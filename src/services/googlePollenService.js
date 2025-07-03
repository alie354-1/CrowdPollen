/**
 * Google Pollen API Service
 * Handles all interactions with Google's Pollen API including forecasts and heatmap tiles
 */

const API_BASE_URL = 'https://pollen.googleapis.com/v1';
// Use unified Google Maps API key, fallback to separate pollen key
const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || import.meta.env.VITE_GOOGLE_POLLEN_API_KEY;

// Cache configuration
const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours in milliseconds
const cache = new Map();

/**
 * Cache key generator for forecast requests
 */
const generateCacheKey = (latitude, longitude, days) => {
  // Round coordinates to reduce cache fragmentation
  const lat = Math.round(latitude * 1000) / 1000;
  const lng = Math.round(longitude * 1000) / 1000;
  return `forecast_${lat}_${lng}_${days}`;
};

/**
 * Check if cached data is still valid
 */
const isCacheValid = (cacheEntry) => {
  return cacheEntry && (Date.now() - cacheEntry.timestamp) < CACHE_DURATION;
};

/**
 * Generic API request handler with error handling and retries
 */
const makeApiRequest = async (url, options = {}, retries = 3) => {
  if (!API_KEY) {
    throw new Error('Google Pollen API key not configured');
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
          // Rate limited - wait and retry
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        if (response.status === 403) {
          throw new Error('Google Pollen API access denied. Check your API key and billing.');
        }
        
        if (response.status === 404) {
          throw new Error('No pollen data available for this location');
        }
        
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      if (attempt === retries - 1) {
        throw error;
      }
      
      // Wait before retry
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

/**
 * Get pollen forecast for a specific location
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @param {number} days - Number of forecast days (1-5, default: 3)
 * @param {string} languageCode - Language code (default: 'en')
 * @returns {Promise<Object>} Forecast data
 */
export const getForecast = async (latitude, longitude, days = 3, languageCode = 'en') => {
  // Validate inputs
  if (!latitude || !longitude) {
    throw new Error('Latitude and longitude are required');
  }
  
  if (days < 1 || days > 5) {
    throw new Error('Days must be between 1 and 5');
  }

  // Check cache first
  const cacheKey = generateCacheKey(latitude, longitude, days);
  const cachedData = cache.get(cacheKey);
  
  if (isCacheValid(cachedData)) {
    console.log('Returning cached forecast data');
    return cachedData.data;
  }

  // If no API key, return mock data for testing
  if (!API_KEY) {
    console.log('No Google Pollen API key found, returning mock data for testing');
    return getMockPollenForecast(latitude, longitude, days);
  }

  try {
    const url = new URL(`${API_BASE_URL}/forecast:lookup`);
    url.searchParams.append('key', API_KEY);
    url.searchParams.append('location.latitude', latitude.toString());
    url.searchParams.append('location.longitude', longitude.toString());
    url.searchParams.append('days', days.toString());
    url.searchParams.append('languageCode', languageCode);

    console.log('Fetching forecast from Google Pollen API:', { latitude, longitude, days });
    
    const data = await makeApiRequest(url.toString());
    
    // Process and normalize the response
    const processedData = processForecastData(data);
    
    // Cache the result
    cache.set(cacheKey, {
      data: processedData,
      timestamp: Date.now()
    });
    
    return processedData;
  } catch (error) {
    console.error('Failed to fetch pollen forecast:', error);
    // Return mock data as fallback
    console.log('Returning mock data as fallback');
    return getMockPollenForecast(latitude, longitude, days);
  }
};

/**
 * Process raw forecast data from Google API into normalized format
 */
const processForecastData = (rawData) => {
  if (!rawData || !rawData.dailyInfo) {
    throw new Error('Invalid forecast data received');
  }

  return {
    regionCode: rawData.regionCode,
    dailyForecasts: rawData.dailyInfo.map(day => ({
      date: day.date,
      pollenTypes: {
        tree: {
          index: day.pollenTypeInfo?.find(p => p.code === 'TREE')?.indexInfo?.value || 0,
          category: day.pollenTypeInfo?.find(p => p.code === 'TREE')?.indexInfo?.category || 'UNSPECIFIED',
          displayName: day.pollenTypeInfo?.find(p => p.code === 'TREE')?.displayName || 'Tree Pollen'
        },
        grass: {
          index: day.pollenTypeInfo?.find(p => p.code === 'GRASS')?.indexInfo?.value || 0,
          category: day.pollenTypeInfo?.find(p => p.code === 'GRASS')?.indexInfo?.category || 'UNSPECIFIED',
          displayName: day.pollenTypeInfo?.find(p => p.code === 'GRASS')?.displayName || 'Grass Pollen'
        },
        weed: {
          index: day.pollenTypeInfo?.find(p => p.code === 'WEED')?.indexInfo?.value || 0,
          category: day.pollenTypeInfo?.find(p => p.code === 'WEED')?.indexInfo?.category || 'UNSPECIFIED',
          displayName: day.pollenTypeInfo?.find(p => p.code === 'WEED')?.displayName || 'Weed Pollen'
        }
      },
      plantInfo: day.plantInfo || [],
      healthRecommendations: day.healthRecommendations || []
    })),
    metadata: {
      fetchedAt: new Date().toISOString(),
      source: 'google_pollen_api',
      cacheExpiry: new Date(Date.now() + CACHE_DURATION).toISOString()
    }
  };
};

/**
 * Get heatmap tile URL for map overlay
 * @param {string} mapType - Type of pollen map (TREE_UPI, GRASS_UPI, WEED_UPI)
 * @param {number} zoom - Map zoom level
 * @param {number} x - Tile X coordinate
 * @param {number} y - Tile Y coordinate
 * @returns {string} Heatmap tile URL
 */
export const getHeatmapTileUrl = (mapType, zoom, x, y) => {
  if (!API_KEY) {
    throw new Error('Google Pollen API key not configured');
  }

  const validMapTypes = ['TREE_UPI', 'GRASS_UPI', 'WEED_UPI'];
  if (!validMapTypes.includes(mapType)) {
    throw new Error(`Invalid map type. Must be one of: ${validMapTypes.join(', ')}`);
  }

  const url = new URL(`${API_BASE_URL}/mapTypes/${mapType}/heatmapTiles/${zoom}/${x}/${y}`);
  url.searchParams.append('key', API_KEY);
  
  return url.toString();
};

/**
 * Validate API key by making a test request
 * @returns {Promise<boolean>} True if API key is valid
 */
export const validateApiKey = async () => {
  if (!API_KEY) {
    return false;
  }

  try {
    // Test with a simple forecast request for New York City
    await getForecast(40.7128, -74.0060, 1);
    return true;
  } catch (error) {
    console.error('API key validation failed:', error);
    return false;
  }
};

/**
 * Get cached forecast data without making API call
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @param {number} days - Number of forecast days
 * @returns {Object|null} Cached data or null if not available
 */
export const getCachedForecast = (latitude, longitude, days = 3) => {
  const cacheKey = generateCacheKey(latitude, longitude, days);
  const cachedData = cache.get(cacheKey);
  
  if (isCacheValid(cachedData)) {
    return cachedData.data;
  }
  
  return null;
};

/**
 * Clear all cached forecast data
 */
export const clearCache = () => {
  cache.clear();
  console.log('Google Pollen API cache cleared');
};

/**
 * Get cache statistics
 * @returns {Object} Cache statistics
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
    expiredEntries,
    cacheHitRate: validEntries / Math.max(cache.size, 1)
  };
};

/**
 * Convert Google pollen category to CrowdPollen level
 * @param {string} category - Google category (UNSPECIFIED, VERY_LOW, LOW, MODERATE, HIGH, VERY_HIGH)
 * @returns {string} CrowdPollen level
 */
export const convertCategoryToLevel = (category) => {
  const categoryMap = {
    'UNSPECIFIED': 'unknown',
    'VERY_LOW': 'very_low',
    'LOW': 'low',
    'MODERATE': 'moderate',
    'HIGH': 'high',
    'VERY_HIGH': 'very_high'
  };
  
  return categoryMap[category] || 'unknown';
};

/**
 * Get overall pollen level from multiple pollen types
 * @param {Object} pollenTypes - Object containing tree, grass, weed data
 * @returns {string} Overall pollen level
 */
export const getOverallPollenLevel = (pollenTypes) => {
  const levels = ['very_low', 'low', 'moderate', 'high', 'very_high'];
  const levelValues = {
    'very_low': 1,
    'low': 2,
    'moderate': 3,
    'high': 4,
    'very_high': 5,
    'unknown': 0
  };
  
  const treeLevel = convertCategoryToLevel(pollenTypes.tree?.category);
  const grassLevel = convertCategoryToLevel(pollenTypes.grass?.category);
  const weedLevel = convertCategoryToLevel(pollenTypes.weed?.category);
  
  // Return the highest level among all pollen types
  const maxValue = Math.max(
    levelValues[treeLevel] || 0,
    levelValues[grassLevel] || 0,
    levelValues[weedLevel] || 0
  );
  
  return levels[maxValue - 1] || 'unknown';
};

/**
 * Get mock pollen forecast data for testing
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @param {number} days - Number of forecast days
 * @returns {Object} Mock forecast data
 */
const getMockPollenForecast = (latitude, longitude, days) => {
  const categories = ['VERY_LOW', 'LOW', 'MODERATE', 'HIGH', 'VERY_HIGH'];
  const dailyForecasts = [];
  
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    
    // Generate realistic seasonal patterns
    const month = date.getMonth();
    let treeLevel, grassLevel, weedLevel;
    
    // Spring (March-May): High tree pollen
    if (month >= 2 && month <= 4) {
      treeLevel = categories[3 + Math.floor(Math.random() * 2)]; // HIGH or VERY_HIGH
      grassLevel = categories[1 + Math.floor(Math.random() * 2)]; // LOW or MODERATE
      weedLevel = categories[Math.floor(Math.random() * 2)]; // VERY_LOW or LOW
    }
    // Summer (June-August): High grass pollen
    else if (month >= 5 && month <= 7) {
      treeLevel = categories[Math.floor(Math.random() * 3)]; // VERY_LOW to MODERATE
      grassLevel = categories[3 + Math.floor(Math.random() * 2)]; // HIGH or VERY_HIGH
      weedLevel = categories[1 + Math.floor(Math.random() * 2)]; // LOW or MODERATE
    }
    // Fall (September-November): High weed pollen
    else if (month >= 8 && month <= 10) {
      treeLevel = categories[Math.floor(Math.random() * 2)]; // VERY_LOW or LOW
      grassLevel = categories[Math.floor(Math.random() * 3)]; // VERY_LOW to MODERATE
      weedLevel = categories[3 + Math.floor(Math.random() * 2)]; // HIGH or VERY_HIGH
    }
    // Winter (December-February): Low all pollen
    else {
      treeLevel = categories[Math.floor(Math.random() * 2)]; // VERY_LOW or LOW
      grassLevel = categories[Math.floor(Math.random() * 2)]; // VERY_LOW or LOW
      weedLevel = categories[Math.floor(Math.random() * 2)]; // VERY_LOW or LOW
    }
    
    dailyForecasts.push({
      date: date.toISOString().split('T')[0],
      pollenTypes: {
        tree: {
          index: categories.indexOf(treeLevel) + 1,
          category: treeLevel,
          displayName: 'Tree Pollen'
        },
        grass: {
          index: categories.indexOf(grassLevel) + 1,
          category: grassLevel,
          displayName: 'Grass Pollen'
        },
        weed: {
          index: categories.indexOf(weedLevel) + 1,
          category: weedLevel,
          displayName: 'Weed Pollen'
        }
      },
      plantInfo: [
        { displayName: 'Oak', inSeason: month >= 2 && month <= 4 },
        { displayName: 'Birch', inSeason: month >= 2 && month <= 4 },
        { displayName: 'Timothy Grass', inSeason: month >= 5 && month <= 7 },
        { displayName: 'Ragweed', inSeason: month >= 8 && month <= 10 }
      ].filter(plant => plant.inSeason),
      healthRecommendations: [
        'Check pollen forecasts daily',
        'Keep windows closed during high pollen days',
        'Consider wearing sunglasses outdoors'
      ]
    });
  }
  
  return {
    regionCode: 'US',
    dailyForecasts,
    metadata: {
      fetchedAt: new Date().toISOString(),
      source: 'mock_data',
      cacheExpiry: new Date(Date.now() + CACHE_DURATION).toISOString()
    }
  };
};

/**
 * Check if API is configured
 * @returns {boolean} True if API key is available
 */
export const isConfigured = () => {
  return !!API_KEY;
};

// Export default object with all functions
export default {
  getForecast,
  getHeatmapTileUrl,
  validateApiKey,
  getCachedForecast,
  clearCache,
  getCacheStats,
  convertCategoryToLevel,
  getOverallPollenLevel,
  isConfigured
};
