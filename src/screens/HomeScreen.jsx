import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, Map, AlertTriangle, Info, User, ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useLocation } from '../contexts/LocationContext'
import { crowdPollenAPI } from '../services/crowdPollenAPI'
import ForecastWidget from '../components/forecast/ForecastWidget'
import LocationInput from '../components/LocationInput'

export default function HomeScreen() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { location } = useLocation()
  const [pollenData, setPollenData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [localReportCounts, setLocalReportCounts] = useState({})
  const [showLocationInput, setShowLocationInput] = useState(false)
  const [showJoinDetails, setShowJoinDetails] = useState(false)
  const [showNearbyDetails, setShowNearbyDetails] = useState(false)

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
        const counts = await crowdPollenAPI.getLocalReportCounts(location.latitude, location.longitude, location.zip_code)
        setLocalReportCounts(counts)
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
  const showCelebration = pollenData?.current_level === 'none' || pollenData?.current_level === 'very_low' || pollenData?.current_level === 'low'

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
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigate('/help')}
              className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <Info className="w-5 h-5 text-gray-600" />
            </button>
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
        </div>

        {/* Expandable Join CrowdPollen Section for Non-Signed-In Users */}
        {!user && (
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl mb-6 text-white overflow-hidden">
            <button
              onClick={() => setShowJoinDetails(!showJoinDetails)}
              className="w-full p-4 text-left hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">Join CrowdPollen Platform</h3>
                  <p className="text-blue-100 text-sm">Coming soon - Choose your contribution level</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="bg-white/20 text-xs px-2 py-1 rounded-full">3 Modes</span>
                  {showJoinDetails ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </div>
              </div>
            </button>
            
            {showJoinDetails && (
              <div className="px-4 pb-4 space-y-3 border-t border-white/20 pt-4">
                {/* Individual Mode */}
                <div className="bg-white/10 rounded-lg p-3">
                  <div className="flex items-center mb-2">
                    <span className="text-lg mr-2">👤</span>
                    <h4 className="font-semibold">Individual Contributor</h4>
                  </div>
                  <p className="text-blue-100 text-sm mb-2">
                    Perfect for personal allergy tracking and community contribution
                  </p>
                  <ul className="text-xs text-blue-200 space-y-1">
                    <li>• Sync data across all your devices</li>
                    <li>• Personal allergy insights & trends</li>
                    <li>• Contribute to community science</li>
                    <li>• Access to premium forecast features</li>
                  </ul>
                </div>

                {/* Teacher Mode */}
                <div className="bg-white/10 rounded-lg p-3">
                  <div className="flex items-center mb-2">
                    <span className="text-lg mr-2">🎓</span>
                    <h4 className="font-semibold">Teacher & Educator</h4>
                  </div>
                  <p className="text-blue-100 text-sm mb-2">
                    Engage students in real environmental science
                  </p>
                  <ul className="text-xs text-blue-200 space-y-1">
                    <li>• Classroom dashboard for student data</li>
                    <li>• Educational resources & lesson plans</li>
                    <li>• Student progress tracking</li>
                    <li>• Bulk data export for projects</li>
                  </ul>
                </div>

                {/* Expert Mode */}
                <div className="bg-white/10 rounded-lg p-3">
                  <div className="flex items-center mb-2">
                    <span className="text-lg mr-2">🔬</span>
                    <h4 className="font-semibold">Research & Expert</h4>
                  </div>
                  <p className="text-blue-100 text-sm mb-2">
                    Advanced tools for researchers and professionals
                  </p>
                  <ul className="text-xs text-blue-200 space-y-1">
                    <li>• Raw data access & API endpoints</li>
                    <li>• Advanced analytics & visualizations</li>
                    <li>• Evaluate & tag submitted images for model training</li>
                    <li>• Custom research project tools</li>
                    <li>• Priority support & collaboration</li>
                  </ul>
                </div>

                {/* Coming Soon Notice */}
                <div className="bg-white/5 rounded-lg p-3 text-center">
                  <p className="text-blue-200 text-sm mb-2">
                    🚀 <strong>Coming Soon</strong>
                  </p>
                  <p className="text-xs text-blue-300">
                    Join our waitlist to be notified when registration opens
                  </p>
                  <button
                    disabled
                    className="mt-2 bg-white/20 text-white px-4 py-2 rounded-lg font-medium text-sm cursor-not-allowed opacity-75"
                  >
                    Join Waitlist (Coming Soon)
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {!location && (
          <button
            onClick={() => setShowLocationInput(true)}
            className="w-full bg-blue-50 rounded-xl p-4 mb-6 hover:bg-blue-100 transition-colors"
          >
            <div className="flex items-center">
              <Info className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0" />
              <div className="text-left">
                <p className="text-blue-900 font-medium">Location Required</p>
                <p className="text-blue-700 text-sm">Tap to set your location for personalized pollen data</p>
              </div>
            </div>
          </button>
        )}

        {/* Data Usage Disclaimer */}
        {!user ? (
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="flex items-start justify-between">
              <div className="flex">
                <Info className="w-4 h-4 text-gray-500 mr-2 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-gray-600">
                  <p className="font-medium text-gray-700 mb-1">Anonymous Mode</p>
                  <p>Your data is stored locally on your device only. Sign up to sync across devices and contribute to citizen science research.</p>
                </div>
              </div>
              <div className="relative group ml-4">
                <button
                  onClick={() => {
                    localStorage.clear()
                    sessionStorage.clear()
                    window.location.href = '/'
                  }}
                  className="text-xs text-red-500 hover:underline"
                >
                  Clear
                </button>
                <div className="absolute bottom-full mb-1 right-0 bg-gray-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap max-w-xs text-center">
                  Clear all local data & location
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-green-50 rounded-xl p-4 mb-6">
            <div className="flex items-start">
              <Info className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-green-700">
                <p className="font-medium text-green-800 mb-1">Contributing to Science</p>
                <p>Your submissions help researchers understand pollen patterns and improve allergy forecasts for everyone.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="px-6 space-y-6">
        {/* Current Conditions */}
        <div className="relative bg-white rounded-xl border border-gray-100 p-6 overflow-hidden">
          {showCelebration && (
            <div className="absolute inset-0 pointer-events-none z-0">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className={`absolute w-0.5 h-0.5 bg-transparent left-1/2 top-1/2`}
                  style={{
                    animation: `firework-burst 1s ease-out ${i * 0.4}s forwards`,
                    transformOrigin: 'center',
                  }}
                >
                  {[...Array(8)].map((_, j) => (
                    <div
                      key={j}
                      className="absolute w-1 h-1 rounded-full"
                      style={{
                        backgroundColor: ['#34d399', '#60a5fa', '#a78bfa'][j % 3],
                        transform: `rotate(${j * 45}deg) translateX(0)`,
                        animation: `firework-particle 1s ease-out ${i * 0.4}s forwards`,
                      }}
                    />
                  ))}
                </div>
              ))}
            </div>
          )}
          <div className="mb-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-200 pb-1">Current Conditions</h3>
            {location ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-3xl mr-4">{levelInfo.emoji}</span>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{levelInfo.description}</h2>
                    <p className="text-gray-600">
                      {pollenData?.count || 0} grains/m³
                    </p>
                  </div>
                </div>
                <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  Hyper-Local Data
                </div>
              </div>
            ) : (
              <div className="flex items-center text-sm text-gray-600">
                <Info className="w-4 h-4 mr-2 text-gray-400" />
                <span>Location Required to show today's pollen level</span>
              </div>
            )}
          </div>

          {location && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-gray-700 font-medium">
                {levelInfo.advice}
              </p>
            </div>
          )}

          <p className="text-xs text-gray-500 mb-3">
            Updates as community reports come in • Defaults to Google data for this location when insufficient local reports
          </p>

          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>
              {localReportCounts['0.5 miles'] ?? pollenData?.local_reports ?? 0} local reports
            </span>
            <button
              onClick={() => setShowNearbyDetails(!showNearbyDetails)}
              className="text-blue-600 hover:underline text-xs"
            >
              {showNearbyDetails ? 'Hide details' : 'Show details'}
            </button>
          </div>

          {showNearbyDetails && Object.values(localReportCounts).some(count => count > 0) && (
            <div className="mt-4">
              <h4 className="text-xs text-gray-500 mb-2">Nearby Reports</h4>
              <div className="grid grid-cols-5 gap-2 text-center text-[10px] text-gray-600">
                {['0.5 miles', '1 mile', '5 miles', '10 miles', 'zip_code'].map((tier) => (
                  <div key={tier} className="flex flex-col items-center">
                    <div className="text-sm font-medium text-gray-800">
                      {localReportCounts[tier] ?? 0}
                    </div>
                    <div>{tier}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Forecast Label */}
        <h3 className="text-lg font-bold text-gray-900 px-1 mt-8 mb-2 border-b border-gray-200 pb-1">Forecast</h3>

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

      {/* Location Input Modal */}
      {showLocationInput && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Set Location</h3>
              <button
                onClick={() => setShowLocationInput(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <LocationInput 
              onLocationSet={() => setShowLocationInput(false)}
              showTitle={false}
            />
          </div>
        </div>
      )}
    </div>
  )
}
