import { useUser } from '@clerk/clerk-react'
import { Navigate } from 'react-router-dom'

function ProtectedRoute({ children }) {
  const { isSignedIn, isLoaded } = useUser()

  // Show loading state while checking auth
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  // Redirect to sign-in if not authenticated
  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace />
  }

  // Render protected content
  return children
}

export default ProtectedRoute

