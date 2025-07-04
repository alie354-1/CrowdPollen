import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Layers, RefreshCw, Filter, Navigation } from 'lucide-react'
import { useLocation } from '../../contexts/LocationContext'
import { crowdPollenAPI } from '../../services/crowdPollenAPI'
import googlePollenService from '../../services/googlePollenService'
import googleMapsService from '../../services/googleMapsService'

export default function GoogleMapScreen() {
  const navigate = useNavigate()
  const { location } = useLocation()
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [mapData, setMapData] = useState([])
  const [forecastData, setForecastData] = useState(null)
  const [activeOverlays, setActiveOverlays] = useState(() => ({
    TREE_UPI: true,
    GRASS_UPI: false,
    WEED_UPI: false
  }))
  const overlayRefs = useRef({})
  // Unified view mode - always show both forecast and community data
  const [viewMode] = useState('hybrid')
  const [selectedSubmission, setSelectedSubmission] = useState(null)
  const [showLegend, setShowLegend] = useState(true)

  useEffect(() => {
    initializeMap()
    return () => {
      // Cleanup markers when component unmounts
      clearMarkers()
    }
  }, [])

  useEffect(() => {
    if (mapInstanceRef.current) {
      loadMapData()
    }
  }, [location, viewMode])

  const initializeMap = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!googleMapsService.isConfigured()) {
        setError('Google Maps API key not configured. Please add VITE_GOOGLE_MAPS_API_KEY to your environment.')
        return
      }

      // Default center (NYC)
      let center = { lat: 40.7128, lng: -74.0060 }
      let zoom = 10

      if (location) {
        center = { lat: location.latitude, lng: location.longitude }
        zoom = 12
      }

      const map = await googleMapsService.createMap(mapRef.current, {
        center,
        zoom,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          },
          {
            featureType: 'transit',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      })

      mapInstanceRef.current = map

      // Add click listener to close info windows
      map.addListener('click', () => {
        setSelectedSubmission(null)
      })

      await loadMapData()
      updateHeatmapOverlays()
    } catch (err) {
      console.error('Map initialization failed:', err)
      setError('Failed to load map. Please check your internet connection.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    updateHeatmapOverlays()
  }, [activeOverlays])

  const updateHeatmapOverlays = () => {
    if (!mapInstanceRef.current) return

    const map = mapInstanceRef.current

    Object.entries(activeOverlays).forEach(([mapType, isActive]) => {
      if (isActive && !overlayRefs.current[mapType]) {
        const overlay = new window.google.maps.ImageMapType({
          getTileUrl: (coord, zoom) => googlePollenService.getHeatmapTileUrl(mapType, zoom, coord.x, coord.y),
          tileSize: new window.google.maps.Size(256, 256),
          name: mapType,
          opacity: 0.6
        })
        map.overlayMapTypes.push(overlay)
        overlayRefs.current[mapType] = overlay
      } else if (!isActive && overlayRefs.current[mapType]) {
        const index = map.overlayMapTypes.getArray().indexOf(overlayRefs.current[mapType])
        if (index > -1) {
          map.overlayMapTypes.removeAt(index)
        }
        delete overlayRefs.current[mapType]
      }
    })
  }

  const loadMapData = async () => {
    if (!mapInstanceRef.current) return

    try {
      setLoading(true)
      clearMarkers()

      const promises = []

      // Load crowd-sourced data
      if (viewMode === 'crowd' || viewMode === 'hybrid') {
        if (location) {
          promises.push(
            crowdPollenAPI.getLocalSubmissions(
              location.latitude,
              location.longitude,
              16 // 10 mile radius
            )
          )
        } else {
          promises.push(crowdPollenAPI.getNationalSubmissions())
        }
      }

      // Load forecast data
      if (viewMode === 'forecast' || viewMode === 'hybrid') {
        if (location) {
          promises.push(
            googlePollenService.getForecast(location.latitude, location.longitude)
          )
        } else {
          promises.push(Promise.resolve(null))
        }
      }

      const results = await Promise.allSettled(promises)
      
      let crowdData = []
      let forecast = null

      if (viewMode === 'crowd' || viewMode === 'hybrid') {
        const crowdResult = results[0]
        if (crowdResult.status === 'fulfilled') {
          crowdData = crowdResult.value || []
        } else {
          // Generate mock data for demo
          crowdData = generateMockCrowdData()
        }
      }

      if (viewMode === 'forecast' || viewMode === 'hybrid') {
        const forecastIndex = viewMode === 'hybrid' ? 1 : 0
        const forecastResult = results[forecastIndex]
        if (forecastResult.status === 'fulfilled') {
          forecast = forecastResult.value
        }
      }

      setMapData(crowdData)
      setForecastData(forecast)

      // Add markers to map
      addMarkersToMap(crowdData, forecast)

    } catch (err) {
      console.error('Failed to load map data:', err)
      // Use fallback data
      const fallbackData = generateMockCrowdData()
      setMapData(fallbackData)
      addMarkersToMap(fallbackData, null)
    } finally {
      setLoading(false)
    }
  }

  const generateMockCrowdData = () => {
    const baseData = []
    const centerLat = location?.latitude || 40.7128
    const centerLon = location?.longitude || -74.0060
    const radius = location ? 0.1 : 2

    for (let i = 0; i < 25; i++) {
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
        address: `Location ${i + 1}`,
        source: 'crowd'
      })
    }
    return baseData
  }

  const clearMarkers = () => {
    markersRef.current.forEach(marker => {
      marker.setMap(null)
    })
    markersRef.current = []
  }

  const addMarkersToMap = (crowdData, forecast) => {
    if (!mapInstanceRef.current) return

    // Add user location marker
    if (location) {
      const userMarker = googleMapsService.createMarker(
        mapInstanceRef.current,
        { lat: location.latitude, lng: location.longitude },
        {
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#3B82F6',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2
          },
          title: 'Your Location',
          zIndex: 1000
        }
      )
      markersRef.current.push(userMarker)
    }

    // Add crowd-sourced data markers
    if (viewMode === 'crowd' || viewMode === 'hybrid') {
      const now = Date.now()
      const recentData = crowdData.filter(p => {
        const created = new Date(p.created_at).getTime()
        return now - created <= 48 * 60 * 60 * 1000
      })

      recentData.forEach(point => {
        const marker = googleMapsService.createMarker(
          mapInstanceRef.current,
          { lat: point.latitude, lng: point.longitude },
          {
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: getMarkerSize(point.pollen_count),
              fillColor: getPollenColor(point.pollen_density),
              fillOpacity: 1,
              strokeColor: '#000000',
              strokeWeight: 1.5
            },
            title: `${point.pollen_density.replace('_', ' ')} - ${point.pollen_count} grains/m³`
          }
        )

        marker.addListener('click', () => {
          setSelectedSubmission(point)
        })

        markersRef.current.push(marker)
      })
    }

    // Add forecast overlay (if available)
    if (forecast && (viewMode === 'forecast' || viewMode === 'hybrid')) {
      // This would typically be a heatmap overlay
      // For now, we'll add a center marker showing forecast
      const forecastMarker = googleMapsService.createMarker(
        mapInstanceRef.current,
        { lat: location.latitude, lng: location.longitude },
        {
          icon: {
            path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            scale: 6,
            fillColor: '#FF6B35',
            fillOpacity: 0.9,
            strokeColor: '#FFFFFF',
            strokeWeight: 1
          },
          title: 'Forecast Data Available'
        }
      )
      markersRef.current.push(forecastMarker)
    }
  }

  const getPollenColor = (level) => {
    const colors = {
      very_low: '#34C759',
      low: '#34C759',
      moderate: '#FACC15',
      high: '#FF3B30',
      very_high: '#FF3B30'
    }
    return colors[level] || '#6B7280'
  }

  const getMarkerSize = (count) => {
    if (count < 10) return 4
    if (count < 30) return 6
    if (count < 60) return 8
    return 10
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

  const centerOnUserLocation = () => {
    if (location && mapInstanceRef.current) {
      mapInstanceRef.current.setCenter({
        lat: location.latitude,
        lng: location.longitude
      })
      mapInstanceRef.current.setZoom(12)
    }
  }

  if (!googleMapsService.isConfigured()) {
    return (
      <div className="min-h-screen bg-white pb-20">
        <div className="px-6 pt-12 pb-6">
          <div className="flex items-center mb-6">
            <button
              onClick={() => navigate('/')}
              className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-2xl font-semibold text-gray-900">Pollen Map</h1>
          </div>
        </div>

        <div className="px-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
            <div className="flex items-start">
              <MapPin className="w-6 h-6 text-yellow-600 mr-3 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-yellow-900 mb-2">Google Maps Setup Required</h3>
                <p className="text-yellow-800 mb-4">
                  To use the interactive map feature, you need to configure the Google Maps API key.
                </p>
                <div className="bg-yellow-100 rounded-lg p-3 mb-4">
                  <p className="text-sm text-yellow-800 font-mono">
                    Add VITE_GOOGLE_MAPS_API_KEY to your .env file
                  </p>
                </div>
                <button
                  onClick={() => navigate('/map-fallback')}
                  className="text-yellow-700 font-medium hover:text-yellow-800"
                >
                  Use simplified map view →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <div className="px-6 pt-12 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/')}
              className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-2xl font-semibold text-gray-900">Pollen Map</h1>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1">
              {['TREE_UPI', 'GRASS_UPI', 'WEED_UPI'].map(type => (
                <button
                  key={type}
                  onClick={() => {
                    setActiveOverlays(prev => ({
                      ...prev,
                      [type]: !prev[type]
                    }))
                  }}
                  className={`px-2 py-1 text-xs rounded-full border ${
                    activeOverlays[type]
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white text-gray-600 border-gray-300'
                  }`}
                >
                  {type.replace('_UPI', '')}
                </button>
              ))}
            </div>
            <button
              onClick={loadMapData}
              disabled={loading}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
            </button>
            {location && (
              <button
                onClick={centerOnUserLocation}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <Navigation className="w-5 h-5 text-gray-600" />
              </button>
            )}
            <button
              onClick={() => setShowLegend(!showLegend)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Layers className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* View Mode Toggle Removed - unified view */}
      </div>

      {/* Map Container */}
      <div className="relative">
        <div 
          ref={mapRef}
          className="h-96 w-full"
          style={{ minHeight: '400px' }}
        />

        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-500 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Loading map data...</p>
            </div>
          </div>
        )}

        {/* Error Overlay */}
        {error && (
          <div className="absolute inset-0 bg-white/90 flex items-center justify-center p-6">
            <div className="text-center max-w-sm">
              <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Map Unavailable</h3>
              <p className="text-sm text-gray-600 mb-4">{error}</p>
              <button
                onClick={initializeMap}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Legend */}
        {showLegend && !loading && !error && (
          <div className="absolute bottom-4 left-4 bg-white rounded-xl shadow-lg p-4 max-w-xs">
            <h4 className="font-semibold text-sm mb-3 flex items-center">
              <Layers className="w-4 h-4 mr-2" />
              Pollen Levels
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3" />
                <span>Very Low / Low</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-400 rounded-full mr-3" />
                <span>Moderate</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-3" />
                <span>High / Very High</span>
              </div>
              {location && (
                <div className="flex items-center pt-2 border-t border-gray-200">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-3" />
                  <span>Your Location</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Stats */}
        {!loading && !error && (
          <>
            <div
              className="absolute top-4 right-4 bg-white rounded-xl shadow-lg p-3 cursor-pointer hover:bg-gray-50"
              onClick={() => {
                if (mapInstanceRef.current && mapData.length > 0) {
                  const bounds = new window.google.maps.LatLngBounds()
                  mapData.forEach(p => bounds.extend({ lat: p.latitude, lng: p.longitude }))
                  mapInstanceRef.current.fitBounds(bounds)
                }
              }}
            >
              <div className="text-center">
                <div className="text-lg font-semibold">{mapData.length}</div>
                <div className="text-xs text-gray-500">Reports (last 48h)</div>
              </div>
            </div>
            <div className="absolute top-4 left-4 bg-white rounded-xl shadow-lg p-3">
              <div className="text-sm font-medium text-gray-700 mb-2">Map Layers</div>
              <ul className="space-y-1 text-xs text-gray-600">
                <li>• Community Reports (colored circles)</li>
                <li>• Pollen Forecast Overlays (Tree, Grass, Weed)</li>
              </ul>
            </div>
          </>
        )}
    </div>
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Pollen Report</h3>
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
                    {selectedSubmission.pollen_count} grains/m³
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Source</span>
                  <span className="font-medium capitalize">
                    {selectedSubmission.source || 'Community'}
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
              className="w-full mt-6 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
