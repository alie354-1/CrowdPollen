import { useState, useEffect } from 'react';
import { AlertTriangle, MapPin } from 'lucide-react';
import googlePollenService from '../../services/googlePollenService.js';
import dataFusionService from '../../services/dataFusionService.js';
import { useLocation } from '../../contexts/LocationContext.jsx';

export default function ForecastWidget() {
  const { location } = useLocation();
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDay, setSelectedDay] = useState(0);

  // Debug logging for state changes
  useEffect(() => {
    console.log('ForecastWidget: State changed - forecast:', forecast, 'loading:', loading, 'error:', error);
  }, [forecast, loading, error]);

  useEffect(() => {
    loadForecast();
  }, [location]);

  const loadForecast = async () => {
    if (!location?.latitude || !location?.longitude) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('ForecastWidget: Starting forecast load for location:', location);

      // Check if Google Pollen API key is configured (unified or separate key)
      const hasGoogleAPI = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || import.meta.env.VITE_GOOGLE_POLLEN_API_KEY;
      console.log('ForecastWidget: Has Google API key:', !!hasGoogleAPI);
      
      if (hasGoogleAPI) {
        console.log('ForecastWidget: Calling enhanced forecast...');
        // Get enhanced forecast with user data integration
        const enhancedForecast = await dataFusionService.getEnhancedForecast(
          location.latitude,
          location.longitude,
          5
        );
        console.log('ForecastWidget: Enhanced forecast received:', enhancedForecast);
        setForecast(enhancedForecast);
      } else {
        // Demo mode - show sample forecast data
        console.warn('Google Pollen API key not configured, showing demo data');
        const demoForecast = generateDemoForecast(location);
        setForecast(demoForecast);
      }
    } catch (err) {
      console.error('Failed to load forecast:', err);
      
      if (import.meta.env.VITE_GOOGLE_MAPS_API_KEY || import.meta.env.VITE_GOOGLE_POLLEN_API_KEY) {
        // Try fallback to Google-only forecast
        try {
          console.log('ForecastWidget: Trying fallback to Google-only forecast...');
          const googleForecast = await googlePollenService.getForecast(
            location.latitude,
            location.longitude,
            5
          );
          console.log('ForecastWidget: Fallback forecast received:', googleForecast);
          setForecast(googleForecast);
          setError(null);
        } catch (fallbackErr) {
          console.error('Fallback forecast also failed:', fallbackErr);
          // Show demo data as final fallback
          const demoForecast = generateDemoForecast(location);
          setForecast(demoForecast);
          setError('Demo data - API unavailable');
        }
      } else {
        // Show demo data when no API key
        const demoForecast = generateDemoForecast(location);
        setForecast(demoForecast);
        setError(null); // Don't show error for demo mode
      }
    } finally {
      console.log('ForecastWidget: Setting loading to false');
      setLoading(false);
    }
  };

  // Generate demo forecast data for testing
  const generateDemoForecast = (location) => {
    const dailyForecasts = [];
    
    const pollenLevels = ['low', 'moderate', 'high', 'moderate', 'low'];
    const pollenTypes = ['tree', 'grass', 'weed'];
    
    for (let i = 0; i < 5; i++) {
      // Create date properly to avoid timezone issues
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth();
      const day = today.getDate();
      const date = new Date(year, month, day + i);
      
      const level = pollenLevels[i];
      const pollenTypeData = {};
      
      pollenTypes.forEach(type => {
        const variation = Math.random() * 0.4 - 0.2; // ±20% variation
        const baseIndex = level === 'low' ? 2 : level === 'moderate' ? 3 : level === 'high' ? 4 : 2;
        const index = Math.max(1, Math.min(5, Math.round(baseIndex + variation)));
        
        pollenTypeData[type] = {
          category: level.toUpperCase(),
          index: index,
          displayName: type.charAt(0).toUpperCase() + type.slice(1)
        };
      });
      
      // Format date as YYYY-MM-DD in local timezone
      const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      
      dailyForecasts.push({
        date: dateString,
        pollenTypes: pollenTypeData,
        confidence: 0.85 + Math.random() * 0.1, // 85-95% confidence
        dataSource: 'demo',
        submissionCount: Math.floor(Math.random() * 20),
        userDataInfluence: Math.floor(Math.random() * 30),
        healthRecommendations: [
          level === 'high' ? 'Consider limiting outdoor time' : 'Good day for outdoor activities',
          'Take allergy medication if needed',
          'Keep windows closed during peak hours'
        ]
      });
    }
    
    return {
      dailyForecasts,
      metadata: {
        enhanced: false,
        fetchedAt: new Date().toISOString(),
        location: location.address || `${location.latitude}, ${location.longitude}`,
        source: 'demo'
      }
    };
  };

  const getPollenLevelInfo = (level) => {
    const levels = {
      very_low: {
        color: '#34C759',
        emoji: '🟢',
        description: 'Very Low',
        advice: 'Perfect day to be outside'
      },
      low: {
        color: '#34C759',
        emoji: '🟢',
        description: 'Low',
        advice: 'Great conditions for outdoor activities'
      },
      moderate: {
        color: '#FFCC00',
        emoji: '🟡',
        description: 'Moderate',
        advice: 'Good day for most activities'
      },
      high: {
        color: '#FF9500',
        emoji: '🟠',
        description: 'High',
        advice: 'Consider limiting outdoor time'
      },
      very_high: {
        color: '#FF3B30',
        emoji: '🔴',
        description: 'Very High',
        advice: 'Stay indoors if possible'
      },
      unknown: {
        color: '#E5E5E7',
        emoji: '⚪',
        description: 'Out of Season',
        advice: 'Not currently active'
      }
    };
    return levels[level] || levels.unknown;
  };

  const getSeasonalContext = () => {
    const month = new Date().getMonth();
    
    // Spring (March-May): Tree pollen season
    if (month >= 2 && month <= 4) {
      return {
        season: 'Spring',
        primary: 'Tree',
        description: 'Peak tree pollen season. Oak, birch, and maple are most active.',
        icon: '🌸'
      };
    }
    // Summer (June-August): Grass pollen season
    else if (month >= 5 && month <= 7) {
      return {
        season: 'Summer',
        primary: 'Grass',
        description: 'Peak grass pollen season. Timothy, bermuda, and ryegrass are most active.',
        icon: '🌾'
      };
    }
    // Fall (September-November): Weed pollen season
    else if (month >= 8 && month <= 10) {
      return {
        season: 'Fall',
        primary: 'Weed',
        description: 'Peak weed pollen season. Ragweed and other weeds are most active.',
        icon: '🍂'
      };
    }
    // Winter (December-February): Low pollen season
    else {
      return {
        season: 'Winter',
        primary: 'None',
        description: 'Low pollen season. Most plants are dormant.',
        icon: '❄️'
      };
    }
  };

  const formatDate = (dateInput, isShort = false) => {
    let date;
    
    // Handle different date formats
    if (typeof dateInput === 'string') {
      // Handle YYYY-MM-DD format
      date = new Date(dateInput + 'T00:00:00');
    } else if (typeof dateInput === 'object' && dateInput.year && dateInput.month && dateInput.day) {
      // Handle Google API format: {year: 2025, month: 7, day: 3}
      // Note: JavaScript months are 0-indexed, but Google API months are 1-indexed
      date = new Date(dateInput.year, dateInput.month - 1, dateInput.day);
    } else if (dateInput instanceof Date) {
      // Handle Date objects
      date = new Date(dateInput);
    } else {
      console.error('Invalid date format:', dateInput);
      return 'Invalid Date';
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.error('Invalid date:', dateInput);
      return 'Invalid Date';
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Compare dates properly
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);
    
    if (dateOnly.getTime() === today.getTime()) {
      return 'Today';
    } else if (dateOnly.getTime() === tomorrow.getTime()) {
      return 'Tomorrow';
    } else {
      return isShort 
        ? date.toLocaleDateString('en-US', { weekday: 'short' })
        : date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    }
  };

  if (!location?.latitude || !location?.longitude) {
    console.log('ForecastWidget: Rendering location required UI');
    return (
      <div className="bg-white rounded-xl p-6">
        <div className="text-center py-8">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Location Required</h3>
          <p className="text-gray-600">Set your location to see pollen forecast</p>
        </div>
      </div>
    );
  }

  if (loading) {
    console.log('ForecastWidget: Rendering loading UI');
    return (
      <div className="bg-white rounded-xl p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-32 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-24 mb-6"></div>
          <div className="h-16 bg-gray-200 rounded mb-6"></div>
          <div className="flex space-x-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex-1 h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    console.log('ForecastWidget: Rendering error UI with error:', error);
    return (
      <div className="bg-white rounded-xl p-6">
        <div className="text-center py-8">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Forecast Unavailable</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadForecast}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!forecast?.dailyForecasts?.length) {
    console.log('ForecastWidget: Rendering no data UI - forecast:', forecast);
    return (
      <div className="bg-white rounded-xl p-6">
        <div className="text-center py-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data Available</h3>
          <p className="text-gray-600">No forecast data for this location</p>
        </div>
      </div>
    );
  }

  const selectedForecast = forecast.dailyForecasts[selectedDay];
  const seasonalContext = getSeasonalContext();
  
  // Debug the pollen types structure
  console.log('ForecastWidget: Selected forecast pollen types:', selectedForecast.pollenTypes);
  console.log('ForecastWidget: Tree pollen data:', selectedForecast.pollenTypes.tree);
  console.log('ForecastWidget: Grass pollen data:', selectedForecast.pollenTypes.grass);
  console.log('ForecastWidget: Weed pollen data:', selectedForecast.pollenTypes.weed);
  
  const overallLevel = googlePollenService.getOverallPollenLevel(selectedForecast.pollenTypes);
  const levelInfo = getPollenLevelInfo(overallLevel);

  console.log('ForecastWidget: Rendering main forecast UI with data:', {
    selectedForecast,
    overallLevel,
    levelInfo,
    dailyForecastsLength: forecast.dailyForecasts.length
  });

  return (
    <div className="bg-white rounded-xl p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-1">Pollen Forecast</h2>
        <p className="text-sm text-gray-600">
          {location.address?.split(',')[0] || 'Your location'}
        </p>
      </div>

      {/* Seasonal Context Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center mb-2">
          <span className="text-lg mr-2">{seasonalContext.icon}</span>
          <h3 className="text-sm font-semibold text-blue-900">
            {seasonalContext.season} Pollen Season
          </h3>
        </div>
        <p className="text-sm text-blue-800">{seasonalContext.description}</p>
        {seasonalContext.primary !== 'None' && (
          <p className="text-xs text-blue-600 mt-1">
            Other pollen types may show as "Out of Season" during this time.
          </p>
        )}
      </div>

      {/* Current Day Hero */}
      <div className="mb-8">
        <div className="mb-4">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {formatDate(selectedForecast.date)}
          </h3>
          <div className="flex items-center mb-3">
            <span className="text-2xl mr-3">{levelInfo.emoji}</span>
            <div>
              <div className="text-2xl font-semibold text-gray-900">{levelInfo.description}</div>
              <div className="text-gray-600">{levelInfo.advice}</div>
            </div>
          </div>
        </div>

        {/* Pollen Type Breakdown */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          {Object.entries(selectedForecast.pollenTypes).map(([type, data]) => {
            const typeLevel = googlePollenService.convertCategoryToLevel(data.category, data.index);
            const typeInfo = getPollenLevelInfo(typeLevel);
            const isActive = typeLevel !== 'unknown';
            const isPrimary = seasonalContext.primary.toLowerCase() === type;
            
            return (
              <div 
                key={type} 
                className={`text-center p-3 rounded-lg border ${
                  isPrimary 
                    ? 'border-blue-200 bg-blue-50' 
                    : isActive 
                      ? 'border-green-200 bg-green-50' 
                      : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="text-sm font-medium text-gray-900 mb-2 capitalize flex items-center justify-center">
                  {type}
                  {isPrimary && <span className="ml-1 text-xs">🌟</span>}
                </div>
                <div 
                  className="w-6 h-6 rounded-full mx-auto mb-2 border-2 border-white shadow-sm"
                  style={{ backgroundColor: typeInfo.color }}
                ></div>
                <div className={`text-xs font-medium ${
                  isActive ? 'text-gray-700' : 'text-gray-500'
                }`}>
                  {typeInfo.description}
                </div>
                {data.index > 0 && (
                  <div className="text-xs text-gray-500 mt-1">
                    Index: {data.index}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Health Recommendations */}
        {selectedForecast.healthRecommendations?.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="space-y-1">
              {selectedForecast.healthRecommendations.slice(0, 2).map((rec, index) => (
                <div key={index} className="text-sm text-gray-700">
                  • {rec}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 5-Day Overview */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-900">5-Day Forecast</h4>
          <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
            National Data
          </div>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {forecast.dailyForecasts.map((day, index) => {
            const dayLevel = googlePollenService.getOverallPollenLevel(day.pollenTypes);
            const dayInfo = getPollenLevelInfo(dayLevel);
            const isSelected = index === selectedDay;
            
            return (
              <button
                key={index}
                onClick={() => setSelectedDay(index)}
                className={`p-3 rounded-lg text-center transition-all ${
                  isSelected 
                    ? 'bg-blue-50 border border-blue-200' 
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="text-xs font-medium text-gray-600 mb-2">
                  {formatDate(day.date, true)}
                </div>
                <div className="mb-2">
                  <span className="text-lg">{dayInfo.emoji}</span>
                </div>
                <div className="text-xs text-gray-700 font-medium">
                  {dayInfo.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Confidence & Data Source */}
      <div className="pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-4">
            {selectedForecast.confidence && (
              <span>Confidence: {Math.round(selectedForecast.confidence * 100)}%</span>
            )}
            {forecast.metadata?.source === 'demo' && (
              <span className="text-orange-600">Demo Mode</span>
            )}
          </div>
          <span>Google Pollen API</span>
        </div>
      </div>
    </div>
  );
}
