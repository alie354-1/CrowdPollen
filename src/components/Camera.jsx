import { useState, useRef, useCallback, useEffect } from 'react'
import { X, RotateCcw, Zap, ZapOff } from 'lucide-react'

export default function Camera({ onCapture, onClose }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [hasPermission, setHasPermission] = useState(null)
  const [facingMode, setFacingMode] = useState('environment')
  const [flashEnabled, setFlashEnabled] = useState(false)
  const [isCapturing, setIsCapturing] = useState(false)

  const startCamera = useCallback(async () => {
    try {
      // Stop existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }

      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1920, max: 1920 },
          height: { ideal: 1080, max: 1080 }
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setIsStreaming(true)
        setHasPermission(true)
      }
    } catch (error) {
      console.error('Camera access denied:', error)
      setHasPermission(false)
    }
  }, [facingMode])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
      setIsStreaming(false)
    }
  }, [])

  const toggleCamera = useCallback(() => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment')
  }, [])

  const toggleFlash = useCallback(async () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0]
      if (videoTrack && videoTrack.getCapabilities) {
        const capabilities = videoTrack.getCapabilities()
        if (capabilities.torch) {
          try {
            await videoTrack.applyConstraints({
              advanced: [{ torch: !flashEnabled }]
            })
            setFlashEnabled(!flashEnabled)
          } catch (error) {
            console.warn('Flash not supported:', error)
          }
        }
      }
    }
  }, [flashEnabled])

  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || isCapturing) return

    setIsCapturing(true)

    try {
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')

      // Set canvas size to match video
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      // Draw video frame to canvas
      context.drawImage(video, 0, 0)

      // Convert to blob with high quality
      const blob = await new Promise(resolve => {
        canvas.toBlob(resolve, 'image/jpeg', 0.9)
      })

      if (blob) {
        // Add capture flash effect
        const flashDiv = document.createElement('div')
        flashDiv.className = 'fixed inset-0 bg-white z-50 pointer-events-none'
        flashDiv.style.animation = 'flash 0.2s ease-out'
        document.body.appendChild(flashDiv)
        
        setTimeout(() => {
          document.body.removeChild(flashDiv)
        }, 200)

        onCapture(blob)
        stopCamera()
      }
    } catch (error) {
      console.error('Capture error:', error)
    } finally {
      setIsCapturing(false)
    }
  }, [onCapture, stopCamera, isCapturing])

  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [startCamera, stopCamera])

  // Add flash animation styles
  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      @keyframes flash {
        0% { opacity: 0; }
        50% { opacity: 0.8; }
        100% { opacity: 0; }
      }
    `
    document.head.appendChild(style)
    return () => document.head.removeChild(style)
  }, [])

  if (hasPermission === false) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center p-6 z-50">
        <div className="bg-white rounded-xl p-6 max-w-sm">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <X className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Camera Access Required</h3>
            <p className="text-gray-600 mb-4">
              Please allow camera access to take photos of your pollen trap.
            </p>
            <div className="space-y-3">
              <button
                onClick={startCamera}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium"
              >
                Try Again
              </button>
              <button
                onClick={onClose}
                className="w-full bg-gray-200 text-gray-800 py-3 rounded-lg font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 flex justify-between items-center safe-area-top">
        <button
          onClick={onClose}
          className="bg-black/50 text-white p-3 rounded-full backdrop-blur-sm"
        >
          <X className="w-6 h-6" />
        </button>
        
        <div className="bg-black/70 text-white px-4 py-2 rounded-full text-sm backdrop-blur-sm">
          Center trap in frame
        </div>

        <div className="flex space-x-2">
          {/* Flash toggle */}
          <button
            onClick={toggleFlash}
            className="bg-black/50 text-white p-3 rounded-full backdrop-blur-sm"
          >
            {flashEnabled ? (
              <Zap className="w-6 h-6" />
            ) : (
              <ZapOff className="w-6 h-6" />
            )}
          </button>

          {/* Camera flip */}
          <button
            onClick={toggleCamera}
            className="bg-black/50 text-white p-3 rounded-full backdrop-blur-sm"
          >
            <RotateCcw className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Camera View */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />

      {/* Frame Guide Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-64 h-64">
            {/* Corner guides */}
            <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-white rounded-tl-lg opacity-80" />
            <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-white rounded-tr-lg opacity-80" />
            <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-white rounded-bl-lg opacity-80" />
            <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-white rounded-br-lg opacity-80" />
            
            {/* Center crosshair */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="w-8 h-0.5 bg-white opacity-60"></div>
              <div className="w-0.5 h-8 bg-white opacity-60 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 pointer-events-none">
        <div className="bg-white/90 p-4 rounded-lg backdrop-blur-sm max-w-xs">
          <div className="text-center">
            <div className="relative w-32 h-20 bg-yellow-50 rounded mb-2 mx-auto">
              {/* Animated pollen grains */}
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 bg-yellow-600 rounded-full animate-pulse"
                  style={{
                    animationDelay: `${i * 0.5}s`,
                    top: `${20 + Math.random() * 40}%`,
                    left: `${10 + Math.random() * 80}%`
                  }}
                />
              ))}
            </div>
            <p className="text-xs text-gray-700 font-medium">
              Pollen grains will look like yellow dots
            </p>
          </div>
        </div>
      </div>

      {/* Capture Button */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 safe-area-bottom">
        <button
          onClick={capturePhoto}
          disabled={!isStreaming || isCapturing}
          className="relative w-20 h-20 bg-white rounded-full shadow-lg disabled:opacity-50 transition-all duration-200 active:scale-95"
        >
          <div className={`absolute inset-2 bg-white rounded-full border-4 transition-colors ${
            isCapturing ? 'border-blue-500' : 'border-gray-300'
          }`} />
          {isCapturing && (
            <div className="absolute inset-0 rounded-full border-4 border-blue-500 animate-ping" />
          )}
        </button>
      </div>

      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
