// Input validation utilities

import { ValidationResult } from '../types';

/**
 * Validate location input data
 * Checks for required fields and valid GPS coordinates
 */
export function validateLocationInput(
  vehicleId: string | undefined,
  latitude: number | undefined,
  longitude: number | undefined
): ValidationResult {
  // Check required fields
  if (!vehicleId) {
    return {
      valid: false,
      error: 'vehicleId is required'
    };
  }

  if (latitude === undefined || latitude === null) {
    return {
      valid: false,
      error: 'latitude is required'
    };
  }

  if (longitude === undefined || longitude === null) {
    return {
      valid: false,
      error: 'longitude is required'
    };
  }

  // Validate vehicle ID format
  if (typeof vehicleId !== 'string' || vehicleId.trim().length === 0) {
    return {
      valid: false,
      error: 'vehicleId must be a non-empty string'
    };
  }

  // Validate latitude
  if (typeof latitude !== 'number' || isNaN(latitude)) {
    return {
      valid: false,
      error: 'latitude must be a valid number'
    };
  }

  if (latitude < -90 || latitude > 90) {
    return {
      valid: false,
      error: 'Invalid latitude. Must be between -90 and 90'
    };
  }

  // Validate longitude
  if (typeof longitude !== 'number' || isNaN(longitude)) {
    return {
      valid: false,
      error: 'longitude must be a valid number'
    };
  }

  if (longitude < -180 || longitude > 180) {
    return {
      valid: false,
      error: 'Invalid longitude. Must be between -180 and 180'
    };
  }

  return { valid: true };
}

/**
 * Validate vehicle ID
 */
export function isValidVehicleId(vehicleId: string): boolean {
  return typeof vehicleId === 'string' && vehicleId.trim().length > 0;
}

/**
 * Validate GPS coordinates
 */
export function isValidGpsCoordinates(latitude: number, longitude: number): boolean {
  return (
    typeof latitude === 'number' &&
    !isNaN(latitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    typeof longitude === 'number' &&
    !isNaN(longitude) &&
    longitude >= -180 &&
    longitude <= 180
  );
}