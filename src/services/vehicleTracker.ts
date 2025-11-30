// Vehicle tracking service - manages vehicle state and location history

import { GeoPoint, VehicleLocation, VehicleStatus, ZoneEvent, TrackingResult } from '../types';
import { isPointInZone, isAnomalousMovement } from './geofence';
import { getAllZones } from '../config/zones';
import { logger } from '../utils/logger';

// Store vehicle locations and their event history
interface VehicleData {
  location: VehicleLocation;
  events: ZoneEvent[];
}

const vehicleStore = new Map<string, VehicleData>();
const MAX_EVENTS_PER_VEHICLE = 50; // Keep last 50 events in memory

/**
 * Find which zone a vehicle is currently in
 */
function findCurrentZone(point: GeoPoint): string | null {
  const zones = getAllZones();

  for (const zone of zones) {
    if (isPointInZone(point, zone)) {
      return zone.name;
    }
  }

  return null;
}

/**
 * Track a vehicle's new location
 * Detects zone entries and exits
 * Returns result with event info if zone boundary was crossed
 */
export function trackVehicleLocation(
  vehicleId: string,
  latitude: number,
  longitude: number,
  timestamp: number
): TrackingResult {
  const currentLocation: GeoPoint = { latitude, longitude };
  const previousData = vehicleStore.get(vehicleId);
  const previousLocation = previousData?.location;

  // Check for anomalous movements (possible GPS errors)
  if (previousLocation && isAnomalousMovement(previousLocation, currentLocation)) {
    logger.warn(
      `Anomalous movement detected for ${vehicleId}: jumped from ` +
      `(${previousLocation.latitude}, ${previousLocation.longitude}) to ` +
      `(${latitude}, ${longitude})`
    );
  }

  // Find current zone
  const newZone = findCurrentZone(currentLocation);
  const previousZone = previousData?.location.currentZone || null;

  // Track location
  const newLocation: VehicleLocation = {
    vehicleId,
    latitude,
    longitude,
    timestamp,
    currentZone: newZone
  };

  // Initialize or update vehicle data
  let vehicleData = vehicleStore.get(vehicleId);
  if (!vehicleData) {
    vehicleData = {
      location: newLocation,
      events: []
    };
  } else {
    vehicleData.location = newLocation;
  }

  // Check if zone changed
  let eventTriggered = false;
  let event: ZoneEvent | undefined;

  if (previousZone !== newZone) {
    if (previousZone !== null && newZone !== null) {
      // Vehicle exited one zone and entered another
      const exitEvent: ZoneEvent = {
        type: 'exit',
        zone: previousZone,
        timestamp
      };
      const enterEvent: ZoneEvent = {
        type: 'enter',
        zone: newZone,
        timestamp
      };

      vehicleData.events.push(exitEvent, enterEvent);
      event = enterEvent; // Return the enter event as primary
      eventTriggered = true;

      logger.log(`Vehicle ${vehicleId} exited ${previousZone} and entered ${newZone}`);
    } else if (previousZone !== null) {
      // Vehicle exited a zone
      event = {
        type: 'exit',
        zone: previousZone,
        timestamp
      };
      vehicleData.events.push(event);
      eventTriggered = true;

      logger.log(`Vehicle ${vehicleId} exited ${previousZone}`);
    } else if (newZone !== null) {
      // Vehicle entered a zone
      event = {
        type: 'enter',
        zone: newZone,
        timestamp
      };
      vehicleData.events.push(event);
      eventTriggered = true;

      logger.log(`Vehicle ${vehicleId} entered ${newZone}`);
    }
  }

  // Keep only recent events to manage memory
  if (vehicleData.events.length > MAX_EVENTS_PER_VEHICLE) {
    vehicleData.events = vehicleData.events.slice(-MAX_EVENTS_PER_VEHICLE);
  }

  // Save updated data
  vehicleStore.set(vehicleId, vehicleData);

  return {
    vehicleId,
    latitude,
    longitude,
    currentZone: newZone,
    eventTriggered,
    ...(event && { event })
  };
}

/**
 * Get complete status for a vehicle
 * Returns current zone, last location, and recent events
 */
export function getVehicleStatus(vehicleId: string): VehicleStatus | null {
  const vehicleData = vehicleStore.get(vehicleId);

  if (!vehicleData) {
    return null;
  }

  const { location, events } = vehicleData;

  return {
    vehicleId,
    currentZone: location.currentZone || null,
    lastLocationUpdate: location.timestamp,
    lastLocation: {
      latitude: location.latitude,
      longitude: location.longitude
    },
    recentEvents: events.slice(-10), // Return last 10 events
    totalEventsTracked: events.length
  };
}

/**
 * Get all tracked vehicles (for debugging/admin)
 */
export function getAllTrackedVehicles(): VehicleStatus[] {
  const allVehicles: VehicleStatus[] = [];

  vehicleStore.forEach((_data, vehicleId) => {
    const status = getVehicleStatus(vehicleId);
    if (status) {
      allVehicles.push(status);
    }
  });

  return allVehicles;
}

/**
 * Get vehicles currently in a specific zone
 */
export function getVehiclesInZone(zoneName: string): VehicleStatus[] {
  const allVehicles = getAllTrackedVehicles();
  return allVehicles.filter(v => v.currentZone === zoneName);
}

/**
 * Clear all vehicle data (for testing/reset)
 */
export function clearAllVehicleData(): void {
  vehicleStore.clear();
  logger.log('All vehicle data cleared');
}
