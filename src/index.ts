import express, { Request, Response, Application } from 'express';
import { logger } from './utils/logger';
import { validateLocationInput } from './utils/validator';
import { initializeZones, getAllZones } from './config/zones';
import { trackVehicleLocation } from './services/vehicleTracker';
import { getVehicleStatus } from './services/vehicleTracker';

const app: Application = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Request logging middleware
app.use((req: Request, _res: Response, next) => {
  logger.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Initialize zones on startup
initializeZones();

// Routes

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  const uptime = process.uptime();
  res.status(200).json({
    status: 'ok',
    uptime: Math.floor(uptime),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Get all zones
app.get('/api/zones', (_req: Request, res: Response) => {
  try {
    const zones = getAllZones();
    res.status(200).json({
      success: true,
      data: {
        totalZones: zones.length,
        zones: zones.map(z => ({
          id: z.id,
          name: z.name,
          description: z.description,
          type: z.type
        }))
      }
    });
  } catch (error) {
    logger.error(`Error fetching zones: ${error}`);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch zones'
    });
  }
});

// Report vehicle location
app.post('/api/location', (req: Request, res: Response) => {
  try {
    const { vehicleId, latitude, longitude, timestamp } = req.body;

    // Validate input
    const validation = validateLocationInput(vehicleId, latitude, longitude);
    if (!validation.valid) {
      res.status(400).json({
        success: false,
        error: validation.error
      });
      return;
    }

    // Track the vehicle location
    const result = trackVehicleLocation(
      vehicleId,
      latitude,
      longitude,
      timestamp || Date.now()
    );

    res.status(200).json({
      success: true,
      data: {
        vehicleId: result.vehicleId,
        location: {
          latitude: result.latitude,
          longitude: result.longitude
        },
        currentZone: result.currentZone || 'Outside all zones',
        eventTriggered: result.eventTriggered,
        ...(result.event && { event: result.event })
      }
    });
  } catch (error) {
    logger.error(`Error processing location: ${error}`);
    res.status(500).json({
      success: false,
      error: 'Failed to process location update'
    });
  }
});

// Get vehicle status
app.get('/api/vehicle/:vehicleId', (req: Request, res: Response) => {
  try {
    const { vehicleId } = req.params;

    const status = getVehicleStatus(vehicleId);

    if (!status) {
      res.status(404).json({
        success: false,
        error: `Vehicle ${vehicleId} has no location data yet`
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: status
    });
  } catch (error) {
    logger.error(`Error fetching vehicle status: ${error}`);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vehicle status'
    });
  }
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: `Endpoint ${req.method} ${req.path} not found`
  });
});

// Start server
app.listen(PORT, () => {
  logger.log(`Server running on http://localhost:${PORT}`);
  logger.log(`Health check: http://localhost:${PORT}/health`);
  logger.log(`API docs: Check README.md for endpoint documentation`);
});

export default app;