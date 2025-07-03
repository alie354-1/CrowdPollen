import { useState } from 'react'
import { ChevronRight, Camera, MapPin, BarChart3 } from 'lucide-react'

export default function OnboardingScreen({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0)

  const steps = [
    {
      title: "Welcome to CrowdPollen",
      subtitle: "Help track pollen levels in your community",
      icon: "🌻",
      content: "Join thousands of citizen scientists collecting real-time pollen data to help everyone manage their allergies better."
    },
    {
      title: "Take Photos",
      subtitle: "Capture pollen trap images",
      icon: Camera,
      content: "Use your phone's camera to photograph pollen traps. Our AI will analyze the images to count pollen grains."
    },
    {
      title: "Share Location",
      subtitle: "Help map pollen levels",
      icon: MapPin,
      content: "Share your location to contribute to neighborhood pollen maps. You can use GPS or enter your ZIP code."
    },
    {
      title: "Track Symptoms",
      subtitle: "Monitor your health",
      icon: BarChart3,
      content: "Log your allergy symptoms to see how they correlate with local pollen levels and get personalized insights."
    }
  ]

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onComplete()
    }
  }

  const handleSkip = () => {
    onComplete()
  }

  const step = steps[currentStep]
  const IconComponent = step.icon

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-600 flex flex-col">
      {/* Skip Button */}
      <div className="flex justify-end p-4 safe-area-top">
        <button
          onClick={handleSkip}
          className="text-white/80 hover:text-white text-sm font-medium"
        >
          Skip
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center text-white">
        {/* Icon */}
        <div className="mb-8">
          {typeof IconComponent === 'string' ? (
            <div className="text-6xl">{IconComponent}</div>
          ) : (
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
              <IconComponent className="w-10 h-10" />
            </div>
          )}
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold mb-4">{step.title}</h1>
        
        {/* Subtitle */}
        <h2 className="text-xl font-medium mb-6 opacity-90">{step.subtitle}</h2>
        
        {/* Content */}
        <p className="text-lg opacity-80 leading-relaxed max-w-sm">
          {step.content}
        </p>
      </div>

      {/* Bottom Section */}
      <div className="p-6 safe-area-bottom">
        {/* Progress Dots */}
        <div className="flex justify-center mb-8">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full mx-1 transition-colors ${
                index === currentStep ? 'bg-white' : 'bg-white/30'
              }`}
            />
          ))}
        </div>

        {/* Next Button */}
        <button
          onClick={handleNext}
          className="w-full bg-white text-blue-600 py-4 rounded-xl font-semibold text-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
        >
          {currentStep < steps.length - 1 ? 'Next' : 'Get Started'}
          <ChevronRight className="w-5 h-5 ml-2" />
        </button>
      </div>
    </div>
  )
}
