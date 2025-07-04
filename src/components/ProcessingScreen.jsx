import { useState, useEffect } from 'react'

export default function ProcessingScreen({ capturedImage }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)

  const steps = [
    { 
      text: 'Uploading image...', 
      duration: 1200,
      progress: 25,
      icon: '📤'
    },
    { 
      text: 'Analyzing pollen grains...', 
      duration: 2000,
      progress: 50,
      icon: '🔍'
    },
    { 
      text: 'Identifying species...', 
      duration: 1800,
      progress: 75,
      icon: '🧬'
    },
    { 
      text: 'Saving to database...', 
      duration: 1000,
      progress: 100,
      icon: '💾'
    }
  ]

  useEffect(() => {
    let timeoutId

    const advanceStep = () => {
      if (currentStep < steps.length - 1) {
        setCurrentStep(prev => prev + 1)
        setProgress(steps[currentStep + 1].progress)
        
        timeoutId = setTimeout(advanceStep, steps[currentStep + 1].duration)
      }
    }

    // Start the first step
    setProgress(steps[0].progress)
    timeoutId = setTimeout(advanceStep, steps[0].duration)

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [currentStep, steps])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="text-center max-w-sm w-full">
        
        {/* Captured Image Preview */}
        {capturedImage && (
          <div className="mb-8">
            <div className="relative">
              <img 
                src={capturedImage} 
                alt="Captured pollen trap" 
                className="w-48 h-48 object-cover rounded-2xl mx-auto shadow-2xl border-4 border-white"
              />
              {/* Scanning overlay effect */}
              <div className="absolute inset-0 rounded-2xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-200/30 to-transparent animate-pulse"></div>
                <div 
                  className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent animate-bounce"
                  style={{ 
                    top: `${20 + (progress * 0.6)}%`,
                    animationDuration: '2s'
                  }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {/* Main Animation - Exact HTML Mock Style */}
        <div className="mb-8">
          <div 
            className="text-8xl mb-6 animate-spin inline-block"
            style={{ animationDuration: '2s', animationTimingFunction: 'linear' }}
          >
            🌿
          </div>
        </div>

        {/* Status Text */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            Analyzing Sample
          </h2>
          <div className="flex items-center justify-center mb-4">
            <span className="text-2xl mr-3 animate-bounce" style={{ animationDelay: '0.1s' }}>
              {steps[currentStep].icon}
            </span>
            <p className="text-lg text-gray-700 font-medium">
              {steps[currentStep].text}
            </p>
          </div>
          <p className="text-gray-600 text-sm">
            Our AI is counting pollen grains and identifying species...
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
              style={{ width: `${progress}%` }}
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
            </div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>0%</span>
            <span className="font-medium">{progress}%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Step Indicators */}
        <div className="flex justify-center space-x-3 mb-8">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`w-3 h-3 rounded-full transition-all duration-500 ${
                index <= currentStep 
                  ? 'bg-blue-500 scale-110' 
                  : 'bg-gray-300'
              }`}
            />
          ))}
        </div>

        {/* AI Model Info */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/50">
          <div className="flex items-center justify-center mb-2">
            <div className="text-lg mr-2">🤖</div>
            <h3 className="font-semibold text-gray-800">AI Model v2.1</h3>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            Using advanced computer vision to detect and classify pollen grains with 
            <span className="font-semibold text-blue-600"> 94% accuracy</span>
          </p>
          
          {/* Fake processing details */}
          <div className="mt-3 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Neural network layers:</span>
              <span className="font-mono text-gray-700">127</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Training samples:</span>
              <span className="font-mono text-gray-700">2.3M</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Species database:</span>
              <span className="font-mono text-gray-700">450+</span>
            </div>
          </div>
        </div>

        {/* Fun Facts Carousel */}
        <div className="mt-6 bg-gradient-to-r from-green-50 to-yellow-50 rounded-xl p-3 border border-green-200">
          <div className="text-xs text-green-800">
            <span className="font-semibold">💡 Did you know?</span>
            <div className="mt-1">
              {currentStep === 0 && "A single oak tree can produce up to 10 million pollen grains per day!"}
              {currentStep === 1 && "Pollen grains are so small that 1,000 could fit on a pinhead."}
              {currentStep === 2 && "Each plant species has uniquely shaped pollen - like fingerprints!"}
              {currentStep === 3 && "Your data helps scientists track climate change effects on plants."}
            </div>
          </div>
        </div>

        {/* Estimated time */}
        <div className="mt-4">
          <p className="text-xs text-gray-500">
            ⏱️ This usually takes 15-30 seconds
          </p>
        </div>
      </div>
    </div>
  )
}
