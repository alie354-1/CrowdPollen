import { useState } from 'react'
import { ArrowLeft, MapPin, Clock, TrendingUp, Award, Share2, Info, ToggleLeft, ToggleRight } from 'lucide-react'

export default function ResultsScreen({ 
  results, 
  capturedImage, 
  location, 
  onBack, 
  onRetake, 
  onViewMap, 
  onLogSymptoms,
  onNewSubmission 
}) {
  const [showShareOptions, setShowShareOptions] = useState(false)
  const [isImperial, setIsImperial] = useState(true) // Default to imperial
  const [showConfidenceTooltip, setShowConfidenceTooltip] = useState(false)

  const getPollenLevelInfo = (level, count = 0) => {
    // Handle zero pollen count specifically
    if (count === 0) {
      return {
        color: 'text-emerald-600', 
        bg: 'bg-emerald-50', 
        border: 'border-emerald-200',
        emoji: '🌱',
        label: 'No Pollen Detected',
        description: 'Perfect conditions - no pollen found in your sample!'
      };
    }
    
    const levels = {
      none: { 
        color: 'text-emerald-600', 
        bg: 'bg-emerald-50', 
        border: 'border-emerald-200',
        emoji: '🌱',
        label: 'None',
        description: 'Perfect conditions - no pollen detected!'
      },
      very_low: { 
        color: 'text-green-600', 
        bg: 'bg-green-50', 
        border: 'border-green-200',
        emoji: '🌱',
        label: 'Very Low',
        description: 'Excellent conditions for outdoor activities'
      },
      low: { 
        color: 'text-green-600', 
        bg: 'bg-green-50', 
        border: 'border-green-200',
        emoji: '🟢',
        label: 'Low',
        description: 'Good conditions for most people'
      },
      moderate: { 
        color: 'text-yellow-600', 
        bg: 'bg-yellow-50', 
        border: 'border-yellow-200',
        emoji: '🟡',
        label: 'Moderate',
        description: 'Sensitive individuals may experience symptoms'
      },
      high: { 
        color: 'text-orange-600', 
        bg: 'bg-orange-50', 
        border: 'border-orange-200',
        emoji: '🟠',
        label: 'High',
        description: 'Most allergy sufferers will experience symptoms'
      },
      very_high: { 
        color: 'text-red-600', 
        bg: 'bg-red-50', 
        border: 'border-red-200',
        emoji: '🔴',
        label: 'Very High',
        description: 'Avoid outdoor activities if possible'
      }
    }
    return levels[level] || levels.moderate
  }

  const levelInfo = getPollenLevelInfo(results.pollen_density, results.pollen_count)
  const confidenceScore = Math.round(results.confidence_score * 100)

  // Generate mock pollen type breakdown
  const pollenBreakdown = results.plant_species?.map((species, index) => ({
    name: species,
    count: Math.floor(Math.random() * (results.pollen_count / results.plant_species.length)) + 1,
    percentage: Math.floor(Math.random() * 40) + 20
  })) || []

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 safe-area-top">
        <div className="flex items-center mb-4">
          <button
            onClick={onBack}
            className="mr-3 p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-semibold">Analysis Complete</h1>
        </div>
        
        {/* Main result display */}
        <div className="text-center py-6">
          <div className="text-6xl mb-4">{levelInfo.emoji}</div>
          <h2 className="text-2xl font-bold mb-2">{levelInfo.label}</h2>
          <p className="text-blue-100 mb-4">
            {results.pollen_count === 0 
              ? "No pollen grains found in your sample" 
              : `${results.pollen_count} grains detected in your sample`
            }
          </p>
          <div className="inline-flex items-center bg-white/20 rounded-full px-4 py-2">
            <Award className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">Analysis Complete</span>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4 pb-20">
        {/* Success Banner */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-green-200 p-4">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
              <span className="text-2xl">✅</span>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-green-800 text-lg">Data Successfully Saved!</h3>
              <p className="text-green-700 text-sm">Your reading has been added to the community database</p>
            </div>
          </div>
        </div>

        {/* Image Preview */}
        {capturedImage && (
          <div className="bg-white rounded-2xl shadow-lg p-4">
            <h3 className="font-semibold mb-3 flex items-center">
              <span className="text-lg mr-2">📸</span>
              Analyzed Image
            </h3>
            <div className="relative">
              <img 
                src={capturedImage} 
                alt="Analyzed pollen trap" 
                className="w-full h-48 object-cover rounded-xl border-2 border-gray-200"
              />
              {/* Analysis overlay */}
              <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded-lg text-xs">
                AI Analyzed ✨
              </div>
            </div>
          </div>
        )}

        {/* Detection Results */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg flex items-center">
              <span className="text-xl mr-2">🔍</span>
              Detection Results
            </h3>
            <button
              onClick={() => setShowConfidenceTooltip(!showConfidenceTooltip)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Info className="w-5 h-5" />
            </button>
          </div>
          
          <div className="mb-6">
            <div 
              className={`relative min-h-[120px] p-6 rounded-xl text-center border cursor-help overflow-hidden ${
                results.pollen_count === 0 
                  ? 'bg-gradient-to-br from-gray-100 to-gray-200 border-gray-300' 
                  : 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200'
              }`}
              onMouseEnter={() => setShowConfidenceTooltip(true)}
              onMouseLeave={() => setShowConfidenceTooltip(false)}
              onClick={() => setShowConfidenceTooltip(!showConfidenceTooltip)}
            >
              {results.pollen_count === 0 && (
                <div className="absolute inset-0 pointer-events-none z-0 flex flex-col items-center justify-center animate-fade-in delay-500">
                  <div className="flex items-center justify-center gap-2 text-3xl">
                    <span className="animate-bounce">🎉</span>
                    <span className="relative text-4xl font-bold text-black">
                      <span className="absolute left-0 top-0 opacity-30">0</span>
                      <span className="absolute left-0 top-0 opacity-50">0</span>
                      <span className="relative">0</span>
                    </span>
                    <span className="animate-bounce">🎉</span>
                  </div>
                  <div className="text-sm font-medium text-black mt-2">Total Grains</div>
                </div>
              )}
              {results.pollen_count !== 0 && (
                <>
                  <div className={`relative z-10 text-3xl font-bold text-orange-600`}>
                    {results.pollen_count}
                  </div>
                  <div className="text-sm font-medium text-orange-700">
                    Total Grains
                  </div>
                </>
              )}
              {showConfidenceTooltip && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-10 w-72">
                  <div className="bg-gray-800 text-white text-sm rounded-lg px-3 py-2 shadow-lg">
                    <div className="text-center mb-2">
                      <div className="font-semibold">{confidenceScore}% Confidence</div>
                      <div className="text-xs text-gray-300 mt-1">AI model accuracy</div>
                    </div>
                    <div className="text-xs text-gray-200 space-y-1">
                      <div><strong>Model:</strong> PollenNet v1.2</div>
                      <div><strong>Training Images:</strong> 12,000+</div>
                      <div><strong>Species Known:</strong> 38</div>
                      <div><strong>Neural Layers:</strong> 18</div>
                    </div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                  </div>
                </div>
              )}
            </div>
            {/* Removed Analysis Info box */}
          </div>

          {/* Level description */}
          <div className={`p-4 rounded-xl border-2 ${levelInfo.bg} ${levelInfo.border}`}>
            <div className="flex items-center mb-2">
              <span className="text-xl mr-2">{levelInfo.emoji}</span>
              <span className={`font-semibold ${levelInfo.color}`}>{levelInfo.label} Level</span>
            </div>
            <p className={`text-sm ${levelInfo.color}`}>
              {levelInfo.description}
            </p>
          </div>
        </div>

        {/* Pollen Types Found - Only show when pollen is detected */}
        {results.pollen_count > 0 && pollenBreakdown.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="font-bold text-lg mb-4 flex items-center">
              <span className="text-xl mr-2">🌿</span>
              Pollen Types Found
            </h3>
            <div className="space-y-4">
              {pollenBreakdown.map((pollen, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                    <div>
                      <span className="font-medium">{pollen.name}</span>
                      <div className="text-xs text-gray-500">{pollen.count} grains detected</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-700">{pollen.percentage}%</div>
                    <div className="w-16 bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-1000" 
                        style={{ width: `${pollen.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}


        {/* Weather Context */}
        {results.weather_conditions && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg flex items-center">
                <Clock className="w-5 h-5 mr-2 text-blue-600" />
                Weather Conditions
              </h3>
              <button
                onClick={() => setIsImperial(!isImperial)}
                className="flex items-center space-x-2 text-sm text-blue-600 hover:underline"
              >
                {isImperial ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                <span>{isImperial ? "Imperial" : "Metric"}</span>
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-xl">
                <div className="text-2xl font-bold text-blue-600">
                  {isImperial 
                    ? `${Math.round((results.weather_conditions.temperature * 9) / 5 + 32)}°F`
                    : `${results.weather_conditions.temperature}°C`}
                </div>
                <div className="text-xs text-blue-700 font-medium">Temperature</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-xl">
                <div className="text-2xl font-bold text-blue-600">
                  {results.weather_conditions.humidity}%
                </div>
                <div className="text-xs text-blue-700 font-medium">Humidity</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-xl">
                <div className="text-2xl font-bold text-blue-600">
                  {isImperial 
                    ? `${Math.round(results.weather_conditions.wind_speed * 0.621371)} mph`
                    : `${results.weather_conditions.wind_speed} km/h`}
                </div>
                <div className="text-xs text-blue-700 font-medium">Wind {isImperial ? "mph" : "km/h"}</div>
              </div>
            </div>
          </div>
        )}

        {/* Location Info */}
        {location && (
          <div className="bg-white rounded-2xl shadow-lg p-4">
            <div className="flex items-center">
              <MapPin className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <div className="font-medium text-gray-800">Reading Location</div>
                <div className="text-sm text-gray-600">
                  {location.address || `${location.latitude?.toFixed(4)}, ${location.longitude?.toFixed(4)}`}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Community Impact */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl shadow-lg p-6 border border-green-200">
          <h3 className="font-bold text-lg mb-3 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
            Community Impact
          </h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">+1</div>
              <div className="text-xs text-green-700">Your Contribution</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">2,847</div>
              <div className="text-xs text-green-700">Total This Week</div>
            </div>
          </div>
          <p className="text-sm text-green-800 bg-white/70 rounded-lg p-3">
            🌍 Your data helps improve pollen forecasts for everyone in your community!
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={onLogSymptoms}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-semibold text-lg shadow-lg flex items-center justify-center space-x-2"
          >
            <span>📝</span>
            <span>Log How You Feel</span>
          </button>
          
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onViewMap}
              className="py-3 bg-white border-2 border-blue-200 text-blue-700 rounded-xl font-medium shadow-sm hover:bg-blue-50 transition-colors"
            >
              🗺️ View on Map
            </button>
            <button
              onClick={() => setShowShareOptions(true)}
              className="py-3 bg-white border-2 border-green-200 text-green-700 rounded-xl font-medium shadow-sm hover:bg-green-50 transition-colors flex items-center justify-center space-x-1"
            >
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onRetake}
              className="py-3 bg-gray-100 text-gray-700 rounded-xl font-medium"
            >
              📷 Retake Photo
            </button>
            <button
              onClick={onNewSubmission}
              className="py-3 bg-gray-100 text-gray-700 rounded-xl font-medium"
            >
              ➕ New Reading
            </button>
          </div>
        </div>

        {/* Share Options Modal */}
        {showShareOptions && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
              <h3 className="text-lg font-bold mb-4 text-center">Share Your Results</h3>
              <div className="space-y-3">
                <button className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium">
                  📱 Share to Social Media
                </button>
                <button className="w-full py-3 bg-green-600 text-white rounded-xl font-medium">
                  💬 Send to Friends
                </button>
                <button className="w-full py-3 bg-purple-600 text-white rounded-xl font-medium">
                  📧 Email Results
                </button>
                <button
                  onClick={() => setShowShareOptions(false)}
                  className="w-full py-2 text-gray-600 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
