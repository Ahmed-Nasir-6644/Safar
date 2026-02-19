# Quick Reference: API Testing

## Test Backend Health
```powershell
curl http://localhost:8000/health
```

## Get All Stops
```powershell
curl http://localhost:8000/stops
```

## Get All Routes
```powershell
curl http://localhost:8000/routes
```

## Find a Route (Example)
```powershell
curl -X POST http://localhost:8000/find-route `
  -H "Content-Type: application/json" `
  -d '{
    "source_stop_id": "karachi_company_down",
    "destination_stop_id": "pims_station_fr_down"
  }'
```

## Test with Different Stops

### Short Route (Same Area)
```powershell
curl -X POST http://localhost:8000/find-route `
  -H "Content-Type: application/json" `
  -d '{
    "source_stop_id": "g94_park_down",
    "destination_stop_id": "karachi_company_down"
  }'
```

### Metro Route
```powershell
curl -X POST http://localhost:8000/find-route `
  -H "Content-Type: application/json" `
  -d '{
    "source_stop_id": "pims_station",
    "destination_stop_id": "secretariat_station"
  }'
```

### Long Distance Route
```powershell
curl -X POST http://localhost:8000/find-route `
  -H "Content-Type: application/json" `
  -d '{
    "source_stop_id": "airport_station",
    "destination_stop_id": "zoo_up"
  }'
```

## Common Stop IDs

- `airport_station` - Airport
- `pims_station` - PIMS Metro Station
- `secretariat_station` - Secretariat Metro Station
- `saddar_station` - Saddar Metro Station
- `zero_point_up` - Zero Point
- `blue_area_down` - Blue Area
- `aabpara_f8a_down` - Aabpara
- `faiz_station` - Faiz Ahmed Faiz Metro Station
- `golra_station` - Golra Morr Metro Station
