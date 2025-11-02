import { useUser, useAuth } from '@clerk/clerk-react'
import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Settings, User, MessageCircle, Hash, Image, Link as LinkIcon, FileText, ChevronDown, Smile, Gift, TagIcon } from 'lucide-react'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

function DashboardPage() {
  const { user, isLoaded } = useUser()
  const { getToken } = useAuth()
  const [xConnection, setXConnection] = useState(null)
  const [threadsConnection, setThreadsConnection] = useState(null)
  const [loading, setLoading] = useState(true)
  const [composeText, setComposeText] = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useState([])
  const [platformTexts, setPlatformTexts] = useState({})
  const [showSectionTwo, setShowSectionTwo] = useState(false)
  const [showSectionThree, setShowSectionThree] = useState(false)
  const [focusedPlatform, setFocusedPlatform] = useState(null)
  const [showScheduleMenu, setShowScheduleMenu] = useState(false)
  const [banner, setBanner] = useState(null)
  const [showProfileModal, setShowProfileModal] = useState(false)

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
      }
    } catch (err) {
      console.error('Failed to fetch Threads connection', err)
    }
  }, [getToken])

  useEffect(() => {
    if (isLoaded && user) {
      Promise.all([fetchXConnection(), fetchThreadsConnection()])
        .finally(() => setLoading(false))
    }
  }, [isLoaded, user, fetchXConnection, fetchThreadsConnection])

  const socialAccounts = [
    {
      id: 'x',
      icon: MessageCircle,
      name: 'X',
      emoji: '𝕏',
      connected: !!xConnection,
      bgColor: '#3b82f6',
    },
    {
      id: 'threads',
      icon: Hash,
      name: 'Threads',
      emoji: '🧵',
      connected: !!threadsConnection,
      bgColor: '#a855f7',
    },
    {
      id: 'instagram',
      icon: Image,
      name: 'Instagram',
      emoji: '📸',
      connected: false,
      bgColor: '#ec4899',
    },
    {
      id: 'linkedin',
      icon: LinkIcon,
      name: 'LinkedIn',
      emoji: '💼',
      connected: false,
      bgColor: '#0ea5e9',
    },
    {
      id: 'facebook',
      icon: FileText,
      name: 'Facebook',
      emoji: '🔵',
      connected: false,
      bgColor: '#6366f1',
    },
  ]

  const togglePlatform = (platformId) => {
    setSelectedPlatforms(prev => {
      const newSelection = prev.includes(platformId)
        ? prev.filter(id => id !== platformId)
        : [...prev, platformId]

      if (!prev.includes(platformId)) {
        setPlatformTexts(prevTexts => ({
          ...prevTexts,
          [platformId]: composeText
        }))
      }

      return newSelection
    })
  }

  const updatePlatformText = (platformId, text) => {
    setPlatformTexts(prev => ({
      ...prev,
      [platformId]: text
    }))
  }

  const handleCustomizeNetwork = () => {
    if (selectedPlatforms.length > 0) {
      setShowSectionTwo(true)
    } else {
      setBanner({ type: 'error', message: 'Please select at least one platform first!' })
    }
  }

  const handleScheduleNow = () => {
    setShowScheduleMenu(false)
    setBanner({ type: 'success', message: 'Post scheduled immediately!' })
  }

  const handleCustomSchedule = () => {
    setShowScheduleMenu(false)
    window.location.href = '/profile'
  }

  const handleSaveAsDraft = () => {
    setShowScheduleMenu(false)
    setBanner({ type: 'success', message: 'Draft saved successfully!' })
  }

  const handlePlatformClick = (platformId) => {
    setFocusedPlatform(platformId)
    setShowSectionThree(true)
    setShowSectionTwo(false)
  }

  const handleBackFromSectionTwo = () => {
    setShowSectionTwo(false)
  }

  const handleBackFromSectionThree = () => {
    setShowSectionThree(false)
    setShowSectionTwo(true)
  }

  if (!isLoaded || loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1rem', color: 'var(--text-2)' }}>Loading...</div>
        </div>
      </div>
    )
  }

  const connectedCount = socialAccounts.filter(a => a.connected).length

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <header className="site-header">
        <div className="container" style={{ padding: '1.5rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: '"Space Mono", monospace', fontWeight: 700, fontSize: '1.5rem', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text)' }}>
            OMNI WRITES
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link to="/connect-accounts" className="btn btn-nav">
              <Settings size={16} />
              Settings
            </Link>
            <button onClick={() => setShowProfileModal(true)} className="btn btn-nav">
              <User size={16} />
              Profile
            </button>
          </div>
        </div>
      </header>

      <main className="container" style={{ padding: '3rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
        {banner && (
          <div className="card" style={{
            padding: '1rem 1.5rem',
            marginBottom: '1.5rem',
            background: banner.type === 'success' ? '#dcfce7' : '#fee2e2',
            border: `2px solid ${banner.type === 'success' ? '#86efac' : '#fca5a5'}`,
            color: banner.type === 'success' ? '#166534' : '#991b1b',
            fontWeight: 600,
            fontSize: '0.85rem'
          }}>
            {banner.message}
          </div>
        )}

        {/* SECTION ONE: Initial Composer */}
        {!showSectionTwo && !showSectionThree && (
          <div className="card" style={{
            padding: '3rem',
            boxShadow: '0 10px 0 var(--shadow)',
            background: 'linear-gradient(135deg, rgba(103, 232, 249, 0.08) 0%, rgba(45, 212, 191, 0.08) 100%), var(--card)'
          }}>
            {/* Platform Selection Circles */}
            {connectedCount > 0 && (
              <div style={{ marginBottom: '2.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                  {socialAccounts.filter(a => a.connected).map((account) => {
                    const isSelected = selectedPlatforms.includes(account.id)

                    return (
                      <button
                        key={account.id}
                        onClick={() => togglePlatform(account.id)}
                        className="card-platform"
                        style={{
                          width: '100px',
                          height: '100px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '1rem',
                          cursor: 'pointer',
                          border: isSelected ? `3px solid ${account.bgColor}` : '2px dashed var(--border)',
                          background: isSelected ? 'var(--card)' : 'transparent',
                          boxShadow: isSelected ? `0 6px 0 var(--shadow)` : 'none',
                          transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                        }}
                      >
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{account.emoji}</div>
                        <div style={{ fontSize: '0.65rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text)' }}>
                          {account.name}
                        </div>
                      </button>
                    )
                  })}
                </div>
                <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-3)', letterSpacing: '0.5px' }}>
                  {selectedPlatforms.length > 0
                    ? `${selectedPlatforms.length} platform${selectedPlatforms.length !== 1 ? 's' : ''} selected • Full borders are active`
                    : 'Click circles to select platforms • Dashed borders are inactive'}
                </p>
              </div>
            )}

            {/* Main Composer */}
            <div className="card" style={{ padding: '2rem', boxShadow: '0 8px 0 var(--shadow)' }}>
              <textarea
                value={composeText}
                onChange={(e) => setComposeText(e.target.value)}
                placeholder="Write here"
                style={{
                  width: '100%',
                  minHeight: '350px',
                  resize: 'none',
                  border: 'none',
                  background: 'transparent',
                  fontFamily: 'inherit',
                  fontSize: '1rem',
                  color: 'var(--text)',
                  outline: 'none',
                  lineHeight: 1.7
                }}
              />

              {/* Bottom Actions */}
              <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '2px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                {/* Shape Buttons - Left */}
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    type="button"
                    className="btn btn-nav"
                    style={{ padding: '0.75rem', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    title="Emojis"
                  >
                    <Smile size={20} />
                  </button>
                  <button
                    type="button"
                    className="btn btn-nav"
                    style={{ padding: '0.75rem', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    title="GIFs"
                  >
                    <Gift size={18} />
                  </button>
                  <button
                    type="button"
                    className="btn btn-nav"
                    style={{ padding: '0.75rem', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    title="Hashtags"
                  >
                    <TagIcon size={18} />
                  </button>
                </div>

                {/* Action Buttons - Right */}
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  {/* Customize Network Button */}
                  <button
                    type="button"
                    onClick={handleCustomizeNetwork}
                    disabled={selectedPlatforms.length === 0}
                    className="btn btn-secondary"
                    style={{ padding: '1rem 2rem', opacity: selectedPlatforms.length === 0 ? 0.5 : 1, cursor: selectedPlatforms.length === 0 ? 'not-allowed' : 'pointer' }}
                  >
                    Customize Network
                  </button>

                  {/* Schedule Now Dropdown */}
                  <div style={{ position: 'relative' }}>
                    <button
                      type="button"
                      onClick={() => setShowScheduleMenu(!showScheduleMenu)}
                      className="btn btn-primary"
                      style={{ padding: '1rem 2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                      Schedule Now
                      <ChevronDown size={16} style={{ transform: showScheduleMenu ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
                    </button>

                    {showScheduleMenu && (
                      <div className="card" style={{
                        position: 'absolute',
                        bottom: '100%',
                        right: 0,
                        marginBottom: '0.5rem',
                        width: '220px',
                        padding: 0,
                        boxShadow: '0 6px 0 var(--shadow)',
                        zIndex: 10
                      }}>
                        <button
                          onClick={handleScheduleNow}
                          style={{
                            width: '100%',
                            padding: '1rem',
                            textAlign: 'left',
                            background: 'transparent',
                            border: 'none',
                            borderBottom: '2px solid var(--border)',
                            fontFamily: 'inherit',
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            color: 'var(--text)',
                            cursor: 'pointer',
                            transition: 'background 0.15s'
                          }}
                          onMouseEnter={(e) => e.target.style.background = 'var(--bg-alt)'}
                          onMouseLeave={(e) => e.target.style.background = 'transparent'}
                        >
                          Schedule Now
                        </button>
                        <button
                          onClick={handleCustomSchedule}
                          style={{
                            width: '100%',
                            padding: '1rem',
                            textAlign: 'left',
                            background: 'transparent',
                            border: 'none',
                            borderBottom: '2px solid var(--border)',
                            fontFamily: 'inherit',
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            color: 'var(--text)',
                            cursor: 'pointer',
                            transition: 'background 0.15s'
                          }}
                          onMouseEnter={(e) => e.target.style.background = 'var(--bg-alt)'}
                          onMouseLeave={(e) => e.target.style.background = 'transparent'}
                        >
                          Custom Schedule
                        </button>
                        <button
                          onClick={handleSaveAsDraft}
                          style={{
                            width: '100%',
                            padding: '1rem',
                            textAlign: 'left',
                            background: 'transparent',
                            border: 'none',
                            fontFamily: 'inherit',
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            color: 'var(--text)',
                            cursor: 'pointer',
                            transition: 'background 0.15s'
                          }}
                          onMouseEnter={(e) => e.target.style.background = 'var(--bg-alt)'}
                          onMouseLeave={(e) => e.target.style.background = 'transparent'}
                        >
                          Save as Draft
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* No Platforms Connected */}
            {connectedCount === 0 && (
              <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                <p style={{ marginBottom: '1.5rem', fontSize: '0.85rem', color: 'var(--text-2)' }}>
                  No social media accounts connected yet.
                </p>
                <Link to="/connect-accounts" className="btn btn-primary" style={{ padding: '1rem 2rem' }}>
                  Connect Accounts
                </Link>
              </div>
            )}
          </div>
        )}

        {/* SECTION TWO: All Platform Composers */}
        {showSectionTwo && !showSectionThree && (
          <div className="card" style={{
            padding: '3rem 2.5rem',
            boxShadow: '0 10px 0 var(--shadow)',
            background: 'linear-gradient(135deg, #67e8f9 0%, #2dd4bf 100%)',
            position: 'relative'
          }}>
            {/* Back Button */}
            <div style={{ marginBottom: '2rem' }}>
              <button onClick={handleBackFromSectionTwo} className="btn btn-nav">
                ← Back to Composer
              </button>
            </div>

            {/* Text Label on Right */}
            <div style={{
              position: 'absolute',
              right: '2rem',
              top: '3rem',
              fontSize: '0.9rem',
              fontWeight: 600,
              color: 'var(--text)',
              maxWidth: '200px',
              textAlign: 'right'
            }}>
              Active Social Media that user want to work on
            </div>

            {/* Platform Cards with Purple Circles */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '700px' }}>
              {selectedPlatforms.map((platformId) => {
                const account = socialAccounts.find(a => a.id === platformId)
                if (!account) return null

                return (
                  <div
                    key={platformId}
                    className="card"
                    style={{
                      padding: '1.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1.5rem',
                      boxShadow: '0 6px 0 var(--shadow)',
                      background: 'var(--card)'
                    }}
                  >
                    {/* Purple Circle */}
                    <div style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      background: '#a855f7',
                      flexShrink: 0
                    }} />

                    {/* Textarea */}
                    <textarea
                      value={platformTexts[platformId] || ''}
                      onChange={(e) => updatePlatformText(platformId, e.target.value)}
                      placeholder="Write here"
                      onClick={() => handlePlatformClick(platformId)}
                      style={{
                        flex: 1,
                        minHeight: '60px',
                        resize: 'none',
                        border: 'none',
                        background: 'transparent',
                        fontFamily: 'inherit',
                        fontSize: '0.95rem',
                        color: 'var(--text)',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* SECTION THREE: Single Platform Focus */}
        {showSectionThree && focusedPlatform && (
          <div className="card" style={{
            padding: '3rem',
            boxShadow: '0 10px 0 var(--shadow)',
            background: 'linear-gradient(135deg, rgba(103, 232, 249, 0.08) 0%, rgba(45, 212, 191, 0.08) 100%), var(--card)'
          }}>
            <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text)', fontFamily: '"Space Mono", monospace' }}>
                {socialAccounts.find(a => a.id === focusedPlatform)?.name} Composer
              </h2>
              <button onClick={handleBackFromSectionThree} className="btn btn-nav">
                ← Back to All
              </button>
            </div>

            {/* Focused Platform Icon */}
            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'center' }}>
              <div style={{ fontSize: '4rem' }}>
                {socialAccounts.find(a => a.id === focusedPlatform)?.emoji}
              </div>
            </div>

            {/* Focused Composer */}
            <div className="card" style={{ padding: '2rem', boxShadow: '0 8px 0 var(--shadow)' }}>
              <textarea
                value={platformTexts[focusedPlatform] || ''}
                onChange={(e) => updatePlatformText(focusedPlatform, e.target.value)}
                placeholder="Write here"
                style={{
                  width: '100%',
                  minHeight: '300px',
                  resize: 'none',
                  border: 'none',
                  background: 'transparent',
                  fontFamily: 'inherit',
                  fontSize: '1rem',
                  color: 'var(--text)',
                  outline: 'none',
                  lineHeight: 1.7
                }}
              />

              {/* Bottom Actions */}
              <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '2px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                {/* Shape Buttons */}
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button type="button" className="btn btn-nav" style={{ padding: '0.75rem', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Emojis">
                    <Smile size={20} />
                  </button>
                  <button type="button" className="btn btn-nav" style={{ padding: '0.75rem', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="GIFs">
                    <Gift size={18} />
                  </button>
                  <button type="button" className="btn btn-nav" style={{ padding: '0.75rem', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Hashtags">
                    <TagIcon size={18} />
                  </button>
                </div>

                {/* Schedule Button */}
                <div style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() => setShowScheduleMenu(!showScheduleMenu)}
                    className="btn btn-primary"
                    style={{ padding: '1rem 2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    Schedule Now
                    <ChevronDown size={16} style={{ transform: showScheduleMenu ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
                  </button>

                  {showScheduleMenu && (
                    <div className="card" style={{ position: 'absolute', bottom: '100%', right: 0, marginBottom: '0.5rem', width: '220px', padding: 0, boxShadow: '0 6px 0 var(--shadow)', zIndex: 10 }}>
                      <button onClick={handleScheduleNow} style={{ width: '100%', padding: '1rem', textAlign: 'left', background: 'transparent', border: 'none', borderBottom: '2px solid var(--border)', fontFamily: 'inherit', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text)', cursor: 'pointer' }} onMouseEnter={(e) => e.target.style.background = 'var(--bg-alt)'} onMouseLeave={(e) => e.target.style.background = 'transparent'}>Schedule Now</button>
                      <button onClick={handleCustomSchedule} style={{ width: '100%', padding: '1rem', textAlign: 'left', background: 'transparent', border: 'none', borderBottom: '2px solid var(--border)', fontFamily: 'inherit', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text)', cursor: 'pointer' }} onMouseEnter={(e) => e.target.style.background = 'var(--bg-alt)'} onMouseLeave={(e) => e.target.style.background = 'transparent'}>Custom Schedule</button>
                      <button onClick={handleSaveAsDraft} style={{ width: '100%', padding: '1rem', textAlign: 'left', background: 'transparent', border: 'none', fontFamily: 'inherit', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text)', cursor: 'pointer' }} onMouseEnter={(e) => e.target.style.background = 'var(--bg-alt)'} onMouseLeave={(e) => e.target.style.background = 'transparent'}>Save as Draft</button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Stacked Other Platforms */}
            {selectedPlatforms.length > 1 && (
              <div style={{ marginTop: '2rem' }}>
                <p style={{ marginBottom: '1rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-3)' }}>
                  Other Selected Platforms
                </p>
                <div style={{ position: 'relative', height: '80px', maxWidth: '600px', margin: '0 auto' }}>
                  {selectedPlatforms.filter(id => id !== focusedPlatform).map((platformId, index) => (
                    <button
                      key={platformId}
                      onClick={() => setFocusedPlatform(platformId)}
                      className="card"
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        width: '100%',
                        height: '60px',
                        cursor: 'pointer',
                        boxShadow: '0 6px 0 var(--shadow)',
                        transform: `translateY(${index * 6}px) translateX(${index * 6}px)`,
                        zIndex: 10 - index,
                        transition: 'transform 0.2s'
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Profile Modal */}
      {showProfileModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '2rem'
          }}
          onClick={() => setShowProfileModal(false)}
        >
          <div
            className="card"
            style={{
              maxWidth: '600px',
              width: '100%',
              maxHeight: '80vh',
              overflowY: 'auto',
              padding: '2.5rem',
              boxShadow: '0 20px 0 var(--shadow)',
              background: 'var(--card)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text)', fontFamily: '"Space Mono", monospace' }}>
                Profile
              </h2>
              <button
                onClick={() => setShowProfileModal(false)}
                className="btn btn-nav"
                style={{ padding: '0.5rem 1rem' }}
              >
                Close
              </button>
            </div>

            {/* User Info */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-3)', marginBottom: '0.5rem' }}>
                Name
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text)', marginBottom: '1.5rem' }}>
                {user?.firstName || 'Not set'} {user?.lastName || ''}
              </div>

              <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-3)', marginBottom: '0.5rem' }}>
                Email
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text)', marginBottom: '1.5rem' }}>
                {user?.primaryEmailAddress?.emailAddress || 'Not set'}
              </div>

              <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-3)', marginBottom: '0.5rem' }}>
                User ID
              </div>
              <div style={{ fontSize: '0.85rem', fontFamily: 'monospace', color: 'var(--text-2)', marginBottom: '1.5rem', wordBreak: 'break-all' }}>
                {user?.id || 'Not set'}
              </div>

              <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-3)', marginBottom: '0.5rem' }}>
                Member Since
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text)' }}>
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not available'}
              </div>
            </div>

            {/* Connected Accounts */}
            <div style={{ paddingTop: '2rem', borderTop: '2px solid var(--border)' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text)', marginBottom: '1rem' }}>
                Connected Accounts
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {xConnection && (
                  <div className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 4px 0 var(--shadow)' }}>
                    <div style={{ fontSize: '1.5rem' }}>𝕏</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>X (Twitter)</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>@{xConnection.username}</div>
                    </div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--success)', letterSpacing: '1px' }}>CONNECTED</div>
                  </div>
                )}
                {threadsConnection && (
                  <div className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 4px 0 var(--shadow)' }}>
                    <div style={{ fontSize: '1.5rem' }}>🧵</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>Threads</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>@{threadsConnection.username}</div>
                    </div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--success)', letterSpacing: '1px' }}>CONNECTED</div>
                  </div>
                )}
                {!xConnection && !threadsConnection && (
                  <div style={{ padding: '1.5rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-3)' }}>
                    No accounts connected yet
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ marginTop: '2rem', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <Link to="/connect-accounts" className="btn btn-secondary" style={{ padding: '0.75rem 1.5rem' }} onClick={() => setShowProfileModal(false)}>
                Manage Accounts
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DashboardPage
