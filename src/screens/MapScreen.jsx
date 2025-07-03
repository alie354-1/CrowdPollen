import { useState, useEffect } from 'react'
import { ArrowLeft, MapPin, Filter, RefreshCw, Layers } from 'lucide-react'
import { useLocation } from '../contexts/LocationContext'
import LocationInput from '../components/LocationInput'
import { crowdPollenAPI } from '../services/crowdPollenAPI'

export default function MapScreen({ setScreen }) {
  const { location } = useLocation()
  const [showLocationInput, setShowLocationInput] = useState(false)
  const [mapData, setMapData] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('local') // 'local' or 'national'
  const [selectedSubmission, setSelectedSubmission] = useState(null)

  useEffect(() => {
    loadMapData()
  }, [location, viewMode])

  const loadMapData = async () => {
    try {
      setLoading(true)
      
      let data
      if (viewMode === 'local' && location) {
        data = await crowdPollenAPI.getLocalSubmissions(
          location.latitude,
          location.longitude,
          10 // 10km radius
        )
      } else {
        data = await crowdPollenAPI.getNationalSubmissions()
      }
      
      setMapData(data || [])
    } catch (error) {
      console.error('Failed to load map data:', error)
      // Set fallback data for demo
      setMapData(generateMockData())
    } finally {
      setLoading(false)
    }
  }

  const generateMockData = () => {
    const baseData = []
    const centerLat = location?.latitude || 40.7128
    const centerLon = location?.longitude || -74.0060
    const radius = viewMode === 'local' ? 0.1 : 10

    for (let i = 0; i < (viewMode === 'local' ? 15 : 50); i++) {
      const lat = centerLat + (Math.random() - 0.5) * radius
      const lon = centerLon + (Math.random() - 0.5) * radius
      const levels = ['very_low', 'low', 'moderate', 'high', 'very_high']
      const level = levels[Math.floor(Math.random() * levels.length)]
      
      baseData.push({
        id: `mock-${i}`,
        latitude: lat,
        longitude: lon,
        pollen_density: level,
        pollen_count: Math.floor(Math.random() * 100) + 5,
        confidence_score: 0.6 + Math.random() * 0.4,
        created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        address: `Location ${i + 1}`
      })
    }
    return baseData
  }

  const getPollenColor = (level) => {
    const colors = {
      very_low: '#22c55e',
      low: '#22c55e', 
      moderate: '#f59e0b',
      high: '#f97316',
      very_high: '#ef4444'
    }
    return colors[level] || '#6b7280'
  }

  const getPollenSize = (count) => {
    if (count < 10) return 'w-3 h-3'
    if (count < 30) return 'w-4 h-4'
    if (count < 60) return 'w-5 h-5'
    return 'w-6 h-6'
  }

  const formatTimeAgo = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours === 1) return '1 hour ago'
    if (diffInHours < 24) return `${diffInHours} hours ago`
    return `${Math.floor(diffInHours / 24)} days ago`
  }

  const handleLocationSet = (newLocation) => {
    setShowLocationInput(false)
    if (newLocation && viewMode === 'local') {
      loadMapData()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm p-4 safe-area-top">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => setScreen('home')}
              className="mr-3 p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-semibold">Pollen Map</h1>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={loadMapData}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowLocationInput(true)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <MapPin className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1 mt-3">
          <button
            onClick={() => setViewMode('local')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'local'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600'
            }`}
          >
            Local Area
          </button>
          <button
            onClick={() => setViewMode('national')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'national'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600'
            }`}
          >
            National View
          </button>
        </div>
      </div>

      {/* Location Notice */}
      {viewMode === 'local' && !location && (
        <div className="bg-yellow-50 border-b border-yellow-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-800">
                Set your location for local pollen data
              </p>
              <p className="text-xs text-yellow-700">
                Showing national view instead
              </p>
            </div>
            <button
              onClick={() => setShowLocationInput(true)}
              className="text-sm text-yellow-600 underline"
            >
              Set Location
            </button>
          </div>
        </div>
      )}

      {/* Map Container */}
      <div className="relative flex-1 bg-gray-100">
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading pollen data...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Simplified Map View */}
            <div className="h-96 bg-gradient-to-br from-green-100 to-blue-100 relative overflow-hidden">
              {/* Grid lines for map effect */}
              <div className="absolute inset-0 opacity-20">
                {[...Array(10)].map((_, i) => (
                  <div key={`h-${i}`} className="absolute w-full h-px bg-gray-400" style={{ top: `${i * 10}%` }} />
                ))}
                {[...Array(10)].map((_, i) => (
                  <div key={`v-${i}`} className="absolute h-full w-px bg-gray-400" style={{ left: `${i * 10}%` }} />
                ))}
              </div>

              {/* Current Location Marker */}
              {location && viewMode === 'local' && (
                <div 
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20"
                  style={{ top: '50%', left: '50%' }}
                >
                  <div className="w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-lg">
                    <div className="w-8 h-8 bg-blue-600/20 rounded-full absolute -top-2 -left-2 animate-ping" />
                  </div>
                </div>
              )}

              {/* Pollen Data Points */}
              {mapData.map((point, index) => {
                const x = viewMode === 'local' 
                  ? 50 + (Math.random() - 0.5) * 80 // Spread around center for local
                  : Math.random() * 90 + 5 // Random across map for national
                const y = viewMode === 'local'
                  ? 50 + (Math.random() - 0.5) * 80
                  : Math.random() * 90 + 5

                return (
                  <button
                    key={point.id}
                    onClick={() => setSelectedSubmission(point)}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10 hover:scale-110 transition-transform"
                    style={{ top: `${y}%`, left: `${x}%` }}
                  >
                    <div 
                      className={`${getPollenSize(point.pollen_count)} rounded-full border-2 border-white shadow-lg`}
                      style={{ backgroundColor: getPollenColor(point.pollen_density) }}
                    />
                  </button>
                )
              })}
            </div>

            {/* Legend */}
            <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 z-30">
              <h4 className="font-semibold text-sm mb-2 flex items-center">
                <Layers className="w-4 h-4 mr-1" />
                Pollen Levels
              </h4>
              <div className="space-y-1 text-xs">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2" />
                  <span>Low (0-10)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2" />
                  <span>Moderate (11-30)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-orange-500 rounded-full mr-2" />
                  <span>High (31-60)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-2" />
                  <span>Very High (60+)</span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 z-30">
              <div className="text-center">
                <div className="text-lg font-semibold">{mapData.length}</div>
                <div className="text-xs text-gray-500">Reports</div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Recent Submissions List */}
      <div className="bg-white border-t border-gray-200 max-h-48 overflow-y-auto">
        <div className="p-4">
          <h3 className="font-semibold mb-3">Recent Submissions</h3>
          <div className="space-y-2">
            {mapData.slice(0, 5).map((submission) => (
              <button
                key={submission.id}
                onClick={() => setSelectedSubmission(submission)}
                className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-3"
                    style={{ backgroundColor: getPollenColor(submission.pollen_density) }}
                  />
                  <div className="text-left">
                    <p className="text-sm font-medium capitalize">
                      {submission.pollen_density.replace('_', ' ')} Level
                    </p>
                    <p className="text-xs text-gray-500">
                      {submission.address || 'Unknown location'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{submission.pollen_count}</p>
                  <p className="text-xs text-gray-500">
                    {formatTimeAgo(submission.created_at)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Location Input Modal */}
      {showLocationInput && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4">Set Map Location</h3>
            <LocationInput 
              onLocationSet={handleLocationSet}
              showTitle={false}
            />
            <button
              onClick={() => setShowLocationInput(false)}
              className="w-full mt-4 py-2 text-gray-600 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Submission Detail Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Submission Details</h3>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center">
                <div 
                  className="w-4 h-4 rounded-full mr-3"
                  style={{ backgroundColor: getPollenColor(selectedSubmission.pollen_density) }}
                />
                <div>
                  <p className="font-medium capitalize">
                    {selectedSubmission.pollen_density.replace('_', ' ')} Level
                  </p>
                  <p className="text-sm text-gray-600">
                    {selectedSubmission.pollen_count} grains detected
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Confidence</span>
                  <span className="font-medium">
                    {Math.round(selectedSubmission.confidence_score * 100)}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-gray-600">Submitted</span>
                  <span className="font-medium">
                    {formatTimeAgo(selectedSubmission.created_at)}
                  </span>
                </div>
              </div>

              <div className="flex items-center">
                <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                <span className="text-sm text-gray-600">
                  {selectedSubmission.address || 'Location not available'}
                </span>
              </div>
            </div>

            <button
              onClick={() => setSelectedSubmission(null)}
              className="w-full mt-6 py-3 bg-blue-600 text-white rounded-lg font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
