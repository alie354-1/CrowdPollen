import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  ArrowRight, 
  Home, 
  Camera, 
  Map, 
  Activity, 
  History, 
  Settings,
  MapPin,
  Bell,
  Users,
  BarChart3,
  CheckCircle,
  HelpCircle
} from 'lucide-react'

export default function WalkthroughScreen() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(0)

  const steps = [
    {
      title: "Welcome to CrowdPollen! 🌸",
      icon: Home,
      content: (
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">🌸</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Track Pollen Like a Pro</h2>
          <p className="text-gray-600 mb-6">
            CrowdPollen combines professional weather data with community reports to give you the most accurate pollen information available.
          </p>
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">What makes us different?</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Real-time community data + Google's professional forecasts</li>
              <li>• 5-day pollen forecasts with health recommendations</li>
              <li>• Photo-based pollen trap submissions</li>
              <li>• Symptom tracking and personalized insights</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      title: "Home Screen - Your Dashboard 🏠",
      icon: Home,
      content: (
        <div>
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Home className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">Your Pollen Command Center</h2>
          
          <div className="space-y-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-2">📊 5-Day Forecast Widget</h3>
              <p className="text-sm text-gray-600">
                See professional pollen forecasts powered by Google's API. Click any day to see detailed breakdowns by pollen type (tree, grass, weed).
              </p>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-2">📍 Location-Based Data</h3>
              <p className="text-sm text-gray-600">
                All forecasts are tailored to your specific location. Set it once and get hyper-local pollen information.
              </p>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-2">🎯 Quick Actions</h3>
              <p className="text-sm text-gray-600">
                Jump straight to camera for pollen trap photos, check the map, or log symptoms - all from your home screen.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Camera - Capture Pollen Evidence 📸",
      icon: Camera,
      content: (
        <div>
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Camera className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">Document Real Pollen Levels</h2>
          
          <div className="space-y-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-2">📱 Pollen Trap Photos</h3>
              <p className="text-sm text-gray-600 mb-2">
                Take photos of surfaces covered in pollen - car hoods, outdoor furniture, anything that shows pollen accumulation.
              </p>
              <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                💡 Tip: Best photos are taken in good lighting with clear pollen visibility
              </div>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-2">🏷️ Smart Categorization</h3>
              <p className="text-sm text-gray-600">
                Rate pollen levels (Low/Medium/High) and specify types (Tree/Grass/Weed) to help the community.
              </p>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-2">🌍 Automatic Location</h3>
              <p className="text-sm text-gray-600">
                Your submissions are automatically tagged with location and timestamp for accurate community mapping.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Pollen Trap Guide - DIY Collection 🪤",
      icon: HelpCircle,
      content: (
        <div>
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <HelpCircle className="w-8 h-8 text-yellow-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">Make Your Own Pollen Trap</h2>
          
          <div className="space-y-4">
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
            
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-2">🛠️ What you need:</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p>• Clear tape or petroleum jelly</p>
                <p>• Small plate or cardboard</p>
                <p>• Magnifying glass (optional)</p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-2">📋 Quick Steps:</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p>1. Apply tape sticky-side up or spread petroleum jelly</p>
                <p>2. Place in open area away from buildings</p>
                <p>3. Wait 1-3 hours (best on dry, breezy days)</p>
                <p>4. Photograph with CrowdPollen app</p>
              </div>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-800">
                <span className="font-medium">💡 Remember:</span> This guide is always available on the submit page whenever you need it!
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Map - Community Intelligence 🗺️",
      icon: Map,
      content: (
        <div>
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Map className="w-8 h-8 text-purple-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">See Pollen Everywhere</h2>
          
          <div className="space-y-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-2">🎨 Dual-Layer Visualization</h3>
              <p className="text-sm text-gray-600">
                Professional forecast heatmaps overlay with real community submissions. Toggle between layers to see both perspectives.
              </p>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-2">📍 Interactive Markers</h3>
              <p className="text-sm text-gray-600">
                Click any community submission to see photos, pollen levels, and submission details from other users.
              </p>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-2">🔍 Zoom & Explore</h3>
              <p className="text-sm text-gray-600">
                Zoom into your neighborhood or explore other regions. Perfect for planning trips or understanding regional patterns.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Symptoms - Track Your Health 🤧",
      icon: Activity,
      content: (
        <div>
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Activity className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">Monitor Your Reactions</h2>
          
          <div className="space-y-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-2">📝 Daily Symptom Logging</h3>
              <p className="text-sm text-gray-600">
                Track sneezing, congestion, itchy eyes, and more. Rate severity and add notes about triggers or medications.
              </p>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-2">📊 Pattern Recognition</h3>
              <p className="text-sm text-gray-600">
                Correlate your symptoms with pollen forecasts to identify your personal triggers and peak sensitivity times.
              </p>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-2">💊 Medication Tracking</h3>
              <p className="text-sm text-gray-600">
                Log when you take allergy medications to see effectiveness and optimize your treatment timing.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "History - Your Personal Data 📈",
      icon: History,
      content: (
        <div>
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <History className="w-8 h-8 text-orange-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">Learn From Your Data</h2>
          
          <div className="space-y-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-2">📸 Submission Gallery</h3>
              <p className="text-sm text-gray-600">
                Browse all your pollen trap photos with timestamps and locations. See how pollen levels changed over time.
              </p>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-2">📊 Symptom Trends</h3>
              <p className="text-sm text-gray-600">
                Visualize your symptom patterns over weeks and months. Identify seasonal trends and trigger patterns.
              </p>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-2">📤 Data Export</h3>
              <p className="text-sm text-gray-600">
                Export your data for sharing with healthcare providers or personal analysis. Your data, your control.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Settings - Customize Your Experience ⚙️",
      icon: Settings,
      content: (
        <div>
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Settings className="w-8 h-8 text-gray-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">Make It Yours</h2>
          
          <div className="space-y-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-2">🔔 Smart Notifications</h3>
              <p className="text-sm text-gray-600">
                Get alerts for high pollen days, symptom logging reminders, and weekly health reports.
              </p>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-2">📍 Location Management</h3>
              <p className="text-sm text-gray-600">
                Set your home location for accurate forecasts. Use GPS or enter ZIP codes for multiple locations.
              </p>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-2">🔐 Privacy Controls</h3>
              <p className="text-sm text-gray-600">
                Control data sharing, export your information, and manage account preferences. Your privacy matters.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Ready to Start! 🚀",
      icon: CheckCircle,
      content: (
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">You're All Set!</h2>
          <p className="text-gray-600 mb-6">
            You now know how to use all of CrowdPollen's features. Start by setting your location, then explore the forecast and begin contributing to the community!
          </p>
          
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">🎯 Quick Start Checklist</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-center">
                <div className="w-4 h-4 border-2 border-gray-300 rounded mr-3"></div>
                <span>Set your location in Settings</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 border-2 border-gray-300 rounded mr-3"></div>
                <span>Check today's pollen forecast</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 border-2 border-gray-300 rounded mr-3"></div>
                <span>Take your first pollen trap photo</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 border-2 border-gray-300 rounded mr-3"></div>
                <span>Log any current symptoms</span>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={() => navigate('/api-settings')}
              className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              API Settings
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex-1 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl font-medium hover:from-green-600 hover:to-blue-600 transition-colors"
            >
              Start Using CrowdPollen
            </button>
          </div>
        </div>
      )
    }
  ]

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const currentStepData = steps[currentStep]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm p-4 safe-area-top">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/api-settings')}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span className="text-sm">Back to API Settings</span>
          </button>
          <div className="text-sm text-gray-500">
            {currentStep + 1} of {steps.length}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-6 py-4">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-6 min-h-[500px]">
            {currentStepData.content}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                currentStep === 0 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-gray-700 hover:bg-white hover:shadow-md'
              }`}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </button>

            <div className="flex space-x-2">
              {steps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentStep 
                      ? 'bg-blue-500' 
                      : index < currentStep 
                        ? 'bg-green-500' 
                        : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={nextStep}
              disabled={currentStep === steps.length - 1}
              className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                currentStep === steps.length - 1 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-white bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 shadow-md'
              }`}
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
