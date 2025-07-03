import { useState } from 'react'
import { MapPin, Navigation, Loader2 } from 'lucide-react'
import { useLocation } from '../contexts/LocationContext'

export default function LocationInput({ onLocationSet, showTitle = true }) {
  const { 
    location, 
    isLoading, 
    error, 
    requestGPSLocation, 
    setZipCode, 
    clearLocation,
    permissionStatus 
  } = useLocation()
  
  const [zipInput, setZipInput] = useState('')
  const [inputMode, setInputMode] = useState('gps') // 'gps' or 'zip'

  const handleGPSRequest = async () => {
    try {
      const newLocation = await requestGPSLocation()
      if (onLocationSet) {
        onLocationSet(newLocation)
      }
    } catch (error) {
      console.error('GPS location failed:', error)
    }
  }

  const handleZipSubmit = async (e) => {
    e.preventDefault()
    if (zipInput.length === 5) {
      try {
        const newLocation = await setZipCode(zipInput)
        if (onLocationSet) {
          onLocationSet(newLocation)
        }
      } catch (error) {
        console.error('ZIP code failed:', error)
      }
    }
  }

  const handleZipInputChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 5)
    setZipInput(value)
  }

  const getGPSButtonText = () => {
    if (isLoading && inputMode === 'gps') return 'Getting location...'
    if (permissionStatus === 'denied') return 'Location denied'
    if (location?.source === 'gps') return 'Update GPS'
    return 'Use GPS'
  }

  const isGPSDisabled = () => {
    return isLoading || permissionStatus === 'denied'
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-4">
      {showTitle && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center">
            <MapPin className="w-5 h-5 mr-2 text-blue-600" />
            Set Your Location
          </h3>
          {location && (
            <button
              onClick={clearLocation}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {/* Input Mode Toggle */}
      <div className="flex bg-gray-100 rounded-lg p-1 mb-4">
        <button
          onClick={() => setInputMode('gps')}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            inputMode === 'gps'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Navigation className="w-4 h-4 inline mr-1" />
          GPS
        </button>
        <button
          onClick={() => setInputMode('zip')}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            inputMode === 'zip'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          ZIP Code
        </button>
      </div>

      {/* GPS Mode */}
      {inputMode === 'gps' && (
        <div className="space-y-3">
          <button
            onClick={handleGPSRequest}
            disabled={isGPSDisabled()}
            className={`w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center transition-colors ${
              isGPSDisabled()
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isLoading && inputMode === 'gps' ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Navigation className="w-4 h-4 mr-2" />
            )}
            {getGPSButtonText()}
          </button>

          {permissionStatus === 'denied' && (
            <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
              <p className="font-medium">Location access denied</p>
              <p>Please enable location services in your browser settings or use ZIP code instead.</p>
            </div>
          )}
        </div>
      )}

      {/* ZIP Code Mode */}
      {inputMode === 'zip' && (
        <form onSubmit={handleZipSubmit} className="space-y-3">
          <div>
            <input
              type="text"
              placeholder="Enter ZIP code (e.g., 90210)"
              value={zipInput}
              onChange={handleZipInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              maxLength={5}
            />
          </div>
          <button
            type="submit"
            disabled={zipInput.length !== 5 || (isLoading && inputMode === 'zip')}
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors flex items-center justify-center"
          >
            {isLoading && inputMode === 'zip' ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : null}
            Set Location
          </button>
        </form>
      )}

      {/* Error Display */}
      {error && (
        <div className="mt-3 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Current Location Display */}
      {location && (
        <div className="mt-4 p-3 bg-green-50 rounded-lg">
          <div className="flex items-start">
            <MapPin className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-green-800">
                Location set
              </p>
              <p className="text-sm text-green-700 truncate">
                {location.address || `${location.latitude?.toFixed(4)}, ${location.longitude?.toFixed(4)}`}
              </p>
              {location.source === 'gps' && location.accuracy && (
                <p className="text-xs text-green-600 mt-1">
                  Accuracy: ±{Math.round(location.accuracy)}m
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="mt-4 text-xs text-gray-500">
        <p>
          Your location helps us show relevant pollen data for your area. 
          GPS provides more accurate results.
        </p>
      </div>
    </div>
  )
}
