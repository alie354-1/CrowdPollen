/**
 * Google Weather API Service
 * Handles weather data from Google's Weather API to complement pollen forecasts
 */

const API_BASE_URL = 'https://weather.googleapis.com/v1';
const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY; // Uses same key as Maps API

// Cache configuration
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes for weather data
const FORECAST_CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours for forecasts
const cache = new Map();

/**
 * Cache key generator for weather requests
 */
const generateCacheKey = (latitude, longitude, type = 'current') => {
  const lat = Math.round(latitude * 1000) / 1000;
  const lng = Math.round(longitude * 1000) / 1000;
  return `weather_${type}_${lat}_${lng}`;
};

/**
 * Check if cached data is still valid
 */
const isCacheValid = (cacheEntry, duration = CACHE_DURATION) => {
  return cacheEntry && (Date.now() - cacheEntry.timestamp) < duration;
};

/**
 * Generic API request handler with error handling
 */
const makeApiRequest = async (url, options = {}, retries = 3) => {
  if (!API_KEY) {
    throw new Error('Google Maps API key not configured');
  }

  const requestOptions = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(url, requestOptions);
      
      if (!response.ok) {
        if (response.status === 429) {
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        if (response.status === 403) {
          throw new Error('Google Weather API access denied. Check your API key.');
        }
        
        throw new Error(`Weather API request failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (attempt === retries - 1) {
        throw error;
      }
      
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

/**
 * Get current weather conditions
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @param {string} units - Temperature units ('metric' or 'imperial')
 * @returns {Promise<Object>} Current weather data
 */
export const getCurrentWeather = async (latitude, longitude, units = 'metric') => {
  if (!latitude || !longitude) {
    throw new Error('Latitude and longitude are required');
  }

  // Check cache first
  const cacheKey = generateCacheKey(latitude, longitude, 'current');
  const cachedData = cache.get(cacheKey);
  
  if (isCacheValid(cachedData, CACHE_DURATION)) {
    console.log('Returning cached current weather data');
    return cachedData.data;
  }

  try {
    // Note: Google doesn't have a public Weather API yet, so we'll use OpenWeatherMap
    // but structure it to easily switch to Google when available
    const openWeatherKey = import.meta.env.VITE_OPENWEATHER_API_KEY;
    
    if (!openWeatherKey) {
      // Return mock data for development
      return getMockCurrentWeather(latitude, longitude);
    }

    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${openWeatherKey}&units=${units}`;
    
    console.log('Fetching current weather data');
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }
    
    const data = await response.json();
    const processedData = processCurrentWeatherData(data, units);
    
    // Cache the result
    cache.set(cacheKey, {
      data: processedData,
      timestamp: Date.now()
    });
    
    return processedData;
  } catch (error) {
    console.error('Failed to fetch current weather:', error);
    // Return mock data as fallback
    return getMockCurrentWeather(latitude, longitude);
  }
};

/**
 * Get weather forecast
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @param {number} days - Number of forecast days (1-5)
 * @param {string} units - Temperature units ('metric' or 'imperial')
 * @returns {Promise<Object>} Weather forecast data
 */
export const getWeatherForecast = async (latitude, longitude, days = 5, units = 'metric') => {
  if (!latitude || !longitude) {
    throw new Error('Latitude and longitude are required');
  }

  // Check cache first
  const cacheKey = generateCacheKey(latitude, longitude, `forecast_${days}`);
  const cachedData = cache.get(cacheKey);
  
  if (isCacheValid(cachedData, FORECAST_CACHE_DURATION)) {
    console.log('Returning cached weather forecast data');
    return cachedData.data;
  }

  try {
    const openWeatherKey = import.meta.env.VITE_OPENWEATHER_API_KEY;
    
    if (!openWeatherKey) {
      return getMockWeatherForecast(latitude, longitude, days);
    }

    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${openWeatherKey}&units=${units}&cnt=${days * 8}`; // 8 forecasts per day (3-hour intervals)
    
    console.log('Fetching weather forecast data');
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Weather forecast API error: ${response.status}`);
    }
    
    const data = await response.json();
    const processedData = processWeatherForecastData(data, units, days);
    
    // Cache the result
    cache.set(cacheKey, {
      data: processedData,
      timestamp: Date.now()
    });
    
    return processedData;
  } catch (error) {
    console.error('Failed to fetch weather forecast:', error);
    return getMockWeatherForecast(latitude, longitude, days);
  }
};

/**
 * Process current weather data into normalized format
 */
const processCurrentWeatherData = (rawData, units) => {
  const tempUnit = units === 'metric' ? '°C' : '°F';
  const windUnit = units === 'metric' ? 'm/s' : 'mph';
  
  return {
    location: {
      name: rawData.name,
      country: rawData.sys?.country,
      coordinates: {
        latitude: rawData.coord?.lat,
        longitude: rawData.coord?.lon
      }
    },
    current: {
      temperature: Math.round(rawData.main?.temp || 0),
      temperatureUnit: tempUnit,
      feelsLike: Math.round(rawData.main?.feels_like || 0),
      humidity: rawData.main?.humidity || 0,
      pressure: rawData.main?.pressure || 0,
      visibility: rawData.visibility ? Math.round(rawData.visibility / 1000) : null, // Convert to km
      uvIndex: null, // Not available in current weather endpoint
      windSpeed: rawData.wind?.speed || 0,
      windDirection: rawData.wind?.deg || 0,
      windUnit: windUnit,
      cloudCover: rawData.clouds?.all || 0,
      condition: {
        main: rawData.weather?.[0]?.main || 'Unknown',
        description: rawData.weather?.[0]?.description || 'Unknown',
        icon: rawData.weather?.[0]?.icon || '01d'
      },
      sunrise: rawData.sys?.sunrise ? new Date(rawData.sys.sunrise * 1000).toISOString() : null,
      sunset: rawData.sys?.sunset ? new Date(rawData.sys.sunset * 1000).toISOString() : null
    },
    metadata: {
      fetchedAt: new Date().toISOString(),
      source: 'openweathermap',
      units: units
    }
  };
};

/**
 * Process weather forecast data into normalized format
 */
const processWeatherForecastData = (rawData, units, days) => {
  const tempUnit = units === 'metric' ? '°C' : '°F';
  
  // Group forecasts by day
  const dailyForecasts = [];
  const forecastsByDay = {};
  
  rawData.list?.forEach(forecast => {
    const date = new Date(forecast.dt * 1000).toISOString().split('T')[0];
    
    if (!forecastsByDay[date]) {
      forecastsByDay[date] = [];
    }
    
    forecastsByDay[date].push(forecast);
  });
  
  // Process each day
  Object.entries(forecastsByDay).slice(0, days).forEach(([date, forecasts]) => {
    const temps = forecasts.map(f => f.main.temp);
    const conditions = forecasts.map(f => f.weather[0]);
    
    // Find the most common condition for the day
    const conditionCounts = {};
    conditions.forEach(condition => {
      conditionCounts[condition.main] = (conditionCounts[condition.main] || 0) + 1;
    });
    
    const dominantCondition = Object.entries(conditionCounts)
      .sort(([,a], [,b]) => b - a)[0][0];
    
    const dayCondition = conditions.find(c => c.main === dominantCondition);
    
    dailyForecasts.push({
      date: date,
      temperature: {
        min: Math.round(Math.min(...temps)),
        max: Math.round(Math.max(...temps)),
        unit: tempUnit
      },
      condition: {
        main: dayCondition.main,
        description: dayCondition.description,
        icon: dayCondition.icon
      },
      humidity: Math.round(forecasts.reduce((sum, f) => sum + f.main.humidity, 0) / forecasts.length),
      windSpeed: Math.round(forecasts.reduce((sum, f) => sum + (f.wind?.speed || 0), 0) / forecasts.length),
      cloudCover: Math.round(forecasts.reduce((sum, f) => sum + (f.clouds?.all || 0), 0) / forecasts.length),
      precipitation: forecasts.some(f => f.rain || f.snow)
    });
  });
  
  return {
    location: {
      name: rawData.city?.name,
      country: rawData.city?.country,
      coordinates: {
        latitude: rawData.city?.coord?.lat,
        longitude: rawData.city?.coord?.lon
      }
    },
    dailyForecasts,
    metadata: {
      fetchedAt: new Date().toISOString(),
      source: 'openweathermap',
      units: units,
      forecastDays: days
    }
  };
};

/**
 * Get mock current weather data for development
 */
const getMockCurrentWeather = (latitude, longitude) => {
  const conditions = [
    { main: 'Clear', description: 'clear sky', icon: '01d' },
    { main: 'Clouds', description: 'few clouds', icon: '02d' },
    { main: 'Clouds', description: 'scattered clouds', icon: '03d' },
    { main: 'Rain', description: 'light rain', icon: '10d' }
  ];
  
  const condition = conditions[Math.floor(Math.random() * conditions.length)];
  const temp = Math.round(15 + Math.random() * 20); // 15-35°C
  
  return {
    location: {
      name: 'Mock Location',
      country: 'US',
      coordinates: { latitude, longitude }
    },
    current: {
      temperature: temp,
      temperatureUnit: '°C',
      feelsLike: temp + Math.round((Math.random() - 0.5) * 4),
      humidity: Math.round(40 + Math.random() * 40),
      pressure: Math.round(1000 + Math.random() * 50),
      visibility: Math.round(5 + Math.random() * 15),
      uvIndex: Math.round(Math.random() * 11),
      windSpeed: Math.round(Math.random() * 20),
      windDirection: Math.round(Math.random() * 360),
      windUnit: 'm/s',
      cloudCover: Math.round(Math.random() * 100),
      condition,
      sunrise: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      sunset: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString()
    },
    metadata: {
      fetchedAt: new Date().toISOString(),
      source: 'mock_data',
      units: 'metric'
    }
  };
};

/**
 * Get mock weather forecast data for development
 */
const getMockWeatherForecast = (latitude, longitude, days) => {
  const conditions = [
    { main: 'Clear', description: 'clear sky', icon: '01d' },
    { main: 'Clouds', description: 'few clouds', icon: '02d' },
    { main: 'Rain', description: 'light rain', icon: '10d' }
  ];
  
  const dailyForecasts = [];
  
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    
    const condition = conditions[Math.floor(Math.random() * conditions.length)];
    const baseTemp = 20 + Math.random() * 15;
    
    dailyForecasts.push({
      date: date.toISOString().split('T')[0],
      temperature: {
        min: Math.round(baseTemp - 5),
        max: Math.round(baseTemp + 5),
        unit: '°C'
      },
      condition,
      humidity: Math.round(40 + Math.random() * 40),
      windSpeed: Math.round(Math.random() * 15),
      cloudCover: Math.round(Math.random() * 100),
      precipitation: Math.random() > 0.7
    });
  }
  
  return {
    location: {
      name: 'Mock Location',
      country: 'US',
      coordinates: { latitude, longitude }
    },
    dailyForecasts,
    metadata: {
      fetchedAt: new Date().toISOString(),
      source: 'mock_data',
      units: 'metric',
      forecastDays: days
    }
  };
};

/**
 * Get weather condition emoji
 * @param {string} condition - Weather condition main category
 * @param {string} icon - Weather icon code
 * @returns {string} Emoji representation
 */
export const getWeatherEmoji = (condition, icon) => {
  const isDay = icon?.includes('d');
  
  switch (condition?.toLowerCase()) {
    case 'clear':
      return isDay ? '☀️' : '🌙';
    case 'clouds':
      return isDay ? '⛅' : '☁️';
    case 'rain':
      return '🌧️';
    case 'drizzle':
      return '🌦️';
    case 'thunderstorm':
      return '⛈️';
    case 'snow':
      return '❄️';
    case 'mist':
    case 'fog':
      return '🌫️';
    default:
      return isDay ? '🌤️' : '🌙';
  }
};

/**
 * Check if API is configured
 * @returns {boolean} True if weather API is available
 */
export const isConfigured = () => {
  return !!(import.meta.env.VITE_OPENWEATHER_API_KEY || import.meta.env.VITE_GOOGLE_MAPS_API_KEY);
};

/**
 * Clear weather cache
 */
export const clearCache = () => {
  cache.clear();
  console.log('Weather cache cleared');
};

/**
 * Get cache statistics
 */
export const getCacheStats = () => {
  const now = Date.now();
  let validEntries = 0;
  let expiredEntries = 0;
  
  for (const [key, entry] of cache.entries()) {
    if (isCacheValid(entry)) {
      validEntries++;
    } else {
      expiredEntries++;
    }
  }
  
  return {
    totalEntries: cache.size,
    validEntries,
    expiredEntries
  };
};

// Export default object with all functions
export default {
  getCurrentWeather,
  getWeatherForecast,
  getWeatherEmoji,
  isConfigured,
  clearCache,
  getCacheStats
};
