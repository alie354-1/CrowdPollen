/**
 * Google Maps Service
 * Handles all Google Maps Platform APIs including Maps, Geocoding, and Places
 */

import apiMonitoringService from './apiMonitoringService'

class GoogleMapsService {
  constructor() {
    this.apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    this.baseUrl = 'https://maps.googleapis.com/maps/api';
    this.isLoaded = false;
    this.loadPromise = null;
  }

  /**
   * Load Google Maps JavaScript API
   */
  async loadGoogleMaps() {
    if (this.isLoaded) return window.google;
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = new Promise((resolve, reject) => {
      if (window.google && window.google.maps) {
        this.isLoaded = true;
        resolve(window.google);
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${this.apiKey}&libraries=places,geometry`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        this.isLoaded = true;
        resolve(window.google);
      };
      
      script.onerror = () => {
        reject(new Error('Failed to load Google Maps API'));
      };

      document.head.appendChild(script);
    });

    return this.loadPromise;
  }

  /**
   * Geocode address or ZIP code to coordinates
   */
  async geocodeAddress(address) {
    const startTime = Date.now();
    
    try {
      const response = await fetch(
        `${this.baseUrl}/geocode/json?address=${encodeURIComponent(address)}&key=${this.apiKey}`
      );
      
      const responseTime = Date.now() - startTime;
      
      if (!response.ok) {
        apiMonitoringService.recordApiCall(
          'google-maps',
          'geocoding',
          false,
          responseTime,
          0.005
        );
        throw new Error(`Geocoding failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status !== 'OK' || !data.results.length) {
        apiMonitoringService.recordApiCall(
          'google-maps',
          'geocoding',
          false,
          responseTime,
          0.005
        );
        throw new Error(`No results found for: ${address}`);
      }

      // Record successful API call
      apiMonitoringService.recordApiCall(
        'google-maps',
        'geocoding',
        true,
        responseTime,
        0.005
      );

      const result = data.results[0];
      const location = result.geometry.location;
      
      return {
        latitude: location.lat,
        longitude: location.lng,
        address: result.formatted_address,
        components: result.address_components,
        placeId: result.place_id,
        source: 'geocoding'
      };
    } catch (error) {
      console.error('Geocoding error:', error);
      throw error;
    }
  }

  /**
   * Reverse geocode coordinates to address
   */
  async reverseGeocode(latitude, longitude) {
    const startTime = Date.now();
    
    try {
      const response = await fetch(
        `${this.baseUrl}/geocode/json?latlng=${latitude},${longitude}&key=${this.apiKey}`
      );
      
      const responseTime = Date.now() - startTime;
      
      if (!response.ok) {
        apiMonitoringService.recordApiCall(
          'google-maps',
          'reverse_geocoding',
          false,
          responseTime,
          0.005
        );
        throw new Error(`Reverse geocoding failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status !== 'OK' || !data.results.length) {
        apiMonitoringService.recordApiCall(
          'google-maps',
          'reverse_geocoding',
          false,
          responseTime,
          0.005
        );
        throw new Error('No address found for coordinates');
      }

      // Record successful API call
      apiMonitoringService.recordApiCall(
        'google-maps',
        'reverse_geocoding',
        true,
        responseTime,
        0.005
      );

      const result = data.results[0];
      
      return {
        latitude,
        longitude,
        address: result.formatted_address,
        components: result.address_components,
        placeId: result.place_id,
        source: 'reverse_geocoding'
      };
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      throw error;
    }
  }

  /**
   * Validate and geocode ZIP code
   */
  async geocodeZipCode(zipCode) {
    // Add country code for better accuracy
    const query = `${zipCode}, USA`;
    
    try {
      const result = await this.geocodeAddress(query);
      
      // Verify it's actually a ZIP code result
      const hasPostalCode = result.components.some(
        component => component.types.includes('postal_code')
      );
      
      if (!hasPostalCode) {
        throw new Error('Invalid ZIP code');
      }
      
      return {
        ...result,
        zipCode,
        source: 'zip_code'
      };
    } catch (error) {
      console.error('ZIP code geocoding error:', error);
      throw new Error(`Invalid ZIP code: ${zipCode}`);
    }
  }

  /**
   * Search for places using Google Places API
   */
  async searchPlaces(query, location = null, radius = 50000) {
    try {
      let url = `${this.baseUrl}/place/textsearch/json?query=${encodeURIComponent(query)}&key=${this.apiKey}`;
      
      if (location) {
        url += `&location=${location.latitude},${location.longitude}&radius=${radius}`;
      }

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Places search failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status !== 'OK') {
        throw new Error(`Places API error: ${data.status}`);
      }

      return data.results.map(place => ({
        placeId: place.place_id,
        name: place.name,
        address: place.formatted_address,
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng,
        rating: place.rating,
        types: place.types
      }));
    } catch (error) {
      console.error('Places search error:', error);
      throw error;
    }
  }

  /**
   * Create a Google Map instance
   */
  async createMap(container, options = {}) {
    await this.loadGoogleMaps();
    
    const defaultOptions = {
      zoom: 10,
      center: { lat: 40.7128, lng: -74.0060 }, // NYC default
      mapTypeId: 'roadmap',
      zoomControl: true,
      streetViewControl: false,
      fullscreenControl: false,
      mapTypeControl: false,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    };

    const mapOptions = { ...defaultOptions, ...options };
    return new window.google.maps.Map(container, mapOptions);
  }

  /**
   * Add marker to map
   */
  createMarker(map, position, options = {}) {
    const defaultOptions = {
      position,
      map,
      animation: window.google.maps.Animation.DROP
    };

    return new window.google.maps.Marker({ ...defaultOptions, ...options });
  }

  /**
   * Create info window
   */
  createInfoWindow(content, options = {}) {
    return new window.google.maps.InfoWindow({
      content,
      ...options
    });
  }

  /**
   * Calculate distance between two points
   */
  calculateDistance(point1, point2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(point2.latitude - point1.latitude);
    const dLon = this.toRadians(point2.longitude - point1.longitude);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(point1.latitude)) * Math.cos(this.toRadians(point2.latitude)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
  }

  /**
   * Convert degrees to radians
   */
  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Get current location using browser geolocation
   */
  async getCurrentLocation(options = {}) {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      const defaultOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      };

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude, accuracy } = position.coords;
            
            // Get address for the coordinates
            const locationData = await this.reverseGeocode(latitude, longitude);
            
            resolve({
              ...locationData,
              accuracy,
              source: 'gps'
            });
          } catch (error) {
            // Return coordinates even if reverse geocoding fails
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              address: `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`,
              source: 'gps'
            });
          }
        },
        (error) => {
          let message = 'Location access failed';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = 'Location access denied by user';
              break;
            case error.POSITION_UNAVAILABLE:
              message = 'Location information unavailable';
              break;
            case error.TIMEOUT:
              message = 'Location request timed out';
              break;
          }
          reject(new Error(message));
        },
        { ...defaultOptions, ...options }
      );
    });
  }

  /**
   * Check if API key is configured
   */
  isConfigured() {
    return !!this.apiKey;
  }

  /**
   * Get fallback location data for demo mode
   */
  getFallbackLocation(zipCode) {
    const fallbackLocations = {
      '10001': { lat: 40.7505, lng: -73.9934, address: 'New York, NY 10001' },
      '11218': { lat: 40.6441, lng: -73.9710, address: 'Brooklyn, NY 11218' },
      '90210': { lat: 34.0901, lng: -118.4065, address: 'Beverly Hills, CA 90210' },
      '60601': { lat: 41.8827, lng: -87.6233, address: 'Chicago, IL 60601' },
      '94102': { lat: 37.7849, lng: -122.4094, address: 'San Francisco, CA 94102' }
    };

    const fallback = fallbackLocations[zipCode];
    if (fallback) {
      return {
        latitude: fallback.lat,
        longitude: fallback.lng,
        address: fallback.address,
        zipCode,
        source: 'fallback'
      };
    }

    throw new Error(`Unsupported ZIP code: ${zipCode}`);
  }
}

// Export singleton instance
export default new GoogleMapsService();
