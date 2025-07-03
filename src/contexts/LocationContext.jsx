import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import googleMapsService from '../services/googleMapsService'
import googleGeolocationService from '../services/googleGeolocationService'

const LocationContext = createContext({})

export function useLocation() {
  const context = useContext(LocationContext)
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider')
  }
  return context
}

export function LocationProvider({ children }) {
  const [location, setLocation] = useState(null)
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [permissionStatus, setPermissionStatus] = useState('prompt')
  const [watchId, setWatchId] = useState(null)
  const [useGoogleGeolocation, setUseGoogleGeolocation] = useState(false)

  // Check permission status on mount
  useEffect(() => {
    checkPermissionStatus()
    loadSavedLocation()
    loadGeolocationPreference()
  }, [])

  const checkPermissionStatus = async () => {
    if (navigator.permissions && navigator.permissions.query) {
      try {
        const result = await navigator.permissions.query({ name: 'geolocation' })
        setPermissionStatus(result.state)
        
        result.addEventListener('change', () => {
          setPermissionStatus(result.state)
        })
      } catch (error) {
        console.warn('Permission API not supported:', error)
      }
    }
  }

  const loadSavedLocation = () => {
    try {
      const saved = localStorage.getItem('crowdpollen_location')
      if (saved) {
        const parsedLocation = JSON.parse(saved)
        // Only use saved location if it's recent (within 1 hour)
        const oneHour = 60 * 60 * 1000
        if (Date.now() - parsedLocation.timestamp < oneHour) {
          setLocation(parsedLocation)
        } else {
          localStorage.removeItem('crowdpollen_location')
        }
      }
    } catch (error) {
      console.warn('Error loading saved location:', error)
      localStorage.removeItem('crowdpollen_location')
    }
  }

  const loadGeolocationPreference = () => {
    try {
      const saved = localStorage.getItem('crowdpollen_use_google_geolocation')
      if (saved) {
        setUseGoogleGeolocation(JSON.parse(saved))
      }
    } catch (error) {
      console.warn('Error loading geolocation preference:', error)
    }
  }

  const updateGeolocationPreference = useCallback((enabled) => {
    setUseGoogleGeolocation(enabled)
    try {
      localStorage.setItem('crowdpollen_use_google_geolocation', JSON.stringify(enabled))
    } catch (error) {
      console.warn('Error saving geolocation preference:', error)
    }
  }, [])

  const requestGoogleGeolocation = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      if (!googleGeolocationService.isConfigured()) {
        throw new Error('Google Geolocation API not configured')
      }

      const locationData = await googleGeolocationService.getCurrentLocation()
      
      // Get address using reverse geocoding if Google Maps is configured
      let address = `${locationData.latitude.toFixed(4)}, ${locationData.longitude.toFixed(4)}`
      
      if (googleMapsService.isConfigured()) {
        try {
          const reverseGeocodedData = await googleMapsService.reverseGeocode(
            locationData.latitude, 
            locationData.longitude
          )
          address = reverseGeocodedData.address
        } catch (error) {
          console.warn('Reverse geocoding failed:', error)
        }
      }

      const finalLocationData = {
        ...locationData,
        address,
        source: 'google_geolocation',
        timestamp: Date.now()
      }

      setLocation(finalLocationData)
      saveLocation(finalLocationData)

      return finalLocationData
    } catch (err) {
      const errorMessage = err.message || 'Google Geolocation failed'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const saveLocation = (locationData) => {
    try {
      const locationWithTimestamp = {
        ...locationData,
        timestamp: Date.now()
      }
      localStorage.setItem('crowdpollen_location', JSON.stringify(locationWithTimestamp))
    } catch (error) {
      console.warn('Error saving location:', error)
    }
  }

  const requestGPSLocation = useCallback(async (options = {}) => {
    setIsLoading(true)
    setError(null)

    try {
      if (!googleMapsService.isConfigured()) {
        // Fallback to browser geolocation without reverse geocoding
        const position = await new Promise((resolve, reject) => {
          if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported by your browser'))
            return
          }

          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 300000,
            ...options
          })
        })

        const { latitude, longitude, accuracy } = position.coords
        const locationData = {
          latitude,
          longitude,
          accuracy,
          address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
          source: 'gps',
          timestamp: Date.now()
        }

        setLocation(locationData)
        saveLocation(locationData)
        setPermissionStatus('granted')
        return locationData
      }

      // Use Google Maps service for GPS + reverse geocoding
      const locationData = await googleMapsService.getCurrentLocation(options)
      
      setLocation(locationData)
      saveLocation(locationData)
      setPermissionStatus('granted')

      return locationData
    } catch (err) {
      const errorMessage = getLocationErrorMessage(err)
      setError(errorMessage)
      
      if (err.message.includes('denied')) {
        setPermissionStatus('denied')
      }
      
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const watchPosition = useCallback((options = {}) => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported')
      return null
    }

    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 60000, // 1 minute
      ...options
    }

    const id = navigator.geolocation.watchPosition(
      async (position) => {
        try {
          const { latitude, longitude, accuracy } = position.coords
          
          let address = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
          
          // Try to get address using Google Maps if configured
          if (googleMapsService.isConfigured()) {
            try {
              const locationData = await googleMapsService.reverseGeocode(latitude, longitude)
              address = locationData.address
            } catch (error) {
              console.warn('Reverse geocoding failed:', error)
            }
          }

          const locationData = {
            latitude,
            longitude,
            accuracy,
            address,
            source: 'gps',
            timestamp: Date.now()
          }

          setLocation(locationData)
          saveLocation(locationData)
          setError(null)
        } catch (error) {
          console.error('Watch position error:', error)
        }
      },
      (err) => {
        const errorMessage = getLocationErrorMessage(err)
        setError(errorMessage)
      },
      defaultOptions
    )

    setWatchId(id)
    return id
  }, [])

  const stopWatching = useCallback(() => {
    if (watchId && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId)
      setWatchId(null)
    }
  }, [watchId])

  const setZipCode = useCallback(async (zipCode) => {
    setIsLoading(true)
    setError(null)

    try {
      if (!/^\d{5}(-\d{4})?$/.test(zipCode)) {
        throw new Error('Invalid ZIP code format')
      }

      const cleanZipCode = zipCode.slice(0, 5) // Use only 5-digit ZIP

      let locationData
      
      if (googleMapsService.isConfigured()) {
        // Use Google Maps geocoding
        locationData = await googleMapsService.geocodeZipCode(cleanZipCode)
      } else {
        // Use fallback locations
        locationData = googleMapsService.getFallbackLocation(cleanZipCode)
      }
      
      const finalLocationData = {
        ...locationData,
        zipCode: cleanZipCode,
        source: 'zip_code',
        timestamp: Date.now()
      }

      setLocation(finalLocationData)
      saveLocation(finalLocationData)

      return finalLocationData
    } catch (err) {
      const errorMessage = err.message || 'Invalid ZIP code'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const setManualLocation = useCallback(async (address) => {
    setIsLoading(true)
    setError(null)

    try {
      if (!googleMapsService.isConfigured()) {
        throw new Error('Location search requires Google Maps API configuration')
      }

      const locationData = await googleMapsService.geocodeAddress(address)
      
      const finalLocationData = {
        ...locationData,
        source: 'manual',
        timestamp: Date.now()
      }

      setLocation(finalLocationData)
      saveLocation(finalLocationData)

      return finalLocationData
    } catch (err) {
      const errorMessage = err.message || 'Unable to find location'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const clearLocation = useCallback(() => {
    setLocation(null)
    setError(null)
    localStorage.removeItem('crowdpollen_location')
    stopWatching()
  }, [stopWatching])

  const refreshLocation = useCallback(async () => {
    if (!location) return

    if (location.source === 'gps') {
      return await requestGPSLocation()
    } else if (location.source === 'google_geolocation') {
      return await requestGoogleGeolocation()
    } else if (location.zipCode) {
      return await setZipCode(location.zipCode)
    } else if (location.address && location.source === 'manual') {
      return await setManualLocation(location.address)
    }
  }, [location, requestGPSLocation, requestGoogleGeolocation, setZipCode, setManualLocation])

  const requestLocationWithPreference = useCallback(async (options = {}) => {
    // Smart location request that respects user preferences
    if (useGoogleGeolocation && googleGeolocationService.isConfigured()) {
      try {
        return await requestGoogleGeolocation()
      } catch (error) {
        console.warn('Google Geolocation failed, falling back to GPS:', error)
        // Fallback to GPS if Google Geolocation fails
        return await requestGPSLocation(options)
      }
    } else {
      // Use GPS by default
      return await requestGPSLocation(options)
    }
  }, [useGoogleGeolocation, requestGoogleGeolocation, requestGPSLocation])

  const value = {
    location,
    error,
    isLoading,
    permissionStatus,
    requestGPSLocation,
    requestGoogleGeolocation,
    requestLocationWithPreference,
    watchPosition,
    stopWatching,
    setZipCode,
    setManualLocation,
    clearLocation,
    refreshLocation,
    hasLocation: !!location,
    isGPSLocation: location?.source === 'gps',
    isGoogleGeolocation: location?.source === 'google_geolocation',
    isManualLocation: location?.source === 'manual',
    isGoogleMapsConfigured: googleMapsService.isConfigured(),
    isGoogleGeolocationConfigured: googleGeolocationService.isConfigured(),
    useGoogleGeolocation,
    updateGeolocationPreference
  }

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  )
}

// Helper functions
function getLocationErrorMessage(error) {
  if (typeof error === 'string') return error
  
  if (error.code) {
    switch (error.code) {
      case 1: // PERMISSION_DENIED
        return 'Location access denied. Please enable location services.'
      case 2: // POSITION_UNAVAILABLE
        return 'Location information unavailable. Please try again.'
      case 3: // TIMEOUT
        return 'Location request timed out. Please try again.'
      default:
        return 'Unable to get location. Please try again.'
    }
  }
  
  return error.message || 'Unable to get location. Please try again.'
}
