// Geofence detection logic - point-in-polygon and circle detection

import { GeoPoint, Zone } from '../types';

/**
 * Calculate distance between two GPS coordinates in degrees
 * Rough approximation: 1 degree ≈ 111 km
 */
export function calculateDistance(point1: GeoPoint, point2: GeoPoint): number {
  const latDiff = point1.latitude - point2.latitude;
  const lonDiff = point1.longitude - point2.longitude;
  return Math.sqrt(latDiff * latDiff + lonDiff * lonDiff);
}

/**
 * Check if a point is inside a circle
 * @param point - GPS coordinates to check
 * @param center - Center of circle
 * @param radius - Radius in degrees
 */
export function isPointInCircle(
  point: GeoPoint,
  center: [number, number],
  radius: number
): boolean {
  const distance = calculateDistance(point, {
    latitude: center[0],
    longitude: center[1]
  });
  return distance <= radius;
}

/**
 * Ray casting algorithm to check if point is inside polygon
 * Works for convex and concave polygons
 * @param point - GPS coordinates to check
 * @param polygonCoordinates - Array of [lat, lon] coordinate pairs
 */
export function isPointInPolygon(
  point: GeoPoint,
  polygonCoordinates: [number, number][]
): boolean {
  const { latitude: x, longitude: y } = point;
  let inside = false;

  for (let i = 0, j = polygonCoordinates.length - 1; i < polygonCoordinates.length; j = i++) {
    const [xi, yi] = polygonCoordinates[i];
    const [xj, yj] = polygonCoordinates[j];

    // Ray casting algorithm
    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }

  return inside;
}

/**
 * Check if a point is inside a zone
 * Handles both polygon and circle zones
 */
export function isPointInZone(point: GeoPoint, zone: Zone): boolean {
  if (zone.type === 'circle' && zone.center && zone.radius !== undefined) {
    return isPointInCircle(point, zone.center, zone.radius);
  }

  if (zone.type === 'polygon' && zone.coordinates) {
    return isPointInPolygon(point, zone.coordinates);
  }

  return false;
}

/**
 * Detect if movement is anomalous (impossible/unrealistic)
 * Flags if vehicle moved more than ~11km (0.1 degrees)
 */
export function isAnomalousMovement(
  previousLocation: GeoPoint | null,
  currentLocation: GeoPoint
): boolean {
  if (!previousLocation) return false;

  const distance = calculateDistance(previousLocation, currentLocation);
  const MAX_REALISTIC_JUMP = 0.1; // About 11km

  return distance > MAX_REALISTIC_JUMP;
}