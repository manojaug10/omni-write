import { useUser, useAuth } from '@clerk/clerk-react'
import { useState, useEffect, useCallback, useMemo } from 'react'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const PREVIEW_USER = {
  firstName: 'Avery',
  lastName: 'Hart',
  username: 'avery.writes',
  primaryEmailAddress: { emailAddress: 'avery@example.com' },
  id: 'user_01H9PREVIEW',
  createdAt: '2024-01-16T12:45:00.000Z',
  profileImageUrl: '',
}

const PREVIEW_DB_USER = {
  id: 'clu_01h9preview',
  clerkId: 'user_01H9PREVIEW',
  email: 'avery@example.com',
  name: 'Avery Hart',
  createdAt: '2024-01-16T13:05:00.000Z',
  updatedAt: '2024-03-02T09:22:00.000Z',
}

const PREVIEW_SCHEDULED_TWEETS = [
  {
    id: 'tweet_preview_1',
    text: 'Drafting product launch copy for next Tuesday — any final metrics we should highlight?',
    scheduledAt: '2024-03-08T15:30:00.000Z',
    status: 'QUEUED',
  },
  {
    id: 'tweet_preview_2',
    text: 'Shipping a small but mighty dashboard update today. ✨',
    scheduledAt: '2024-03-05T11:00:00.000Z',
    status: 'SENT',
  },
]

const PREVIEW_SCHEDULED_THREADS = [
  {
    id: 'thread_preview_1',
    tweets: [
      'Launching a behind-the-scenes thread on our AI-assisted writing workflow.',
      'From prompt templates to QA — here’s what keeps the content sharp.',
      'Bonus: a checklist you can copy into your own process.',
    ],
    scheduledAt: '2024-03-12T18:15:00.000Z',
    status: 'QUEUED',
  },
]

const PREVIEW_CONNECTION = {
  username: 'omniwrite_team',
  providerUserId: '1234567890',
}

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
  QUEUED: 'bg-sky-400/15 text-sky-200 ring-1 ring-inset ring-sky-400/40',
  CANCELLED: 'bg-slate-400/10 text-slate-300 ring-1 ring-inset ring-slate-400/40',
  FAILED: 'bg-rose-400/15 text-rose-200 ring-1 ring-inset ring-rose-400/40',
  SENT: 'bg-emerald-400/15 text-emerald-200 ring-1 ring-inset ring-emerald-400/40',
  POSTED: 'bg-emerald-400/15 text-emerald-200 ring-1 ring-inset ring-emerald-400/40',
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
  const [loading, setLoading] = useState(false)
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

  const previewMode = !user
  const profileUser = previewMode ? PREVIEW_USER : user

  const connectTwitter = useCallback(async () => {
    try {
      if (previewMode) {
        setBanner({ type: 'error', message: 'Sign in to connect your Twitter account.' })
        return
      }
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
  }, [getToken, previewMode])

  const disconnectTwitter = useCallback(async () => {
    try {
      if (previewMode) {
        setBanner({ type: 'error', message: 'Sign in to disconnect Twitter.' })
        return
      }
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
  }, [getToken, previewMode])

  const [composeText, setComposeText] = useState('')
  const [scheduleAt, setScheduleAt] = useState('')
  const [scheduled, setScheduled] = useState([])
  const [composeMode, setComposeMode] = useState('tweet') // 'tweet' or 'thread'
  const [threadTweets, setThreadTweets] = useState(['', ''])
  const [scheduledThreads, setScheduledThreads] = useState([])

  const displayName = useMemo(() => {
    if (!profileUser) {
      return 'Your profile'
    }

    const fullName = [profileUser.firstName, profileUser.lastName].filter(Boolean).join(' ')
    return fullName || profileUser.username || profileUser.primaryEmailAddress?.emailAddress || 'Your profile'
  }, [profileUser])

  const avatarInitial = useMemo(() => {
    const source = displayName || profileUser?.primaryEmailAddress?.emailAddress || ''
    return source ? source.charAt(0).toUpperCase() : '?'
  }, [displayName, profileUser])

  const truncatedUserId = useMemo(() => {
    if (!profileUser?.id) {
      return ''
    }

    if (profileUser.id.length <= 12) {
      return profileUser.id
    }

    return `${profileUser.id.slice(0, 6)}…${profileUser.id.slice(-4)}`
  }, [profileUser])

  const accountDetails = useMemo(() => {
    if (!profileUser) {
      return []
    }

    const fullName = [profileUser.firstName, profileUser.lastName].filter(Boolean).join(' ') || 'Not set'

    return [
      { label: 'Name', value: fullName },
      { label: 'Email', value: profileUser.primaryEmailAddress?.emailAddress || 'Not set' },
      { label: 'Username', value: profileUser.username || 'Not set' },
      { label: 'User ID', value: profileUser.id, isMono: true },
      { label: 'Joined', value: formatDateOnly(profileUser.createdAt) },
    ]
  }, [profileUser])

  const displayDbUser = previewMode ? PREVIEW_DB_USER : dbUser

  const databaseDetails = useMemo(() => {
    if (!displayDbUser) {
      return []
    }

    return [
      { label: 'Database ID', value: displayDbUser.id, isMono: true },
      { label: 'Clerk ID', value: displayDbUser.clerkId, isMono: true },
      { label: 'Email', value: displayDbUser.email },
      { label: 'Name', value: displayDbUser.name || 'Not set' },
      { label: 'Created', value: formatDateTime(displayDbUser.createdAt) },
      { label: 'Updated', value: formatDateTime(displayDbUser.updatedAt) },
    ]
  }, [displayDbUser])

  const queuedCount = useMemo(
    () => (previewMode ? PREVIEW_SCHEDULED_TWEETS : scheduled).filter((item) => item.status === 'QUEUED').length,
    [previewMode, scheduled]
  )

  const heroStats = useMemo(
    () => [
      { label: 'Member Since', value: formatDateOnly(profileUser?.createdAt) },
      { label: 'Queued Tweets', value: queuedCount.toString() },
      {
        label: 'Last Sync',
        value: displayDbUser?.updatedAt ? formatDateTime(displayDbUser.updatedAt) : 'Awaiting sync',
      },
    ],
    [profileUser, queuedCount, displayDbUser]
  )

  const connectionRecord = previewMode ? PREVIEW_CONNECTION : xConnection

  const connectionHandle = connectionRecord
    ? connectionRecord.username || connectionRecord.providerUserId
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
      if (previewMode) {
        setBanner({ type: 'error', message: 'Sign in to schedule tweets.' })
        return
      }
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
  }, [composeText, scheduleAt, getToken, loadScheduled, previewMode])

  const cancelScheduled = useCallback(async (id) => {
    try {
      if (previewMode) {
        setBanner({ type: 'error', message: 'Sign in to manage scheduled tweets.' })
        return
      }
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
  }, [getToken, loadScheduled, previewMode])

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
      if (previewMode) {
        setBanner({ type: 'error', message: 'Sign in to schedule threads.' })
        return
      }
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
  }, [threadTweets, scheduleAt, getToken, loadScheduledThreads, previewMode])

  const cancelScheduledThread = useCallback(async (id) => {
    try {
      if (previewMode) {
        setBanner({ type: 'error', message: 'Sign in to manage scheduled threads.' })
        return
      }
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
  }, [getToken, loadScheduledThreads, previewMode])

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

  const scheduledTweetsDisplay = previewMode ? PREVIEW_SCHEDULED_TWEETS : scheduled
  const scheduledThreadsDisplay = previewMode ? PREVIEW_SCHEDULED_THREADS : scheduledThreads

  const bannerClasses =
    banner?.type === 'success'
      ? 'border-emerald-400/60 bg-emerald-400/10 text-emerald-100'
      : 'border-rose-400/60 bg-rose-400/10 text-rose-100'

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-12 h-72 w-72 rounded-full bg-indigo-500/40 blur-3xl" />
        <div className="absolute right-[-10%] top-[-18%] h-80 w-80 rounded-full bg-purple-500/35 blur-[140px]" />
        <div className="absolute bottom-[-30%] left-1/3 h-96 w-96 rounded-full bg-sky-500/30 blur-[160px]" />
      </div>
      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-12">
        {previewMode && (
          <div className="mb-10 flex items-start gap-3 rounded-3xl border border-amber-400/30 bg-amber-400/10 px-6 py-4 text-sm text-amber-100 shadow-xl backdrop-blur">
            <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full border border-amber-300/50 text-[10px] font-semibold uppercase tracking-[0.3em]">
              Demo
            </span>
            <p className="flex-1 text-sm font-medium tracking-tight">
              You&apos;re viewing sample data. Sign in to Omni Write to manage your live profile and schedules.
            </p>
          </div>
        )}

        {banner && (
          <div
            className={`mb-10 flex items-start gap-3 rounded-3xl border px-6 py-4 text-sm shadow-2xl backdrop-blur ${bannerClasses}`}
          >
            <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/30 text-[10px] font-semibold uppercase tracking-[0.3em]">
              {banner.type === 'success' ? 'OK' : 'ERR'}
            </span>
            <p className="flex-1 text-sm font-medium tracking-tight">{banner.message}</p>
          </div>
        )}

        {error && (
          <div className="mb-10 flex items-start gap-3 rounded-3xl border border-rose-400/60 bg-rose-500/10 px-6 py-4 text-sm text-rose-100 shadow-2xl backdrop-blur">
            <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full border border-rose-300/60 text-[10px] font-semibold uppercase tracking-[0.3em]">
              ERR
            </span>
            <p className="flex-1 text-sm font-medium tracking-tight">{error}</p>
          </div>
        )}

        <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-slate-900/90 via-slate-900/55 to-slate-900/30 shadow-[0_40px_120px_-45px_rgba(15,23,42,0.9)]">
          <div className="absolute -right-32 -top-32 h-72 w-72 rounded-full bg-indigo-500/40 blur-3xl" />
          <div className="absolute bottom-[-35%] right-10 h-64 w-64 rounded-full bg-sky-400/25 blur-[140px]" />
          <div className="relative grid gap-10 p-10 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-6">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-8">
                <div className="relative shrink-0">
                  {profileUser?.profileImageUrl ? (
                    <img
                      src={profileUser.profileImageUrl}
                      alt={`${displayName}'s profile`}
                      className="h-24 w-24 rounded-[28px] border-2 border-white/40 object-cover shadow-xl"
                    />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-[28px] border-2 border-white/30 bg-white/10 text-3xl font-semibold uppercase tracking-wide">
                      {avatarInitial}
                    </div>
                  )}
                  <div className="absolute -bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/20 bg-slate-950/70 px-4 py-1 text-[11px] font-medium uppercase tracking-[0.35em] text-slate-200">
                    Profile
                  </div>
                </div>
                <div className="space-y-3">
                  <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{displayName}</h1>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300/90">
                    {profileUser?.primaryEmailAddress?.emailAddress && <span>{profileUser.primaryEmailAddress.emailAddress}</span>}
                    {profileUser?.username && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-slate-100">
                        @{profileUser.username}
                      </span>
                    )}
                    {truncatedUserId && (
                      <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-200">
                        <span>ID</span>
                        <code title={profileUser.id} className="font-mono text-slate-100">
                          {truncatedUserId}
                        </code>
                      </span>
                    )}
                  </div>
                  <p className="max-w-xl text-sm text-slate-300/80">
                    Manage your Omni Write identity, check database sync details, and keep tabs on scheduled content—all from a single, modern workspace.
                  </p>
                </div>
              </div>
            </div>
            <aside className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              {heroStats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-left shadow-lg backdrop-blur"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-300/80">
                    {stat.label}
                  </p>
                  <p className="mt-3 text-lg font-semibold text-white">{stat.value}</p>
                </div>
              ))}
            </aside>
          </div>
        </section>

        <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
          <div className="space-y-10">
            <article className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-xl backdrop-blur">
              <header>
                <h2 className="text-lg font-semibold text-white">Account snapshot</h2>
                <p className="mt-2 text-sm text-slate-300/80">Live details synced from your Clerk profile.</p>
              </header>
              <dl className="mt-6 divide-y divide-white/5">
                {accountDetails.map(({ label, value, isMono }) => {
                  const display = value ?? 'Not set'
                  const isPlaceholder = display === 'Not set' || display === ''
                  const valueClass = [
                    'text-sm leading-6',
                    isMono ? 'font-mono text-[13px] text-slate-200' : 'font-semibold text-slate-50',
                    isPlaceholder ? 'font-normal italic text-slate-400' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')

                  return (
                    <div key={label} className="grid gap-y-1 gap-x-6 py-4 sm:grid-cols-[160px_1fr]">
                      <dt className="text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-400/80">
                        {label}
                      </dt>
                      <dd className={valueClass}>{display || '—'}</dd>
                    </div>
                  )
                })}
              </dl>
            </article>

            <article className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-xl backdrop-blur">
              <header>
                <h2 className="text-lg font-semibold text-white">Database record</h2>
                <p className="mt-2 text-sm text-slate-300/80">
                  These values mirror what is stored on the Omni Write servers.
                </p>
              </header>

              {displayDbUser ? (
                <dl className="mt-6 divide-y divide-white/5">
                  {databaseDetails.map(({ label, value, isMono }) => {
                    const display = value ?? 'Not set'
                    const isPlaceholder = display === 'Not set' || display === ''
                    const valueClass = [
                      'text-sm leading-6',
                      isMono ? 'font-mono text-[13px] text-slate-200' : 'font-semibold text-slate-50',
                      isPlaceholder ? 'font-normal italic text-slate-400' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')

                    return (
                      <div key={label} className="grid gap-y-1 gap-x-6 py-4 sm:grid-cols-[160px_1fr]">
                        <dt className="text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-400/80">
                          {label}
                        </dt>
                        <dd className={valueClass}>{display || '—'}</dd>
                      </div>
                    )
                  })}
                </dl>
              ) : (
                <div className="mt-6 rounded-2xl border border-dashed border-white/20 bg-slate-950/40 p-6 text-sm leading-6 text-slate-300/80">
                  Profile not synced to the database yet. This usually resolves a few moments after signup.
                </div>
              )}
            </article>
          </div>

          <article className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-xl backdrop-blur">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">X (Twitter) connection</h3>
                <p className="mt-2 text-sm text-slate-300/80">
                  Connect your account to queue posts directly from Omni Write.
                </p>
              </div>
              {connectionRecord ? (
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-slate-950/40 px-4 py-2 text-sm font-semibold text-slate-100">
                    @{connectionHandle}
                  </span>
                  <button
                    type="button"
                    onClick={disconnectTwitter}
                    className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-white/40 hover:text-white focus:outline-none focus:ring-2 focus:ring-rose-400/50 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={previewMode}
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={connectTwitter}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 to-sky-500 px-5 py-2 text-sm font-semibold text-white shadow-lg transition hover:from-indigo-400 hover:to-sky-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/60 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={previewMode}
                >
                  Connect account
                </button>
              )}
            </div>

            <p className="mt-4 text-xs uppercase tracking-[0.35em] text-slate-400/80">
              To edit profile details, use the menu in the top-right corner.
            </p>

            {connectionRecord && (
              <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h4 className="text-base font-semibold text-white">
                        Compose {composeMode === 'tweet' ? 'tweet' : 'thread'}
                      </h4>
                      <p className="mt-1 text-sm text-slate-300/80">
                        Draft a post and choose when it should go live.
                      </p>
                    </div>
                    <div className="inline-flex rounded-full border border-white/10 bg-slate-950/40 p-1 shadow-inner">
                      <button
                        type="button"
                        onClick={() => setComposeMode('tweet')}
                        className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                          composeMode === 'tweet'
                            ? 'bg-gradient-to-r from-indigo-500 to-sky-500 text-white shadow-lg'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        Tweet
                      </button>
                      <button
                        type="button"
                        onClick={() => setComposeMode('thread')}
                        className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                          composeMode === 'thread'
                            ? 'bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow-lg'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        Thread
                      </button>
                    </div>
                  </div>

                  {composeMode === 'tweet' ? (
                    <form onSubmit={submitSchedule} className="flex flex-col gap-5">
                      <textarea
                        value={composeText}
                        onChange={(e) => setComposeText(e.target.value)}
                        rows={6}
                        className="w-full resize-none rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-100 shadow-inner placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 disabled:cursor-not-allowed disabled:opacity-70"
                        disabled={previewMode}
                        placeholder="What would you like to share?"
                      />
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        <input
                          type="datetime-local"
                          value={scheduleAt}
                          onChange={(e) => setScheduleAt(e.target.value)}
                          className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-2 text-sm text-slate-100 shadow-sm placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
                          disabled={previewMode}
                        />
                        <button
                          type="submit"
                          className="inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-500 to-sky-500 px-5 py-2 text-sm font-semibold text-white shadow-lg transition hover:from-indigo-400 hover:to-sky-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/60 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                          disabled={previewMode || !composeText || !scheduleAt}
                        >
                          Schedule tweet
                        </button>
                      </div>
                    </form>
                  ) : (
                    <form onSubmit={submitThreadSchedule} className="flex flex-col gap-5">
                      <div className="space-y-4">
                        {threadTweets.map((tweet, index) => (
                          <div key={index} className="flex items-start gap-3">
                            <div className="flex flex-col items-center gap-2 pt-1.5">
                              <div className="flex h-7 w-7 items-center justify-center rounded-full border border-indigo-400/60 bg-indigo-500/20 text-xs font-bold text-indigo-100">
                                {index + 1}
                              </div>
                              {index < threadTweets.length - 1 && <div className="h-full w-px flex-1 bg-white/10" />}
                            </div>
                            <div className="flex-1">
                              <textarea
                                value={tweet}
                                onChange={(e) => updateThreadTweet(index, e.target.value)}
                                rows={3}
                                className="w-full resize-none rounded-2xl border border-white/10 bg-slate-950/60 p-3 text-sm text-slate-100 shadow-inner placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 disabled:cursor-not-allowed disabled:opacity-70"
                                disabled={previewMode}
                                placeholder={`Tweet ${index + 1}`}
                              />
                            </div>
                            {threadTweets.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeThreadTweet(index)}
                                className="mt-2 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-slate-300 transition hover:border-rose-400/70 hover:bg-rose-500/20 hover:text-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                                disabled={previewMode}
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
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-white/15 bg-slate-950/40 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-indigo-300/70 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={previewMode}
                      >
                        + Add tweet
                      </button>
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        <input
                          type="datetime-local"
                          value={scheduleAt}
                          onChange={(e) => setScheduleAt(e.target.value)}
                          className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-2 text-sm text-slate-100 shadow-sm placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
                          disabled={previewMode}
                        />
                        <button
                          type="submit"
                          className="inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-violet-500 to-indigo-500 px-5 py-2 text-sm font-semibold text-white shadow-lg transition hover:from-violet-400 hover:to-indigo-400 focus:outline-none focus:ring-2 focus:ring-violet-400/60 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                          disabled={previewMode || !scheduleAt || threadTweets.every((t) => !t.trim())}
                        >
                          Schedule thread
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                <div className="flex flex-col gap-4">
                  <div>
                    <h4 className="text-base font-semibold text-white">Scheduled posts</h4>
                    <p className="mt-1 text-sm text-slate-300/80">
                      A quick look at everything queued from Omni Write.
                    </p>
                  </div>
                {scheduledTweetsDisplay.length === 0 && scheduledThreadsDisplay.length === 0 ? (
                    <div className="flex min-h-[160px] items-center justify-center rounded-2xl border border-dashed border-white/20 bg-slate-950/40 p-6 text-center text-sm text-slate-300/80">
                      Nothing scheduled yet. Your upcoming posts will appear here.
                    </div>
                  ) : (
                    <ul className="space-y-4">
                    {scheduledTweetsDisplay.map((s) => {
                        const badgeClass = statusStyles[s.status] || 'bg-slate-400/10 text-slate-200'
                        const badgeLabel = statusLabels[s.status] || s.status

                        return (
                          <li
                            key={`tweet-${s.id}`}
                            className="rounded-2xl border border-white/10 bg-slate-950/50 p-4 shadow-lg"
                          >
                            <div className="flex flex-col gap-3">
                              <div className="flex items-start gap-2">
                                <span className="mt-0.5 inline-flex items-center rounded-full bg-sky-400/10 px-3 py-0.5 text-xs font-semibold text-sky-200">
                                  Tweet
                                </span>
                                <p className="flex-1 text-sm font-medium leading-relaxed text-slate-100">
                                  {s.text || <span className="italic text-slate-400">No content</span>}
                                </p>
                              </div>
                              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300/80">
                                <span>{formatDateTime(s.scheduledAt)}</span>
                                <div className="flex items-center gap-3">
                                  <span
                                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${badgeClass}`}
                                  >
                                    {badgeLabel}
                                  </span>
                                  {s.status === 'QUEUED' && (
                                    <button
                                      type="button"
                                      onClick={() => cancelScheduled(s.id)}
                                      className="inline-flex items-center rounded-full border border-white/20 px-3 py-1 text-xs font-medium text-slate-200 transition hover:border-white/40 hover:text-white focus:outline-none focus:ring-2 focus:ring-rose-400/50 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
                                      disabled={previewMode}
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
                    {scheduledThreadsDisplay.map((t) => {
                        const badgeClass = statusStyles[t.status] || 'bg-slate-400/10 text-slate-200'
                        const badgeLabel = statusLabels[t.status] || t.status

                        return (
                          <li
                            key={`thread-${t.id}`}
                            className="rounded-2xl border border-white/10 bg-slate-950/50 p-4 shadow-lg"
                          >
                            <div className="flex flex-col gap-3">
                              <div className="flex items-start gap-2">
                                <span className="mt-0.5 inline-flex items-center rounded-full bg-violet-400/10 px-3 py-0.5 text-xs font-semibold text-violet-200">
                                  Thread ({t.tweets?.length || 0})
                                </span>
                                <div className="flex-1 space-y-2">
                                  {(t.tweets || []).slice(0, 2).map((tweet, idx) => (
                                    <p key={idx} className="text-sm font-medium leading-relaxed text-slate-100">
                                      {idx + 1}. {tweet.length > 80 ? `${tweet.substring(0, 80)}…` : tweet}
                                    </p>
                                  ))}
                                  {t.tweets && t.tweets.length > 2 && (
                                    <p className="text-xs italic text-slate-400">
                                      + {t.tweets.length - 2} more tweet{t.tweets.length - 2 !== 1 ? 's' : ''}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300/80">
                                <span>{formatDateTime(t.scheduledAt)}</span>
                                <div className="flex items-center gap-3">
                                  <span
                                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${badgeClass}`}
                                  >
                                    {badgeLabel}
                                  </span>
                                  {t.status === 'QUEUED' && (
                                    <button
                                      type="button"
                                      onClick={() => cancelScheduledThread(t.id)}
                                      className="inline-flex items-center rounded-full border border-white/20 px-3 py-1 text-xs font-medium text-slate-200 transition hover:border-white/40 hover:text-white focus:outline-none focus:ring-2 focus:ring-rose-400/50 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
                                      disabled={previewMode}
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
          </article>
        </div>
      </div>
    </main>
  )
}

export default ProfilePage
