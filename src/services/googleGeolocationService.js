/**
 * Google Geolocation API Service
 * Provides location data using WiFi, cell towers, and IP address
 */

import apiMonitoringService from './apiMonitoringService'

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const GEOLOCATION_API_URL = 'https://www.googleapis.com/geolocation/v1/geolocate';

/**
 * Get location using Google Geolocation API
 * Uses WiFi access points, cell towers, and IP address
 * @returns {Promise<Object>} Location data with latitude, longitude, and accuracy
 */
export const getCurrentLocation = async () => {
  if (!API_KEY) {
    throw new Error('Google Maps API key not configured');
  }

  const startTime = Date.now();

  try {
    const response = await fetch(`${GEOLOCATION_API_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        considerIp: true,
        // Optional: Include WiFi and cell tower data if available
        wifiAccessPoints: [],
        cellTowers: []
      })
    });

    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      // Record failed API call
      apiMonitoringService.recordApiCall(
        'google-geolocation',
        'location',
        false,
        responseTime,
        0.005 // $5 per 1,000 requests
      );

      if (response.status === 403) {
        throw new Error('Google Geolocation API access denied. Check your API key and billing.');
      }
      if (response.status === 400) {
        throw new Error('Invalid geolocation request');
      }
      throw new Error(`Geolocation API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.location) {
      // Record failed API call
      apiMonitoringService.recordApiCall(
        'google-geolocation',
        'location',
        false,
        responseTime,
        0.005
      );
      throw new Error('No location data received');
    }

    // Record successful API call
    apiMonitoringService.recordApiCall(
      'google-geolocation',
      'location',
      true,
      responseTime,
      0.005
    );

    return {
      latitude: data.location.lat,
      longitude: data.location.lng,
      accuracy: data.accuracy || 1000, // meters
      source: 'google_geolocation',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Google Geolocation API error:', error);
    throw error;
  }
};

/**
 * Check if Google Geolocation API is configured
 * @returns {boolean} True if API key is available
 */
export const isConfigured = () => {
  return !!API_KEY;
};

/**
 * Get location with enhanced accuracy using WiFi scan data
 * Note: This requires additional permissions and may not work in all browsers
 * @returns {Promise<Object>} Enhanced location data
 */
export const getEnhancedLocation = async () => {
  if (!API_KEY) {
    throw new Error('Google Maps API key not configured');
  }

  // Try to get WiFi access points if available
  let wifiAccessPoints = [];
  
  // Note: navigator.wifi is not widely supported
  // This is a placeholder for future enhancement
  if ('wifi' in navigator) {
    try {
      // This would require special permissions
      // const wifiData = await navigator.wifi.getNetworks();
      // wifiAccessPoints = wifiData.map(network => ({
      //   macAddress: network.bssid,
      //   signalStrength: network.level,
      //   channel: network.frequency
      // }));
    } catch (error) {
      console.log('WiFi data not available:', error);
    }
  }

  try {
    const response = await fetch(`${GEOLOCATION_API_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        considerIp: true,
        wifiAccessPoints: wifiAccessPoints,
        cellTowers: [] // Could be populated with cell tower data if available
      })
    });

    if (!response.ok) {
      throw new Error(`Enhanced geolocation failed: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      latitude: data.location.lat,
      longitude: data.location.lng,
      accuracy: data.accuracy || 1000,
      source: 'google_geolocation_enhanced',
      timestamp: new Date().toISOString(),
      enhancedData: {
        wifiPointsUsed: wifiAccessPoints.length,
        cellTowersUsed: 0
      }
    };
  } catch (error) {
    console.error('Enhanced geolocation error:', error);
    // Fallback to basic geolocation
    return getCurrentLocation();
  }
};

export default {
  getCurrentLocation,
  getEnhancedLocation,
  isConfigured
};
