import { useUser, useAuth } from '@clerk/clerk-react'
import { useState, useEffect, useCallback, useMemo } from 'react'

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
  }, [fetchXConnection])

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

  const [composeText, setComposeText] = useState('')
  const [scheduleAt, setScheduleAt] = useState('')
  const [scheduled, setScheduled] = useState([])
  const [composeMode, setComposeMode] = useState('tweet') // 'tweet' or 'thread'
  const [threadTweets, setThreadTweets] = useState(['', ''])
  const [scheduledThreads, setScheduledThreads] = useState([])

  const displayName = useMemo(() => {
    if (!user) {
      return ''
    }

    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ')
    return fullName || user.username || user.primaryEmailAddress?.emailAddress || 'Your profile'
  }, [user])

  const truncatedUserId = useMemo(() => {
    if (!user?.id) {
      return ''
    }

    if (user.id.length <= 12) {
      return user.id
    }

    return `${user.id.slice(0, 6)}…${user.id.slice(-4)}`
  }, [user])

  const accountDetails = useMemo(() => {
    if (!user) {
      return []
    }

    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Not set'

    return [
      { label: 'Name', value: fullName },
      { label: 'Email', value: user.primaryEmailAddress?.emailAddress || 'Not set' },
      { label: 'Username', value: user.username || 'Not set' },
      { label: 'User ID', value: user.id, isMono: true },
      { label: 'Joined', value: formatDateOnly(user.createdAt) },
    ]
  }, [user])

  const databaseDetails = useMemo(() => {
    if (!dbUser) {
      return []
    }

    return [
      { label: 'Database ID', value: dbUser.id, isMono: true },
      { label: 'Clerk ID', value: dbUser.clerkId, isMono: true },
      { label: 'Email', value: dbUser.email },
      { label: 'Name', value: dbUser.name || 'Not set' },
      { label: 'Created', value: formatDateTime(dbUser.createdAt) },
      { label: 'Updated', value: formatDateTime(dbUser.updatedAt) },
    ]
  }, [dbUser])

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

  useEffect(() => {
    if (xConnection) {
      loadScheduledThreads()
    }
  }, [xConnection, loadScheduledThreads])

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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-500" aria-hidden />
          <p className="text-sm font-medium text-indigo-700">We&apos;re getting your profile ready…</p>
        </div>
      </div>
    )
  }

  const bannerClasses =
    banner?.type === 'success'
      ? 'border-emerald-200 bg-emerald-50/80 text-emerald-700'
      : 'border-rose-200 bg-rose-50/80 text-rose-700'

  return (
    <main className="px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-10">
        {banner && (
          <div className={`rounded-3xl border px-5 py-4 text-sm font-medium shadow-sm ${bannerClasses}`}>
            {banner.message}
          </div>
        )}

        <section className="relative overflow-hidden rounded-3xl bg-slate-900 text-white shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-sky-500 opacity-90" />
          <div className="absolute -top-24 -left-16 h-56 w-56 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute -bottom-24 -right-12 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="relative z-10 p-8 sm:p-10">
            <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-6">
                {user?.profileImageUrl ? (
                  <img
                    src={user.profileImageUrl}
                    alt={`${displayName}'s profile`}
                    className="h-20 w-20 rounded-3xl border-2 border-white/70 shadow-lg"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-3xl border-2 border-white/40 bg-white/10 text-2xl font-semibold uppercase tracking-wide">
                    {displayName.charAt(0)}
                  </div>
                )}

                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-white/60">Profile</p>
                  <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                    {displayName}
                  </h1>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-white/80">
                    {user?.primaryEmailAddress?.emailAddress && (
                      <span>{user.primaryEmailAddress.emailAddress}</span>
                    )}
                    {truncatedUserId && (
                      <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.23em] text-white/80 backdrop-blur">
                        <span>ID</span>
                        <code title={user.id} className="font-mono text-white">
                          {truncatedUserId}
                        </code>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid w-full gap-4 sm:w-auto sm:grid-cols-3">
                {heroStats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl bg-white/15 px-4 py-3 text-left backdrop-blur-sm"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
                      {stat.label}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
            <header>
              <h2 className="text-lg font-semibold text-slate-900">Account Information</h2>
              <p className="mt-1 text-sm text-slate-500">
                Live details synced from your Clerk profile.
              </p>
            </header>
            <dl className="mt-6 space-y-5">
              {accountDetails.map(({ label, value, isMono }) => {
                const display = value ?? 'Not set'
                const isPlaceholder = display === 'Not set' || display === ''
                const valueClass = [
                  'text-sm leading-6',
                  isMono ? 'font-mono text-[13px] text-slate-700' : 'font-medium text-slate-900',
                  isPlaceholder ? 'font-normal italic text-slate-400' : '',
                ]
                  .filter(Boolean)
                  .join(' ')

                return (
                  <div
                    key={label}
                    className="grid grid-cols-[minmax(130px,auto)_1fr] items-start gap-x-4 gap-y-1"
                  >
                    <dt className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                      {label}
                    </dt>
                    <dd className={valueClass}>{display || '—'}</dd>
                  </div>
                )
              })}
            </dl>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
            <header>
              <h2 className="text-lg font-semibold text-slate-900">Database Profile</h2>
              <p className="mt-1 text-sm text-slate-500">
                Your Omni Write record stored in our database.
              </p>
            </header>
            {error ? (
              <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-sm text-rose-700">
                {error}
              </div>
            ) : databaseDetails.length ? (
              <dl className="mt-6 space-y-5">
                {databaseDetails.map(({ label, value, isMono }) => {
                  const display = value ?? 'Not set'
                  const isPlaceholder = display === 'Not set' || display === ''
                  const valueClass = [
                    'text-sm leading-6',
                    isMono ? 'font-mono text-[13px] text-slate-700' : 'font-medium text-slate-900',
                    isPlaceholder ? 'font-normal italic text-slate-400' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')

                  return (
                    <div
                      key={label}
                      className="grid grid-cols-[minmax(130px,auto)_1fr] items-start gap-x-4 gap-y-1"
                    >
                      <dt className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                        {label}
                      </dt>
                      <dd className={valueClass}>{display || '—'}</dd>
                    </div>
                  )
                })}
              </dl>
            ) : (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-6 text-sm leading-6 text-slate-500">
                Profile not synced to the database yet. This usually resolves a few moments after
                signup.
              </div>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">X (Twitter) connection</h3>
              <p className="mt-1 text-sm text-slate-500">
                Connect your account to queue posts directly from Omni Write.
              </p>
            </div>
            {xConnection ? (
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
                  @{connectionHandle}
                </span>
                <button
                  type="button"
                  onClick={disconnectTwitter}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-400 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:ring-offset-2"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={connectTwitter}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:ring-offset-2"
              >
                Connect account
              </button>
            )}
          </div>

          <p className="mt-4 text-xs uppercase tracking-[0.3em] text-slate-400">
            To edit profile details, use the menu in the top-right corner.
          </p>

          {xConnection && (
            <div className="mt-8 grid gap-8 lg:grid-cols-2">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-base font-semibold text-slate-900">
                      Compose {composeMode === 'tweet' ? 'tweet' : 'thread'}
                    </h4>
                    <p className="mt-1 text-sm text-slate-500">
                      Draft a post and choose when it should go live.
                    </p>
                  </div>
                  <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 p-1">
                    <button
                      type="button"
                      onClick={() => setComposeMode('tweet')}
                      className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                        composeMode === 'tweet'
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Tweet
                    </button>
                    <button
                      type="button"
                      onClick={() => setComposeMode('thread')}
                      className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                        composeMode === 'thread'
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Thread
                    </button>
                  </div>
                </div>

                {composeMode === 'tweet' ? (
                  <form onSubmit={submitSchedule} className="flex flex-col gap-4">
                    <textarea
                      value={composeText}
                      onChange={(e) => setComposeText(e.target.value)}
                      rows={6}
                      className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-900 shadow-inner transition focus:border-indigo-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
                      placeholder="What would you like to share?"
                    />
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                      <input
                        type="datetime-local"
                        value={scheduleAt}
                        onChange={(e) => setScheduleAt(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm transition focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-200 sm:w-auto"
                      />
                      <button
                        type="submit"
                        className="inline-flex w-full items-center justify-center rounded-2xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:ring-offset-2 sm:w-auto"
                        disabled={!composeText || !scheduleAt}
                      >
                        Schedule tweet
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={submitThreadSchedule} className="flex flex-col gap-4">
                    <div className="space-y-3">
                      {threadTweets.map((tweet, index) => (
                        <div key={index} className="flex gap-2">
                          <div className="flex flex-col items-center gap-2 pt-4">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                              {index + 1}
                            </div>
                            {index < threadTweets.length - 1 && (
                              <div className="h-full w-0.5 flex-1 bg-slate-200" />
                            )}
                          </div>
                          <div className="flex-1">
                            <textarea
                              value={tweet}
                              onChange={(e) => updateThreadTweet(index, e.target.value)}
                              rows={3}
                              className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50/70 p-3 text-sm text-slate-900 shadow-inner transition focus:border-indigo-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
                              placeholder={`Tweet ${index + 1}`}
                            />
                          </div>
                          {threadTweets.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeThreadTweet(index)}
                              className="mt-3 h-8 w-8 rounded-full border border-slate-300 text-slate-400 transition hover:border-rose-400 hover:bg-rose-50 hover:text-rose-600"
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
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/50 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-indigo-300 hover:bg-indigo-50/50 hover:text-indigo-700"
                    >
                      + Add tweet
                    </button>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                      <input
                        type="datetime-local"
                        value={scheduleAt}
                        onChange={(e) => setScheduleAt(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm transition focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-200 sm:w-auto"
                      />
                      <button
                        type="submit"
                        className="inline-flex w-full items-center justify-center rounded-2xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:ring-offset-2 sm:w-auto"
                        disabled={!scheduleAt || threadTweets.every(t => !t.trim())}
                      >
                        Schedule thread
                      </button>
                    </div>
                  </form>
                )}
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <h4 className="text-base font-semibold text-slate-900">Scheduled posts</h4>
                  <p className="mt-1 text-sm text-slate-500">
                    A quick look at everything queued from Omni Write.
                  </p>
                </div>
                {scheduled.length === 0 && scheduledThreads.length === 0 ? (
                  <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-6 text-center text-sm text-slate-500">
                    Nothing scheduled yet. Your upcoming posts will appear here.
                  </div>
                ) : (
                  <ul className="space-y-4">
                    {scheduled.map((s) => {
                      const badgeClass = statusStyles[s.status] || 'bg-slate-100 text-slate-600'
                      const badgeLabel = statusLabels[s.status] || s.status

                      return (
                        <li
                          key={`tweet-${s.id}`}
                          className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 shadow-sm"
                        >
                          <div className="flex flex-col gap-3">
                            <div className="flex items-start gap-2">
                              <span className="mt-0.5 inline-flex items-center rounded-md bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-700">
                                Tweet
                              </span>
                              <p className="flex-1 text-sm font-medium leading-relaxed text-slate-900">
                                {s.text || <span className="italic text-slate-400">No content</span>}
                              </p>
                            </div>
                            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                              <span>{formatDateTime(s.scheduledAt)}</span>
                              <div className="flex items-center gap-3">
                                <span
                                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1 font-semibold ${badgeClass}`}
                                >
                                  {badgeLabel}
                                </span>
                                {s.status === 'QUEUED' && (
                                  <button
                                    type="button"
                                    onClick={() => cancelScheduled(s.id)}
                                    className="inline-flex items-center rounded-full border border-slate-300 px-3 py-1 font-medium text-slate-600 transition hover:border-slate-400 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:ring-offset-2"
                                  >
                                    Cancel
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </li>
                      )
                    })}
                    {scheduledThreads.map((t) => {
                      const badgeClass = statusStyles[t.status] || 'bg-slate-100 text-slate-600'
                      const badgeLabel = statusLabels[t.status] || t.status

                      return (
                        <li
                          key={`thread-${t.id}`}
                          className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 shadow-sm"
                        >
                          <div className="flex flex-col gap-3">
                            <div className="flex items-start gap-2">
                              <span className="mt-0.5 inline-flex items-center rounded-md bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                                Thread ({t.tweets?.length || 0})
                              </span>
                              <div className="flex-1 space-y-2">
                                {(t.tweets || []).slice(0, 2).map((tweet, idx) => (
                                  <p key={idx} className="text-sm font-medium leading-relaxed text-slate-900">
                                    {idx + 1}. {tweet.length > 80 ? tweet.substring(0, 80) + '...' : tweet}
                                  </p>
                                ))}
                                {t.tweets && t.tweets.length > 2 && (
                                  <p className="text-xs italic text-slate-500">
                                    + {t.tweets.length - 2} more tweet{t.tweets.length - 2 !== 1 ? 's' : ''}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                              <span>{formatDateTime(t.scheduledAt)}</span>
                              <div className="flex items-center gap-3">
                                <span
                                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1 font-semibold ${badgeClass}`}
                                >
                                  {badgeLabel}
                                </span>
                                {t.status === 'QUEUED' && (
                                  <button
                                    type="button"
                                    onClick={() => cancelScheduledThread(t.id)}
                                    className="inline-flex items-center rounded-full border border-slate-300 px-3 py-1 font-medium text-slate-600 transition hover:border-slate-400 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:ring-offset-2"
                                  >
                                    Cancel
                                  </button>
                                )}
                              </div>
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
        </section>
      </div>
    </main>
  )
}

export default ProfilePage
