import { useUser, SignInButton, SignUpButton } from '@clerk/clerk-react'
import { Link } from 'react-router-dom'

function HomePage() {
  const { isSignedIn, user } = useUser()

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {isSignedIn ? (
        // Signed In View
        <div className="text-center">
          <div className="bg-white rounded-lg shadow-md p-8 max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Welcome back, {user.firstName || user.username || 'Writer'}!
            </h2>
            <p className="text-gray-600 mb-8">
              You're successfully authenticated with Clerk.
            </p>

            <div className="bg-indigo-50 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-indigo-900 mb-2">
                Your Profile
              </h3>
              <div className="text-left space-y-2 text-sm text-gray-700">
                <p><span className="font-medium">Email:</span> {user.primaryEmailAddress?.emailAddress}</p>
                <p><span className="font-medium">User ID:</span> {user.id}</p>
                <p><span className="font-medium">Joined:</span> {new Date(user.createdAt).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="pt-4">
              <Link 
                to="/profile"
                className="inline-block px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
              >
                View Full Profile
              </Link>
            </div>
          </div>
        </div>
      ) : (
        // Signed Out View
        <div className="text-center">
          <div className="bg-white rounded-lg shadow-md p-8 max-w-2xl mx-auto">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome to Omni Write
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Your modern writing and content management platform
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <Link 
                to="/sign-in"
                className="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-md w-full sm:w-auto text-center"
              >
                Sign In
              </Link>

              <Link 
                to="/sign-up"
                className="px-8 py-3 bg-white text-indigo-600 font-semibold rounded-lg border-2 border-indigo-600 hover:bg-indigo-50 transition-colors w-full sm:w-auto text-center"
              >
                Sign Up
              </Link>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Get Started
              </h3>
              <p className="text-gray-600 text-sm">
                Sign in or create an account to start writing and managing your content.
              </p>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default HomePage

