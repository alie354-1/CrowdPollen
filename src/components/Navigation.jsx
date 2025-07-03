import { Home, Camera, Map, FileText, Settings } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'

export default function Navigation() {
  const navigate = useNavigate()
  const location = useLocation()

  const tabs = [
    { id: 'home', path: '/', icon: Home, label: 'Home' },
    { id: 'camera', path: '/camera', icon: Camera, label: 'Submit' },
    { id: 'map', path: '/map', icon: Map, label: 'Map' },
    { id: 'symptomLog', path: '/symptoms', icon: FileText, label: 'Log' },
    { id: 'settings', path: '/settings', icon: Settings, label: 'Settings' }
  ]

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 z-50 safe-area-bottom">
      <div className="max-w-mobile mx-auto">
        <div className="grid grid-cols-5 px-4 py-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center justify-center py-3 px-2 transition-colors ${
                isActive(tab.path)
                  ? 'text-blue-500'
                  : 'text-gray-500'
              }`}
            >
              <tab.icon className={`w-6 h-6 mb-1 ${isActive(tab.path) ? 'stroke-2' : 'stroke-1.5'}`} />
              <span className={`text-xs ${isActive(tab.path) ? 'font-semibold' : 'font-medium'}`}>
                {tab.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
