import { useState, useEffect } from 'react'
import { ArrowLeft, Plus, Calendar, TrendingUp, Save } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { crowdPollenAPI } from '../services/crowdPollenAPI'

export default function SymptomLogScreen({ setScreen }) {
  const { user } = useAuth()
  const [symptoms, setSymptoms] = useState([])
  const [showAddSymptom, setShowAddSymptom] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSymptoms()
  }, [selectedDate])

  const loadSymptoms = async () => {
    try {
      setLoading(true)
      if (user) {
        const data = await crowdPollenAPI.getUserSymptoms(user.id, selectedDate)
        setSymptoms(data || [])
      } else {
        // Load from localStorage for anonymous users
        const stored = localStorage.getItem(`symptoms_${selectedDate}`)
        setSymptoms(stored ? JSON.parse(stored) : [])
      }
    } catch (error) {
      console.error('Failed to load symptoms:', error)
      setSymptoms([])
    } finally {
      setLoading(false)
    }
  }

  const saveSymptom = async (symptomData) => {
    try {
      const newSymptom = {
        id: Date.now().toString(),
        date: selectedDate,
        timestamp: new Date().toISOString(),
        user_id: user?.id || null,
        ...symptomData
      }

      if (user) {
        await crowdPollenAPI.saveSymptom(newSymptom)
      } else {
        // Save to localStorage for anonymous users
        const updated = [...symptoms, newSymptom]
        setSymptoms(updated)
        localStorage.setItem(`symptoms_${selectedDate}`, JSON.stringify(updated))
      }

      setShowAddSymptom(false)
      loadSymptoms()
    } catch (error) {
      console.error('Failed to save symptom:', error)
    }
  }

  const deleteSymptom = async (symptomId) => {
    try {
      if (user) {
        await crowdPollenAPI.deleteSymptom(symptomId)
      } else {
        const updated = symptoms.filter(s => s.id !== symptomId)
        setSymptoms(updated)
        localStorage.setItem(`symptoms_${selectedDate}`, JSON.stringify(updated))
      }
      loadSymptoms()
    } catch (error) {
      console.error('Failed to delete symptom:', error)
    }
  }

  const getSeverityColor = (severity) => {
    const colors = {
      mild: 'text-green-600 bg-green-50',
      moderate: 'text-yellow-600 bg-yellow-50',
      severe: 'text-red-600 bg-red-50'
    }
    return colors[severity] || colors.mild
  }

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'mild': return '😌'
      case 'moderate': return '😐'
      case 'severe': return '😣'
      default: return '😌'
    }
  }

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const AddSymptomModal = ({ onClose, onSave }) => {
    const [formData, setFormData] = useState({
      type: '',
      severity: 'mild',
      notes: '',
      triggers: []
    })

    const symptomTypes = [
      'Sneezing',
      'Runny nose',
      'Stuffy nose',
      'Itchy eyes',
      'Watery eyes',
      'Scratchy throat',
      'Coughing',
      'Headache',
      'Fatigue',
      'Other'
    ]

    const commonTriggers = [
      'Outdoor exposure',
      'Open windows',
      'Exercise outside',
      'Gardening',
      'Windy weather',
      'High pollen count'
    ]

    const handleSubmit = (e) => {
      e.preventDefault()
      if (formData.type) {
        onSave(formData)
      }
    }

    const toggleTrigger = (trigger) => {
      setFormData(prev => ({
        ...prev,
        triggers: prev.triggers.includes(trigger)
          ? prev.triggers.filter(t => t !== trigger)
          : [...prev.triggers, trigger]
      }))
    }

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Log Symptom</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Symptom Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select a symptom</option>
                {symptomTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Severity
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['mild', 'moderate', 'severe'].map(severity => (
                  <button
                    key={severity}
                    type="button"
                    onClick={() => setFormData({ ...formData, severity })}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      formData.severity === severity
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-1">{getSeverityIcon(severity)}</div>
                      <div className="text-sm font-medium capitalize">{severity}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Possible Triggers
              </label>
              <div className="space-y-2">
                {commonTriggers.map(trigger => (
                  <label key={trigger} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.triggers.includes(trigger)}
                      onChange={() => toggleTrigger(trigger)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">{trigger}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any additional details..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium"
              >
                Save Symptom
              </button>
            </div>
          </form>
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
            <h1 className="text-xl font-semibold">Symptom Log</h1>
          </div>
          <button
            onClick={() => setShowAddSymptom(true)}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Date Selector */}
        <div className="mt-4">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
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
                  Your symptoms are stored locally. Sign in to sync across devices and get personalized insights.
                </p>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : symptoms.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-lg font-semibold mb-2">No symptoms logged</h3>
            <p className="text-gray-600 mb-6">
              Track your allergy symptoms to identify patterns and triggers.
            </p>
            <button
              onClick={() => setShowAddSymptom(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium"
            >
              <Plus className="w-4 h-4 mr-2" />
              Log First Symptom
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Daily Summary */}
            <div className="bg-white rounded-xl shadow-md p-4">
              <h3 className="font-semibold mb-3 flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                {new Date(selectedDate).toLocaleDateString([], { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-semibold">{symptoms.length}</div>
                  <div className="text-xs text-gray-500">Symptoms</div>
                </div>
                <div>
                  <div className="text-lg font-semibold">
                    {symptoms.filter(s => s.severity === 'severe').length}
                  </div>
                  <div className="text-xs text-gray-500">Severe</div>
                </div>
                <div>
                  <div className="text-lg font-semibold">
                    {[...new Set(symptoms.map(s => s.type))].length}
                  </div>
                  <div className="text-xs text-gray-500">Types</div>
                </div>
              </div>
            </div>

            {/* Symptoms List */}
            <div className="space-y-3">
              {symptoms.map((symptom) => (
                <div key={symptom.id} className="bg-white rounded-xl shadow-md p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <span className="text-lg mr-2">
                          {getSeverityIcon(symptom.severity)}
                        </span>
                        <h4 className="font-medium">{symptom.type}</h4>
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(symptom.severity)}`}>
                          {symptom.severity}
                        </span>
                      </div>
                      
                      {symptom.triggers && symptom.triggers.length > 0 && (
                        <div className="mb-2">
                          <p className="text-xs text-gray-500 mb-1">Triggers:</p>
                          <div className="flex flex-wrap gap-1">
                            {symptom.triggers.map((trigger, index) => (
                              <span key={index} className="px-2 py-1 bg-gray-100 text-xs rounded">
                                {trigger}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {symptom.notes && (
                        <p className="text-sm text-gray-600 mb-2">{symptom.notes}</p>
                      )}
                      
                      <p className="text-xs text-gray-500">
                        {formatTime(symptom.timestamp)}
                      </p>
                    </div>
                    
                    <button
                      onClick={() => deleteSymptom(symptom.id)}
                      className="ml-3 p-1 text-gray-400 hover:text-red-500"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Add Buttons */}
            <div className="bg-white rounded-xl shadow-md p-4">
              <h4 className="font-medium mb-3">Quick Add</h4>
              <div className="grid grid-cols-2 gap-2">
                {['Sneezing', 'Runny nose', 'Itchy eyes', 'Coughing'].map(type => (
                  <button
                    key={type}
                    onClick={() => saveSymptom({ type, severity: 'mild', triggers: [], notes: '' })}
                    className="p-3 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Weekly Trends (if user has data) */}
            {user && symptoms.length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-4">
                <h4 className="font-medium mb-3 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  This Week's Patterns
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Most common symptom:</span>
                    <span className="font-medium">Sneezing</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Peak time:</span>
                    <span className="font-medium">Morning (8-10 AM)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Common trigger:</span>
                    <span className="font-medium">Outdoor exposure</span>
                  </div>
                </div>
                <button
                  onClick={() => setScreen('insights')}
                  className="w-full mt-3 py-2 text-blue-600 text-sm font-medium"
                >
                  View detailed insights →
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Symptom Modal */}
      {showAddSymptom && (
        <AddSymptomModal
          onClose={() => setShowAddSymptom(false)}
          onSave={saveSymptom}
        />
      )}
    </div>
  )
}
