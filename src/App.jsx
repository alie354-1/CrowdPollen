import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { LocationProvider } from './contexts/LocationContext'
import { NotificationProvider } from './contexts/NotificationContext'
import Navigation from './components/Navigation'
import HomeScreen from './screens/HomeScreen'
import CameraScreen from './screens/CameraScreen'
import MapScreen from './screens/MapScreen'
import SymptomLogScreen from './screens/SymptomLogScreen'
import HistoryScreen from './screens/HistoryScreen'
import SettingsScreen from './screens/SettingsScreen'
import OnboardingScreen from './screens/OnboardingScreen'
import LoadingScreen from './components/LoadingScreen'
import ErrorBoundary from './components/ErrorBoundary'
import './App.css'

function App() {
  const [isLoading, setIsLoading] = useState(true)
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false)

  useEffect(() => {
    // Check if user has completed onboarding
    const checkOnboardingStatus = () => {
      const onboardingCompleted = localStorage.getItem('crowdpollen_onboarding_completed')
      setHasCompletedOnboarding(!!onboardingCompleted)
      setIsLoading(false)
    }

    // Simulate app initialization
    setTimeout(checkOnboardingStatus, 1000)
  }, [])

  const handleOnboardingComplete = () => {
    localStorage.setItem('crowdpollen_onboarding_completed', 'true')
    setHasCompletedOnboarding(true)
  }

  if (isLoading) {
    return <LoadingScreen />
  }

  if (!hasCompletedOnboarding) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />
  }

  return (
    <ErrorBoundary>
      <Router future={{ v7_relativeSplatPath: true }}>
        <AuthProvider>
          <LocationProvider>
            <NotificationProvider>
              <div className="min-h-screen bg-neutral-50">
                {/* Main Content */}
                <main className="pb-16 safe-bottom">
                  <Routes>
                    <Route path="/" element={<HomeScreen />} />
                    <Route path="/camera" element={<CameraScreen />} />
                    <Route path="/map" element={<MapScreen />} />
                    <Route path="/symptoms" element={<SymptomLogScreen />} />
                    <Route path="/history" element={<HistoryScreen />} />
                    <Route path="/settings" element={<SettingsScreen />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </main>

                {/* Bottom Navigation */}
                <Navigation />
              </div>
            </NotificationProvider>
          </LocationProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  )
}

export default App
