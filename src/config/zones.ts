// Zone configuration and management

import { Zone } from '../types';
import { logger } from '../utils/logger';

let zones: Zone[] = [];

/**
 * Initialize all predefined zones
 * These are loaded on server startup
 */
export function initializeZones(): void {
  zones = [
    {
      id: 'downtown',
      name: 'Downtown',
      description: 'City center commercial zone',
      type: 'polygon',
      coordinates: [
        [40.7128, -74.0060],
        [40.7150, -74.0060],
        [40.7150, -74.0040],
        [40.7128, -74.0040]
      ]
    },
    {
      id: 'airport',
      name: 'Airport',
      description: 'Airport terminal zone',
      type: 'circle',
      center: [40.7769, -73.8740],
      radius: 0.01 // About 1.1 km radius
    },
    {
      id: 'harbor',
      name: 'Harbor',
      description: 'Waterfront harbor zone',
      type: 'polygon',
      coordinates: [
        [40.7061, -74.0087],
        [40.7061, -73.9960],
        [40.6995, -73.9960],
        [40.6995, -74.0087]
      ]
    },
    {
      id: 'stadium',
      name: 'Stadium',
      description: 'Sports complex zone',
      type: 'circle',
      center: [40.7282, -73.9942],
      radius: 0.008 // About 0.9 km radius
    }
  ];

  logger.log(`Initialized ${zones.length} zones`);
}

/**
 * Get all zones
 */
export function getAllZones(): Zone[] {
  return zones;
}

/**
 * Get a specific zone by ID
 */
export function getZoneById(zoneId: string): Zone | undefined {
  return zones.find(z => z.id === zoneId);
}

/**
 * Get a specific zone by name
 */
export function getZoneByName(zoneName: string): Zone | undefined {
  return zones.find(z => z.name === zoneName);
}

/**
 * Add a new zone at runtime (for advanced use)
 */
export function addZone(zone: Zone): void {
  const exists = zones.find(z => z.id === zone.id);
  if (exists) {
    logger.warn(`Zone with ID ${zone.id} already exists`);
    return;
  }
  zones.push(zone);
  logger.log(`Added new zone: ${zone.name}`);
}

/**
 * Remove a zone (for advanced use)
 */
export function removeZone(zoneId: string): void {
  zones = zones.filter(z => z.id !== zoneId);
  logger.log(`Removed zone: ${zoneId}`);
}

/**
 * Get zone count
 */
export function getZoneCount(): number {
  return zones.length;
}