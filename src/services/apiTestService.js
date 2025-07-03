/**
 * API Testing Service
 * Helps test and validate all API integrations
 */

import googleMapsService from './googleMapsService.js';
import googlePollenService from './googlePollenService.js';
import googleWeatherService from './googleWeatherService.js';

/**
 * Test all API services and show their status
 * @returns {Promise<Object>} Test results for all services
 */
export const testAllServices = async () => {
  const results = {
    timestamp: new Date().toISOString(),
    services: {}
  };

  // Test Google Maps Service
  try {
    const mapsConfigured = googleMapsService.isConfigured();
    results.services.googleMaps = {
      configured: mapsConfigured,
      status: mapsConfigured ? 'ready' : 'needs_api_key',
      message: mapsConfigured ? 
        'Google Maps API key found' : 
        'Add VITE_GOOGLE_MAPS_API_KEY to .env file'
    };

    if (mapsConfigured) {
      // Test geocoding
      try {
        const location = await googleMapsService.geocodeAddress('New York, NY');
        results.services.googleMaps.geocoding = 'working';
        results.services.googleMaps.testLocation = location;
      } catch (error) {
        results.services.googleMaps.geocoding = 'error';
        results.services.googleMaps.error = error.message;
      }
    }
  } catch (error) {
    results.services.googleMaps = {
      configured: false,
      status: 'error',
      error: error.message
    };
  }

  // Test Google Pollen Service
  try {
    const pollenKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || import.meta.env.VITE_GOOGLE_POLLEN_API_KEY;
    results.services.googlePollen = {
      configured: !!pollenKey,
      status: pollenKey ? 'ready' : 'using_mock_data',
      message: pollenKey ? 
        'Google Pollen API key found' : 
        'Using mock data - add VITE_GOOGLE_MAPS_API_KEY for real data'
    };

    // Test pollen forecast (will use mock data if no key)
    try {
      const forecast = await googlePollenService.getForecast(40.7128, -74.0060, 3);
      results.services.googlePollen.forecast = 'working';
      results.services.googlePollen.dataSource = forecast.metadata?.source || 'unknown';
      results.services.googlePollen.sampleData = {
        days: forecast.dailyForecasts?.length || 0,
        firstDay: forecast.dailyForecasts?.[0]?.date
      };
    } catch (error) {
      results.services.googlePollen.forecast = 'error';
      results.services.googlePollen.error = error.message;
    }
  } catch (error) {
    results.services.googlePollen = {
      configured: false,
      status: 'error',
      error: error.message
    };
  }

  // Test Google Weather Service
  try {
    const weatherConfigured = googleWeatherService.isConfigured();
    results.services.googleWeather = {
      configured: weatherConfigured,
      status: weatherConfigured ? 'ready' : 'using_mock_data',
      message: weatherConfigured ? 
        'Weather API configured' : 
        'Using mock data - add VITE_OPENWEATHER_API_KEY for real weather'
    };

    // Test weather forecast (will use mock data if no key)
    try {
      const weather = await googleWeatherService.getCurrentWeather(40.7128, -74.0060);
      results.services.googleWeather.current = 'working';
      results.services.googleWeather.dataSource = weather.metadata?.source || 'unknown';
      results.services.googleWeather.sampleData = {
        temperature: weather.current?.temperature,
        condition: weather.current?.condition?.main
      };
    } catch (error) {
      results.services.googleWeather.current = 'error';
      results.services.googleWeather.error = error.message;
    }
  } catch (error) {
    results.services.googleWeather = {
      configured: false,
      status: 'error',
      error: error.message
    };
  }

  // Test Google Geolocation Service
  try {
    const { default: googleGeolocationService } = await import('./googleGeolocationService.js');
    const geolocationConfigured = googleGeolocationService.isConfigured();
    
    results.services.googleGeolocation = {
      configured: geolocationConfigured,
      status: geolocationConfigured ? 'ready' : 'needs_api_key',
      message: geolocationConfigured ? 
        'Google Geolocation API configured ($5 per 1,000 requests)' : 
        'Add VITE_GOOGLE_MAPS_API_KEY to enable geolocation without GPS'
    };

    if (geolocationConfigured) {
      // Note: We don't test the actual geolocation API here to avoid charges
      // The user can test it manually in the location settings
      results.services.googleGeolocation.note = 'API ready - test manually to avoid charges';
    }
  } catch (error) {
    results.services.googleGeolocation = {
      configured: false,
      status: 'error',
      error: error.message
    };
  }

  return results;
};

/**
 * Get setup instructions based on current configuration
 * @returns {Object} Setup instructions
 */
export const getSetupInstructions = () => {
  const mapsKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const huggingFaceKey = import.meta.env.VITE_HUGGINGFACE_API_TOKEN;

  const instructions = {
    required: [],
    optional: [],
    status: 'complete'
  };

  // Check required keys for core functionality
  if (!supabaseUrl) {
    instructions.required.push({
      service: 'Supabase',
      key: 'VITE_SUPABASE_URL',
      description: 'Database and authentication',
      priority: 'high'
    });
    instructions.status = 'incomplete';
  }

  if (!supabaseKey) {
    instructions.required.push({
      service: 'Supabase',
      key: 'VITE_SUPABASE_ANON_KEY',
      description: 'Database authentication key',
      priority: 'high'
    });
    instructions.status = 'incomplete';
  }

  if (!mapsKey) {
    instructions.required.push({
      service: 'Google Cloud',
      key: 'VITE_GOOGLE_MAPS_API_KEY',
      description: 'Maps, geocoding, pollen & weather data',
      priority: 'high'
    });
    instructions.status = 'incomplete';
  }

  // Check optional keys
  if (!huggingFaceKey) {
    instructions.optional.push({
      service: 'Hugging Face',
      key: 'VITE_HUGGINGFACE_API_TOKEN',
      description: 'AI pollen detection from photos',
      priority: 'medium'
    });
  }

  return instructions;
};

/**
 * Generate a simple .env file template
 * @returns {string} .env file content
 */
export const generateEnvTemplate = () => {
  return `# CrowdPollen - Simplified 3-Provider Setup
# Copy this to .env and add your API keys

# 1️⃣ SUPABASE (Required for database & auth)
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# 2️⃣ GOOGLE CLOUD (Required for maps, pollen & weather)
VITE_GOOGLE_MAPS_API_KEY=your_google_cloud_api_key

# 3️⃣ HUGGING FACE (Optional - for AI pollen detection)
VITE_HUGGINGFACE_API_TOKEN=your_huggingface_token

# 🔧 App Configuration
VITE_APP_ENV=development
VITE_ENABLE_ANALYTICS=false
`;
};

export default {
  testAllServices,
  getSetupInstructions,
  generateEnvTemplate
};
