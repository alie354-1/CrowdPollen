import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  User, 
  Bell, 
  MapPin, 
  Shield, 
  HelpCircle, 
  LogOut,
  ChevronRight,
  Moon,
  Sun,
  Globe,
  Download,
  Trash2,
  Settings
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useLocation } from '../contexts/LocationContext'
import { useNotification } from '../contexts/NotificationContext'
import LocationInput from '../components/LocationInput'

export default function SettingsScreen() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { location, clearLocation, useGoogleGeolocation, updateGeolocationPreference, isGoogleGeolocationConfigured } = useLocation()
  const { preferences, updatePreferences } = useNotification()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showLocationInput, setShowLocationInput] = useState(false)
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    // Check for dark mode preference
    const isDark = localStorage.getItem('darkMode') === 'true'
    setDarkMode(isDark)
  }, [])

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode
    setDarkMode(newDarkMode)
    localStorage.setItem('darkMode', newDarkMode.toString())
    
    // Apply dark mode class to document
    if (newDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const exportData = () => {
    try {
      const data = {
        submissions: JSON.parse(localStorage.getItem('user_submissions') || '[]'),
        symptoms: Object.keys(localStorage)
          .filter(key => key.startsWith('symptoms_'))
          .reduce((acc, key) => {
            acc[key] = JSON.parse(localStorage.getItem(key) || '[]')
            return acc
          }, {}),
        preferences: preferences,
        location: location,
        exportDate: new Date().toISOString()
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `crowdpollen-data-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
      alert('Failed to export data')
    }
  }

  const clearAllData = () => {
    try {
      // Clear all CrowdPollen data from localStorage
      const keysToRemove = Object.keys(localStorage).filter(key => 
        key.startsWith('symptoms_') || 
        key === 'user_submissions' ||
        key === 'notification_preferences' ||
        key === 'user_location'
      )
      
      keysToRemove.forEach(key => localStorage.removeItem(key))
      
      // Clear location
      clearLocation()
      
      setShowDeleteConfirm(false)
      alert('All data cleared successfully')
    } catch (error) {
      console.error('Clear data failed:', error)
      alert('Failed to clear data')
    }
  }

  const SettingItem = ({ icon: Icon, title, subtitle, action, danger = false, showChevron = true }) => (
    <button
      onClick={action}
      className={`w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors ${
        danger ? 'text-red-600' : 'text-gray-900'
      }`}
    >
      <div className="flex items-center">
        <Icon className={`w-5 h-5 mr-3 ${danger ? 'text-red-500' : 'text-gray-500'}`} />
        <div className="text-left">
          <h3 className={`font-medium ${danger ? 'text-red-600' : 'text-gray-900'}`}>
            {title}
          </h3>
          {subtitle && (
            <p className="text-sm text-gray-500">{subtitle}</p>
          )}
        </div>
      </div>
      {showChevron && <ChevronRight className="w-4 h-4 text-gray-400" />}
    </button>
  )

  const ToggleItem = ({ icon: Icon, title, subtitle, value, onChange }) => (
    <div className="flex items-center justify-between p-4">
      <div className="flex items-center">
        <Icon className="w-5 h-5 mr-3 text-gray-500" />
        <div>
          <h3 className="font-medium text-gray-900">{title}</h3>
          {subtitle && (
            <p className="text-sm text-gray-500">{subtitle}</p>
          )}
        </div>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={value}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
      </label>
    </div>
  )

  const SettingGroup = ({ title, children }) => (
    <div className="mb-8">
      <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3 px-4">
        {title}
      </h2>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {children}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <div className="px-6 pt-12 pb-6">
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate('/')}
            className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        </div>
      </div>

      {/* Content */}
      <div className="px-6">
        {/* User Profile Section */}
        <SettingGroup title="Account">
          {user ? (
            <div className="p-4">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="font-medium text-gray-900">{user.email}</h3>
                  <p className="text-sm text-gray-500">
                    {user.user_metadata?.account_type || 'Individual'} account
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Sign In</h3>
                  <p className="text-sm text-gray-500">
                    Coming soon - Sync data across devices
                  </p>
                </div>
                <button
                  disabled
                  className="px-4 py-2 bg-gray-300 text-gray-500 rounded-lg text-sm font-medium cursor-not-allowed"
                >
                  Coming Soon
                </button>
              </div>
            </div>
          )}
        </SettingGroup>

        {/* Teacher & Expert Modes */}
        <SettingGroup title="Special Modes">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Teacher Mode</h3>
                <p className="text-sm text-gray-500">
                  Help improve AI model with educational data
                </p>
              </div>
              <button
                disabled
                className="px-4 py-2 bg-gray-300 text-gray-500 rounded-lg text-sm font-medium cursor-not-allowed"
              >
                Coming Soon
              </button>
            </div>
          </div>
          <div className="border-t border-gray-100">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Expert Mode</h3>
                  <p className="text-sm text-gray-500">
                    Review and reclassify AI predictions
                  </p>
                </div>
                <button
                  disabled
                  className="px-4 py-2 bg-gray-300 text-gray-500 rounded-lg text-sm font-medium cursor-not-allowed"
                >
                  Coming Soon
                </button>
              </div>
            </div>
          </div>
        </SettingGroup>

        {/* Notifications */}
        <SettingGroup title="Notifications">
          <ToggleItem
            icon={Bell}
            title="High Pollen Alerts"
            subtitle="Get notified when pollen levels are high"
            value={preferences.highPollenAlerts}
            onChange={(value) => updatePreferences({ highPollenAlerts: value })}
          />
          <div className="border-t border-gray-100">
            <ToggleItem
              icon={Bell}
              title="Symptom Reminders"
              subtitle="Daily reminders to log symptoms"
              value={preferences.symptomReminders}
              onChange={(value) => updatePreferences({ symptomReminders: value })}
            />
          </div>
          <div className="border-t border-gray-100">
            <ToggleItem
              icon={Bell}
              title="Weekly Reports"
              subtitle="Get weekly summaries"
              value={preferences.weeklyReports}
              onChange={(value) => updatePreferences({ weeklyReports: value })}
            />
          </div>
        </SettingGroup>

        {/* Location */}
        <SettingGroup title="Location">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <MapPin className="w-5 h-5 mr-3 text-gray-500" />
                <div>
                  <h3 className="font-medium text-gray-900">Current Location</h3>
                  <p className="text-sm text-gray-500">
                    {location ? 
                      (location.address?.split(',')[0] || `${location.latitude?.toFixed(4)}, ${location.longitude?.toFixed(4)}`) :
                      'Not set'
                    }
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowLocationInput(true)}
                className="text-blue-500 text-sm font-medium hover:text-blue-600 transition-colors"
              >
                {location ? 'Change' : 'Set'}
              </button>
            </div>
          </div>
        </SettingGroup>

        {/* Appearance */}
        <SettingGroup title="Appearance">
          <ToggleItem
            icon={darkMode ? Moon : Sun}
            title="Dark Mode"
            subtitle="Use dark theme"
            value={darkMode}
            onChange={toggleDarkMode}
          />
        </SettingGroup>

        {/* Data & Privacy */}
        <SettingGroup title="Data & Privacy">
          <SettingItem
            icon={Download}
            title="Export Data"
            subtitle="Download your data"
            action={exportData}
          />
          <div className="border-t border-gray-100">
            <SettingItem
              icon={Shield}
              title="Privacy Policy"
              subtitle="How we protect your data"
              action={() => window.open('https://crowdpollen.com/privacy', '_blank')}
            />
          </div>
          <div className="border-t border-gray-100">
            <SettingItem
              icon={Globe}
              title="Terms of Service"
              subtitle="Terms and conditions"
              action={() => window.open('https://crowdpollen.com/terms', '_blank')}
            />
          </div>
        </SettingGroup>


        {/* Support */}
        <SettingGroup title="Support">
          <SettingItem
            icon={HelpCircle}
            title="Help & FAQ"
            subtitle="Common questions"
            action={() => navigate('/help')}
          />
          <div className="border-t border-gray-100">
            <SettingItem
              icon={HelpCircle}
              title="Contact Support"
              subtitle="Get technical help"
              action={() => window.open('mailto:support@crowdpollen.com')}
            />
          </div>
        </SettingGroup>

        {/* Admin */}
        <SettingGroup title="Admin">
          <SettingItem
            icon={Settings}
            title="API Settings"
            subtitle="Configure and monitor Google APIs"
            action={() => navigate('/api-settings')}
          />
        </SettingGroup>

        {/* Danger Zone */}
        <SettingGroup title="Danger Zone">
          <SettingItem
            icon={Trash2}
            title="Clear All Data"
            subtitle="Permanently delete local data"
            action={() => setShowDeleteConfirm(true)}
            danger={true}
          />
          {user && (
            <>
              <div className="border-t border-gray-100">
                <SettingItem
                  icon={LogOut}
                  title="Sign Out"
                  subtitle="Sign out of your account"
                  action={handleSignOut}
                  danger={true}
                />
              </div>
            </>
          )}
        </SettingGroup>

        {/* App Info */}
        <div className="text-center py-8">
          <p className="text-sm text-gray-500 mb-1">CrowdPollen v1.0.0</p>
          <p className="text-sm text-gray-400">Built with ❤️ for citizen science</p>
        </div>
      </div>

      {/* Location Input Modal */}
      {showLocationInput && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Set Location</h3>
              <button
                onClick={() => setShowLocationInput(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <LocationInput 
              onLocationSet={() => setShowLocationInput(false)}
              showTitle={false}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Clear All Data?</h3>
              <p className="text-gray-600 mb-6">
                This will permanently delete all your submissions, symptoms, and settings. 
                This action cannot be undone.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={clearAllData}
                  className="flex-1 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors"
                >
                  Delete All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
