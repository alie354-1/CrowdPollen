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

      // Check if Google Pollen API key is configured
      const hasGoogleAPI = import.meta.env.VITE_GOOGLE_POLLEN_API_KEY;
      
      if (hasGoogleAPI) {
        // Get enhanced forecast with user data integration
        const enhancedForecast = await dataFusionService.getEnhancedForecast(
          location.latitude,
          location.longitude,
          5
        );
        setForecast(enhancedForecast);
      } else {
        // Demo mode - show sample forecast data
        console.warn('Google Pollen API key not configured, showing demo data');
        const demoForecast = generateDemoForecast(location);
        setForecast(demoForecast);
      }
    } catch (err) {
      console.error('Failed to load forecast:', err);
      
      if (import.meta.env.VITE_GOOGLE_POLLEN_API_KEY) {
        // Try fallback to Google-only forecast
        try {
          const googleForecast = await googlePollenService.getForecast(
            location.latitude,
            location.longitude,
            5
          );
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
      setLoading(false);
    }
  };

  // Generate demo forecast data for testing
  const generateDemoForecast = (location) => {
    const today = new Date();
    const dailyForecasts = [];
    
    const pollenLevels = ['low', 'moderate', 'high', 'moderate', 'low'];
    const pollenTypes = ['tree', 'grass', 'weed'];
    
    for (let i = 0; i < 5; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      
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
      
      dailyForecasts.push({
        date: date.toISOString().split('T')[0],
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
        color: '#FF9500',
        emoji: '🟡',
        description: 'Moderate',
        advice: 'Good day for most activities'
      },
      high: {
        color: '#FF3B30',
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
        color: '#8E8E93',
        emoji: '⚪',
        description: 'Unknown',
        advice: 'No data available'
      }
    };
    return levels[level] || levels.unknown;
  };

  const formatDate = (dateString, isShort = false) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return isShort 
        ? date.toLocaleDateString('en-US', { weekday: 'short' })
        : date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    }
  };

  if (!location?.latitude || !location?.longitude) {
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
  const overallLevel = googlePollenService.getOverallPollenLevel(selectedForecast.pollenTypes);
  const levelInfo = getPollenLevelInfo(overallLevel);

  return (
    <div className="bg-white rounded-xl p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-1">Pollen Forecast</h2>
        <p className="text-sm text-gray-600">
          {location.address?.split(',')[0] || 'Your location'}
        </p>
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
            const typeLevel = googlePollenService.convertCategoryToLevel(data.category);
            const typeInfo = getPollenLevelInfo(typeLevel);
            
            return (
              <div key={type} className="text-center">
                <div className="text-sm font-medium text-gray-900 mb-1 capitalize">{type}</div>
                <div 
                  className="w-4 h-4 rounded-full mx-auto mb-1"
                  style={{ backgroundColor: typeInfo.color }}
                ></div>
                <div className="text-xs text-gray-600">{typeInfo.description}</div>
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
        <h4 className="text-sm font-medium text-gray-900 mb-3">5-Day Forecast</h4>
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
