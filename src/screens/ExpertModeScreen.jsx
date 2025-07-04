import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Eye, Check, X, AlertTriangle, BarChart3 } from 'lucide-react'

export default function ExpertModeScreen() {
  const navigate = useNavigate()
  const [currentImage, setCurrentImage] = useState(0)
  const [showStats, setShowStats] = useState(false)

  // Mock data for expert review
  const reviewQueue = [
    {
      id: 1,
      image: '/api/placeholder/300/200',
      aiPrediction: {
        pollenLevel: 'high',
        confidence: 0.87,
        species: ['Oak', 'Birch'],
        count: 45
      },
      metadata: {
        location: 'Central Park, NYC',
        timestamp: '2024-01-15 14:30',
        weather: 'Sunny, 22°C',
        submittedBy: 'user_123'
      },
      needsReview: true
    },
    {
      id: 2,
      image: '/api/placeholder/300/200',
      aiPrediction: {
        pollenLevel: 'moderate',
        confidence: 0.65,
        species: ['Grass'],
        count: 23
      },
      metadata: {
        location: 'Brooklyn Bridge Park',
        timestamp: '2024-01-15 16:45',
        weather: 'Partly cloudy, 20°C',
        submittedBy: 'user_456'
      },
      needsReview: true
    }
  ]

  const [expertClassifications, setExpertClassifications] = useState({})

  const handleClassification = (imageId, classification) => {
    setExpertClassifications(prev => ({
      ...prev,
      [imageId]: classification
    }))
  }

  const currentImageData = reviewQueue[currentImage]
  const expertClassification = expertClassifications[currentImageData?.id]

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm p-4 safe-area-top">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/settings')}
              className="mr-3 p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-semibold">Expert Mode</h1>
              <p className="text-sm text-gray-600">Review AI Classifications</p>
            </div>
          </div>
          <button
            onClick={() => setShowStats(!showStats)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <BarChart3 className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Coming Soon Banner */}
      <div className="p-4">
        <div className="bg-gradient-to-r from-purple-100 to-blue-100 border border-purple-200 rounded-xl p-6 text-center">
          <div className="w-16 h-16 bg-purple-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Eye className="w-8 h-8 text-purple-600" />
          </div>
          <h2 className="text-xl font-semibold text-purple-900 mb-2">Expert Mode Coming Soon</h2>
          <p className="text-purple-800 mb-4">
            This feature will allow experts to review and reclassify AI predictions to improve model accuracy.
          </p>
          <div className="bg-white rounded-lg p-4 text-left">
            <h3 className="font-semibold text-gray-900 mb-3">Planned Features:</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-center">
                <Check className="w-4 h-4 text-green-500 mr-2" />
                <span>Review AI pollen classifications</span>
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 text-green-500 mr-2" />
                <span>Correct species identification</span>
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 text-green-500 mr-2" />
                <span>Adjust pollen count estimates</span>
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 text-green-500 mr-2" />
                <span>Flag low-quality images</span>
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 text-green-500 mr-2" />
                <span>Contribute to model retraining</span>
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 text-green-500 mr-2" />
                <span>Track expert consensus</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mock Interface Preview */}
      <div className="p-4">
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="bg-gray-100 p-3 border-b">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Preview Interface</span>
              <span className="text-xs text-gray-500">Demo Only</span>
            </div>
          </div>

          {currentImageData && (
            <div className="p-4">
              {/* Image */}
              <div className="bg-gray-200 rounded-lg h-48 mb-4 flex items-center justify-center">
                <span className="text-gray-500">Pollen Trap Image #{currentImageData.id}</span>
              </div>

              {/* AI Prediction */}
              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-blue-900 mb-2">AI Prediction</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700">Level:</span>
                    <span className="ml-2 font-medium capitalize">{currentImageData.aiPrediction.pollenLevel}</span>
                  </div>
                  <div>
                    <span className="text-blue-700">Confidence:</span>
                    <span className="ml-2 font-medium">{Math.round(currentImageData.aiPrediction.confidence * 100)}%</span>
                  </div>
                  <div>
                    <span className="text-blue-700">Count:</span>
                    <span className="ml-2 font-medium">{currentImageData.aiPrediction.count} grains</span>
                  </div>
                  <div>
                    <span className="text-blue-700">Species:</span>
                    <span className="ml-2 font-medium">{currentImageData.aiPrediction.species.join(', ')}</span>
                  </div>
                </div>
              </div>

              {/* Expert Classification */}
              <div className="bg-green-50 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-green-900 mb-3">Expert Classification</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-green-800 mb-1">Pollen Level</label>
                    <select 
                      className="w-full p-2 border border-green-200 rounded-lg text-sm"
                      value={expertClassification?.level || ''}
                      onChange={(e) => handleClassification(currentImageData.id, {
                        ...expertClassification,
                        level: e.target.value
                      })}
                    >
                      <option value="">Select level...</option>
                      <option value="very_low">Very Low</option>
                      <option value="low">Low</option>
                      <option value="moderate">Moderate</option>
                      <option value="high">High</option>
                      <option value="very_high">Very High</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-green-800 mb-1">Pollen Count</label>
                    <input 
                      type="number" 
                      className="w-full p-2 border border-green-200 rounded-lg text-sm"
                      placeholder="Enter count..."
                      value={expertClassification?.count || ''}
                      onChange={(e) => handleClassification(currentImageData.id, {
                        ...expertClassification,
                        count: e.target.value
                      })}
                    />
                  </div>
                </div>
              </div>

              {/* Metadata */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-gray-900 mb-2">Submission Details</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><span className="font-medium">Location:</span> {currentImageData.metadata.location}</p>
                  <p><span className="font-medium">Time:</span> {currentImageData.metadata.timestamp}</p>
                  <p><span className="font-medium">Weather:</span> {currentImageData.metadata.weather}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button className="flex-1 py-2 bg-green-600 text-white rounded-lg font-medium text-sm">
                  Approve AI Classification
                </button>
                <button className="flex-1 py-2 bg-orange-600 text-white rounded-lg font-medium text-sm">
                  Submit Correction
                </button>
                <button className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium text-sm">
                  Flag Image
                </button>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                <button 
                  onClick={() => setCurrentImage(Math.max(0, currentImage - 1))}
                  disabled={currentImage === 0}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  {currentImage + 1} of {reviewQueue.length}
                </span>
                <button 
                  onClick={() => setCurrentImage(Math.min(reviewQueue.length - 1, currentImage + 1))}
                  disabled={currentImage === reviewQueue.length - 1}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Modal */}
      {showStats && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Expert Review Stats</h3>
              <button
                onClick={() => setShowStats(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Your Contributions</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">0</div>
                    <div className="text-blue-700">Images Reviewed</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">0</div>
                    <div className="text-blue-700">Corrections Made</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="font-semibold text-green-900 mb-2">Model Impact</h4>
                <div className="text-sm text-green-700">
                  <p>Your expert classifications will help improve AI accuracy for the entire community.</p>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => setShowStats(false)}
              className="w-full mt-4 py-2 bg-blue-600 text-white rounded-lg font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
