# MetroMate Routing Backend

## Installation

```bash
cd backend
pip install -r requirements.txt
```

## Run the Server

```bash
python routing_service.py
```

Server will start on http://localhost:8000

## API Endpoints

### 1. Health Check
```
GET /health
```

### 2. Get All Stops
```
GET /stops
```

### 3. Get All Routes
```
GET /routes
```

### 4. Find Route (Main Routing Endpoint)
```
POST /find-route
Content-Type: application/json

{
  "source_stop_id": "karachi_company_down",
  "destination_stop_id": "pims_station"
}
```

**Response:**
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
    ...
  ],
  "route_segments": [
    {
      "route_name": "METRO LINE 3A",
      "color": "#8B5CF6",
      "geometry": { "type": "LineString", "coordinates": [[...]] },
      "stops": [...]
    }
  ],
  "total_distance": 12.5,
  "total_time": 25.0
}
```

## How It Works

1. **Graph Construction**: Loads stops and routes from GeoJSON files
2. **Edge Building**: Connects stops based on route geometries
3. **Dijkstra's Algorithm**: Finds shortest path (time-weighted)
4. **Route Segmentation**: Groups consecutive stops by route/line
5. **Geometry Extraction**: Returns exact route shapes for map rendering
