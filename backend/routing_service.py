"""
MetroMate Routing Service
Aligned with reference backend contract (Safar-Backend)
Endpoints match routeFinderRoutes.js / routeFinderController.js
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional, Tuple, Any
import json
import math
import heapq
from pathlib import Path

app = FastAPI(title="MetroMate Routing API")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# DATA MODELS - Aligned with reference backend
# ============================================================================

class FindRouteByIdRequest(BaseModel):
    """Request body for POST /routes/find"""
    startStopId: str
    endStopId: str

class FindRouteByNameRequest(BaseModel):
    """Request body for POST /routes/find/by-name"""
    startStopName: str
    endStopName: str
    maxRoutes: Optional[int] = 6

class NearbyRequest(BaseModel):
    """Request body for POST /routes/nearby"""
    stopId: str
    radiusKm: Optional[float] = 5

class StopInfo(BaseModel):
    stop_id: str
    stop_name: str
    stop_lat: float
    stop_lon: float

class RouteSegment(BaseModel):
    routeName: str
    routeId: str
    stops: List[Dict]
    stopCount: int
    distance: float
    boardingStop: str
    alightingStop: str

class SingleRoute(BaseModel):
    routeStops: List[Dict]
    numberOfStops: int
    totalDistance: float
    estimatedMinutes: Optional[int] = None
    fare: Optional[Dict] = None
    transferCount: int
    busesUsed: List[str]
    busSequence: List[str]
    routeSegments: List[Dict]

class APIResponse(BaseModel):
    """Standard API response format matching reference backend"""
    success: bool
    message: str
    data: Optional[Any] = None

# ============================================================================
# GRAPH CONSTRUCTION & UTILITIES
# ============================================================================

class TransitGraph:
    def __init__(self):
        self.stops = {}  # stop_id -> {stop_name, lat, lng}
        self.edges = {}  # stop_id -> [(neighbor_id, weight, route_info)]
        self.routes = {}  # route_name -> {color, geometries}
        
    def haversine_distance(self, lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        """Calculate distance between two points in kilometers"""
        R = 6371  # Earth's radius in km
        
        phi1 = math.radians(lat1)
        phi2 = math.radians(lat2)
        delta_phi = math.radians(lat2 - lat1)
        delta_lambda = math.radians(lng2 - lng1)
        
        a = math.sin(delta_phi/2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda/2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        
        return R * c
    
    def get_route_color(self, shape_id: str) -> str:
        """Extract color from shape_id"""
        sid = shape_id.lower()
        if 'red' in sid:
            return '#EF4444'
        elif 'orange' in sid:
            return '#F97316'
        elif 'blue' in sid:
            return '#3B82F6'
        elif 'green' in sid:
            return '#10B981'
        elif 'fr' in sid:
            return '#8B5CF6'  # Purple for metro
        return '#6B7280'  # Gray default
    
    def get_route_name(self, shape_id: str) -> str:
        """Extract readable route name from shape_id"""
        parts = shape_id.split('_')
        
        # Remove trip numbers and direction indicators
        if parts and parts[-1].lower().startswith('t'):
            parts.pop()
        if parts and parts[-1].isdigit():
            parts.pop()
            
        name = ' '.join(parts).upper()
        
        # Beautify common abbreviations
        name = name.replace('FR', 'Metro Line')
        
        return name or 'Bus Route'
    
    def load_from_geojson(self, stops_file: str, routes_file: str):
        """Load stops and routes from GeoJSON files"""
        # Load stops
        with open(stops_file, 'r', encoding='utf-8') as f:
            stops_data = json.load(f)
            
        for feature in stops_data['features']:
            stop_id = feature['properties']['stop_id']
            lng, lat = feature['geometry']['coordinates']
            
            self.stops[stop_id] = {
                'stop_name': feature['properties']['stop_name'],
                'lat': lat,
                'lng': lng
            }
            self.edges[stop_id] = []
        
        # Load routes
        with open(routes_file, 'r', encoding='utf-8') as f:
            routes_data = json.load(f)
        
        # Group routes by route name
        route_groups = {}
        for feature in routes_data['features']:
            shape_id = feature['properties']['shape_id']
            route_name = self.get_route_name(shape_id)
            color = self.get_route_color(shape_id)
            
            if route_name not in route_groups:
                route_groups[route_name] = {
                    'color': color,
                    'geometries': []
                }
            
            route_groups[route_name]['geometries'].append({
                'shape_id': shape_id,
                'geometry': feature['geometry']
            })
        
        self.routes = route_groups
        
        # Build graph edges by connecting consecutive points in routes
        for route_name, route_data in route_groups.items():
            for geom_info in route_data['geometries']:
                coordinates = geom_info['geometry']['coordinates']
                
                # Find nearest stops for each point in the route
                stop_sequence = []
                for coord in coordinates:
                    lng, lat = coord[0], coord[1]
                    
                    # Find closest stop within 100m
                    min_dist = float('inf')
                    closest_stop = None
                    
                    for stop_id, stop_info in self.stops.items():
                        dist = self.haversine_distance(
                            lat, lng,
                            stop_info['lat'], stop_info['lng']
                        )
                        if dist < min_dist and dist < 0.1:  # within 100m
                            min_dist = dist
                            closest_stop = stop_id
                    
                    if closest_stop and (not stop_sequence or closest_stop != stop_sequence[-1]):
                        stop_sequence.append(closest_stop)
                
                # Connect consecutive stops in the sequence
                for i in range(len(stop_sequence) - 1):
                    stop_a = stop_sequence[i]
                    stop_b = stop_sequence[i + 1]
                    
                    stop_a_info = self.stops[stop_a]
                    stop_b_info = self.stops[stop_b]
                    
                    distance = self.haversine_distance(
                        stop_a_info['lat'], stop_a_info['lng'],
                        stop_b_info['lat'], stop_b_info['lng']
                    )
                    
                    # Weight = time in minutes (assuming 30 km/h average speed)
                    time_minutes = (distance / 30) * 60
                    
                    # Add edge (bidirectional for now)
                    edge_info = {
                        'route_name': route_name,
                        'color': route_data['color'],
                        'shape_id': geom_info['shape_id']
                    }
                    
                    self.edges[stop_a].append((stop_b, time_minutes, edge_info))
                    self.edges[stop_b].append((stop_a, time_minutes, edge_info))
        
        print(f"✅ Loaded {len(self.stops)} stops and {len(route_groups)} routes")
        print(f"✅ Built graph with {sum(len(e) for e in self.edges.values())} edges")
    
    def find_shortest_path(self, source_id: str, dest_id: str, penalized_edges: Dict[Tuple[str, str], float] = None) -> Tuple[List[str], float, List[Dict]]:
        """
        Dijkstra's algorithm to find shortest path
        Returns: (path_stop_ids, total_time, route_info_list)
        """
        if source_id not in self.stops or dest_id not in self.stops:
            raise ValueError("Invalid source or destination stop")
        
        # Initialize
        distances = {stop_id: float('inf') for stop_id in self.stops}
        distances[source_id] = 0
        previous = {stop_id: None for stop_id in self.stops}
        route_info_map = {stop_id: None for stop_id in self.stops}
        
        # Priority queue: (distance, stop_id)
        pq = [(0, source_id)]
        visited = set()
        
        while pq:
            current_dist, current_stop = heapq.heappop(pq)
            
            if current_stop in visited:
                continue
            
            visited.add(current_stop)
            
            # If we reached destination, we can stop
            if current_stop == dest_id:
                break
            
            # Check all neighbors
            for neighbor, weight, edge_info in self.edges[current_stop]:
                
                # Apply penalty if edge is in penalized_edges
                penalty = 1.0
                if penalized_edges:
                    if (current_stop, neighbor) in penalized_edges:
                        penalty = penalized_edges[(current_stop, neighbor)]
                    elif (neighbor, current_stop) in penalized_edges:
                         penalty = penalized_edges[(neighbor, current_stop)]

                distance = current_dist + (weight * penalty)
                
                if distance < distances[neighbor]:
                    distances[neighbor] = distance
                    previous[neighbor] = current_stop
                    route_info_map[neighbor] = edge_info
                    heapq.heappush(pq, (distance, neighbor))
        
        # Reconstruct path
        if distances[dest_id] == float('inf'):
            raise ValueError("No path found between stops")
        
        path = []
        current = dest_id
        route_segments_info = []
        
        while current is not None:
            path.append(current)
            if route_info_map[current]:
                route_segments_info.append(route_info_map[current])
            current = previous[current]
        
        path.reverse()
        route_segments_info.reverse()
        
        return path, distances[dest_id], route_segments_info

# ============================================================================
# GLOBAL GRAPH INSTANCE
# ============================================================================

transit_graph = TransitGraph()

# Load data on startup
@app.on_event("startup")
async def load_transit_data():
    """Load GeoJSON data when the API starts"""
    try:
        # Adjust paths to your actual file locations
        base_path = Path(__file__).parent.parent / "public"
        stops_file = base_path / "stops.geojson"
        routes_file = base_path / "routes.geojson"
        
        transit_graph.load_from_geojson(str(stops_file), str(routes_file))
        print("🚀 Transit routing service ready!")

        # --- NEW: PRINT A VALID TEST ROUTE ---
        print("\n🔎 Searching for a valid test route...")
        count = 10
        for start_id in transit_graph.stops.keys():
            for end_id in transit_graph.stops.keys():
                if start_id != end_id:
                    try:
                        # Try to find a path that takes at least 3 stops
                        path, time, info = transit_graph.find_shortest_path(start_id, end_id)
                        if len(path) > 3:
                            print(f"\n✅ VALID ROUTE FOUND! Test your frontend with this JSON body:")
                            print(f'{{"source_stop_id": "{start_id}", "destination_stop_id": "{end_id}"}}')
                            print(f"Path travels through {len(path)} stops. Time: {round(time, 1)} mins.\n")
                            count -= 1
                            if count <= 0:
                                return
                    except:
                        pass # Ignore if no path exists between these two
    except Exception as e:
        print(f"❌ Error loading transit data: {e}")

# ============================================================================
# API ENDPOINTS - Aligned with reference backend (routeFinderRoutes.js)
# ============================================================================

@app.get("/")
def root():
    """Root endpoint"""
    return {
        "service": "MetroMate Transit Routing API",
        "version": "1.0.0",
        "status": "active",
        "stops_loaded": len(transit_graph.stops),
        "routes_loaded": len(transit_graph.routes)
    }

# ============================================================================
# /routes/* ENDPOINTS - Matching reference backend contract
# ============================================================================

@app.post("/routes/init")
async def init_graph():
    """
    Initialize route graph
    POST /routes/init
    Response: { success, message, data: [...stopNames] }
    """
    try:
        stop_names = [
            info['stop_name'] 
            for info in transit_graph.stops.values()
            if info.get('stop_name') and isinstance(info['stop_name'], str) and info['stop_name'].strip()
        ]
        print(f"📍 /routes/init stop names: {len(stop_names)}")
        return {
            "success": True,
            "message": f"Route graph initialized successfully ({len(stop_names)} stops)",
            "data": stop_names
        }
    except Exception as e:
        print(f"❌ Initialize graph error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/routes/init-and-get-stops")
async def init_and_get_all_stops():
    """
    Initialize graph and get all stops (combined endpoint)
    GET /routes/init-and-get-stops
    Response: { success, message, data: [...stops] }
    """
    try:
        print("📍 Initializing graph and fetching all stops...")
        stops_list = [
            {
                "stop_id": stop_id,
                "stop_name": info['stop_name'],
                "stop_lat": info['lat'],
                "stop_lon": info['lng']
            }
            for stop_id, info in transit_graph.stops.items()
        ]
        print(f"✓ Sending {len(stops_list)} stops to frontend")
        return {
            "success": True,
            "message": f"Graph initialized and retrieved {len(stops_list)} stops",
            "data": stops_list
        }
    except Exception as e:
        print(f"❌ Init and get all stops error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/routes/find")
async def find_route_by_id(request: FindRouteByIdRequest):
    """
    Find route between two stops (by ID)
    POST /routes/find
    Request: { startStopId, endStopId }
    Response: { success, message, data: {...routeData} }
    """
    try:
        if not request.startStopId or not request.endStopId:
            raise HTTPException(status_code=400, detail="startStopId and endStopId are required")
        
        print(f"🔍 Finding route: {request.startStopId} -> {request.endStopId}")
        
        path_ids, total_time, route_segments_info = transit_graph.find_shortest_path(
            request.startStopId,
            request.endStopId
        )
        
        # Build route data matching reference backend structure
        route_data = build_route_data(path_ids, total_time, route_segments_info)
        
        return {
            "success": True,
            "message": "Route found successfully",
            "data": route_data
        }
    except ValueError as e:
        print(f"❌ Find route error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"❌ Find route error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/routes/find/by-name")
async def find_route_by_names(request: FindRouteByNameRequest):
    """
    Find route between two stops (by name)
    POST /routes/find/by-name
    Request: { startStopName, endStopName, maxRoutes }
    Response: { success, message, data: { routes: [...], farePolicy: {...} } }
    """
    try:
        if not request.startStopName or not request.endStopName:
            raise HTTPException(status_code=400, detail="startStopName and endStopName are required")
        
        print(f"🔍 Finding route by names: {request.startStopName} -> {request.endStopName}")
        
        # Find start stop candidates
        start_candidates = find_stops_by_name(request.startStopName)
        if not start_candidates:
            raise HTTPException(status_code=400, detail=f'No stop found matching "{request.startStopName}"')
        
        # Find end stop candidates
        end_candidates = find_stops_by_name(request.endStopName)
        if not end_candidates:
            raise HTTPException(status_code=400, detail=f'No stop found matching "{request.endStopName}"')
        
        limit = max(1, request.maxRoutes or 6)
        all_routes = []
        seen_paths = set()
        penalized_edges = {}
        
        print(f"🔍 Searching routes between {len(start_candidates)} start and {len(end_candidates)} end candidates")
        
        for start_stop in start_candidates:
            for end_stop in end_candidates:
                # Try to find multiple routes with edge penalization
                for _ in range(3):
                    try:
                        path_ids, total_time, route_segments_info = transit_graph.find_shortest_path(
                            start_stop['stop_id'],
                            end_stop['stop_id'],
                            penalized_edges
                        )
                        
                        # Check for duplicate paths
                        path_key = ",".join(path_ids)
                        if path_key in seen_paths:
                            continue
                        seen_paths.add(path_key)
                        
                        # Build route data
                        route_data = build_route_data(path_ids, total_time, route_segments_info)
                        all_routes.append(route_data)
                        
                        # Penalize edges for finding alternative routes
                        for i in range(len(path_ids) - 1):
                            u, v = path_ids[i], path_ids[i+1]
                            current_penalty = penalized_edges.get((u, v), 1.0)
                            penalized_edges[(u, v)] = current_penalty * 2.0
                            penalized_edges[(v, u)] = current_penalty * 2.0
                        
                        if len(all_routes) >= limit:
                            break
                    except ValueError:
                        break
                
                if len(all_routes) >= limit:
                    break
            if len(all_routes) >= limit:
                break
        
        if not all_routes:
            raise HTTPException(status_code=400, detail="No route found between these stops")
        
        # Sort by distance and limit results
        all_routes.sort(key=lambda r: r.get('totalDistance', float('inf')))
        final_routes = all_routes[:limit]
        
        return {
            "success": True,
            "message": "Routes found successfully",
            "data": {
                "routes": final_routes,
                "farePolicy": {
                    "currency": "PKR",
                    "fares": {
                        "Red Line": 30,
                        "Orange2 (Airport)": 90,
                        "Blue, Green, Orange, FR-3A, FR-4, FR-6, FR-7, FR-8A, FR-8C, FR-9, FR-14": 50
                    }
                }
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Find route by names error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/routes/stop/by-name")
async def find_stop_by_name(stopName: str = Query(..., description="Stop name to search")):
    """
    Find stop by name
    GET /routes/stop/by-name?stopName=...
    Response: { success, message, data: {...stop} }
    """
    try:
        if not stopName:
            raise HTTPException(status_code=400, detail="stopName query parameter is required")
        
        stops = find_stops_by_name(stopName)
        
        if not stops:
            raise HTTPException(status_code=400, detail=f'No stop found matching "{stopName}"')
        
        # If exactly one match, return it directly
        if len(stops) == 1:
            return {
                "success": True,
                "message": "Stop found",
                "data": {
                    "stop_id": stops[0]['stop_id'],
                    "stop_name": stops[0]['stop_name']
                }
            }
        
        # Multiple matches
        return {
            "success": True,
            "message": "Stop found",
            "data": {
                "multiple": True,
                "matches": [{"stop_id": s['stop_id'], "stop_name": s['stop_name']} for s in stops]
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Find stop by name error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/routes/nearby")
async def find_nearby_stops(request: NearbyRequest):
    """
    Find nearby stops
    POST /routes/nearby
    Request: { stopId, radiusKm }
    Response: { success, message, data: [...stops] }
    """
    try:
        if not request.stopId:
            raise HTTPException(status_code=400, detail="stopId is required")
        
        if request.stopId not in transit_graph.stops:
            raise HTTPException(status_code=400, detail=f'Stop "{request.stopId}" not found')
        
        radius_km = request.radiusKm or 5
        center_stop = transit_graph.stops[request.stopId]
        
        nearby = []
        for stop_id, info in transit_graph.stops.items():
            if stop_id == request.stopId:
                continue
            
            dist = transit_graph.haversine_distance(
                center_stop['lat'], center_stop['lng'],
                info['lat'], info['lng']
            )
            
            if dist <= radius_km:
                nearby.append({
                    "stop_id": stop_id,
                    "stop_name": info['stop_name'],
                    "stop_lat": info['lat'],
                    "stop_lon": info['lng'],
                    "distance_km": round(dist, 2)
                })
        
        nearby.sort(key=lambda s: s['distance_km'])
        
        return {
            "success": True,
            "message": f"Found {len(nearby)} nearby stops",
            "data": nearby
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Find nearby error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/routes/stops")
async def get_all_stops():
    """
    Get all stops
    GET /routes/stops
    Response: { success, message, data: [...stops] }
    """
    try:
        print("📍 Fetching all stops...")
        stops_list = [
            {
                "stop_id": stop_id,
                "stop_name": info['stop_name'],
                "stop_lat": info['lat'],
                "stop_lon": info['lng']
            }
            for stop_id, info in transit_graph.stops.items()
        ]
        
        return {
            "success": True,
            "message": f"Retrieved {len(stops_list)} stops",
            "data": stops_list
        }
    except Exception as e:
        print(f"❌ Get all stops error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/routes/search")
async def search_stops(query: str = Query(..., description="Search query")):
    """
    Search stops by name
    GET /routes/search?query=...
    Response: { success, message, data: [...stops] }
    """
    try:
        if not query:
            raise HTTPException(status_code=400, detail="Search query is required")
        
        search_lower = query.lower()
        matching_stops = [
            {
                "stop_id": stop_id,
                "stop_name": info['stop_name'],
                "stop_lat": info['lat'],
                "stop_lon": info['lng']
            }
            for stop_id, info in transit_graph.stops.items()
            if search_lower in info['stop_name'].lower()
        ]
        
        return {
            "success": True,
            "message": f'Found {len(matching_stops)} stops matching "{query}"',
            "data": matching_stops
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Search stops error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/routes/stats")
async def get_stats():
    """
    Get graph statistics
    GET /routes/stats
    Response: { success, message, data: {...stats} }
    """
    try:
        total_connections = sum(len(edges) for edges in transit_graph.edges.values())
        
        max_connections = 0
        busy_stop = None
        for stop_id, edges in transit_graph.edges.items():
            if len(edges) > max_connections:
                max_connections = len(edges)
                busy_stop = transit_graph.stops[stop_id]['stop_name']
        
        stats = {
            "totalStops": len(transit_graph.stops),
            "totalConnections": total_connections,
            "averageConnectionsPerStop": round(total_connections / len(transit_graph.stops), 2) if transit_graph.stops else 0,
            "busyStop": busy_stop,
            "busyStopConnections": max_connections,
            "graphBuiltAt": None  # Could track this if needed
        }
        
        return {
            "success": True,
            "message": "Graph statistics retrieved",
            "data": stats
        }
    except Exception as e:
        print(f"❌ Get stats error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/routes/rebuild")
async def rebuild_graph():
    """
    Rebuild the graph
    POST /routes/rebuild
    Response: { success, message }
    """
    try:
        print("🔄 Rebuilding graph...")
        # In this implementation, graph is built on startup from GeoJSON
        # Rebuild would reload the data
        base_path = Path(__file__).parent.parent / "public"
        stops_file = base_path / "stops.geojson"
        routes_file = base_path / "routes.geojson"
        
        # Clear and reload
        transit_graph.stops = {}
        transit_graph.edges = {}
        transit_graph.routes = {}
        transit_graph.load_from_geojson(str(stops_file), str(routes_file))
        
        return {
            "success": True,
            "message": "Graph rebuilt successfully"
        }
    except Exception as e:
        print(f"❌ Rebuild graph error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "graph_loaded": len(transit_graph.stops) > 0}

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def find_stops_by_name(stop_name: str) -> List[Dict]:
    """Find stops matching the given name"""
    search_term = stop_name.lower()
    
    # Exact matches first
    exact_matches = [
        {"stop_id": stop_id, "stop_name": info['stop_name'], "lat": info['lat'], "lng": info['lng']}
        for stop_id, info in transit_graph.stops.items()
        if info['stop_name'].lower() == search_term
    ]
    
    if exact_matches:
        return exact_matches
    
    # Partial matches
    partial_matches = [
        {"stop_id": stop_id, "stop_name": info['stop_name'], "lat": info['lat'], "lng": info['lng']}
        for stop_id, info in transit_graph.stops.items()
        if search_term in info['stop_name'].lower()
    ]
    
    return partial_matches

def build_route_data(path_ids: List[str], total_time: float, route_segments_info: List[Dict]) -> Dict:
    """Build route data matching reference backend structure"""
    # Build route stops
    route_stops = []
    for stop_id in path_ids:
        stop = transit_graph.stops[stop_id]
        route_stops.append({
            "stop_id": stop_id,
            "stop_name": stop['stop_name'],
            "stop_lat": stop['lat'],
            "stop_lon": stop['lng']
        })
    
    # Calculate total distance
    total_distance = 0
    for i in range(len(route_stops) - 1):
        stop_a = route_stops[i]
        stop_b = route_stops[i + 1]
        total_distance += transit_graph.haversine_distance(
            stop_a['stop_lat'], stop_a['stop_lon'],
            stop_b['stop_lat'], stop_b['stop_lon']
        )
    
    # Build route segments
    segments = []
    buses_used = set()
    bus_sequence = []
    current_route = None
    current_segment_stops = []
    segment_start_idx = 0
    
    for i, route_info in enumerate(route_segments_info):
        if route_info:
            route_name = route_info.get('route_name', 'Unknown')
            
            if current_route and current_route != route_name:
                # Save previous segment
                segments.append({
                    "routeName": current_route.upper(),
                    "routeId": current_route.lower(),
                    "stops": current_segment_stops,
                    "stopCount": len(current_segment_stops),
                    "distance": round(calculate_segment_distance(current_segment_stops), 2),
                    "boardingStop": current_segment_stops[0]['stop_name'] if current_segment_stops else "Unknown",
                    "alightingStop": current_segment_stops[-1]['stop_name'] if current_segment_stops else "Unknown"
                })
                current_segment_stops = []
            
            if route_name != current_route:
                buses_used.add(route_name)
                bus_sequence.append(route_name)
            
            current_route = route_name
            if i < len(route_stops):
                current_segment_stops.append(route_stops[i])
    
    # Add last segment
    if current_route and current_segment_stops:
        # Add the final stop if not already included
        if len(route_stops) > len(route_segments_info):
            current_segment_stops.append(route_stops[-1])
        
        segments.append({
            "routeName": current_route.upper(),
            "routeId": current_route.lower(),
            "stops": current_segment_stops,
            "stopCount": len(current_segment_stops),
            "distance": round(calculate_segment_distance(current_segment_stops), 2),
            "boardingStop": current_segment_stops[0]['stop_name'] if current_segment_stops else "Unknown",
            "alightingStop": current_segment_stops[-1]['stop_name'] if current_segment_stops else "Unknown"
        })
    
    # Calculate fare (simplified)
    fare_map = {
        'red': 30,
        'orange2': 90,
        'orange': 50,
        'blue': 50,
        'green': 50
    }
    
    total_fare = 0
    fare_details = []
    for bus in buses_used:
        bus_lower = bus.lower()
        fare = 50  # Default
        for key, value in fare_map.items():
            if key in bus_lower:
                fare = value
                break
        total_fare += fare
        fare_details.append({"route": bus.upper(), "fare": fare})
    
    # Estimate time (30 km/h average + 0.5 min per stop)
    estimated_minutes = round((total_distance / 30) * 60 + 0.5 * max(0, len(route_stops) - 1))
    
    return {
        "routeStops": route_stops,
        "numberOfStops": len(route_stops),
        "totalDistance": round(total_distance, 2),
        "estimatedMinutes": estimated_minutes,
        "fare": {
            "amount": total_fare,
            "currency": "PKR",
            "routes": [b.upper() for b in buses_used],
            "fareDetails": fare_details
        },
        "transferCount": max(0, len(bus_sequence) - 1),
        "busesUsed": [b.upper() for b in buses_used],
        "busSequence": [b.upper() for b in bus_sequence],
        "routeSegments": segments
    }

def calculate_segment_distance(stops: List[Dict]) -> float:
    """Calculate total distance for a segment"""
    total = 0
    for i in range(len(stops) - 1):
        total += transit_graph.haversine_distance(
            stops[i].get('stop_lat', stops[i].get('lat', 0)),
            stops[i].get('stop_lon', stops[i].get('lng', 0)),
            stops[i+1].get('stop_lat', stops[i+1].get('lat', 0)),
            stops[i+1].get('stop_lon', stops[i+1].get('lng', 0))
        )
    return total

# ============================================================================
# RUN SERVER
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)
