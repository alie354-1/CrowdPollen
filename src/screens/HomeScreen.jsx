import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, Map, AlertTriangle, Info, User } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useLocation } from '../contexts/LocationContext'
import { crowdPollenAPI } from '../services/crowdPollenAPI'
import ForecastWidget from '../components/forecast/ForecastWidget'

export default function HomeScreen() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { location } = useLocation()
  const [pollenData, setPollenData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadPollenData()
  }, [location])

  const loadPollenData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Check if the function exists
      if (!crowdPollenAPI.getLocalPollenData) {
        console.error('getLocalPollenData function not found on crowdPollenAPI:', Object.keys(crowdPollenAPI))
        throw new Error('API function not available - please refresh the page')
      }

      if (location) {
        // Get local pollen data
        const data = await crowdPollenAPI.getLocalPollenData(
          location.latitude,
          location.longitude
        )
        setPollenData(data)
      } else {
        // Get general/national data
        const data = await crowdPollenAPI.getNationalPollenData()
        setPollenData(data)
      }
    } catch (err) {
      console.error('Failed to load pollen data:', err)
      setError(err.message || 'Unable to load pollen data')
      
      // Set fallback data with proper structure
      const now = new Date()
      const month = now.getMonth()
      
      // Seasonal fallback data
      let level = 'moderate'
      let count = 25
      let mainType = 'Mixed'
      
      if (month >= 2 && month <= 5) { // Spring
        level = 'high'
        count = 45
        mainType = 'Tree'
      } else if (month >= 6 && month <= 8) { // Summer
        level = 'moderate'
        count = 30
        mainType = 'Grass'
      } else if (month >= 9 && month <= 10) { // Fall
        level = 'moderate'
        count = 35
        mainType = 'Weed'
      }
      
      setPollenData({
        current_level: level,
        count: count,
        trend: 'stable',
        forecast: `${level.charAt(0).toUpperCase() + level.slice(1)} ${mainType.toLowerCase()} pollen levels expected`,
        last_updated: now.toISOString(),
        local_reports: location ? 12 : 156,
        current: {
          totalPollenCount: count,
          densityLevel: level.charAt(0).toUpperCase() + level.slice(1),
          mainPollenType: mainType
        }
      })
    } finally {
      setLoading(false)
    }
  }

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
      }
    }
    return levels[level] || levels.moderate
  }

  const formatLastUpdated = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just updated'
    if (diffInHours === 1) return '1 hour ago'
    if (diffInHours < 24) return `${diffInHours} hours ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading pollen data...</p>
        </div>
      </div>
    )
  }

  const levelInfo = getPollenLevelInfo(pollenData?.current_level || 'moderate')

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Clean Header */}
      <div className="px-6 pt-12 pb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              {user ? `Hello, ${user.display_name?.split(' ')[0] || 'there'}` : 'CrowdPollen'}
            </h1>
            <p className="text-gray-600 mt-1">
              {location 
                ? location.address?.split(',')[0] || 'Your location'
                : 'Set your location'
              }
            </p>
          </div>
          <button
            onClick={() => navigate('/settings')}
            className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            {user ? (
              <span className="text-lg font-medium text-gray-700">
                {(user.display_name || user.email || 'U')[0].toUpperCase()}
              </span>
            ) : (
              <User className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>

        {!location && (
          <div className="bg-blue-50 rounded-xl p-4 mb-6">
            <div className="flex items-center">
              <Info className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0" />
              <div>
                <p className="text-blue-900 font-medium">Location Required</p>
                <p className="text-blue-700 text-sm">Set your location for personalized pollen data</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="px-6 space-y-6">
        {/* Current Conditions */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <span className="text-3xl mr-4">{levelInfo.emoji}</span>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{levelInfo.description}</h2>
                <p className="text-gray-600">
                  {pollenData?.count || 0} grains/m³
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="text-gray-700 font-medium">
              {levelInfo.advice}
            </p>
          </div>

          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>
              {pollenData?.local_reports || 0} local reports
            </span>
            <span>
              {formatLastUpdated(pollenData?.last_updated || new Date().toISOString())}
            </span>
          </div>
        </div>

        {/* Forecast Widget */}
        <ForecastWidget />

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => navigate('/camera')}
            className="bg-blue-500 text-white p-4 rounded-xl font-medium flex items-center justify-center space-x-3 hover:bg-blue-600 transition-colors"
          >
            <Camera className="w-5 h-5" />
            <span>Submit Reading</span>
          </button>
          <button
            onClick={() => navigate('/map')}
            className="bg-white border border-gray-200 text-gray-900 p-4 rounded-xl font-medium flex items-center justify-center space-x-3 hover:bg-gray-50 transition-colors"
          >
            <Map className="w-5 h-5" />
            <span>View Map</span>
          </button>
        </div>

        {/* Health Alert */}
        {(pollenData?.current_level === 'high' || pollenData?.current_level === 'very_high') && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-orange-600 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-orange-900 mb-2">High Pollen Alert</h4>
                <p className="text-sm text-orange-800 mb-3">
                  Consider taking allergy medication and limiting outdoor activities. 
                  Keep windows closed and use air conditioning when possible.
                </p>
                <button
                  onClick={() => navigate('/symptoms')}
                  className="text-sm text-orange-700 font-medium hover:text-orange-800"
                >
                  Log your symptoms →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-600 mr-3" />
              <div>
                <p className="text-sm text-red-800 mb-2">{error}</p>
                <button
                  onClick={loadPollenData}
                  className="text-sm text-red-700 font-medium hover:text-red-800"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Recent Activity */}
        {user && (
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Activity</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Last submission</span>
                <span className="font-medium text-gray-900">2 days ago</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Total submissions</span>
                <span className="font-medium text-gray-900">12</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Current streak</span>
                <span className="font-medium text-gray-900">5 days 🔥</span>
              </div>
            </div>
            <button
              onClick={() => navigate('/history')}
              className="w-full mt-4 py-3 text-blue-600 font-medium hover:text-blue-700 transition-colors"
            >
              View full history
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
