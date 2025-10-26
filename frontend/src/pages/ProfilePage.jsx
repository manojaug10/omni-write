import { useUser } from '@clerk/clerk-react'
import { useState, useEffect, useCallback } from 'react'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

function ProfilePage() {
  const { user, isLoaded } = useUser()
  const [dbUser, setDbUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [banner, setBanner] = useState(null)

  const fetchUserFromDB = useCallback(async () => {
    if (!user) {
      return
    }

    try {
      setLoading(true)
      setError(null)

      const token = await user.getToken()
      const response = await fetch(`${API_BASE_URL}/api/users/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setDbUser(data.user)
      } else if (response.status === 401) {
        setError('Session expired. Please sign in again.')
      } else {
        setError('Failed to load profile data')
      }
    } catch (err) {
      setError('Error connecting to server')
      console.error('Profile fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (isLoaded && user) {
      fetchUserFromDB()
    }
  }, [isLoaded, user, fetchUserFromDB])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const status = params.get('x_oauth')
    const message = params.get('message')
    if (status === 'success') {
      setBanner({ type: 'success', message: 'Twitter account connected successfully.' })
      // Clean the query params
      const url = new URL(window.location.href)
      url.searchParams.delete('x_oauth')
      url.searchParams.delete('message')
      window.history.replaceState({}, '', url.toString())
    } else if (status === 'error') {
      setBanner({ type: 'error', message: message || 'Failed to connect Twitter account.' })
      const url = new URL(window.location.href)
      url.searchParams.delete('x_oauth')
      url.searchParams.delete('message')
      window.history.replaceState({}, '', url.toString())
    }
  }, [])

  const connectTwitter = useCallback(async () => {
    try {
      const token = await user.getToken()
      const redirect = `${window.location.origin}/profile`
      const url = `${API_BASE_URL}/api/auth/x?mode=json&redirect=${encodeURIComponent(redirect)}`
      const resp = await fetch(url, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
      })
      if (!resp.ok) {
        throw new Error('Failed to initiate Twitter OAuth')
      }
      const data = await resp.json()
      if (!data.authorizationUrl) {
        throw new Error('Missing authorization URL')
      }
      window.location.href = data.authorizationUrl
    } catch (e) {
      console.error('Connect Twitter failed:', e)
      setBanner({ type: 'error', message: e.message || 'Unable to start Twitter OAuth.' })
    }
  }, [user])

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

        {banner && (
          <div className={`mb-6 rounded-lg p-4 border ${banner.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
            {banner.message}
          </div>
        )}

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
          <button
            type="button"
            onClick={connectTwitter}
            className="inline-flex items-center px-4 py-2 rounded-md bg-black text-white hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-800"
          >
            Connect Twitter
          </button>
        </div>
      </div>
    </main>
  )
}

export default ProfilePage
