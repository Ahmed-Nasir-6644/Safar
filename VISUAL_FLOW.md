# Transit Routing System - Visual Flow Diagram

## User Journey Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│ 1. USER OPENS NETWORK MAP                                          │
│    - Loads map with all routes visible                             │
│    - Shows normal OpenStreetMap tiles (light mode)                 │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 2. USER ZOOMS IN (Level 14+)                                       │
│    - White circle markers appear for stops                         │
│    - Route labels become visible                                   │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 3. USER CLICKS A STOP                                              │
│    - Popup appears with stop name                                  │
│    - Shows "Start Routing Here" button (orange)                    │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 4. USER CLICKS "START ROUTING HERE"                                │
│    State Changes:                                                   │
│    - routingMode = true                                            │
│    - routingDestination = clicked stop                             │
│    - showSourceSearch = true                                       │
│                                                                     │
│    UI Changes:                                                      │
│    - Floating search overlay appears                               │
│    - Destination shown in orange box                               │
│    - Input focused automatically                                   │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 5. USER TYPES IN SOURCE SEARCH                                     │
│    - Dropdown filters stops in real-time                           │
│    - Excludes destination from results                             │
│    - Shows stop name + coordinates                                 │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 6. USER SELECTS SOURCE STOP                                        │
│    Frontend:                                                        │
│    - Closes search overlay                                         │
│    - Shows loading spinner                                         │
│    - Sets routingLoading = true                                    │
│                                                                     │
│    API Call:                                                        │
│    POST http://localhost:8000/find-route                          │
│    {                                                                │
│      "source_stop_id": "selected_stop_id",                        │
│      "destination_stop_id": "clicked_stop_id"                     │
│    }                                                                │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 7. BACKEND PROCESSES REQUEST                                       │
│                                                                     │
│    Step 1: Validate stop IDs                                       │
│    ├─ Check source exists in graph                                 │
│    └─ Check destination exists in graph                            │
│                                                                     │
│    Step 2: Run Dijkstra's Algorithm                                │
│    ├─ Initialize distances (source = 0, others = ∞)                │
│    ├─ Use min-heap priority queue                                  │
│    ├─ Relax edges, update distances                                │
│    ├─ Track previous nodes                                         │
│    └─ Stop when destination reached                                │
│                                                                     │
│    Step 3: Reconstruct Path                                        │
│    ├─ Start from destination                                       │
│    ├─ Follow previous[] backward to source                         │
│    └─ Reverse path array                                           │
│                                                                     │
│    Step 4: Build Response                                          │
│    ├─ Extract stop details (name, lat, lng)                        │
│    ├─ Group consecutive stops by route                             │
│    ├─ Include route geometries (LineStrings)                       │
│    ├─ Calculate total distance (Haversine)                         │
│    └─ Return total time from Dijkstra                              │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 8. FRONTEND RECEIVES RESPONSE                                      │
│    Success Path:                                                    │
│    - routingData = response                                        │
│    - isDarkMode = true  ⚡ SWITCH TO DARK TILES                    │
│    - routingLoading = false                                        │
│    - Hide loading spinner                                          │
│                                                                     │
│    Error Path:                                                      │
│    - routingError = error message                                  │
│    - Show red error banner                                         │
│    - Keep in normal mode                                           │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 9. MAP VISUALIZATION UPDATES                                       │
│                                                                     │
│    Tile Layer:                                                      │
│    ✓ Switch from OpenStreetMap (light)                             │
│    ✓ To CartoDB Dark Matter (dark)                                 │
│                                                                     │
│    Hide Default Layers:                                             │
│    ✓ All regular routes (Blue, Red, Green, etc.)                   │
│    ✓ All default stop markers                                      │
│                                                                     │
│    Show Routing Layers:                                             │
│    ✓ Colored LineStrings for each route segment                    │
│    ✓ Custom markers:                                                │
│       - Green circle with "A" (source)                             │
│       - Blue circles with numbers (intermediate)                   │
│       - Red circle with "B" (destination)                          │
│                                                                     │
│    Display Info Panel:                                              │
│    ✓ Orange gradient banner at top                                 │
│    ✓ Shows: Distance (km) | Time (min) | Stops (#)                │
│    ✓ Shows: From stop name → To stop name                          │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 10. USER VIEWS ROUTE                                               │
│     - Sees complete colored path                                   │
│     - Can click markers for stop details                           │
│     - Can zoom/pan to explore route                                │
│     - Reads distance, time, stop count                             │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 11. USER CLICKS "CLEAR ROUTE"                                      │
│     State Changes:                                                  │
│     - routingMode = false                                          │
│     - routingData = null                                           │
│     - isDarkMode = false  ⚡ BACK TO LIGHT TILES                   │
│     - routingDestination = null                                    │
│     - routingError = null                                          │
│                                                                     │
│     UI Changes:                                                     │
│     - Hide info panel                                              │
│     - Hide clear button                                            │
│     - Show default routes again                                    │
│     - Show all stops (when zoomed in)                              │
│     - Switch back to light map tiles                               │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 12. BACK TO NORMAL VIEW                                            │
│     - User can search for another route                            │
│     - Or explore map normally                                      │
│     - All features restored                                        │
└─────────────────────────────────────────────────────────────────────┘
```

---

## State Machine Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         NORMAL MODE                             │
│                                                                 │
│  State:                                                         │
│  - routingMode: false                                          │
│  - isDarkMode: false                                           │
│  - routingData: null                                           │
│                                                                 │
│  Display:                                                       │
│  - Light map tiles                                             │
│  - All routes visible                                          │
│  - All stops clickable                                         │
│  - No routing UI elements                                      │
└─────────────────────────────────────────────────────────────────┘
                         │
                         │ USER CLICKS
                         │ "START ROUTING HERE"
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SOURCE SELECTION MODE                        │
│                                                                 │
│  State:                                                         │
│  - routingMode: true                                           │
│  - routingDestination: {stop object}                          │
│  - showSourceSearch: true                                      │
│  - isDarkMode: false (still light)                            │
│                                                                 │
│  Display:                                                       │
│  - Floating search overlay                                     │
│  - Destination shown                                           │
│  - Input field focused                                         │
│  - Filtered stops dropdown                                     │
└─────────────────────────────────────────────────────────────────┘
                         │
                         │ USER SELECTS
                         │ SOURCE STOP
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                       LOADING MODE                              │
│                                                                 │
│  State:                                                         │
│  - routingLoading: true                                        │
│  - showSourceSearch: false                                     │
│  - isDarkMode: false (still light)                            │
│                                                                 │
│  Display:                                                       │
│  - Full-screen dark overlay                                    │
│  - Loading spinner                                             │
│  - "Finding Best Route..." message                             │
│  - Map still visible behind                                    │
└─────────────────────────────────────────────────────────────────┘
                         │
                         │ API RETURNS
                         │ SUCCESS
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      ROUTING DISPLAY MODE                       │
│                                                                 │
│  State:                                                         │
│  - routingMode: true                                           │
│  - routingData: {path_stops, route_segments, etc}             │
│  - isDarkMode: true  ⚡ DARK MODE ACTIVATED                    │
│  - routingLoading: false                                       │
│                                                                 │
│  Display:                                                       │
│  - DARK map tiles (CartoDB)                                    │
│  - Colored route segments                                      │
│  - Custom markers (A/B/numbers)                                │
│  - Info panel at top                                           │
│  - "Clear Route" button (bottom-right)                         │
│  - NO default routes/stops                                     │
└─────────────────────────────────────────────────────────────────┘
                         │
                         │ USER CLICKS
                         │ "CLEAR ROUTE"
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACK TO NORMAL MODE                          │
│                                                                 │
│  (Returns to first state)                                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagram

```
┌───────────────────┐
│   stops.geojson   │
│   routes.geojson  │
└─────────┬─────────┘
          │
          │ Read on startup
          ▼
┌───────────────────────────────────┐
│    Backend: TransitGraph          │
│                                   │
│  ┌─────────────────────────────┐ │
│  │ stops: {                     │ │
│  │   "stop_id": {               │ │
│  │     stop_name, lat, lng      │ │
│  │   }                          │ │
│  │ }                            │ │
│  └─────────────────────────────┘ │
│                                   │
│  ┌─────────────────────────────┐ │
│  │ edges: {                     │ │
│  │   "stop_id": [               │ │
│  │     (neighbor, weight, info) │ │
│  │   ]                          │ │
│  │ }                            │ │
│  └─────────────────────────────┘ │
│                                   │
│  ┌─────────────────────────────┐ │
│  │ routes: {                    │ │
│  │   "route_name": {            │ │
│  │     color, geometries        │ │
│  │   }                          │ │
│  │ }                            │ │
│  └─────────────────────────────┘ │
└───────────────────────────────────┘
          │
          │ POST /find-route
          │ {source_stop_id, destination_stop_id}
          ▼
┌───────────────────────────────────┐
│   Dijkstra's Algorithm            │
│                                   │
│   Input:                          │
│   - source_stop_id                │
│   - destination_stop_id           │
│                                   │
│   Process:                        │
│   1. distances[source] = 0        │
│   2. pq = [(0, source)]           │
│   3. while pq not empty:          │
│      - pop min distance           │
│      - relax neighbors            │
│      - update distances           │
│   4. reconstruct path             │
│                                   │
│   Output:                         │
│   - path: [stop_id, ...]          │
│   - total_time: float             │
│   - route_info: [...]             │
└───────────────────────────────────┘
          │
          │ Build JSON response
          ▼
┌───────────────────────────────────┐
│   API Response                    │
│   {                               │
│     success: true,                │
│     path_stops: [...],            │
│     route_segments: [             │
│       {                           │
│         route_name,               │
│         color,                    │
│         geometry: LineString,     │
│         stops: [...]              │
│       }                           │
│     ],                            │
│     total_distance: 12.5,         │
│     total_time: 25.0              │
│   }                               │
└───────────────────────────────────┘
          │
          │ HTTP Response
          ▼
┌───────────────────────────────────┐
│   Frontend: setState              │
│                                   │
│   setRoutingData(response)        │
│   setIsDarkMode(true)             │
│   setRoutingLoading(false)        │
└───────────────────────────────────┘
          │
          │ React re-render
          ▼
┌───────────────────────────────────┐
│   Map Rendering                   │
│                                   │
│   <TileLayerController            │
│     isDarkMode={true} />          │
│   → Switches to dark tiles        │
│                                   │
│   <GeoJSON                        │
│     data={segment.geometry}       │
│     style={{color: segment.color}}│
│   />                              │
│   → Renders colored lines         │
│                                   │
│   <Marker                         │
│     position={[lat, lng]}         │
│     icon={customIcon} />          │
│   → Shows A/B/numbered markers    │
└───────────────────────────────────┘
```

---

## Component Hierarchy

```
NetworkMapPage
├── <style> (CSS for labels, popups)
├── Header Section
│   ├── Map Title
│   └── Subtitle
│
├── Search Bar
│   ├── Search Input
│   ├── Clear Button (X)
│   └── Dropdown Results
│       └── Stop Items
│
├── Routing UI Overlays
│   ├── Source Search Overlay (conditional: showSourceSearch)
│   │   ├── Header
│   │   │   ├── Title
│   │   │   └── Close Button (X)
│   │   ├── Destination Display (orange box)
│   │   ├── Search Input
│   │   └── Results List
│   │       └── Stop Items → onClick: handleSourceSelect
│   │
│   ├── Loading Overlay (conditional: routingLoading)
│   │   ├── Spinner Icon
│   │   ├── Title
│   │   └── Description
│   │
│   ├── Clear Route Button (conditional: routingMode && routingData)
│   │   ├── Icon (XCircle)
│   │   └── Text ("Clear Route")
│   │
│   ├── Routing Info Panel (conditional: routingMode && routingData)
│   │   ├── Header
│   │   │   ├── Route Icon
│   │   │   ├── Title
│   │   │   └── Close Button
│   │   ├── Stats Grid
│   │   │   ├── Distance Card
│   │   │   ├── Time Card
│   │   │   └── Stops Card
│   │   └── From/To Display
│   │
│   └── Error Banner (conditional: routingError)
│       ├── Error Icon
│       ├── Title & Message
│       └── Close Button
│
├── Main Content (Flex Row)
│   ├── Sidebar (Left)
│   │   ├── Routes Control Panel
│   │   │   ├── Header (Active Routes)
│   │   │   ├── Show All / Hide All Buttons
│   │   │   └── Route List
│   │   │       └── Route Items → onClick: toggleRoute
│   │   └── Legend Card
│   │       ├── Stop Legend
│   │       └── Route Legend
│   │
│   └── Map Container (Right - Full Height)
│       └── <MapContainer>
│           ├── <TileLayerController isDarkMode={isDarkMode} />
│           ├── <ZoomHandler setCurrentZoom={setCurrentZoom} />
│           ├── <MapController targetLocation={selectedStop} />
│           │
│           ├── Normal Mode Layers (conditional: !routingMode)
│           │   ├── <GeoJSON> for each visible route
│           │   └── <GeoJSON> for stops (when zoomed in)
│           │
│           └── Routing Mode Layers (conditional: routingMode && routingData)
│               ├── <GeoJSON> for each route segment
│               └── <Marker> for each path stop
│                   ├── Green "A" (start)
│                   ├── Blue numbers (intermediate)
│                   └── Red "B" (end)
```

---

## Algorithm Pseudocode

### Dijkstra's Shortest Path

```python
function findShortestPath(source, destination):
    # Initialization
    distances = {}
    for each stop in graph:
        distances[stop] = INFINITY
    distances[source] = 0
    
    previous = {}
    for each stop in graph:
        previous[stop] = NULL
    
    route_info = {}
    
    # Priority Queue (min-heap)
    pq = PriorityQueue()
    pq.push((0, source))
    
    visited = Set()
    
    # Main Loop
    while pq is not empty:
        (current_dist, current_stop) = pq.pop()
        
        if current_stop in visited:
            continue
        
        visited.add(current_stop)
        
        # Early exit if destination reached
        if current_stop == destination:
            break
        
        # Relax edges
        for each (neighbor, weight, edge_info) in edges[current_stop]:
            distance = current_dist + weight
            
            if distance < distances[neighbor]:
                distances[neighbor] = distance
                previous[neighbor] = current_stop
                route_info[neighbor] = edge_info
                pq.push((distance, neighbor))
    
    # Check if path exists
    if distances[destination] == INFINITY:
        raise NoPathFoundError
    
    # Reconstruct Path
    path = []
    current = destination
    while current is not NULL:
        path.append(current)
        current = previous[current]
    path.reverse()
    
    return (path, distances[destination], route_info)
```

### Time Complexity Analysis

```
n = number of stops (~450)
m = number of edges (~2000)

Graph Construction: O(m + n)
Dijkstra's Algorithm: O((m + n) log n)
Path Reconstruction: O(n)

Total: O((m + n) log n)

With n=450, m=2000:
≈ (2450) * log(450)
≈ 2450 * 8.8
≈ 21,560 operations

At 1 billion ops/sec:
≈ 0.02 milliseconds (theoretical)

Actual runtime: 50-200ms
(includes data processing, JSON serialization)
```

---

## Error Handling Flow

```
API Request
    │
    ├─ Validation Error (400)
    │   ├─ Missing source_stop_id
    │   ├─ Missing destination_stop_id
    │   └─ Invalid JSON
    │       → Return: {"detail": "Validation error"}
    │
    ├─ Not Found Error (404)
    │   ├─ Source stop doesn't exist
    │   ├─ Destination stop doesn't exist
    │   └─ No path found
    │       → Return: {"detail": "No path found between stops"}
    │
    ├─ Server Error (500)
    │   ├─ Graph not loaded
    │   ├─ Algorithm crash
    │   └─ Unexpected exception
    │       → Return: {"detail": "Routing error: <message>"}
    │
    └─ Success (200)
        → Return: {success: true, ...data}

Frontend Handling
    │
    ├─ Network Error
    │   ├─ Backend not running
    │   ├─ Connection timeout
    │   └─ CORS error
    │       → Show: "Failed to connect to routing service"
    │
    ├─ API Error (400/404/500)
    │   └─ Display error.detail in red banner
    │
    └─ Success
        └─ Display route on map
```

---

**🎉 Your transit routing system is fully documented!**

Use this guide to understand the complete flow and architecture.
