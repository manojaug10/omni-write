import { useUser, useAuth } from '@clerk/clerk-react'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { Eye, EyeOff, Calendar, Clock, CheckCircle, MessageCircle, Hash, BarChart3, Send, Lock } from 'lucide-react'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const formatDate = (value, options) => {
  if (!value) {
    return 'Not set'
  }

  try {
    return new Date(value).toLocaleString(undefined, options)
  } catch {
    return 'Not set'
  }
}

const formatDateOnly = (value) =>
  formatDate(value, { dateStyle: 'medium' })

const formatDateTime = (value) =>
  formatDate(value, { dateStyle: 'medium', timeStyle: 'short' })

const statusStyles = {
  QUEUED: 'bg-sky-100 text-sky-700',
  CANCELLED: 'bg-slate-100 text-slate-600',
  FAILED: 'bg-rose-100 text-rose-700',
  SENT: 'bg-emerald-100 text-emerald-700',
  POSTED: 'bg-emerald-100 text-emerald-700',
}

const statusLabels = {
  QUEUED: 'Queued',
  CANCELLED: 'Cancelled',
  FAILED: 'Failed',
  SENT: 'Sent',
  POSTED: 'Posted',
}

// Helper function to mask sensitive information
const maskText = (text, visible = false) => {
  if (!text || text === 'Not set') return text
  if (visible) return text
  // Mask email addresses
  if (text.includes('@')) {
    const [local, domain] = text.split('@')
    const maskedLocal = local.length > 2 ? `${local[0]}${'*'.repeat(local.length - 2)}${local[local.length - 1]}` : '**'
    return `${maskedLocal}@${domain}`
  }
  // Mask names and other text
  if (text.length <= 3) return '***'
  return `${text[0]}${'*'.repeat(Math.min(text.length - 2, 8))}${text[text.length - 1]}`
}

// Helper function to mask IDs
const maskId = (id, visible = false) => {
  if (!id) return id
  if (visible) return id
  if (id.length <= 8) return '••••••••'
  return `${id.slice(0, 3)}${'•'.repeat(6)}${id.slice(-3)}`
}

function ProfilePage() {
  const { user, isLoaded } = useUser()
  const { getToken } = useAuth()
  const [dbUser, setDbUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [banner, setBanner] = useState(null)
  const [xConnection, setXConnection] = useState(null)
  const [threadsConnection, setThreadsConnection] = useState(null)
  const [showSensitiveInfo, setShowSensitiveInfo] = useState(false)

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
  }, [user, getToken])

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
    } catch (err) {
      console.error('Failed to fetch X connection', err)
      setXConnection(null)
    }
  }, [getToken])

  const fetchThreadsConnection = useCallback(async () => {
    try {
      const token = await getToken()
      const resp = await fetch(`${API_BASE_URL}/api/threads/connection`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      })
      if (resp.ok) {
        const data = await resp.json()
        setThreadsConnection(data.connection)
      } else {
        setThreadsConnection(null)
      }
    } catch (err) {
      console.error('Failed to fetch Threads connection', err)
      setThreadsConnection(null)
    }
  }, [getToken])

  useEffect(() => {
    if (isLoaded && user) {
      fetchXConnection()
      fetchThreadsConnection()
    }
  }, [isLoaded, user, fetchXConnection, fetchThreadsConnection])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const xStatus = params.get('x_oauth')
    const threadsStatus = params.get('threads')
    const message = params.get('message')

    if (xStatus === 'success') {
      setBanner({ type: 'success', message: 'Twitter account connected successfully.' })
      fetchXConnection()
      // Clean the query params
      const url = new URL(window.location.href)
      url.searchParams.delete('x_oauth')
      url.searchParams.delete('message')
      window.history.replaceState({}, '', url.toString())
    } else if (xStatus === 'error') {
      setBanner({ type: 'error', message: message || 'Failed to connect Twitter account.' })
      const url = new URL(window.location.href)
      url.searchParams.delete('x_oauth')
      url.searchParams.delete('message')
      window.history.replaceState({}, '', url.toString())
    }

    if (threadsStatus === 'connected') {
      setBanner({ type: 'success', message: 'Threads account connected successfully.' })
      fetchThreadsConnection()
      // Clean the query params
      const url = new URL(window.location.href)
      url.searchParams.delete('threads')
      url.searchParams.delete('message')
      window.history.replaceState({}, '', url.toString())
    } else if (threadsStatus === 'error') {
      setBanner({ type: 'error', message: message || 'Failed to connect Threads account.' })
      const url = new URL(window.location.href)
      url.searchParams.delete('threads')
      url.searchParams.delete('message')
      window.history.replaceState({}, '', url.toString())
    }
  }, [fetchXConnection, fetchThreadsConnection])

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
  }, [getToken])

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

  const connectThreads = useCallback(async () => {
    try {
      const token = await getToken()
      const redirect = `${window.location.origin}/profile`
      const url = `${API_BASE_URL}/api/auth/threads?mode=json&redirect=${encodeURIComponent(redirect)}`
      const resp = await fetch(url, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
      })
      if (!resp.ok) {
        throw new Error('Failed to initiate Threads OAuth')
      }
      const data = await resp.json()
      if (!data.authorizationUrl) {
        throw new Error('Missing authorization URL')
      }
      window.location.href = data.authorizationUrl
    } catch (e) {
      console.error('Connect Threads failed:', e)
      setBanner({ type: 'error', message: e.message || 'Unable to start Threads OAuth.' })
    }
  }, [getToken])

  const disconnectThreads = useCallback(async () => {
    try {
      const token = await getToken()
      const resp = await fetch(`${API_BASE_URL}/api/threads/connection`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      })
      if (resp.ok) {
        setBanner({ type: 'success', message: 'Threads account disconnected.' })
        setThreadsConnection(null)
      } else {
        const data = await resp.json().catch(() => null)
        setBanner({ type: 'error', message: data?.message || 'Failed to disconnect Threads.' })
      }
    } catch (e) {
      setBanner({ type: 'error', message: e.message || 'Failed to disconnect Threads.' })
    }
  }, [getToken])

  const [composeText, setComposeText] = useState('')
  const [scheduleAt, setScheduleAt] = useState('')
  const [scheduled, setScheduled] = useState([])
  const [composeMode, setComposeMode] = useState('tweet') // 'tweet' or 'thread'
  const [composeProvider, setComposeProvider] = useState('X') // 'X' or 'THREADS'
  const [threadTweets, setThreadTweets] = useState(['', ''])
  const [scheduledThreads, setScheduledThreads] = useState([])
  const [scheduledThreadsPosts, setScheduledThreadsPosts] = useState([])

  const displayName = useMemo(() => {
    if (!user) {
      return ''
    }

    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ')
    const name = fullName || user.username || user.primaryEmailAddress?.emailAddress || 'Your profile'
    return maskText(name, showSensitiveInfo)
  }, [user, showSensitiveInfo])

  const truncatedUserId = useMemo(() => {
    if (!user?.id) {
      return ''
    }

    return maskId(user.id, showSensitiveInfo)
  }, [user, showSensitiveInfo])

  const maskedEmail = useMemo(() => {
    if (!user?.primaryEmailAddress?.emailAddress) {
      return 'Not set'
    }
    return maskText(user.primaryEmailAddress.emailAddress, showSensitiveInfo)
  }, [user, showSensitiveInfo])

  const accountDetails = useMemo(() => {
    if (!user) {
      return []
    }

    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Not set'

    return [
      { label: 'Name', value: maskText(fullName, showSensitiveInfo), isSensitive: true },
      { label: 'Email', value: maskText(user.primaryEmailAddress?.emailAddress || 'Not set', showSensitiveInfo), isSensitive: true },
      { label: 'Username', value: user.username || 'Not set' },
      { label: 'User ID', value: maskId(user.id, showSensitiveInfo), isMono: true, isSensitive: true },
      { label: 'Joined', value: formatDateOnly(user.createdAt) },
    ]
  }, [user, showSensitiveInfo])

  const databaseDetails = useMemo(() => {
    if (!dbUser) {
      return []
    }

    return [
      { label: 'Database ID', value: maskId(dbUser.id, showSensitiveInfo), isMono: true, isSensitive: true },
      { label: 'Clerk ID', value: maskId(dbUser.clerkId, showSensitiveInfo), isMono: true, isSensitive: true },
      { label: 'Email', value: maskText(dbUser.email, showSensitiveInfo), isSensitive: true },
      { label: 'Name', value: maskText(dbUser.name || 'Not set', showSensitiveInfo), isSensitive: true },
      { label: 'Created', value: formatDateTime(dbUser.createdAt) },
      { label: 'Updated', value: formatDateTime(dbUser.updatedAt) },
    ]
  }, [dbUser, showSensitiveInfo])

  const queuedCount = useMemo(
    () => scheduled.filter((item) => item.status === 'QUEUED').length,
    [scheduled]
  )

  const heroStats = useMemo(
    () => [
      { label: 'Member Since', value: formatDateOnly(user?.createdAt) },
      { label: 'Queued Tweets', value: queuedCount.toString() },
      {
        label: 'Last Sync',
        value: dbUser?.updatedAt ? formatDateTime(dbUser.updatedAt) : 'Awaiting sync',
      },
    ],
    [user, queuedCount, dbUser]
  )

  const connectionHandle = xConnection
    ? xConnection.username || xConnection.providerUserId
    : ''

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
    } catch (err) {
      console.error('Failed to load scheduled tweets', err)
    }
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
    } catch (err) {
      console.error('Failed to cancel scheduled tweet', err)
    }
  }, [getToken, loadScheduled])

  const loadScheduledThreads = useCallback(async () => {
    try {
      const token = await getToken()
      const resp = await fetch(`${API_BASE_URL}/api/x/thread/schedule`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      })
      if (resp.ok) {
        const data = await resp.json()
        setScheduledThreads(data.scheduled || [])
      }
    } catch (err) {
      console.error('Failed to load scheduled threads', err)
    }
  }, [getToken])

  const loadScheduledThreadsPosts = useCallback(async () => {
    try {
      const token = await getToken()
      const resp = await fetch(`${API_BASE_URL}/api/threads/post/schedule`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      })
      if (resp.ok) {
        const data = await resp.json()
        setScheduledThreadsPosts(data.scheduled || [])
      }
    } catch (err) {
      console.error('Failed to load scheduled Threads posts', err)
    }
  }, [getToken])

  useEffect(() => {
    if (xConnection) {
      loadScheduledThreads()
    }
  }, [xConnection, loadScheduledThreads])

  useEffect(() => {
    if (threadsConnection) {
      loadScheduledThreadsPosts()
    }
  }, [threadsConnection, loadScheduledThreadsPosts])

  // Auto-select provider based on available connections
  useEffect(() => {
    if (!xConnection && threadsConnection) {
      setComposeProvider('THREADS')
    } else if (xConnection && !threadsConnection) {
      setComposeProvider('X')
    }
  }, [xConnection, threadsConnection])

  const submitThreadSchedule = useCallback(async (e) => {
    e.preventDefault()
    try {
      const token = await getToken()
      const localDate = new Date(scheduleAt)
      const isoWithTimezone = localDate.toISOString()

      // Filter out empty tweets
      const validTweets = threadTweets.filter(t => t.trim())
      if (validTweets.length === 0) {
        setBanner({ type: 'error', message: 'Please add at least one tweet to the thread.' })
        return
      }

      const body = { tweets: validTweets, scheduledAt: isoWithTimezone }
      const resp = await fetch(`${API_BASE_URL}/api/x/thread/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        credentials: 'include',
        body: JSON.stringify(body),
      })
      if (resp.ok) {
        setThreadTweets(['', ''])
        setScheduleAt('')
        setBanner({ type: 'success', message: 'Thread scheduled.' })
        loadScheduledThreads()
      } else {
        const data = await resp.json().catch(() => null)
        setBanner({ type: 'error', message: data?.message || 'Failed to schedule thread.' })
      }
    } catch (e) {
      setBanner({ type: 'error', message: e.message || 'Failed to schedule thread.' })
    }
  }, [threadTweets, scheduleAt, getToken, loadScheduledThreads])

  const cancelScheduledThread = useCallback(async (id) => {
    try {
      const token = await getToken()
      const resp = await fetch(`${API_BASE_URL}/api/x/thread/schedule/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      })
      if (resp.ok) {
        loadScheduledThreads()
      }
    } catch (err) {
      console.error('Failed to cancel scheduled thread', err)
    }
  }, [getToken, loadScheduledThreads])

  const submitThreadsPostSchedule = useCallback(async (e) => {
    e.preventDefault()
    try {
      const token = await getToken()
      const localDate = new Date(scheduleAt)
      const isoWithTimezone = localDate.toISOString()

      const body = { text: composeText, scheduledAt: isoWithTimezone }
      const resp = await fetch(`${API_BASE_URL}/api/threads/post/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        credentials: 'include',
        body: JSON.stringify(body),
      })
      if (resp.ok) {
        setComposeText('')
        setScheduleAt('')
        setBanner({ type: 'success', message: 'Threads post scheduled.' })
        loadScheduledThreadsPosts()
      } else {
        const data = await resp.json().catch(() => null)
        setBanner({ type: 'error', message: data?.message || 'Failed to schedule Threads post.' })
      }
    } catch (e) {
      setBanner({ type: 'error', message: e.message || 'Failed to schedule Threads post.' })
    }
  }, [composeText, scheduleAt, getToken, loadScheduledThreadsPosts])

  const cancelScheduledThreadsPost = useCallback(async (id) => {
    try {
      const token = await getToken()
      const resp = await fetch(`${API_BASE_URL}/api/threads/post/schedule/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      })
      if (resp.ok) {
        loadScheduledThreadsPosts()
      }
    } catch (err) {
      console.error('Failed to cancel scheduled Threads post', err)
    }
  }, [getToken, loadScheduledThreadsPosts])

  const addThreadTweet = useCallback(() => {
    setThreadTweets([...threadTweets, ''])
  }, [threadTweets])

  const removeThreadTweet = useCallback((index) => {
    if (threadTweets.length > 1) {
      setThreadTweets(threadTweets.filter((_, i) => i !== index))
    }
  }, [threadTweets])

  const updateThreadTweet = useCallback((index, value) => {
    const updated = [...threadTweets]
    updated[index] = value
    setThreadTweets(updated)
  }, [threadTweets])

  if (!isLoaded || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
          <p className="text-sm font-medium text-gray-600">Loading your profile...</p>
        </div>
      </div>
    )
  }

  const bannerClasses =
    banner?.type === 'success'
      ? 'border-emerald-200 bg-emerald-50/80 text-emerald-700'
      : 'border-rose-200 bg-rose-50/80 text-rose-700'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="border-b border-white/60 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
              <p className="mt-1 text-sm text-gray-600">
                Manage your account settings and scheduled content
              </p>
            </div>
            <button
              onClick={() => setShowSensitiveInfo(!showSensitiveInfo)}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 hover:shadow-md"
            >
              {showSensitiveInfo ? (
                <>
                  <EyeOff className="h-4 w-4" />
                  Hide Info
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" />
                  Show Info
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6">
          {banner && (
            <div className={`rounded-2xl border px-5 py-4 text-sm font-medium shadow-sm ${bannerClasses}`}>
              {banner.message}
            </div>
          )}

          {/* Profile Hero Section */}
          <section className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md lg:p-8">
            <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-gradient-to-br from-blue-100 to-indigo-50 opacity-50 blur-2xl" />
            <div className="relative">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-6">
                  {user?.profileImageUrl ? (
                    <img
                      src={user.profileImageUrl}
                      alt="Profile"
                      className="h-20 w-20 rounded-2xl border-2 border-gray-100 shadow-md"
                    />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-gray-100 bg-gradient-to-br from-blue-100 to-indigo-100 text-2xl font-semibold uppercase tracking-wide text-indigo-600 shadow-md">
                      {displayName.charAt(0) || 'U'}
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-3">
                      <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Profile</p>
                      {!showSensitiveInfo && (
                        <Lock className="h-3 w-3 text-gray-400" />
                      )}
                    </div>
                    <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                      {displayName}
                    </h2>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-600">
                      {maskedEmail !== 'Not set' && (
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-gray-50 px-3 py-1.5 text-xs font-medium">
                          {maskedEmail}
                        </span>
                      )}
                      {truncatedUserId && (
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-gray-50 px-3 py-1.5 text-xs font-medium font-mono">
                          ID: {truncatedUserId}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {heroStats.map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-xl bg-gradient-to-br from-gray-50 to-gray-100/50 px-4 py-3 text-center backdrop-blur-sm"
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                        {stat.label}
                      </p>
                      <p className="mt-2 text-xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Account Information & Database Profile */}
          <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Account Information Card */}
            <div className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md">
              <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 opacity-50 blur-2xl" />
              <div className="relative">
                <header className="mb-6">
                  <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                      <BarChart3 className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Account Information</h2>
                      <p className="mt-1 text-sm text-gray-500">
                        Live details synced from your Clerk profile
                      </p>
                    </div>
                  </div>
                </header>
                <dl className="space-y-4">
                  {accountDetails.map(({ label, value, isMono, isSensitive }) => {
                    const display = value ?? 'Not set'
                    const isPlaceholder = display === 'Not set' || display === ''
                    const valueClass = [
                      'text-sm leading-6',
                      isMono ? 'font-mono text-[13px] text-gray-700' : 'font-medium text-gray-900',
                      isPlaceholder ? 'font-normal italic text-gray-400' : '',
                      isSensitive && !showSensitiveInfo ? 'text-gray-500' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')

                    return (
                      <div
                        key={label}
                        className="flex items-start justify-between gap-4 border-b border-gray-100 pb-4 last:border-0"
                      >
                        <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                          {label}
                        </dt>
                        <dd className={valueClass}>{display || '—'}</dd>
                      </div>
                    )
                  })}
                </dl>
              </div>
            </div>

            {/* Database Profile Card */}
            <div className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md">
              <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-gradient-to-br from-purple-50 to-pink-50 opacity-50 blur-2xl" />
              <div className="relative">
                <header className="mb-6">
                  <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                      <Hash className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Database Profile</h2>
                      <p className="mt-1 text-sm text-gray-500">
                        Your Omni Write record stored in our database
                      </p>
                    </div>
                  </div>
                </header>
                {error ? (
                  <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-4 text-sm text-rose-700">
                    {error}
                  </div>
                ) : databaseDetails.length ? (
                  <dl className="space-y-4">
                    {databaseDetails.map(({ label, value, isMono, isSensitive }) => {
                      const display = value ?? 'Not set'
                      const isPlaceholder = display === 'Not set' || display === ''
                      const valueClass = [
                        'text-sm leading-6',
                        isMono ? 'font-mono text-[13px] text-gray-700' : 'font-medium text-gray-900',
                        isPlaceholder ? 'font-normal italic text-gray-400' : '',
                        isSensitive && !showSensitiveInfo ? 'text-gray-500' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')

                      return (
                        <div
                          key={label}
                          className="flex items-start justify-between gap-4 border-b border-gray-100 pb-4 last:border-0"
                        >
                          <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                            {label}
                          </dt>
                          <dd className={valueClass}>{display || '—'}</dd>
                        </div>
                      )
                    })}
                  </dl>
                ) : (
                  <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/70 p-6 text-center text-sm text-gray-500">
                    Profile not synced to the database yet. This usually resolves a few moments after signup.
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* X Connection Section */}
          <section className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md lg:p-8">
            <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-gradient-to-br from-indigo-50 to-purple-50 opacity-50 blur-2xl" />
            <div className="relative">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600">
                    <MessageCircle className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">X (Twitter) Connection</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Connect your account to queue posts directly from Omni Write
                    </p>
                  </div>
                </div>
                {xConnection ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-2 text-sm font-semibold text-gray-700 border border-blue-100">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      @{connectionHandle}
                    </span>
                    <button
                      type="button"
                      onClick={disconnectTwitter}
                      className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:ring-offset-2"
                    >
                      Disconnect
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={connectTwitter}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:ring-offset-2"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Connect Account
                  </button>
                )}
              </div>

              {(xConnection || threadsConnection) && (
                <div className="mt-8 grid gap-8 lg:grid-cols-2">
                  {/* Compose Section */}
                  <div className="flex flex-col gap-6 rounded-xl border border-gray-100 bg-gray-50/50 p-6">
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-base font-semibold text-gray-900">
                            Compose Post
                          </h4>
                          <p className="mt-1 text-sm text-gray-500">
                            Draft a post and choose when it should go live
                          </p>
                        </div>
                      </div>

                      {/* Provider Selector */}
                      {xConnection && threadsConnection && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Platform:</span>
                          <div className="inline-flex rounded-full border border-gray-200 bg-white p-1 shadow-sm">
                            <button
                              type="button"
                              onClick={() => setComposeProvider('X')}
                              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                                composeProvider === 'X'
                                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm'
                                  : 'text-gray-600 hover:text-gray-900'
                              }`}
                            >
                              X (Twitter)
                            </button>
                            <button
                              type="button"
                              onClick={() => setComposeProvider('THREADS')}
                              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                                composeProvider === 'THREADS'
                                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-sm'
                                  : 'text-gray-600 hover:text-gray-900'
                              }`}
                            >
                              Threads
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Mode Selector (only for X) */}
                      {composeProvider === 'X' && xConnection && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Type:</span>
                          <div className="inline-flex rounded-full border border-gray-200 bg-white p-1 shadow-sm">
                            <button
                              type="button"
                              onClick={() => setComposeMode('tweet')}
                              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                                composeMode === 'tweet'
                                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm'
                                  : 'text-gray-600 hover:text-gray-900'
                              }`}
                            >
                              Tweet
                            </button>
                            <button
                              type="button"
                              onClick={() => setComposeMode('thread')}
                              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                                composeMode === 'thread'
                                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm'
                                  : 'text-gray-600 hover:text-gray-900'
                              }`}
                            >
                              Thread
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {composeProvider === 'THREADS' ? (
                      <form onSubmit={submitThreadsPostSchedule} className="flex flex-col gap-4">
                        <textarea
                          value={composeText}
                          onChange={(e) => setComposeText(e.target.value)}
                          rows={6}
                          className="w-full resize-none rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-900 shadow-sm transition focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-200"
                          placeholder="What would you like to share on Threads?"
                        />
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                          <input
                            type="datetime-local"
                            value={scheduleAt}
                            onChange={(e) => setScheduleAt(e.target.value)}
                            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 shadow-sm transition focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-200 sm:w-auto"
                          />
                          <button
                            type="submit"
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-2 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto"
                            disabled={!composeText || !scheduleAt}
                          >
                            <Send className="h-4 w-4" />
                            Schedule Threads Post
                          </button>
                        </div>
                      </form>
                    ) : composeMode === 'tweet' ? (
                      <form onSubmit={submitSchedule} className="flex flex-col gap-4">
                        <textarea
                          value={composeText}
                          onChange={(e) => setComposeText(e.target.value)}
                          rows={6}
                          className="w-full resize-none rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-900 shadow-sm transition focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                          placeholder="What would you like to share?"
                        />
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                          <input
                            type="datetime-local"
                            value={scheduleAt}
                            onChange={(e) => setScheduleAt(e.target.value)}
                            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 shadow-sm transition focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-200 sm:w-auto"
                          />
                          <button
                            type="submit"
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto"
                            disabled={!composeText || !scheduleAt}
                          >
                            <Send className="h-4 w-4" />
                            Schedule Tweet
                          </button>
                        </div>
                      </form>
                    ) : (
                      <form onSubmit={submitThreadSchedule} className="flex flex-col gap-4">
                        <div className="space-y-3">
                          {threadTweets.map((tweet, index) => (
                            <div key={index} className="flex gap-2">
                              <div className="flex flex-col items-center gap-2 pt-4">
                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 text-xs font-bold text-indigo-700">
                                  {index + 1}
                                </div>
                                {index < threadTweets.length - 1 && (
                                  <div className="h-full w-0.5 flex-1 bg-gray-200" />
                                )}
                              </div>
                              <div className="flex-1">
                                <textarea
                                  value={tweet}
                                  onChange={(e) => updateThreadTweet(index, e.target.value)}
                                  rows={3}
                                  className="w-full resize-none rounded-xl border border-gray-200 bg-white p-3 text-sm text-gray-900 shadow-sm transition focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                                  placeholder={`Tweet ${index + 1}`}
                                />
                              </div>
                              {threadTweets.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeThreadTweet(index)}
                                  className="mt-3 h-8 w-8 rounded-full border border-gray-300 text-gray-400 transition hover:border-rose-400 hover:bg-rose-50 hover:text-rose-600"
                                >
                                  ×
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={addThreadTweet}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition hover:border-indigo-300 hover:bg-indigo-50/50 hover:text-indigo-700"
                        >
                          + Add Tweet
                        </button>
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                          <input
                            type="datetime-local"
                            value={scheduleAt}
                            onChange={(e) => setScheduleAt(e.target.value)}
                            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 shadow-sm transition focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-200 sm:w-auto"
                          />
                          <button
                            type="submit"
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto"
                            disabled={!scheduleAt || threadTweets.every(t => !t.trim())}
                          >
                            <Send className="h-4 w-4" />
                            Schedule Thread
                          </button>
                        </div>
                      </form>
                    )}
                  </div>

                  {/* Scheduled Posts Section */}
                  <div className="flex flex-col gap-6 rounded-xl border border-gray-100 bg-gray-50/50 p-6">
                    <div className="flex items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600">
                        <Calendar className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-base font-semibold text-gray-900">Scheduled Posts</h4>
                        <p className="mt-1 text-sm text-gray-500">
                          A quick look at everything queued from Omni Write
                        </p>
                      </div>
                    </div>
                    {scheduled.length === 0 && scheduledThreads.length === 0 && scheduledThreadsPosts.length === 0 ? (
                      <div className="flex flex-1 items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-white p-8 text-center">
                        <div>
                          <Calendar className="mx-auto h-12 w-12 text-gray-300" />
                          <h3 className="mt-4 text-sm font-semibold text-gray-900">No posts scheduled</h3>
                          <p className="mt-2 text-sm text-gray-500">
                            Nothing scheduled yet. Your upcoming posts will appear here.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <ul className="space-y-3">
                        {scheduled.map((s) => {
                          const badgeClass = statusStyles[s.status] || 'bg-gray-100 text-gray-600'
                          const badgeLabel = statusLabels[s.status] || s.status
                          const StatusIcon = s.status === 'POSTED' ? CheckCircle : s.status === 'QUEUED' ? Clock : MessageCircle

                          return (
                            <li
                              key={`tweet-${s.id}`}
                              className="group rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-gray-300 hover:shadow-md"
                            >
                              <div className="flex flex-col gap-3">
                                <div className="flex items-start gap-3">
                                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                                    s.status === 'POSTED' ? 'bg-green-100 text-green-600' :
                                    s.status === 'QUEUED' ? 'bg-blue-100 text-blue-600' :
                                    'bg-gray-100 text-gray-600'
                                  }`}>
                                    <StatusIcon className="h-4 w-4" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="mb-2 flex flex-wrap items-center gap-2">
                                      <span className="inline-flex items-center rounded-md bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-700">
                                        Tweet
                                      </span>
                                      <span
                                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClass}`}
                                      >
                                        {badgeLabel}
                                      </span>
                                    </div>
                                    <p className="text-sm font-medium leading-relaxed text-gray-900">
                                      {s.text || <span className="italic text-gray-400">No content</span>}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500">
                                  <span className="inline-flex items-center gap-1.5">
                                    <Clock className="h-3.5 w-3.5" />
                                    {formatDateTime(s.scheduledAt)}
                                  </span>
                                  {s.status === 'QUEUED' && (
                                    <button
                                      type="button"
                                      onClick={() => cancelScheduled(s.id)}
                                      className="inline-flex items-center rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:ring-offset-2"
                                    >
                                      Cancel
                                    </button>
                                  )}
                                </div>
                              </div>
                            </li>
                          )
                        })}
                        {scheduledThreads.map((t) => {
                          const badgeClass = statusStyles[t.status] || 'bg-gray-100 text-gray-600'
                          const badgeLabel = statusLabels[t.status] || t.status
                          const StatusIcon = t.status === 'POSTED' ? CheckCircle : t.status === 'QUEUED' ? Clock : MessageCircle

                          return (
                            <li
                              key={`thread-${t.id}`}
                              className="group rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-gray-300 hover:shadow-md"
                            >
                              <div className="flex flex-col gap-3">
                                <div className="flex items-start gap-3">
                                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                                    t.status === 'POSTED' ? 'bg-green-100 text-green-600' :
                                    t.status === 'QUEUED' ? 'bg-blue-100 text-blue-600' :
                                    'bg-gray-100 text-gray-600'
                                  }`}>
                                    <StatusIcon className="h-4 w-4" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="mb-2 flex flex-wrap items-center gap-2">
                                      <span className="inline-flex items-center rounded-md bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                                        Thread ({t.tweets?.length || 0})
                                      </span>
                                      <span
                                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClass}`}
                                      >
                                        {badgeLabel}
                                      </span>
                                    </div>
                                    <div className="space-y-2">
                                      {(t.tweets || []).slice(0, 2).map((tweet, idx) => (
                                        <p key={idx} className="text-sm font-medium leading-relaxed text-gray-900">
                                          {idx + 1}. {tweet.length > 80 ? tweet.substring(0, 80) + '...' : tweet}
                                        </p>
                                      ))}
                                      {t.tweets && t.tweets.length > 2 && (
                                        <p className="text-xs italic text-gray-500">
                                          + {t.tweets.length - 2} more tweet{t.tweets.length - 2 !== 1 ? 's' : ''}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500">
                                  <span className="inline-flex items-center gap-1.5">
                                    <Clock className="h-3.5 w-3.5" />
                                    {formatDateTime(t.scheduledAt)}
                                  </span>
                                  {t.status === 'QUEUED' && (
                                    <button
                                      type="button"
                                      onClick={() => cancelScheduledThread(t.id)}
                                      className="inline-flex items-center rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:ring-offset-2"
                                    >
                                      Cancel
                                    </button>
                                  )}
                                </div>
                              </div>
                            </li>
                          )
                        })}
                        {scheduledThreadsPosts.map((tp) => {
                          const badgeClass = statusStyles[tp.status] || 'bg-gray-100 text-gray-600'
                          const badgeLabel = statusLabels[tp.status] || tp.status
                          const StatusIcon = tp.status === 'POSTED' ? CheckCircle : tp.status === 'QUEUED' ? Clock : MessageCircle

                          return (
                            <li
                              key={`threads-post-${tp.id}`}
                              className="group rounded-xl border border-purple-200 bg-white p-4 shadow-sm transition hover:border-purple-300 hover:shadow-md"
                            >
                              <div className="flex flex-col gap-3">
                                <div className="flex items-start gap-3">
                                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                                    tp.status === 'POSTED' ? 'bg-green-100 text-green-600' :
                                    tp.status === 'QUEUED' ? 'bg-purple-100 text-purple-600' :
                                    'bg-gray-100 text-gray-600'
                                  }`}>
                                    <StatusIcon className="h-4 w-4" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="mb-2 flex flex-wrap items-center gap-2">
                                      <span className="inline-flex items-center rounded-md bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700">
                                        Threads Post
                                      </span>
                                      <span
                                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClass}`}
                                      >
                                        {badgeLabel}
                                      </span>
                                    </div>
                                    <p className="text-sm font-medium leading-relaxed text-gray-900">
                                      {tp.text || <span className="italic text-gray-400">No content</span>}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500">
                                  <span className="inline-flex items-center gap-1.5">
                                    <Clock className="h-3.5 w-3.5" />
                                    {formatDateTime(tp.scheduledAt)}
                                  </span>
                                  {tp.status === 'QUEUED' && (
                                    <button
                                      type="button"
                                      onClick={() => cancelScheduledThreadsPost(tp.id)}
                                      className="inline-flex items-center rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:ring-offset-2"
                                    >
                                      Cancel
                                    </button>
                                  )}
                                </div>
                              </div>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Threads Connection Section */}
          <section className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md lg:p-8">
            <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-gradient-to-br from-purple-50 to-pink-50 opacity-50 blur-2xl" />
            <div className="relative">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 text-purple-600">
                    <Hash className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Threads Connection</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Connect your Threads account to schedule posts
                    </p>
                  </div>
                </div>
                {threadsConnection ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 px-4 py-2 text-sm font-semibold text-gray-700 border border-purple-100">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      @{threadsConnection.username || threadsConnection.providerUserId}
                    </span>
                    <button
                      type="button"
                      onClick={disconnectThreads}
                      className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:ring-offset-2"
                    >
                      Disconnect
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={connectThreads}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:ring-offset-2"
                  >
                    <Hash className="h-4 w-4" />
                    Connect Threads
                  </button>
                )}
              </div>

              {threadsConnection && (
                <div className="mt-6 rounded-xl border border-purple-100 bg-purple-50/30 p-4">
                  <p className="text-sm text-gray-700">
                    ✓ Your Threads account is connected. You can now schedule Threads posts from the dashboard.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

export default ProfilePage
