import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { useUser, UserButton } from '@clerk/clerk-react'
import HomePage from './pages/HomePage'
import SignInPage from './pages/SignInPage'
import SignUpPage from './pages/SignUpPage'
import ProfilePage from './pages/ProfilePage'
import ProtectedRoute from './components/ProtectedRoute'
import './App.css'

function App() {
  const { isSignedIn, isLoaded } = useUser()

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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Navigation Bar */}
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <Link to="/" className="text-2xl font-bold text-indigo-600 hover:text-indigo-700 transition-colors">
                  Omni Write
                </Link>
              </div>
              <div className="flex items-center gap-4">
                {isSignedIn ? (
                  <>
                    <Link 
                      to="/profile"
                      className="text-gray-700 hover:text-indigo-600 font-medium transition-colors"
                    >
                      Profile
                    </Link>
                    <UserButton />
                  </>
                ) : (
                  <>
                    <Link 
                      to="/sign-in"
                      className="text-gray-700 hover:text-indigo-600 font-medium transition-colors"
                    >
                      Sign In
                    </Link>
                    <Link 
                      to="/sign-up"
                      className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* Routes */}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/sign-in/*" element={<SignInPage />} />
          <Route path="/sign-up/*" element={<SignUpPage />} />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } 
          />
        </Routes>

        {/* Footer */}
        <footer className="mt-12 pb-8 text-center text-gray-500 text-sm">
          <p>Built with React, Vite, Tailwind CSS, and Clerk</p>
        </footer>
      </div>
    </Router>
  )
}

export default App
