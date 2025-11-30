// Types and interfaces for the geofence system

export interface LocationRequest {
    vehicleId: string;
    latitude: number;
    longitude: number;
    timestamp?: number;
  }
  
  export interface GeoPoint {
    latitude: number;
    longitude: number;
  }
  
  export interface ZoneEvent {
    type: 'enter' | 'exit';
    zone: string;
    timestamp: number;
  }
  
  export interface VehicleLocation {
    vehicleId: string;
    latitude: number;
    longitude: number;
    timestamp: number;
    currentZone: string | null;
  }
  
  export interface VehicleStatus {
    vehicleId: string;
    currentZone: string | null;
    lastLocationUpdate: number;
    lastLocation: GeoPoint;
    recentEvents: ZoneEvent[];
    totalEventsTracked: number;
  }
  
  export interface TrackingResult {
    vehicleId: string;
    latitude: number;
    longitude: number;
    currentZone: string | null;
    eventTriggered: boolean;
    event?: ZoneEvent;
  }
  
  export interface Zone {
    id: string;
    name: string;
    description: string;
    type: 'polygon' | 'circle';
    coordinates?: [number, number][];
    center?: [number, number];
    radius?: number;
  }
  
  export interface ValidationResult {
    valid: boolean;
    error?: string;
  }