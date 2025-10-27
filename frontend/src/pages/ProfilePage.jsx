import { useUser, useAuth } from '@clerk/clerk-react'
import { useState, useEffect, useCallback } from 'react'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

function ProfilePage() {
  const { user, isLoaded } = useUser()
  const { getToken } = useAuth()
  const [dbUser, setDbUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [banner, setBanner] = useState(null)
  const [xConnection, setXConnection] = useState(null)

  const fetchUserFromDB = useCallback(async () => {
    if (!user) {
      return
    }

    try {
      setLoading(true)
      setError(null)

      const token = await getToken()
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

  const fetchXConnection = useCallback(async () => {
    try {
      const token = await getToken()
      const resp = await fetch(`${API_BASE_URL}/api/x/connection`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      })
      if (resp.ok) {
        const data = await resp.json()
        setXConnection(data.connection)
      } else {
        setXConnection(null)
      }
    } catch (e) {
      setXConnection(null)
    }
  }, [getToken])

  useEffect(() => {
    if (isLoaded && user) {
      fetchXConnection()
    }
  }, [isLoaded, user, fetchXConnection])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const status = params.get('x_oauth')
    const message = params.get('message')
    if (status === 'success') {
      setBanner({ type: 'success', message: 'Twitter account connected successfully.' })
      fetchXConnection()
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
      const token = await getToken()
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

  const disconnectTwitter = useCallback(async () => {
    try {
      const token = await getToken()
      const resp = await fetch(`${API_BASE_URL}/api/x/connection`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      })
      if (resp.ok) {
        setBanner({ type: 'success', message: 'Twitter account disconnected.' })
        setXConnection(null)
      } else {
        const data = await resp.json().catch(() => null)
        setBanner({ type: 'error', message: data?.message || 'Failed to disconnect Twitter.' })
      }
    } catch (e) {
      setBanner({ type: 'error', message: e.message || 'Failed to disconnect Twitter.' })
    }
  }, [getToken])

  const [composeText, setComposeText] = useState('')
  const [scheduleAt, setScheduleAt] = useState('')
  const [scheduled, setScheduled] = useState([])

  const loadScheduled = useCallback(async () => {
    try {
      const token = await getToken()
      const resp = await fetch(`${API_BASE_URL}/api/x/tweet/schedule`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      })
      if (resp.ok) {
        const data = await resp.json()
        setScheduled(data.scheduled || [])
      }
    } catch {}
  }, [getToken])

  useEffect(() => {
    if (xConnection) {
      loadScheduled()
    }
  }, [xConnection, loadScheduled])

  const submitSchedule = useCallback(async (e) => {
    e.preventDefault()
    try {
      const token = await getToken()
      // Convert datetime-local (no timezone) to ISO string with user's timezone
      const localDate = new Date(scheduleAt)
      const isoWithTimezone = localDate.toISOString()

      const body = { text: composeText, scheduledAt: isoWithTimezone }
      const resp = await fetch(`${API_BASE_URL}/api/x/tweet/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        credentials: 'include',
        body: JSON.stringify(body),
      })
      if (resp.ok) {
        setComposeText('')
        setScheduleAt('')
        setBanner({ type: 'success', message: 'Tweet scheduled.' })
        loadScheduled()
      } else {
        const data = await resp.json().catch(() => null)
        setBanner({ type: 'error', message: data?.message || 'Failed to schedule tweet.' })
      }
    } catch (e) {
      setBanner({ type: 'error', message: e.message || 'Failed to schedule tweet.' })
    }
  }, [composeText, scheduleAt, getToken, loadScheduled])

  const cancelScheduled = useCallback(async (id) => {
    try {
      const token = await getToken()
      const resp = await fetch(`${API_BASE_URL}/api/x/tweet/schedule/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      })
      if (resp.ok) {
        loadScheduled()
      }
    } catch {}
  }, [getToken, loadScheduled])

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
          {xConnection ? (
            <div className="flex items-center gap-3">
              <span className="text-gray-700">Connected as <span className="font-medium">@{xConnection.username || xConnection.providerUserId}</span></span>
              <button
                type="button"
                onClick={disconnectTwitter}
                className="inline-flex items-center px-3 py-1.5 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={connectTwitter}
              className="inline-flex items-center px-4 py-2 rounded-md bg-black text-white hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-800"
            >
              Connect Twitter
            </button>
          )}

          {xConnection && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-3">Compose tweet</h3>
              <form onSubmit={submitSchedule} className="space-y-3">
                <textarea
                  value={composeText}
                  onChange={(e) => setComposeText(e.target.value)}
                  rows={4}
                  className="w-full border rounded-md p-3"
                  placeholder="What's happening?"
                />
                <div className="flex items-center gap-3">
                  <input
                    type="datetime-local"
                    value={scheduleAt}
                    onChange={(e) => setScheduleAt(e.target.value)}
                    className="border rounded-md p-2"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
                  >
                    Schedule
                  </button>
                </div>
              </form>

              <h4 className="text-md font-semibold mt-6 mb-2">Scheduled</h4>
              <ul className="space-y-2">
                {scheduled.map((s) => (
                  <li key={s.id} className="border rounded-md p-3 flex items-center justify-between">
                    <div>
                      <div className="text-gray-900">{s.text}</div>
                      <div className="text-sm text-gray-500">{new Date(s.scheduledAt).toLocaleString()} • {s.status}</div>
                    </div>
                    {s.status === 'QUEUED' && (
                      <button onClick={() => cancelScheduled(s.id)} className="px-3 py-1.5 rounded-md border">Cancel</button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

export default ProfilePage
