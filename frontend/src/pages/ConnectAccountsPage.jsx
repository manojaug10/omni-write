import { useNavigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { useState, useCallback, useEffect } from 'react'
import { Sparkles, CheckCircle, Clock } from 'lucide-react'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

function ConnectAccountsPage() {
  const navigate = useNavigate()
  const { getToken } = useAuth()
  const [xConnection, setXConnection] = useState(null)
  const [threadsConnection, setThreadsConnection] = useState(null)
  const [loading, setLoading] = useState(true)
  const [banner, setBanner] = useState(null)

  const fetchConnections = useCallback(async () => {
    try {
      setLoading(true)
      const token = await getToken()

      // Fetch X connection
      const xResp = await fetch(`${API_BASE_URL}/api/x/connection`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      })
      if (xResp.ok) {
        const xData = await xResp.json()
        setXConnection(xData.connection)
      }

      // Fetch Threads connection
      const threadsResp = await fetch(`${API_BASE_URL}/api/threads/connection`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      })
      if (threadsResp.ok) {
        const threadsData = await threadsResp.json()
        setThreadsConnection(threadsData.connection)
      }
    } catch (err) {
      console.error('Failed to fetch connections', err)
    } finally {
      setLoading(false)
    }
  }, [getToken])

  useEffect(() => {
    fetchConnections()
  }, [fetchConnections])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const xStatus = params.get('x_oauth')
    const threadsStatus = params.get('threads')
    const message = params.get('message')

    if (xStatus === 'success') {
      setBanner({ type: 'success', message: 'Twitter account connected successfully.' })
      fetchConnections()
      const url = new URL(window.location.href)
      url.searchParams.delete('x_oauth')
      url.searchParams.delete('message')
      window.history.replaceState({}, '', url.toString())
    } else if (xStatus === 'error') {
      setBanner({ type: 'error', message: message || 'Failed to connect Twitter account.' })
    }

    if (threadsStatus === 'connected') {
      setBanner({ type: 'success', message: 'Threads account connected successfully.' })
      fetchConnections()
      const url = new URL(window.location.href)
      url.searchParams.delete('threads')
      url.searchParams.delete('message')
      window.history.replaceState({}, '', url.toString())
    } else if (threadsStatus === 'error') {
      setBanner({ type: 'error', message: message || 'Failed to connect Threads account.' })
    }
  }, [fetchConnections])

  const connectTwitter = useCallback(async () => {
    try {
      const token = await getToken()
      const redirect = `${window.location.origin}/connect-accounts`
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

  const connectThreads = useCallback(async () => {
    try {
      const token = await getToken()
      const redirect = `${window.location.origin}/connect-accounts`
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

  const handleComingSoon = () => {
    setBanner({ type: 'info', message: 'This platform will be available soon! Stay tuned.' })
  }

  const handleRequestOther = () => {
    setBanner({ type: 'info', message: 'Feature coming soon! You\'ll be able to request new platform integrations.' })
  }

  const handleContinue = () => {
    navigate('/dashboard')
  }

  const platforms = [
    {
      id: 'x',
      name: 'X / Twitter',
      emoji: '𝕏',
      available: true,
      connected: !!xConnection,
      onClick: connectTwitter
    },
    {
      id: 'threads',
      name: 'Threads',
      emoji: '🧵',
      available: true,
      connected: !!threadsConnection,
      onClick: connectThreads
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      emoji: '💼',
      available: false,
      connected: false,
      onClick: handleComingSoon
    },
    {
      id: 'facebook',
      name: 'Facebook',
      emoji: '🔵',
      available: false,
      connected: false,
      onClick: handleComingSoon
    },
    {
      id: 'instagram',
      name: 'Instagram',
      emoji: '📸',
      available: false,
      connected: false,
      onClick: handleComingSoon
    },
    {
      id: 'tiktok',
      name: 'TikTok',
      emoji: '🎵',
      available: false,
      connected: false,
      onClick: handleComingSoon
    },
  ]

  const bannerClasses =
    banner?.type === 'success'
      ? 'border-emerald-200 bg-emerald-50/80 text-emerald-700'
      : banner?.type === 'info'
      ? 'border-sky-200 bg-sky-50/80 text-sky-700'
      : 'border-rose-200 bg-rose-50/80 text-rose-700'

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-gray-600" />
          <p className="text-sm font-medium" style={{ color: 'var(--text-2)' }}>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <header className="site-header">
        <div className="container flex items-center justify-between" style={{ padding: '1.5rem 2rem' }}>
          <div style={{ fontFamily: '"Space Mono", monospace', fontWeight: 700, fontSize: '1.5rem', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text)' }}>
            OMNI WRITES
          </div>
          <button
            onClick={handleContinue}
            className="btn btn-nav"
          >
            Skip for Now
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container" style={{ paddingTop: '120px', paddingBottom: '4rem' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 2rem' }}>
          {/* Header Section */}
          <div className="text-center" style={{ marginBottom: '3rem' }}>
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
              <Sparkles size={48} style={{ color: 'var(--accent)' }} />
            </div>
            <h1 className="h1" style={{ marginBottom: '1rem', color: 'var(--text)' }}>
              Connect Your Social Media Accounts
            </h1>
            <p style={{ fontSize: '1.05rem', color: 'var(--text-2)', lineHeight: 1.8, maxWidth: '600px', margin: '0 auto' }}>
              Link your accounts to start scheduling posts, analyzing your audience, and growing your presence across platforms.
            </p>
          </div>

          {/* Banner */}
          {banner && (
            <div className={`rounded-xl border px-5 py-4 text-sm font-semibold shadow-sm mb-6 ${bannerClasses}`} style={{ animation: 'fadeInDown 0.3s ease-out' }}>
              {banner.message}
            </div>
          )}

          {/* Platforms Container */}
          <div
            className="card"
            style={{
              padding: '3rem 2.5rem',
              background: 'linear-gradient(135deg, rgba(103, 232, 249, 0.08) 0%, rgba(45, 212, 191, 0.08) 100%)',
              borderColor: 'rgba(103, 232, 249, 0.3)',
              boxShadow: '0 10px 0 var(--shadow)',
            }}
          >
            <div className="platforms-grid" style={{ gap: '1.5rem' }}>
              {platforms.map((platform, idx) => (
                <button
                  key={platform.id}
                  onClick={platform.onClick}
                  disabled={platform.connected}
                  className="card card-platform"
                  style={{
                    position: 'relative',
                    cursor: platform.connected ? 'default' : 'pointer',
                    opacity: platform.available ? 1 : 0.6,
                    animationDelay: `${idx * 0.1}s`,
                    padding: '2rem 1.5rem',
                  }}
                >
                  {platform.connected && (
                    <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem' }}>
                      <CheckCircle size={20} style={{ color: 'var(--success)' }} />
                    </div>
                  )}
                  {!platform.available && (
                    <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem' }}>
                      <Clock size={18} style={{ color: 'var(--text-3)' }} />
                    </div>
                  )}
                  <div className="platform-icon" style={{ marginBottom: '1rem' }}>
                    {platform.emoji}
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text)' }}>
                    {platform.name}
                  </div>
                  {platform.connected && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.7rem', color: 'var(--success)', fontWeight: 600, letterSpacing: '1px' }}>
                      CONNECTED
                    </div>
                  )}
                  {!platform.available && !platform.connected && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.7rem', color: 'var(--text-3)', fontWeight: 600, letterSpacing: '1px' }}>
                      COMING SOON
                    </div>
                  )}
                </button>
              ))}

              {/* Request Others Card */}
              <button
                onClick={handleRequestOther}
                className="card card-platform"
                style={{
                  animationDelay: `${platforms.length * 0.1}s`,
                  padding: '2rem 1.5rem',
                  borderStyle: 'dashed',
                  borderColor: 'var(--border)',
                }}
              >
                <div className="platform-icon" style={{ marginBottom: '1rem' }}>
                  ✨
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text)' }}>
                  Request others
                </div>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ marginTop: '3rem', display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={handleContinue}
              className="btn btn-primary"
              style={{ padding: '1rem 2.5rem' }}
            >
              Continue to Dashboard
            </button>
          </div>

          {/* Helper Text */}
          <p style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-3)', letterSpacing: '0.5px' }}>
            You can always connect more accounts later from your profile settings
          </p>
        </div>
      </main>
    </div>
  )
}

export default ConnectAccountsPage
