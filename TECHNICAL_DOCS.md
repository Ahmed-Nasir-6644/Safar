# 🚌 MetroMate Transit Routing System - Technical Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Setup & Installation](#setup--installation)
4. [User Guide](#user-guide)
5. [Developer Guide](#developer-guide)
6. [API Reference](#api-reference)
7. [Troubleshooting](#troubleshooting)

---

## System Overview

### What It Does
A complete public transit routing solution that finds the shortest path between any two stops using Dijkstra's algorithm, then renders the route beautifully on an interactive Leaflet map with professional UI/UX.

### Key Features

✅ **Graph-Based Routing**
- Directed graph construction from GeoJSON data
- Stops as nodes, transit connections as weighted edges
- Time-based weights (converts distance → travel time)

✅ **Dijkstra's Algorithm**
- Optimal shortest path calculation
- Priority queue implementation (min-heap)
- Handles complex multi-route networks

✅ **Rich Visualization**
- Color-coded route lines (matching actual transit colors)
- Custom markers (Green=Start, Red=End, Blue=Intermediate)
- Dark mode for routing (better visual contrast)

✅ **Professional UX**
- Floating search overlay for source selection
- Loading spinner during calculation
- Info panel showing distance, time, stops
- One-click return to normal view

---

## Architecture

### System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐ │
│  │ NetworkMap   │ ───│ Routing UI   │ ───│ Leaflet Map  │ │
│  │   Page       │    │  Components  │    │   Layers     │ │
│  └──────────────┘    └──────────────┘    └──────────────┘ │
│         │                    │                    │         │
└─────────┼────────────────────┼────────────────────┼─────────┘
          │                    │                    │
          │ HTTP POST          │                    │
          │ /find-route        │                    │
          ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend API (FastAPI)                     │
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐ │
│  │   Transit    │───▶│  Dijkstra's  │───▶│   Response   │ │
│  │    Graph     │    │  Algorithm   │    │   Builder    │ │
│  └──────────────┘    └──────────────┘    └──────────────┘ │
│         ▲                                                    │
│         │                                                    │
│  ┌──────────────┐                                           │
│  │   GeoJSON    │                                           │
│  │   Loader     │                                           │
│  └──────────────┘                                           │
└─────────────────────────────────────────────────────────────┘
          ▲
          │
    ┌─────┴─────┐
    │  public/  │
    │ *.geojson │
    └───────────┘
```

### Tech Stack

**Frontend:**
- React 19.2.0
- React Router v7
- Leaflet 1.9.4 + React-Leaflet
- Tailwind CSS v4
- Lucide React (Icons)

**Backend:**
- Python 3.8+
- FastAPI 0.115.0
- Uvicorn (ASGI server)
- Pydantic (data validation)

**Data:**
- GeoJSON (stops & routes)
- No database required (in-memory graph)

---

## Setup & Installation

### Prerequisites

```powershell
# Check Python
python --version  # Should be 3.8+

# Check Node.js
node --version    # Should be 18+

# Check npm
npm --version     # Should be 9+
```

### Quick Start (Recommended)

```powershell
# Run the automated setup script
.\start.ps1
```

This script will:
1. Create Python virtual environment
2. Install backend dependencies
3. Start backend server (port 8000)
4. Start frontend dev server (port 5173)
5. Open browser automatically

### Manual Setup

#### Backend

```powershell
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\Activate.ps1  # Windows PowerShell
# OR
source venv/bin/activate      # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Start server
python routing_service.py

# Expected output:
# ✅ Loaded 450+ stops and 15+ routes
# ✅ Built graph with 2000+ edges
# 🚀 Transit routing service ready!
# INFO: Uvicorn running on http://0.0.0.0:8000
```

#### Frontend

```powershell
# Install dependencies (if not already done)
npm install

# Start development server
npm run dev

# Expected output:
# VITE v7.2.4  ready in 500 ms
# ➜  Local:   http://localhost:5173/
```

### Verify Installation

1. **Backend Health Check:**
   ```powershell
   curl http://localhost:8000/health
   ```
   Expected: `{"status": "healthy", "graph_loaded": true}`

2. **Frontend:**
   - Open http://localhost:5173
   - Navigate to "Network Map" tab
   - Zoom in to see stops (zoom level 14+)

---

## User Guide

### Step-by-Step: Finding a Route

#### 1. Open Network Map
- Click "Network Map" in navigation
- Wait for map to load with routes

#### 2. Select Destination
- Zoom in (scroll wheel or +/- buttons)
- Stops appear as small white circles at zoom 14+
- Click on any stop
- Popup appears with stop name

#### 3. Initiate Routing
- Click **"Start Routing Here"** button in popup
- This stop becomes your destination
- Floating search overlay appears

#### 4. Choose Starting Point
- Search overlay shows: "Select Starting Stop"
- Destination is displayed in orange box
- Type in search box to find your start location
- Example: Type "Airport" to find Airport stop

#### 5. View Results
- Loading spinner appears (2-5 seconds)
- Map switches to **dark mode** automatically
- Route appears as colored lines
- Markers show:
  - **Green "A"** = Your starting point
  - **Blue numbers** = Intermediate stops
  - **Red "B"** = Your destination

#### 6. Review Route Info
- Orange info panel appears at top
- Shows:
  - Total **distance** (kilometers)
  - Estimated **time** (minutes)
  - Number of **stops**
  - From/To stop names

#### 7. Clear Route
- Click **"Clear Route"** button (bottom-right)
- Returns to normal light mode
- Shows all regular routes again

### Tips & Tricks

**Finding Stops:**
- Use Ctrl+F to search stop names in dropdown
- Stops are named by area (e.g., "G-9/4 Park", "PIMS Hospital")
- Metro stations have "Metro Station" in name

**Best Practices:**
- Zoom in fully before clicking stops
- Use specific stop names for faster search
- Check route info panel for transfer points

**Visual Indicators:**
- **Orange lines** = Bus routes
- **Purple lines** = Metro routes
- **Red lines** = Red Line BRT
- **Blue lines** = Blue Line BRT
- **Green lines** = Green Line routes

---

## Developer Guide

### Project Structure

```
Safar/
├── backend/
│   ├── routing_service.py      # Main FastAPI app
│   ├── requirements.txt         # Python dependencies
│   ├── README.md               # Backend docs
│   └── API_TESTING.md          # API test examples
├── src/
│   └── pages/
│       └── NetworkMapPage.jsx  # Main routing UI
├── public/
│   ├── stops.geojson           # Stop locations
│   └── routes.geojson          # Route geometries
├── ROUTING_GUIDE.md            # Complete setup guide
└── start.ps1                   # Quick start script
```

### Backend Architecture

#### Graph Construction

```python
class TransitGraph:
    def __init__(self):
        self.stops = {}      # stop_id → {name, lat, lng}
        self.edges = {}      # stop_id → [(neighbor, weight, route_info)]
        self.routes = {}     # route_name → {color, geometries}
```

**Process:**
1. Load stops from `stops.geojson`
2. Load routes from `routes.geojson`
3. For each route geometry (LineString):
   - Extract coordinate points
   - Find nearest stop for each point (within 100m)
   - Build sequence of stops
   - Connect consecutive stops with edges
4. Calculate edge weights:
   ```python
   distance = haversine(stop_a, stop_b)
   time_minutes = (distance_km / 30) * 60  # Assume 30 km/h
   ```

#### Dijkstra's Implementation

```python
def find_shortest_path(self, source_id, dest_id):
    # Initialize distances
    distances = {stop: float('inf') for stop in self.stops}
    distances[source] = 0
    
    # Priority queue
    pq = [(0, source)]
    
    while pq:
        current_dist, current_stop = heapq.heappop(pq)
        
        if current_stop == destination:
            break  # Found!
        
        # Relax edges
        for neighbor, weight, route_info in self.edges[current_stop]:
            distance = current_dist + weight
            if distance < distances[neighbor]:
                distances[neighbor] = distance
                previous[neighbor] = current_stop
                heapq.heappush(pq, (distance, neighbor))
    
    # Reconstruct path
    path = []
    current = destination
    while current:
        path.append(current)
        current = previous[current]
    path.reverse()
    
    return path, distances[destination]
```

**Time Complexity:** O((V + E) log V)
- V = number of stops (~450)
- E = number of edges (~2000)
- Typical runtime: 50-200ms

### Frontend State Management

#### Routing State Variables

```javascript
const [routingMode, setRoutingMode] = useState(false);
// Are we in routing mode?

const [routingDestination, setRoutingDestination] = useState(null);
// {name, lat, lng} of clicked stop

const [showSourceSearch, setShowSourceSearch] = useState(false);
// Show floating source search overlay?

const [routingData, setRoutingData] = useState(null);
// API response: {path_stops, route_segments, total_distance, total_time}

const [isDarkMode, setIsDarkMode] = useState(false);
// Controls tile layer (light/dark)

const [routingLoading, setRoutingLoading] = useState(false);
// Show loading spinner?

const [routingError, setRoutingError] = useState(null);
// Error message to display
```

#### Key Functions

**1. Start Routing**
```javascript
const handleStartRouting = (stop) => {
    setRoutingDestination(stop);
    setRoutingMode(true);
    setShowSourceSearch(true);
};
```

**2. API Call**
```javascript
const handleSourceSelect = async (sourceStop) => {
    setRoutingLoading(true);
    
    const response = await fetch('http://localhost:8000/find-route', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            source_stop_id: findStopIdByName(sourceStop.name),
            destination_stop_id: findStopIdByName(routingDestination.name)
        })
    });
    
    const data = await response.json();
    
    if (data.success) {
        setRoutingData(data);
        setIsDarkMode(true);  // Activate dark mode!
    }
    
    setRoutingLoading(false);
};
```

**3. Clear Routing**
```javascript
const handleClearRouting = () => {
    setRoutingMode(false);
    setRoutingData(null);
    setIsDarkMode(false);
    // ... reset all states
};
```

### Customization Examples

#### Change Route Colors

Edit `routing_service.py`:
```python
def get_route_color(self, shape_id: str) -> str:
    sid = shape_id.lower()
    if 'red' in sid:
        return '#FF0000'  # Change to bright red
    elif 'custom' in sid:
        return '#YOUR_COLOR'
    # ...
```

#### Modify Speed Assumptions

Edit weight calculation:
```python
# Current: 30 km/h average
time_minutes = (distance / 30) * 60

# For buses only: 25 km/h
if 'bus' in route_name.lower():
    time_minutes = (distance / 25) * 60
# For metro: 50 km/h
elif 'metro' in route_name.lower():
    time_minutes = (distance / 50) * 60
```

#### Add Transfer Penalties

```python
# In find_shortest_path, when adding edges:
transfer_penalty = 5  # 5 minute penalty for transfers

for neighbor, weight, route_info in self.edges[current_stop]:
    edge_weight = weight
    
    # Check if this is a transfer (different route)
    if previous_route and previous_route != route_info['route_name']:
        edge_weight += transfer_penalty
    
    distance = current_dist + edge_weight
    # ... continue Dijkstra
```

---

## API Reference

### Base URL
```
http://localhost:8000
```

### Endpoints

#### 1. Root
```http
GET /
```

**Response:**
```json
{
  "service": "MetroMate Transit Routing API",
  "version": "1.0.0",
  "status": "active",
  "stops_loaded": 450,
  "routes_loaded": 15
}
```

#### 2. Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "graph_loaded": true
}
```

#### 3. Get All Stops
```http
GET /stops
```

**Response:**
```json
{
  "stops": [
    {
      "stop_id": "pims_station",
      "stop_name": "PIMS Metro Station",
      "lat": 33.7056,
      "lng": 73.0478
    },
    ...
  ],
  "count": 450
}
```

#### 4. Get All Routes
```http
GET /routes
```

**Response:**
```json
{
  "routes": [
    {
      "route_name": "METRO LINE 3A",
      "color": "#8B5CF6",
      "segments_count": 2
    },
    ...
  ],
  "count": 15
}
```

#### 5. Find Route (Main Endpoint)
```http
POST /find-route
Content-Type: application/json
```

**Request Body:**
```json
{
  "source_stop_id": "karachi_company_down",
  "destination_stop_id": "pims_station_fr_down"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "path_stops": [
    {
      "stop_id": "karachi_company_down",
      "stop_name": "Karachi Company",
      "lat": 33.68864969,
      "lng": 73.03483972
    },
    {
      "stop_id": "g94_park_down",
      "stop_name": "G-9/4 Park",
      "lat": 33.68926726,
      "lng": 73.03709775
    },
    ...
  ],
  "route_segments": [
    {
      "route_name": "METRO LINE 3A",
      "color": "#8B5CF6",
      "geometry": {
        "type": "LineString",
        "coordinates": [[73.0521991, 33.70614835], ...]
      },
      "stops": [...]
    }
  ],
  "total_distance": 12.5,
  "total_time": 25.0
}
```

**Error Response (404):**
```json
{
  "detail": "No path found between stops"
}
```

**Error Response (500):**
```json
{
  "detail": "Routing error: <error message>"
}
```

---

## Troubleshooting

### Common Issues

#### 1. Backend Won't Start

**Error: "Address already in use"**
```powershell
# Find process using port 8000
netstat -ano | findstr :8000

# Kill process
taskkill /PID <PID> /F

# Restart backend
python routing_service.py
```

**Error: "Module not found"**
```powershell
# Ensure virtual environment is activated
.\venv\Scripts\Activate.ps1

# Reinstall dependencies
pip install -r requirements.txt
```

#### 2. CORS Errors

**Error: "has been blocked by CORS policy"**

Check `routing_service.py` line 23-28:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    # Add your frontend URL if different
)
```

#### 3. No Routes Found

**Error: "No path found between stops"**

Possible causes:
1. Stops are on disconnected route segments
2. Stop IDs are incorrect
3. Graph wasn't built properly

Debug:
```powershell
# Check stops exist
curl http://localhost:8000/stops | findstr "stop_id_here"

# Check graph stats
curl http://localhost:8000/
# Should show stops_loaded > 0
```

#### 4. Map Not Rendering Routes

**Check browser console for errors:**

- `Failed to fetch` → Backend not running
- `Unexpected token` → Invalid GeoJSON response
- `Cannot read property 'coordinates'` → Missing geometry data

**Verify GeoJSON:**
```javascript
// In browser console
fetch('http://localhost:8000/find-route', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    source_stop_id: 'test_stop_1',
    destination_stop_id: 'test_stop_2'
  })
})
.then(r => r.json())
.then(data => console.log(data));
```

#### 5. Dark Mode Not Activating

**Check state:**
```javascript
// Add to NetworkMapPage.jsx temporarily
console.log('isDarkMode:', isDarkMode);
console.log('routingData:', routingData);
```

**Verify TileLayerController:**
- Should switch tiles when `isDarkMode` changes
- Check Network tab for tile requests

---

## Performance Metrics

### Expected Performance

| Operation | Time | Notes |
|-----------|------|-------|
| Graph construction | 1-3s | On backend startup |
| Route calculation | 50-200ms | Depends on distance |
| API response time | 100-300ms | Including network |
| Frontend render | 200-500ms | Initial route display |

### Optimization Strategies

1. **Cache Frequent Routes**
   ```python
   from functools import lru_cache
   
   @lru_cache(maxsize=1000)
   def find_shortest_path_cached(source, dest):
       return self.find_shortest_path(source, dest)
   ```

2. **Spatial Indexing**
   ```python
   from rtree import index
   
   # Build R-tree for faster stop lookups
   idx = index.Index()
   for stop_id, info in self.stops.items():
       idx.insert(stop_id, (info['lng'], info['lat'], info['lng'], info['lat']))
   ```

3. **Lazy Load Routes**
   ```javascript
   // Only load routes in viewport
   useEffect(() => {
       const bounds = mapRef.current.getBounds();
       loadRoutesInBounds(bounds);
   }, [mapPosition]);
   ```

---

## FAQ

**Q: Can I use real GTFS data?**
A: Yes! Modify the graph construction to parse GTFS files. The algorithm remains the same.

**Q: How do I add real-time data?**
A: Integrate GTFS-Realtime feeds. Update edge weights based on delays.

**Q: Can I deploy this to production?**
A: Yes, but add:
- PostgreSQL for persistent storage
- Redis for caching
- Nginx for reverse proxy
- Docker for containerization

**Q: Mobile support?**
A: Fully responsive! Works on phones/tablets.

**Q: How to add multiple route options?**
A: Implement k-shortest paths (Yen's algorithm or similar).

---

## License

MIT License - Free to use and modify

## Credits

Built with ❤️ for MetroMate

- Leaflet.js
- FastAPI
- React
- Tailwind CSS
