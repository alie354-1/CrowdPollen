import { useState, useEffect } from 'react'
import { ArrowLeft, Calendar, Filter, TrendingUp, MapPin, Camera } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { crowdPollenAPI } from '../services/crowdPollenAPI'

export default function HistoryScreen({ setScreen }) {
  const { user } = useAuth()
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // 'all', 'week', 'month'
  const [selectedSubmission, setSelectedSubmission] = useState(null)

  useEffect(() => {
    loadSubmissions()
  }, [filter])

  const loadSubmissions = async () => {
    try {
      setLoading(true)
      if (user) {
        const data = await crowdPollenAPI.getUserSubmissions(user.id, filter)
        setSubmissions(data || [])
      } else {
        // Load from localStorage for anonymous users
        const stored = localStorage.getItem('user_submissions')
        const allSubmissions = stored ? JSON.parse(stored) : []
        
        // Apply filter
        const filtered = filterSubmissions(allSubmissions, filter)
        setSubmissions(filtered)
      }
    } catch (error) {
      console.error('Failed to load submissions:', error)
      setSubmissions([])
    } finally {
      setLoading(false)
    }
  }

  const filterSubmissions = (submissions, filterType) => {
    const now = new Date()
    const cutoffDate = new Date()

    switch (filterType) {
      case 'week':
        cutoffDate.setDate(now.getDate() - 7)
        break
      case 'month':
        cutoffDate.setMonth(now.getMonth() - 1)
        break
      default:
        return submissions
    }

    return submissions.filter(sub => new Date(sub.created_at) >= cutoffDate)
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

  const formatDate = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) return 'Today'
    if (diffInDays === 1) return 'Yesterday'
    if (diffInDays < 7) return `${diffInDays} days ago`
    
    return date.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })
  }

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const getStats = () => {
    if (submissions.length === 0) return null

    const totalCount = submissions.reduce((sum, sub) => sum + (sub.pollen_count || 0), 0)
    const avgCount = Math.round(totalCount / submissions.length)
    
    const levelCounts = submissions.reduce((acc, sub) => {
      acc[sub.pollen_density] = (acc[sub.pollen_density] || 0) + 1
      return acc
    }, {})

    const mostCommonLevel = Object.entries(levelCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'moderate'

    const avgConfidence = submissions.reduce((sum, sub) => sum + (sub.confidence_score || 0), 0) / submissions.length

    return {
      total: submissions.length,
      avgCount,
      mostCommonLevel,
      avgConfidence: Math.round(avgConfidence * 100)
    }
  }

  const stats = getStats()

  const SubmissionDetailModal = ({ submission, onClose }) => {
    if (!submission) return null

    const levelInfo = getPollenLevelInfo(submission.pollen_density)

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Submission Details</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            {/* Image */}
            {submission.image_url && (
              <div>
                <img 
                  src={submission.image_url} 
                  alt="Pollen trap" 
                  className="w-full h-48 object-cover rounded-lg"
                />
              </div>
            )}

            {/* Results */}
            <div className={`p-4 rounded-lg ${levelInfo.bg}`}>
              <div className="flex items-center mb-2">
                <span className="text-2xl mr-3">{levelInfo.emoji}</span>
                <div>
                  <h4 className="font-semibold capitalize">
                    {submission.pollen_density.replace('_', ' ')} Level
                  </h4>
                  <p className="text-sm text-gray-600">
                    {submission.pollen_count} grains detected
                  </p>
                </div>
              </div>
              <p className={`text-sm ${levelInfo.color}`}>
                {submission.advice || 'Pollen level recorded for your area.'}
              </p>
            </div>

            {/* Details */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Confidence:</span>
                <span className="font-medium">
                  {Math.round((submission.confidence_score || 0) * 100)}%
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Date:</span>
                <span className="font-medium">
                  {new Date(submission.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Time:</span>
                <span className="font-medium">
                  {formatTime(submission.created_at)}
                </span>
              </div>
            </div>

            {/* Location */}
            {submission.location && (
              <div className="flex items-center">
                <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                <span className="text-sm text-gray-600">
                  {submission.location.address || 
                   `${submission.location.latitude?.toFixed(4)}, ${submission.location.longitude?.toFixed(4)}`}
                </span>
              </div>
            )}

            {/* Weather */}
            {submission.weather_conditions && (
              <div className="bg-gray-50 rounded-lg p-3">
                <h5 className="font-medium text-sm mb-2">Weather Conditions</h5>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center">
                    <div className="font-medium">{submission.weather_conditions.temperature}°C</div>
                    <div className="text-gray-500">Temp</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium">{submission.weather_conditions.humidity}%</div>
                    <div className="text-gray-500">Humidity</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium">{submission.weather_conditions.wind_speed} km/h</div>
                    <div className="text-gray-500">Wind</div>
                  </div>
                </div>
              </div>
            )}

            {/* Species */}
            {submission.plant_species && submission.plant_species.length > 0 && (
              <div>
                <h5 className="font-medium text-sm mb-2">Detected Species</h5>
                <div className="flex flex-wrap gap-1">
                  {submission.plant_species.map((species, index) => (
                    <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      {species}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            className="w-full mt-6 py-3 bg-blue-600 text-white rounded-lg font-medium"
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm p-4 safe-area-top">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => setScreen('home')}
              className="mr-3 p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-semibold">My History</h1>
          </div>
          <button
            onClick={() => setScreen('camera')}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Camera className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex bg-gray-100 rounded-lg p-1 mt-4">
          {[
            { key: 'all', label: 'All Time' },
            { key: 'month', label: 'This Month' },
            { key: 'week', label: 'This Week' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                filter === key
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {!user && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
            <div className="flex items-start">
              <div className="text-blue-600 mr-3">ℹ️</div>
              <div>
                <p className="text-sm font-medium text-blue-800 mb-1">
                  Anonymous Mode
                </p>
                <p className="text-xs text-blue-700">
                  Your submissions are stored locally. Sign in to sync across devices and access full history.
                </p>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-lg font-semibold mb-2">No submissions yet</h3>
            <p className="text-gray-600 mb-6">
              Start tracking pollen levels to build your history and see trends over time.
            </p>
            <button
              onClick={() => setScreen('camera')}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium"
            >
              <Camera className="w-4 h-4 mr-2" />
              Submit First Reading
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Stats Summary */}
            {stats && (
              <div className="bg-white rounded-xl shadow-md p-4">
                <h3 className="font-semibold mb-3 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  {filter === 'all' ? 'All Time' : 
                   filter === 'month' ? 'This Month' : 'This Week'} Summary
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-semibold">{stats.total}</div>
                    <div className="text-xs text-gray-500">Submissions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-semibold">{stats.avgCount}</div>
                    <div className="text-xs text-gray-500">Avg Grains</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold capitalize">
                      {stats.mostCommonLevel.replace('_', ' ')}
                    </div>
                    <div className="text-xs text-gray-500">Most Common</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold">{stats.avgConfidence}%</div>
                    <div className="text-xs text-gray-500">Avg Confidence</div>
                  </div>
                </div>
              </div>
            )}

            {/* Submissions List */}
            <div className="space-y-3">
              {submissions.map((submission) => {
                const levelInfo = getPollenLevelInfo(submission.pollen_density)
                
                return (
                  <button
                    key={submission.id}
                    onClick={() => setSelectedSubmission(submission)}
                    className="w-full bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center flex-1">
                        <span className="text-2xl mr-3">{levelInfo.emoji}</span>
                        <div className="text-left">
                          <h4 className="font-medium capitalize">
                            {submission.pollen_density.replace('_', ' ')} Level
                          </h4>
                          <p className="text-sm text-gray-600">
                            {submission.pollen_count} grains • {Math.round((submission.confidence_score || 0) * 100)}% confidence
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(submission.created_at)} at {formatTime(submission.created_at)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        {submission.location && (
                          <div className="flex items-center text-xs text-gray-500 mb-1">
                            <MapPin className="w-3 h-3 mr-1" />
                            <span className="truncate max-w-20">
                              {submission.location.address?.split(',')[0] || 'Location'}
                            </span>
                          </div>
                        )}
                        <div className="text-xs text-gray-400">
                          Tap for details
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Trends Insight */}
            {submissions.length >= 3 && (
              <div className="bg-white rounded-xl shadow-md p-4">
                <h4 className="font-medium mb-3 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Insights
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Trend:</span>
                    <span className="font-medium text-green-600">
                      Improving ↗️
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Best day:</span>
                    <span className="font-medium">
                      {submissions
                        .filter(s => s.pollen_density === 'low' || s.pollen_density === 'very_low')
                        .slice(-1)[0]
                        ? formatDate(submissions.filter(s => s.pollen_density === 'low' || s.pollen_density === 'very_low').slice(-1)[0].created_at)
                        : 'No low days yet'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Consistency:</span>
                    <span className="font-medium">
                      {submissions.length >= 7 ? 'Great' : 'Keep tracking'}
                    </span>
                  </div>
                </div>
                {user && (
                  <button
                    onClick={() => setScreen('insights')}
                    className="w-full mt-3 py-2 text-blue-600 text-sm font-medium"
                  >
                    View detailed insights →
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Submission Detail Modal */}
      {selectedSubmission && (
        <SubmissionDetailModal
          submission={selectedSubmission}
          onClose={() => setSelectedSubmission(null)}
        />
      )}
    </div>
  )
}
