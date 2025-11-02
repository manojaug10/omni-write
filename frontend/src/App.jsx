import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import LandingPage from './pages/LandingPage'
import SignInPage from './pages/SignInPage'
import SignUpPage from './pages/SignUpPage'
import ProfilePage from './pages/ProfilePage'
import DashboardPage from './pages/DashboardPage'
import PrivacyPolicyPage from './pages/PrivacyPolicyPage'
import ConnectAccountsPage from './pages/ConnectAccountsPage'
import ProtectedRoute from './components/ProtectedRoute'
// Global styles are provided via index.css and Tailwind

function App() {
  const { isLoaded } = useUser()

  // Show loading state while Clerk is initializing
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/sign-in/*" element={<SignInPage />} />
        <Route path="/sign-up/*" element={<SignUpPage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route
          path="/connect-accounts"
          element={
            <ProtectedRoute>
              <ConnectAccountsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  )
}

export default App
