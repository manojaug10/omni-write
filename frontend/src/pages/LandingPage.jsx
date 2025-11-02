import { useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import DarkModeToggle from '../components/DarkModeToggle'

export default function LandingPage() {
  const navigate = useNavigate()
  const { isSignedIn } = useUser()

  const handleGetStarted = () => {
    navigate(isSignedIn ? '/dashboard' : '/sign-up')
  }

  const handleSignIn = () => {
    navigate('/sign-in')
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <header className="site-header">
        <div className="container flex items-center justify-between" style={{ padding: '1.5rem 2rem' }}>
          <div style={{ fontFamily: '"Space Mono", monospace', fontWeight: 700, fontSize: '1.5rem', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text)' }}>
            OMNI WRITES
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <DarkModeToggle />
            <button aria-label={isSignedIn ? 'Go to Dashboard' : 'Join Beta'} onClick={handleGetStarted} className="btn btn-nav">
              {isSignedIn ? 'Dashboard' : 'Join Beta'}
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="px-8 text-center" style={{ padding: '5rem 2rem 4rem', background: 'var(--bg-alt)', marginTop: 80 }}>
        <div className="container-narrow">
          <span className="badge" style={{ marginBottom: '2rem' }}>MVP v0.5 • Early Access</span>
          <h1 className="h1" style={{ marginBottom: '1.5rem', animation: 'fadeInUp 0.8s ease-out 0.2s backwards' }}>
            AI That Actually Knows Your Voice
          </h1>
          <p style={{ fontSize: '1.05rem', color: 'var(--text-2)', lineHeight: 1.8, marginBottom: '2.5rem', maxWidth: 680, marginLeft: 'auto', marginRight: 'auto', animation: 'fadeInUp 0.8s ease-out 0.4s backwards' }}>
            Stop copying bland AI content. Omni Write learns your unique writing style from 1000+ accounts, generates posts that sound like you, and schedules them at the perfect time—all in one platform.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', animation: 'fadeInUp 0.8s ease-out 0.6s backwards' }}>
            <button aria-label="Get early access to Omni Write" onClick={handleGetStarted} className="btn btn-primary" style={{ padding: '1rem 2.5rem' }}>
              Get Early Access
            </button>
            <button aria-label={isSignedIn ? 'Go to Profile' : 'Sign In'} onClick={handleSignIn} className="btn btn-secondary" style={{ padding: '1rem 2.5rem' }}>
              {isSignedIn ? 'Go to Profile' : 'Sign In'}
            </button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-8" id="features" style={{ padding: '5rem 2rem', background: 'var(--bg)' }}>
        <div className="container">
          <div className="text-center" style={{ marginBottom: '4rem' }}>
            <div className="section-label" style={{ marginBottom: '1rem' }}>Core Features</div>
            <h2 className="h2" style={{ color: 'var(--text)' }}>Built for Content Creators</h2>
          </div>

          <div className="features-grid" style={{ marginTop: '3rem' }}>
            {[
              { emoji: '🤖', title: 'Voice Learning AI', desc: 'Analyzes your previous posts across all platforms to understand your unique writing style, tone, and personality—then generates content that sounds like you.' },
              { emoji: '⏰', title: 'Smart Scheduling', desc: 'AI analyzes your audience engagement patterns and suggests optimal posting times personalized to your followers. No more guessing.' },
              { emoji: '✨', title: 'Content Brainstormer', desc: 'Generate fresh content ideas based on your past successful posts using advanced agentic AI. Pick favorites, refine, and perfect.' },
              { emoji: '🎯', title: 'Multi-Platform', desc: 'Write once, publish everywhere. Schedule to 6 major platforms with platform-specific optimization built in.' },
              { emoji: '📊', title: 'Analytics Dashboard', desc: 'Track performance with customizable reports. From professional to playful—get insights that match your style.' },
              { emoji: '🔥', title: 'Gamified Streaks', desc: 'Build your posting streak with Duolingo-style gamification. Turn consistent content creation into a fun habit.' },
            ].map((f, i) => (
              <article key={i} className="card card-feature relative" style={{ padding: '2rem' }} role="article">
                <span className="status-indicator" aria-hidden="true" />
                <div className="icon-box" aria-hidden="true">{f.emoji}</div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem', color: 'var(--text)' }}>{f.title}</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-2)', lineHeight: 1.7 }}>{f.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Platforms */}
      <section className="px-8" style={{ padding: '5rem 2rem', background: 'var(--bg-alt)' }}>
        <div className="container">
          <div className="text-center" style={{ marginBottom: '4rem' }}>
            <div className="section-label" style={{ marginBottom: '1rem' }}>Integrations</div>
            <h2 className="h2" style={{ color: 'var(--text)' }}>Publish Everywhere</h2>
          </div>

          <div className="platforms-grid" style={{ marginTop: '3rem' }}>
            {[
              { name: 'X / Twitter', emoji: '𝕏' },
              { name: 'LinkedIn', emoji: '💼' },
              { name: 'Instagram', emoji: '📸' },
              { name: 'Facebook', emoji: '🔵' },
              { name: 'Threads', emoji: '🧵' },
              { name: 'TikTok', emoji: '🎵' },
            ].map((p, idx) => (
              <div key={idx} className="card card-platform" style={{ padding: '2rem' }}>
                <div className="platform-icon" style={{ marginBottom: '1rem' }} aria-hidden="true">{p.emoji}</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text)' }}>{p.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-8" style={{ padding: '5rem 2rem', background: 'var(--bg)' }}>
        <div className="container">
          <div className="text-center" style={{ marginBottom: '4rem' }}>
            <div className="section-label" style={{ marginBottom: '1rem' }}>Process</div>
            <h2 className="h2" style={{ color: 'var(--text)' }}>How It Works</h2>
          </div>

          <div className="steps-grid" style={{ marginTop: '3rem' }}>
            {[
              { n: 1, title: 'Connect Accounts', desc: 'Link your social media profiles. Our AI analyzes your writing style from past posts.' },
              { n: 2, title: 'Generate Content', desc: 'Use AI to generate ideas in your voice, or write from scratch with AI assistance.' },
              { n: 3, title: 'Schedule Posts', desc: 'Pick optimal times or let AI suggest the best moments to reach your audience.' },
              { n: 4, title: 'Track Performance', desc: 'Monitor results and let AI learn what resonates with your audience.' },
            ].map((s) => (
              <div key={s.n} className="card card-step" style={{ padding: '2rem' }}>
                <div className="step-circle" aria-hidden="true">{s.n}</div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.75rem', color: 'var(--text)' }}>{s.title}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-2)', lineHeight: 1.6 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-8 text-center" style={{ padding: '6rem 2rem', background: 'var(--bg-alt)' }}>
        <div className="container-cta">
          <h2 className="cta-heading" style={{ marginBottom: '1.5rem', color: 'var(--text)' }}>Join the Beta Program</h2>
          <p style={{ fontSize: '1.05rem', color: 'var(--text-2)', lineHeight: 1.8, marginBottom: '2.5rem', maxWidth: 600, marginLeft: 'auto', marginRight: 'auto' }}>
            Be among the first to experience AI-powered content creation that actually understands you. Limited spots available for MVP launch.
          </p>
          <button aria-label="Request access to Omni Writes" onClick={handleGetStarted} className="btn btn-primary" style={{ padding: '1rem 2.5rem', marginBottom: '1.5rem' }}>Request Access</button>
          <div className="badge-cta">Free for Early Adopters • No Credit Card</div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-8 text-center" style={{ padding: '2.5rem 2rem', background: 'var(--black)', color: 'var(--text-3)', fontSize: '0.8rem', letterSpacing: '1px' }}>
        <div className="font-bold uppercase" style={{ color: 'var(--bg-alt)', marginBottom: '0.5rem', letterSpacing: '2px' }}>OMNI WRITES</div>
        <p style={{ marginBottom: '0.5rem', color: 'var(--text-3)' }}>AI-POWERED SOCIAL MEDIA SCHEDULER</p>
        <p style={{ color: 'var(--text-3)' }}>MVP v0.5 • IN DEVELOPMENT</p>
      </footer>
    </div>
  )
}

