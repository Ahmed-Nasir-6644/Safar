
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional, Tuple
import json
import math
import heapq
from pathlib import Path

app = FastAPI(title="MetroMate Routing API")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# DATA MODELS
# ============================================================================

class RouteRequest(BaseModel):
    source_stop_id: str
    destination_stop_id: str

class StopInfo(BaseModel):
    stop_id: str
    stop_name: str
    lat: float
    lng: float

class RouteSegment(BaseModel):
    route_name: str
    color: str
    geometry: Dict  # LineString GeoJSON geometry
    stops: List[StopInfo]

class RouteResponse(BaseModel):
    success: bool
    path_stops: List[StopInfo]
    route_segments: List[RouteSegment]
    total_distance: float
    total_time: float  # in minutes
    error: Optional[str] = None

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
    
    def find_shortest_path(self, source_id: str, dest_id: str) -> Tuple[List[str], float, List[Dict]]:
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
        route_info = {stop_id: None for stop_id in self.stops}
        
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
                distance = current_dist + weight
                
                if distance < distances[neighbor]:
                    distances[neighbor] = distance
                    previous[neighbor] = current_stop
                    route_info[neighbor] = edge_info
                    heapq.heappush(pq, (distance, neighbor))
        
        # Reconstruct path
        if distances[dest_id] == float('inf'):
            raise ValueError("No path found between stops")
        
        path = []
        current = dest_id
        route_segments_info = []
        
        while current is not None:
            path.append(current)
            if route_info[current]:
                route_segments_info.append(route_info[current])
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
# API ENDPOINTS
# ============================================================================

@app.get("/")
def root():
    return {
        "service": "MetroMate Transit Routing API",
        "version": "1.0.0",
        "status": "active",
        "stops_loaded": len(transit_graph.stops),
        "routes_loaded": len(transit_graph.routes)
    }

@app.get("/stops")
def get_all_stops():
    """Get all available stops"""
    stops_list = [
        {
            "stop_id": stop_id,
            "stop_name": info['stop_name'],
            "lat": info['lat'],
            "lng": info['lng']
        }
        for stop_id, info in transit_graph.stops.items()
    ]
    return {"stops": stops_list, "count": len(stops_list)}

@app.get("/routes")
def get_all_routes():
    """Get all available routes"""
    routes_list = [
        {
            "route_name": route_name,
            "color": info['color'],
            "segments_count": len(info['geometries'])
        }
        for route_name, info in transit_graph.routes.items()
    ]
    return {"routes": routes_list, "count": len(routes_list)}

@app.post("/find-route", response_model=RouteResponse)
async def find_route(request: RouteRequest):
    print("endpoint hit")
    """
    Find the shortest route between two stops
    Returns the path with detailed stop information and route segments
    """
    try:
        # Find shortest path
        path_ids, total_time, route_segments_info = transit_graph.find_shortest_path(
            request.source_stop_id,
            request.destination_stop_id
        )
        
        # Build detailed stop information
        path_stops = []
        for stop_id in path_ids:
            stop = transit_graph.stops[stop_id]
            path_stops.append(StopInfo(
                stop_id=stop_id,
                stop_name=stop['stop_name'],
                lat=stop['lat'],
                lng=stop['lng']
            ))
        
        # Build route segments with geometries
        route_segments = []
        current_route = None
        current_stops = []
        
        for i, route_info in enumerate(route_segments_info):
            if route_info:
                route_name = route_info['route_name']
                
                # If route changed, save previous segment
                if current_route and current_route != route_name:
                    # Find geometry for this segment
                    geometry = None
                    if current_route in transit_graph.routes:
                        # Use first geometry as representative
                        geometry = transit_graph.routes[current_route]['geometries'][0]['geometry']
                    
                    route_segments.append(RouteSegment(
                        route_name=current_route,
                        color=transit_graph.routes[current_route]['color'],
                        geometry=geometry or {"type": "LineString", "coordinates": []},
                        stops=current_stops
                    ))
                    current_stops = []
                
                current_route = route_name
                current_stops.append(path_stops[i])
        
        # Add last segment
        if current_route and current_stops:
            geometry = None
            if current_route in transit_graph.routes:
                geometry = transit_graph.routes[current_route]['geometries'][0]['geometry']
            
            route_segments.append(RouteSegment(
                route_name=current_route,
                color=transit_graph.routes[current_route]['color'],
                geometry=geometry or {"type": "LineString", "coordinates": []},
                stops=current_stops
            ))
        
        # Calculate total distance
        total_distance = 0
        for i in range(len(path_stops) - 1):
            stop_a = path_stops[i]
            stop_b = path_stops[i + 1]
            total_distance += transit_graph.haversine_distance(
                stop_a.lat, stop_a.lng,
                stop_b.lat, stop_b.lng
            )
        
        return RouteResponse(
            success=True,
            path_stops=path_stops,
            route_segments=route_segments,
            total_distance=round(total_distance, 2),
            total_time=round(total_time, 1)
        )
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Routing error: {str(e)}")

@app.get("/health")
def health_check():
    return {"status": "healthy", "graph_loaded": len(transit_graph.stops) > 0}

# ============================================================================
# RUN SERVER
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)
