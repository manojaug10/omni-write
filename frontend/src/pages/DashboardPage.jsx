import { useUser, useAuth } from '@clerk/clerk-react'
import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, TrendingUp, Send, CheckCircle, Clock, MessageCircle, Hash, BarChart3 } from 'lucide-react'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const formatDateTime = (value) => {
  if (!value) return 'Not set'
  try {
    const date = new Date(value)
    const now = new Date()
    const diffInHours = (date - now) / (1000 * 60 * 60)

    if (diffInHours < 24 && diffInHours > -24) {
      return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    }
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch {
    return 'Not set'
  }
}

const statusConfig = {
  QUEUED: { label: 'Scheduled', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Clock },
  POSTED: { label: 'Published', color: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle },
  FAILED: { label: 'Failed', color: 'bg-red-50 text-red-700 border-red-200', icon: MessageCircle },
  CANCELLED: { label: 'Cancelled', color: 'bg-gray-50 text-gray-700 border-gray-200', icon: MessageCircle },
}

function DashboardPage() {
  const { user, isLoaded } = useUser()
  const { getToken } = useAuth()
  const [xConnection, setXConnection] = useState(null)
  const [scheduled, setScheduled] = useState([])
  const [scheduledThreads, setScheduledThreads] = useState([])
  const [loading, setLoading] = useState(true)

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
      }
    } catch (err) {
      console.error('Failed to fetch X connection', err)
    }
  }, [getToken])

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
    if (isLoaded && user) {
      Promise.all([fetchXConnection(), loadScheduled(), loadScheduledThreads()])
        .finally(() => setLoading(false))
    }
  }, [isLoaded, user, fetchXConnection, loadScheduled, loadScheduledThreads])

  const queuedCount = scheduled.filter((s) => s.status === 'QUEUED').length +
                      scheduledThreads.filter((t) => t.status === 'QUEUED').length
  const postedCount = scheduled.filter((s) => s.status === 'POSTED').length +
                      scheduledThreads.filter((t) => t.status === 'POSTED').length
  const totalPosts = scheduled.length + scheduledThreads.length

  const allScheduled = [
    ...scheduled.map(s => ({ ...s, type: 'tweet', itemType: 'Single Tweet' })),
    ...scheduledThreads.map(t => ({ ...t, type: 'thread', itemType: 'Thread' }))
  ].sort((a, b) => new Date(a.scheduledAt || 0) - new Date(b.scheduledAt || 0))

  if (!isLoaded || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
          <p className="text-sm font-medium text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="border-b border-white/60 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="mt-1 text-sm text-gray-600">
                Welcome back, {user?.firstName || 'there'}! Here's your content overview.
              </p>
            </div>
            <Link
              to="/profile"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl hover:scale-105"
            >
              <Send className="h-4 w-4" />
              Compose Post
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats Grid */}
        <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Scheduled Posts */}
          <div className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md">
            <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 opacity-50 blur-2xl" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                  <Clock className="h-6 w-6" />
                </div>
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-600">Scheduled</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{queuedCount}</p>
                <p className="mt-1 text-xs text-gray-500">Posts in queue</p>
              </div>
            </div>
          </div>

          {/* Published Posts */}
          <div className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md">
            <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-gradient-to-br from-green-100 to-green-50 opacity-50 blur-2xl" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-600">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-600">Published</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{postedCount}</p>
                <p className="mt-1 text-xs text-gray-500">Successfully posted</p>
              </div>
            </div>
          </div>

          {/* Total Posts */}
          <div className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md">
            <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-gradient-to-br from-purple-100 to-purple-50 opacity-50 blur-2xl" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-600">Total Posts</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{totalPosts}</p>
                <p className="mt-1 text-xs text-gray-500">All time created</p>
              </div>
            </div>
          </div>

          {/* Connection Status */}
          <div className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md">
            <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-50 opacity-50 blur-2xl" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                  <MessageCircle className="h-6 w-6" />
                </div>
                <div className={`flex h-3 w-3 rounded-full ${xConnection ? 'bg-green-500' : 'bg-gray-300'}`} />
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-600">Connections</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{xConnection ? '1' : '0'}</p>
                <p className="mt-1 text-xs text-gray-500">
                  {xConnection ? `@${xConnection.username || 'Connected'}` : 'No accounts linked'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Posts Timeline - 2 columns */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Scheduled Posts</h2>
                    <p className="text-sm text-gray-500">Your upcoming content</p>
                  </div>
                </div>
                <Link
                  to="/profile"
                  className="text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  View all →
                </Link>
              </div>

              {/* Posts List */}
              {allScheduled.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 py-16">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                    <Calendar className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-gray-900">No posts scheduled</h3>
                  <p className="mt-2 max-w-sm text-center text-sm text-gray-600">
                    Start by creating your first post and scheduling it for the perfect time.
                  </p>
                  <Link
                    to="/profile"
                    className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    <Send className="h-4 w-4" />
                    Create Post
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {allScheduled.slice(0, 6).map((item, index) => {
                    const config = statusConfig[item.status] || statusConfig.QUEUED
                    const StatusIcon = config.icon

                    return (
                      <div
                        key={`${item.type}-${item.id}`}
                        className="group rounded-xl border border-gray-100 bg-gradient-to-br from-white to-gray-50/50 p-5 transition hover:border-gray-200 hover:shadow-md"
                      >
                        <div className="flex gap-4">
                          {/* Status Indicator */}
                          <div className="flex flex-col items-center">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                              item.status === 'POSTED' ? 'bg-green-100 text-green-600' :
                              item.status === 'QUEUED' ? 'bg-blue-100 text-blue-600' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              <StatusIcon className="h-5 w-5" />
                            </div>
                            {index < allScheduled.slice(0, 6).length - 1 && (
                              <div className="mt-2 h-full w-px bg-gray-200" />
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="mb-3 flex flex-wrap items-center gap-2">
                              <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold ${config.color}`}>
                                {config.label}
                              </span>
                              <span className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700">
                                <Hash className="h-3 w-3" />
                                {item.itemType}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatDateTime(item.scheduledAt)}
                              </span>
                            </div>

                            {/* Post Content */}
                            {item.type === 'tweet' ? (
                              <div className="rounded-lg bg-white p-4 shadow-sm">
                                <p className="text-sm leading-relaxed text-gray-900">
                                  {item.text?.substring(0, 200)}
                                  {item.text?.length > 200 && '...'}
                                </p>
                              </div>
                            ) : (
                              <div className="space-y-2 rounded-lg bg-white p-4 shadow-sm">
                                <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-gray-600">
                                  <MessageCircle className="h-3.5 w-3.5" />
                                  Thread with {item.tweets?.length || 0} tweets
                                </div>
                                {(item.tweets || []).slice(0, 2).map((tweet, idx) => (
                                  <div key={idx} className="flex gap-2">
                                    <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">
                                      {idx + 1}
                                    </span>
                                    <p className="text-sm leading-relaxed text-gray-700">
                                      {tweet.substring(0, 120)}{tweet.length > 120 && '...'}
                                    </p>
                                  </div>
                                ))}
                                {item.tweets && item.tweets.length > 2 && (
                                  <p className="pl-7 text-xs italic text-gray-500">
                                    +{item.tweets.length - 2} more tweets
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - 1 column */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  to="/profile"
                  className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:shadow-lg hover:scale-[1.02]"
                >
                  <Send className="h-4 w-4" />
                  New Post
                </Link>
                <Link
                  to="/profile"
                  className="flex items-center gap-3 rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
                >
                  <Calendar className="h-4 w-4" />
                  View Calendar
                </Link>
                {!xConnection && (
                  <Link
                    to="/profile"
                    className="flex items-center gap-3 rounded-xl border-2 border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Connect Account
                  </Link>
                )}
              </div>
            </div>

            {/* Account Status */}
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">Connected Accounts</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                      xConnection ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
                    }`}>
                      <MessageCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">X (Twitter)</p>
                      {xConnection && (
                        <p className="text-xs text-gray-600">@{xConnection.username || 'Connected'}</p>
                      )}
                    </div>
                  </div>
                  <div className={`h-2.5 w-2.5 rounded-full ${xConnection ? 'bg-green-500' : 'bg-gray-300'}`} />
                </div>
              </div>
              {!xConnection && (
                <p className="mt-4 text-xs text-gray-500">
                  Connect your X account to start scheduling posts
                </p>
              )}
            </div>

            {/* Stats Summary */}
            <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 p-6 text-white shadow-lg">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide opacity-90">This Week</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm opacity-90">Posts scheduled</span>
                  <span className="text-xl font-bold">{queuedCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm opacity-90">Posts published</span>
                  <span className="text-xl font-bold">{postedCount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default DashboardPage
