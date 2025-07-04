import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Settings, Globe, BarChart3 } from 'lucide-react'
import { useLocation } from '../contexts/LocationContext'
import ApiTestPanel from '../components/ApiTestPanel'
import ApiMonitoringDashboard from '../components/ApiMonitoringDashboard'

export default function ApiSettingsScreen() {
  const navigate = useNavigate()
  const { useGoogleGeolocation, updateGeolocationPreference, isGoogleGeolocationConfigured } = useLocation()
  const [activeTab, setActiveTab] = useState('testing')

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm p-4 safe-area-top">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/')}
            className="mr-3 p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center">
            <Settings className="w-6 h-6 text-blue-600 mr-2" />
            <h1 className="text-xl font-semibold">API Settings</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Feature Walkthrough Banner */}
        <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-1">🌸 New to CrowdPollen?</h3>
              <p className="text-sm text-blue-700">
                Take a quick tour to learn about all features and how to use the app effectively.
              </p>
            </div>
            <button
              onClick={() => navigate('/walkthrough')}
              className="px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg font-medium hover:from-green-600 hover:to-blue-600 transition-colors shadow-md"
            >
              Take Tour
            </button>
          </div>
        </div>

        {/* Admin Controls */}
        {isGoogleGeolocationConfigured && (
          <div className="mb-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
            <h3 className="text-lg font-semibold text-orange-900 mb-3">🔧 Admin Controls</h3>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-medium text-orange-800">Google Geolocation Service</h4>
                <p className="text-sm text-orange-700">Enable location without GPS ($5 per 1,000 requests)</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={useGoogleGeolocation}
                  onChange={(e) => updateGeolocationPreference(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
              </label>
            </div>
            
            {/* Cost Protection Info */}
            <div className="bg-orange-100 rounded-lg p-3 text-sm">
              <h5 className="font-medium text-orange-900 mb-2">💰 Built-in Cost Protection</h5>
              <ul className="text-orange-800 space-y-1">
                <li>• <strong>Rate Limiting:</strong> Max 10 requests per hour</li>
                <li>• <strong>Time Throttling:</strong> 5-minute minimum between calls</li>
                <li>• <strong>Distance Filtering:</strong> Only updates if moved 100+ meters</li>
                <li>• <strong>Smart Caching:</strong> Reuses recent location data</li>
                <li>• <strong>Fallback Logic:</strong> Uses free GPS when rate limited</li>
              </ul>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('testing')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center ${
                activeTab === 'testing'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Settings className="w-4 h-4 mr-2" />
              API Testing
            </button>
            <button
              onClick={() => setActiveTab('monitoring')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center ${
                activeTab === 'monitoring'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              API Monitoring
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'testing' && (
          <div className="bg-white rounded-lg shadow-sm">
            <ApiTestPanel />
          </div>
        )}

        {activeTab === 'monitoring' && (
          <div className="bg-white rounded-lg shadow-sm">
            <ApiMonitoringDashboard />
          </div>
        )}

        {/* Access Info */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">🔗 Direct Access</h3>
          <p className="text-sm text-blue-700 mb-2">
            You can access this page directly at:
          </p>
          <code className="text-sm bg-blue-100 px-2 py-1 rounded text-blue-800">
            {window.location.origin}/api-settings
          </code>
          <p className="text-xs text-blue-600 mt-2">
            Bookmark this URL for quick access to API configuration and monitoring
          </p>
        </div>

        {/* Quick Navigation */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <button
            onClick={() => navigate('/settings')}
            className="p-4 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <div className="text-center">
              <Settings className="w-6 h-6 text-gray-600 mx-auto mb-2" />
              <div className="text-sm font-medium text-gray-900">User Settings</div>
              <div className="text-xs text-gray-500">General app settings</div>
            </div>
          </button>
          <button
            onClick={() => navigate('/')}
            className="p-4 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <div className="text-center">
              <Globe className="w-6 h-6 text-gray-600 mx-auto mb-2" />
              <div className="text-sm font-medium text-gray-900">Home</div>
              <div className="text-xs text-gray-500">Back to main app</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
