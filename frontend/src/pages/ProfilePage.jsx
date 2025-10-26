import { useUser } from '@clerk/clerk-react'
import { useState, useEffect } from 'react'

function ProfilePage() {
  const { user, isLoaded } = useUser()
  const [dbUser, setDbUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchUserFromDB() {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/users/me`, {
          headers: {
            'Authorization': `Bearer ${await user.getToken()}`
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          setDbUser(data.user)
        } else {
          setError('Failed to load profile data')
        }
      } catch (err) {
        setError('Error connecting to server')
        console.error('Profile fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    if (isLoaded && user) {
      fetchUserFromDB()
    }
  }, [user, isLoaded])

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading profile...</div>
      </div>
    )
  }

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Your Profile</h1>

        {/* Clerk User Data */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Account Information</h2>
          <div className="bg-gray-50 rounded-lg p-6 space-y-3">
            <div className="flex items-start">
              <span className="font-medium text-gray-700 w-32">Name:</span>
              <span className="text-gray-900">
                {user.firstName} {user.lastName || ''}
              </span>
            </div>
            <div className="flex items-start">
              <span className="font-medium text-gray-700 w-32">Email:</span>
              <span className="text-gray-900">{user.primaryEmailAddress?.emailAddress}</span>
            </div>
            <div className="flex items-start">
              <span className="font-medium text-gray-700 w-32">Username:</span>
              <span className="text-gray-900">{user.username || 'Not set'}</span>
            </div>
            <div className="flex items-start">
              <span className="font-medium text-gray-700 w-32">User ID:</span>
              <span className="text-gray-600 text-sm font-mono">{user.id}</span>
            </div>
            <div className="flex items-start">
              <span className="font-medium text-gray-700 w-32">Joined:</span>
              <span className="text-gray-900">{new Date(user.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Database User Data */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Database Profile</h2>
          {error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              {error}
            </div>
          ) : dbUser ? (
            <div className="bg-indigo-50 rounded-lg p-6 space-y-3">
              <div className="flex items-start">
                <span className="font-medium text-indigo-900 w-32">DB ID:</span>
                <span className="text-indigo-800 text-sm font-mono">{dbUser.id}</span>
              </div>
              <div className="flex items-start">
                <span className="font-medium text-indigo-900 w-32">Clerk ID:</span>
                <span className="text-indigo-800 text-sm font-mono">{dbUser.clerkId}</span>
              </div>
              <div className="flex items-start">
                <span className="font-medium text-indigo-900 w-32">Email:</span>
                <span className="text-indigo-800">{dbUser.email}</span>
              </div>
              <div className="flex items-start">
                <span className="font-medium text-indigo-900 w-32">Name:</span>
                <span className="text-indigo-800">{dbUser.name || 'Not set'}</span>
              </div>
              <div className="flex items-start">
                <span className="font-medium text-indigo-900 w-32">Created:</span>
                <span className="text-indigo-800">{new Date(dbUser.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex items-start">
                <span className="font-medium text-indigo-900 w-32">Updated:</span>
                <span className="text-indigo-800">{new Date(dbUser.updatedAt).toLocaleString()}</span>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-700">
              Profile not synced to database yet. This may take a moment after signup.
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-4">
            To update your profile information, click your profile picture in the top right corner.
          </p>
        </div>
      </div>
    </main>
  )
}

export default ProfilePage

