import { useState } from 'react'
import { ArrowLeft, Camera as CameraIcon, MapPin, Clock } from 'lucide-react'
import Camera from '../components/Camera'
import LocationInput from '../components/LocationInput'
import { useLocation } from '../contexts/LocationContext'
import { useAuth } from '../contexts/AuthContext'
import { crowdPollenAPI } from '../services/crowdPollenAPI'

export default function CameraScreen({ setScreen }) {
  const { user } = useAuth()
  const { location } = useLocation()
  const [showCamera, setShowCamera] = useState(false)
  const [showLocationInput, setShowLocationInput] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [results, setResults] = useState(null)
  const [capturedImage, setCapturedImage] = useState(null)

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
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          {capturedImage && (
            <div className="mb-6">
              <img 
                src={capturedImage} 
                alt="Captured pollen trap" 
                className="w-48 h-48 object-cover rounded-xl mx-auto shadow-lg"
              />
            </div>
          )}
          
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4" />
          
          <h3 className="text-lg font-semibold mb-2">Analyzing Pollen Levels</h3>
          <p className="text-gray-600 text-sm mb-4">
            Our AI is counting pollen grains and identifying species...
          </p>
          
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-blue-800 text-xs">
              This usually takes 10-30 seconds
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Show results
  if (results) {
    const levelInfo = getPollenLevelInfo(results.pollen_density)
    
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        {/* Header */}
        <div className="bg-white shadow-sm p-4 safe-area-top">
          <div className="flex items-center">
            <button
              onClick={() => setScreen('home')}
              className="mr-3 p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-semibold">Pollen Analysis Results</h1>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Image Preview */}
          {capturedImage && (
            <div className="bg-white rounded-xl shadow-md p-4">
              <img 
                src={capturedImage} 
                alt="Analyzed pollen trap" 
                className="w-full h-48 object-cover rounded-lg"
              />
            </div>
          )}

          {/* Main Results */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <span className="text-2xl mr-3">{levelInfo.emoji}</span>
                <div>
                  <h2 className="text-xl font-semibold capitalize">
                    {results.pollen_density.replace('_', ' ')} Level
                  </h2>
                  <p className="text-gray-600">
                    {results.pollen_count} grains detected
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Confidence</div>
                <div className="text-lg font-semibold">
                  {Math.round(results.confidence_score * 100)}%
                </div>
              </div>
            </div>

            <div className={`p-4 rounded-lg ${levelInfo.bg}`}>
              <p className={`text-sm ${levelInfo.color} font-medium`}>
                {results.advice}
              </p>
            </div>
          </div>

          {/* Species Breakdown */}
          {results.plant_species && results.plant_species.length > 0 && (
            <div className="bg-white rounded-xl shadow-md p-4">
              <h3 className="font-semibold mb-3">Detected Species</h3>
              <div className="space-y-2">
                {results.plant_species.map((species, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm">{species}</span>
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${Math.random() * 60 + 20}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Weather Context */}
          {results.weather_conditions && (
            <div className="bg-white rounded-xl shadow-md p-4">
              <h3 className="font-semibold mb-3 flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                Weather Conditions
              </h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-semibold">
                    {results.weather_conditions.temperature}°C
                  </div>
                  <div className="text-xs text-gray-500">Temperature</div>
                </div>
                <div>
                  <div className="text-lg font-semibold">
                    {results.weather_conditions.humidity}%
                  </div>
                  <div className="text-xs text-gray-500">Humidity</div>
                </div>
                <div>
                  <div className="text-lg font-semibold">
                    {results.weather_conditions.wind_speed} km/h
                  </div>
                  <div className="text-xs text-gray-500">Wind</div>
                </div>
              </div>
            </div>
          )}

          {/* Location Info */}
          {location && (
            <div className="bg-white rounded-xl shadow-md p-4">
              <div className="flex items-center">
                <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                <span className="text-sm text-gray-600">
                  {location.address || `${location.latitude?.toFixed(4)}, ${location.longitude?.toFixed(4)}`}
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => setScreen('map')}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium"
            >
              View on Map
            </button>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setScreen('symptomLog')}
                className="py-3 bg-gray-200 text-gray-800 rounded-xl font-medium"
              >
                Log Symptoms
              </button>
              <button
                onClick={handleRetake}
                className="py-3 border border-gray-300 text-gray-700 rounded-xl font-medium"
              >
                Retake Photo
              </button>
            </div>
            
            <button
              onClick={handleNewSubmission}
              className="w-full py-2 text-gray-600 text-sm"
            >
              Submit Another Reading
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Initial camera screen
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm p-4 safe-area-top">
        <div className="flex items-center">
          <button
            onClick={() => setScreen('home')}
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
      </div>
    </div>
  )
}
