# Geofence Event Processing Service
This is a taxi tracking system that detects when vehicles enter or exit geographical zones. When a taxi enters a zone like "Downtown" or "Airport", the system creates an event. When it exits, another event is created.
## How It Works
1. **Zones** - The system has 4 predefined zones:
   - Downtown (polygon shape)
   - Airport (circle shape)
   - Harbor (polygon shape)
   - Stadium (circle shape)

2. **Vehicle Tracking** - When you send a vehicle's GPS location, the system:
   - Checks which zone it's in
   - Compares with previous location
   - Creates an event if zone changed
   - Stores event history

3. **API Endpoints** - You can:
   - Check if server is running
   - Get list of all zones
   - Report vehicle location
   - Get vehicle status and event history

### Setup

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build and run production
npm run build
npm start
```

The server runs on `http://localhost:3000`

---

## API Endpoints

### 1. Report Vehicle Location
**POST** `/api/location`

Send a vehicle's GPS coordinates to the system.

**Request:**
```json
{
  "vehicleId": "taxi-001",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "timestamp": 1701345600000
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "vehicleId": "taxi-001",
    "location": { "latitude": 40.7128, "longitude": -74.0060 },
    "currentZone": "Downtown",
    "eventTriggered": true,
    "event": {
      "type": "enter",
      "zone": "Downtown",
      "timestamp": 1701345600000
    }
  }
}
```

**Response (Error - Invalid Coordinates):**
```json
{
  "success": false,
  "error": "Invalid latitude. Must be between -90 and 90"
}
```

---

### 2. Get Vehicle Status
**GET** `/api/vehicle/:vehicleId`

Check which zone a vehicle is currently in and see recent zone transitions.

**Request:**
```
GET /api/vehicle/taxi-001
```

**Response:**
```json
{
  "success": true,
  "data": {
    "vehicleId": "taxi-001",
    "currentZone": "Downtown",
    "lastLocationUpdate": 1701345600000,
    "lastLocation": {
      "latitude": 40.7128,
      "longitude": -74.0060
    },
    "recentEvents": [
      {
        "type": "enter",
        "zone": "Downtown",
        "timestamp": 1701345600000
      },
      {
        "type": "exit",
        "zone": "Harbor",
        "timestamp": 1701345500000
      }
    ],
    "totalEventsTracked": 5
  }
}
```

**Response (Not Found):**
```json
{
  "success": false,
  "error": "Vehicle taxi-001 has no location data yet"
}
```

---

### 3. Get All Zones
**GET** `/api/zones`

Get information about all available geographic zones.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalZones": 4,
    "zones": [
      {
        "id": "downtown",
        "name": "Downtown",
        "description": "City center zone",
        "type": "polygon"
      },
      {
        "id": "airport",
        "name": "Airport",
        "description": "Airport terminal zone",
        "type": "circle"
      }
    ]
  }
}
```

---

### 4. Health Check
**GET** `/health`

Check if the service is running.

**Response:**
```json
{
  "status": "ok",
  "uptime": 3600,
  "vehiclesTracked": 5,
  "totalEventsProcessed": 23
}
```

---

## Example Usage

### Test with curl

```bash
# Report a vehicle entering Downtown zone
curl -X POST http://localhost:3000/api/location \
  -H "Content-Type: application/json" \
  -d '{
    "vehicleId": "taxi-001",
    "latitude": 40.7128,
    "longitude": -74.0060
  }'

# Check vehicle status
curl http://localhost:3000/api/vehicle/taxi-001

# Get all zones
curl http://localhost:3000/api/zones

# Health check
curl http://localhost:3000/health
```

---

## Design Decisions

### 1. **In-Memory Storage**
- Used for simplicity and speed (no database setup needed)
- Good for demonstration purposes
- Each vehicle stores up to 50 recent events
- Zones are loaded on startup

**Trade-off:** Data is lost on server restart. In production, we'd use a database like MongoDB or Redis.

### 2. **Geofence Detection Algorithm**
- **Polygon zones:** Uses point-in-polygon ray casting algorithm
- **Circle zones:** Simple distance calculation from center
- Both are efficient for real-time processing

**Why it works:** O(n) complexity where n is number of zone boundaries, sufficient for typical taxi operations.

### 3. **Event Detection Logic**
- Compares vehicle's **previous zone** with **current zone**
- If different, generates `enter` or `exit` event
- Handles vehicles starting outside all zones gracefully

**Edge case handled:** Vehicles on zone boundaries are considered "inside" if they're even partially in the zone.

### 4. **Error Handling**
- Validates all GPS coordinates (latitude: -90 to 90, longitude: -180 to 180)
- Handles missing or malformed JSON gracefully
- Detects and logs anomalous jumps (vehicle teleporting > 0.1 degrees)
- Returns meaningful error messages

### 5. **Logging & Monitoring**
- Every request is logged with timestamp
- Zone transitions are logged for audit trail
- Anomalies (impossible movements) trigger warning logs
- Health endpoint provides service metrics

---

## Code Structure

```
.
├── src/
│   ├── index.ts              # Main Express app setup
│   ├── routes/
│   │   └── location.ts       # Location and vehicle endpoints
│   ├── services/
│   │   ├── geofence.ts       # Geofence detection logic
│   │   └── vehicleTracker.ts # Vehicle state management
│   ├── types/
│   │   └── index.ts          # TypeScript interfaces
│   ├── utils/
│   │   ├── logger.ts         # Logging utility
│   │   └── validator.ts      # Input validation
│   └── config/
│       └── zones.ts          # Zone definitions
├── package.json
└── tsconfig.json
```

---

## What Could Be Improved (Given More Time)

### 1. **Database Integration**
```
Replace in-memory storage with MongoDB for persistence.
This allows queries like "all vehicles in Downtown zone" 
and historical analysis of movement patterns.
```

### 2. **Real-time Notifications**
```
Add WebSocket support to push zone events to clients 
instead of polling. Clients get instant notifications 
when events occur.
```

### 3. **Geofence Complexity**
```
Support for more complex shapes:
- Multi-polygon zones (zones with holes)
- Elevation constraints (3D geofences)
- Time-based zone changes (rush hour vs normal)
```

### 4. **Performance Optimization**
```
For high volume (10k+ vehicles):
- Implement spatial indexing (R-tree) for faster zone lookups
- Cache zone membership results
- Use message queue (Redis) for event processing
```

### 5. **Advanced Features**
```
- Geofence alerts and notifications
- Route history and playback
- Dwell time detection (vehicle stationary in zone)
- Zone congestion metrics
- Analytics dashboard
```

### 6. **Testing**
```
Add comprehensive test suite:
- Unit tests for geofence detection algorithm
- Integration tests for API endpoints
- Load testing for concurrent vehicles
```

### 7. **Deployment**
```
- Docker containerization for easy deployment
- Kubernetes orchestration for scaling
- CI/CD pipeline for automated testing
- Monitoring and alerting setup (Datadog, New Relic)
```

---

## Assumptions

1. **Timestamps:** Vehicle sends current timestamp (milliseconds since epoch). If not provided, server uses current time.

2. **Zone Definitions:** Zones are predefined and loaded on startup. New zones require server restart.

3. **GPS Accuracy:** Assumes GPS data is reasonably accurate. Filters out impossible movements (jumps > 0.1 degrees ≈ 11km).

4. **Vehicle IDs:** Each vehicle has a unique string ID. No authentication needed for this demo.

5. **Event Window:** Only recent 50 events per vehicle are kept in memory to manage memory usage.

6. **Concurrency:** Assumes moderate traffic (< 1000 concurrent vehicles). For higher volumes, would need clustering.

---

## Testing the System

Here's a typical workflow:

```bash
# 1. Start the server
npm run dev

# 2. Send a vehicle into Downtown zone
curl -X POST http://localhost:3000/api/location \
  -H "Content-Type: application/json" \
  -d '{
    "vehicleId": "taxi-001",
    "latitude": 40.7128,
    "longitude": -74.0060
  }'

# Response should show: "event": { "type": "enter", "zone": "Downtown" }

# 3. Move vehicle slightly (still in Downtown)
curl -X POST http://localhost:3000/api/location \
  -H "Content-Type: application/json" \
  -d '{
    "vehicleId": "taxi-001",
    "latitude": 40.7135,
    "longitude": -74.0055
  }'

# Response should show: "eventTriggered": false (still in same zone)

# 4. Move vehicle out of Downtown
curl -X POST http://localhost:3000/api/location \
  -H "Content-Type: application/json" \
  -d '{
    "vehicleId": "taxi-001",
    "latitude": 40.6995,
    "longitude": -74.0087
  }'

# Response should show: "event": { "type": "exit", "zone": "Downtown" }
# And possibly: "event": { "type": "enter", "zone": "Harbor" }

# 5. Check vehicle status
curl http://localhost:3000/api/vehicle/taxi-001

# Shows: currentZone: "Harbor" and full event history
```

---

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js (minimal HTTP framework)
- **Language:** TypeScript (type-safe, maintainable)
- **Algorithms:** Point-in-polygon ray casting, distance calculations
- **Logging:** Console-based (can be upgraded to Winston/Morgan)

---
