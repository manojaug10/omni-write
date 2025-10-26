import { useUser } from '@clerk/clerk-react'
import { Link } from 'react-router-dom'

function HomePage() {
  const { isSignedIn, user } = useUser()

  return (
    <main className="flex items-center justify-center min-h-[calc(100vh-180px)]">
      {isSignedIn ? (
        // Signed In View - Simple welcome
        <div className="text-center max-w-2xl mx-auto px-4">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Welcome back, {user.firstName || 'Writer'}!
          </h1>
          <p className="text-xl text-gray-600 mb-10">
            Ready to continue your writing journey?
          </p>
          <Link
            to="/profile"
            className="inline-block px-8 py-4 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
          >
            Go to Dashboard
          </Link>
        </div>
      ) : (
        // Signed Out View - Clean landing
        <div className="text-center max-w-3xl mx-auto px-4">
          <h1 className="text-6xl md:text-7xl font-bold text-gray-900 mb-6">
            Omni Write
          </h1>
          <p className="text-2xl md:text-3xl text-gray-600 mb-12">
            Your modern writing platform
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/sign-up"
              className="px-10 py-4 bg-indigo-600 text-white text-lg font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all w-full sm:w-auto"
            >
              Get Started
            </Link>

            <Link
              to="/sign-in"
              className="px-10 py-4 bg-white text-indigo-600 text-lg font-semibold rounded-lg border-2 border-indigo-600 hover:bg-indigo-50 transition-colors shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all w-full sm:w-auto"
            >
              Sign In
            </Link>
          </div>
        </div>
      )}
    </main>
  )
}

export default HomePage

