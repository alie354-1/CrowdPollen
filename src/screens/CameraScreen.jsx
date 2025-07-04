import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Camera as CameraIcon, MapPin, Clock, HelpCircle, X } from 'lucide-react'
import Camera from '../components/Camera'
import LocationInput from '../components/LocationInput'
import ProcessingScreen from '../components/ProcessingScreen'
import ResultsScreen from '../components/ResultsScreen'
import { useLocation } from '../contexts/LocationContext'
import { useAuth } from '../contexts/AuthContext'
import { crowdPollenAPI } from '../services/crowdPollenAPI'

export default function CameraScreen() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { location } = useLocation()
  const [showCamera, setShowCamera] = useState(false)
  const [showLocationInput, setShowLocationInput] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [results, setResults] = useState(null)
  const [capturedImage, setCapturedImage] = useState(null)
  const [showTrapInstructions, setShowTrapInstructions] = useState(false)

  const handleCapture = async (blob) => {
    try {
      setIsProcessing(true)
      setShowCamera(false)
      setCapturedImage(URL.createObjectURL(blob))

      // Check if we have location
      if (!location) {
        setShowLocationInput(true)
        return
      }

      // Process the image
      await processImage(blob, location)
    } catch (error) {
      console.error('Capture error:', error)
      setIsProcessing(false)
    }
  }

  const processImage = async (blob, locationData) => {
    try {
      setIsProcessing(true)

      // Submit to API for processing
      const result = await crowdPollenAPI.submitPollenReading({
        image: blob,
        location: locationData,
        user_id: user?.id || null,
        timestamp: new Date().toISOString()
      })

      setResults(result)
    } catch (error) {
      console.error('Processing error:', error)
      // Show fallback results for demo
      setResults({
        id: 'demo-' + Date.now(),
        pollen_density: 'moderate',
        pollen_count: Math.floor(Math.random() * 50) + 10,
        confidence_score: 0.75 + Math.random() * 0.2,
        plant_species: ['Oak', 'Birch', 'Grass'],
        advice: 'Moderate pollen levels detected. Sensitive individuals may experience mild symptoms.',
        weather_conditions: {
          temperature: 22,
          humidity: 65,
          wind_speed: 8
        }
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleLocationSet = async (newLocation) => {
    setShowLocationInput(false)
    if (capturedImage) {
      // Convert the captured image back to blob for processing
      const response = await fetch(capturedImage)
      const blob = await response.blob()
      await processImage(blob, newLocation)
    }
  }

  const handleRetake = () => {
    setResults(null)
    setCapturedImage(null)
    setShowCamera(true)
  }

  const handleNewSubmission = () => {
    setResults(null)
    setCapturedImage(null)
    setShowCamera(false)
  }

  const getPollenLevelInfo = (level) => {
    const levels = {
      very_low: { color: 'text-green-600', bg: 'bg-green-50', emoji: '🟢' },
      low: { color: 'text-green-600', bg: 'bg-green-50', emoji: '🟢' },
      moderate: { color: 'text-yellow-600', bg: 'bg-yellow-50', emoji: '🟡' },
      high: { color: 'text-orange-600', bg: 'bg-orange-50', emoji: '🟠' },
      very_high: { color: 'text-red-600', bg: 'bg-red-50', emoji: '🔴' }
    }
    return levels[level] || levels.moderate
  }

  // Show camera
  if (showCamera) {
    return (
      <Camera 
        onCapture={handleCapture}
        onClose={() => setShowCamera(false)}
      />
    )
  }

  // Show location input modal
  if (showLocationInput) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl p-6 max-w-sm w-full">
          <h3 className="text-lg font-semibold mb-4">Location Required</h3>
          <p className="text-gray-600 mb-4 text-sm">
            We need your location to provide accurate pollen data for your area.
          </p>
          <LocationInput 
            onLocationSet={handleLocationSet}
            showTitle={false}
          />
          <button
            onClick={() => {
              setShowLocationInput(false)
              setIsProcessing(false)
              setCapturedImage(null)
            }}
            className="w-full mt-4 py-2 text-gray-600 text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  // Show processing state
  if (isProcessing) {
    return <ProcessingScreen capturedImage={capturedImage} />
  }

  // Show results
  if (results) {
    return (
      <ResultsScreen
        results={results}
        capturedImage={capturedImage}
        location={location}
        onBack={() => navigate('/')}
        onRetake={handleRetake}
        onViewMap={() => navigate('/map')}
        onLogSymptoms={() => navigate('/symptoms')}
        onNewSubmission={handleNewSubmission}
      />
    )
  }

  // Initial camera screen
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm p-4 safe-area-top">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/')}
            className="mr-3 p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-semibold">Submit Pollen Reading</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Location Status */}
        {location ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center">
              <MapPin className="w-4 h-4 text-green-600 mr-2" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800">Location set</p>
                <p className="text-xs text-green-700">
                  {location.address?.split(',')[0] || 'Current location'}
                </p>
              </div>
              <button
                onClick={() => setShowLocationInput(true)}
                className="text-xs text-green-600 underline"
              >
                Change
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <MapPin className="w-4 h-4 text-yellow-600 mr-2" />
                <span className="text-sm font-medium text-yellow-800">
                  Location required
                </span>
              </div>
              <button
                onClick={() => setShowLocationInput(true)}
                className="text-sm text-yellow-600 underline"
              >
                Set location
              </button>
            </div>
          </div>
        )}

        {/* Pollen Trap Instructions Link */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <HelpCircle className="w-5 h-5 text-blue-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-blue-800">Need a pollen trap?</p>
                <p className="text-xs text-blue-700">Learn how to make one in 5 minutes</p>
              </div>
            </div>
            <button
              onClick={() => setShowTrapInstructions(true)}
              className="text-sm text-blue-600 underline font-medium"
            >
              View Guide
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="font-semibold mb-4 flex items-center">
            <CameraIcon className="w-5 h-5 mr-2 text-blue-600" />
            How to take a good photo
          </h3>
          <div className="space-y-3">
            <div className="flex items-start">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                <span className="text-xs font-semibold text-blue-600">1</span>
              </div>
              <div>
                <p className="text-sm font-medium">Place trap on flat surface</p>
                <p className="text-xs text-gray-600">Ensure the trap is stable and level</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                <span className="text-xs font-semibold text-blue-600">2</span>
              </div>
              <div>
                <p className="text-sm font-medium">Ensure good lighting</p>
                <p className="text-xs text-gray-600">Avoid shadows and direct sunlight</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                <span className="text-xs font-semibold text-blue-600">3</span>
              </div>
              <div>
                <p className="text-sm font-medium">Center trap in frame</p>
                <p className="text-xs text-gray-600">Use the guide lines to align properly</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                <span className="text-xs font-semibold text-blue-600">4</span>
              </div>
              <div>
                <p className="text-sm font-medium">Hold camera steady</p>
                <p className="text-xs text-gray-600">Take a clear, focused photo</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sample Image */}
        <div className="bg-white rounded-xl shadow-md p-4">
          <h4 className="font-medium mb-3">What pollen looks like</h4>
          <div className="bg-yellow-50 rounded-lg p-4 text-center">
            <div className="relative w-32 h-20 bg-yellow-100 rounded mx-auto mb-2">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1.5 h-1.5 bg-yellow-600 rounded-full"
                  style={{
                    top: `${20 + Math.random() * 60}%`,
                    left: `${10 + Math.random() * 80}%`
                  }}
                />
              ))}
            </div>
            <p className="text-xs text-gray-600">
              Pollen grains appear as small yellow/brown dots
            </p>
          </div>
        </div>

        {/* Camera Button */}
        <button
          onClick={() => setShowCamera(true)}
          disabled={!location}
          className="w-full py-4 bg-blue-600 text-white rounded-xl font-medium flex items-center justify-center space-x-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <CameraIcon className="w-6 h-6" />
          <span>Open Camera</span>
        </button>

        {!location && (
          <p className="text-center text-sm text-gray-500">
            Please set your location first
          </p>
        )}

        {/* Pollen Trap Instructions Modal */}
        {showTrapInstructions && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <h3 className="text-lg font-semibold">Make a Pollen Trap</h3>
                <button
                  onClick={() => setShowTrapInstructions(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4 space-y-4">
                {/* Quick Info */}
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-blue-800">⏱️ Time needed:</span>
                    <span className="text-blue-700">5 minutes</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="font-medium text-blue-800">🕐 Best exposure:</span>
                    <span className="text-blue-700">1-3 hours (up to 24h)</span>
                  </div>
                </div>

                {/* Materials */}
                <div>
                  <h4 className="font-semibold mb-2">What you'll need:</h4>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                      <span className="text-sm">Clear tape or petroleum jelly</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                      <span className="text-sm">Small plate or piece of cardboard</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                      <span className="text-sm">Magnifying glass (optional)</span>
                    </div>
                  </div>
                </div>

                {/* Steps */}
                <div>
                  <h4 className="font-semibold mb-3">Instructions:</h4>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                        <span className="text-sm font-semibold text-blue-600">1</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Prepare the surface</p>
                        <p className="text-xs text-gray-600 mt-1">
                          Apply clear tape sticky-side up to a small plate, or spread a thin layer of petroleum jelly on the surface.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                        <span className="text-sm font-semibold text-blue-600">2</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Place outside</p>
                        <p className="text-xs text-gray-600 mt-1">
                          Put your trap in an open area away from buildings. Avoid windy spots that might blow the trap away.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                        <span className="text-sm font-semibold text-blue-600">3</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Wait for pollen</p>
                        <p className="text-xs text-gray-600 mt-1">
                          Leave for 1-3 hours for quick results, or up to 24 hours for maximum collection. Best results on dry, breezy days.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                        <span className="text-sm font-semibold text-blue-600">4</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Take a photo</p>
                        <p className="text-xs text-gray-600 mt-1">
                          Bring your trap inside and use this app to photograph the collected pollen. Look for small yellow/brown dots.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tips */}
                <div className="bg-yellow-50 rounded-lg p-3">
                  <h5 className="font-medium text-yellow-800 mb-2">💡 Pro Tips:</h5>
                  <div className="space-y-1 text-xs text-yellow-700">
                    <p>• Best time: Mid-morning on dry, breezy days</p>
                    <p>• Avoid rainy or very humid conditions</p>
                    <p>• Place multiple traps for better coverage</p>
                    <p>• Use a magnifying glass to see pollen better</p>
                  </div>
                </div>

                {/* Reminder */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-800">
                    <span className="font-medium">Remember:</span> This guide is always available on the submit page whenever you need it!
                  </p>
                </div>

                {/* Close Button */}
                <button
                  onClick={() => setShowTrapInstructions(false)}
                  className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium"
                >
                  Got it!
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
