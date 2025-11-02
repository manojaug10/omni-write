import { SignIn } from '@clerk/clerk-react'
import { Link } from 'react-router-dom'
import DarkModeToggle from '../components/DarkModeToggle'

function SignInPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', position: 'relative' }}>
      {/* Dark Mode Toggle - Top Right */}
      <div style={{ position: 'absolute', top: '2rem', right: '2rem' }}>
        <DarkModeToggle />
      </div>

      <div style={{ width: '100%', maxWidth: '650px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem', animation: 'fadeInDown 0.6s ease-out' }}>
          <div style={{
            width: '100px',
            height: '100px',
            margin: '0 auto 2rem',
            background: 'var(--dark)',
            borderRadius: '8px',
            boxShadow: '0 8px 0 var(--black)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2.5rem'
          }}>
            ✍️
          </div>
          <h1 style={{
            fontFamily: '"Space Mono", monospace',
            fontSize: '2.25rem',
            fontWeight: 700,
            color: 'var(--text)',
            marginBottom: '0.75rem',
            letterSpacing: '-0.5px'
          }}>
            OMNI WRITES
          </h1>
          <p style={{
            color: 'var(--text-2)',
            fontSize: '1rem',
            fontFamily: '"IBM Plex Mono", monospace',
            lineHeight: 1.6,
            maxWidth: '500px',
            margin: '0 auto'
          }}>
            Welcome back! Sign in to continue.
          </p>
        </div>

        {/* Auth Toggle */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '2.5rem',
          padding: '0.5rem',
          background: 'var(--bg-alt)',
          border: '2px solid var(--border)',
          borderRadius: '6px',
          animation: 'fadeInUp 0.6s ease-out 0.2s backwards'
        }}>
          <Link
            to="/sign-in"
            style={{
              flex: 1,
              textAlign: 'center',
              padding: '1rem',
              background: 'var(--accent)',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.9rem',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              borderRadius: '4px',
              boxShadow: '0 5px 0 var(--accent-dark)',
              textDecoration: 'none',
              fontFamily: '"IBM Plex Mono", monospace'
            }}
          >
            Sign In
          </Link>
          <Link
            to="/sign-up"
            style={{
              flex: 1,
              textAlign: 'center',
              padding: '1rem',
              background: 'transparent',
              color: 'var(--text-2)',
              fontWeight: 600,
              fontSize: '0.9rem',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              borderRadius: '4px',
              textDecoration: 'none',
              transition: 'all 0.2s',
              fontFamily: '"IBM Plex Mono", monospace'
            }}
          >
            Sign Up
          </Link>
        </div>

        {/* Clerk Sign In */}
        <div style={{ animation: 'fadeInUp 0.6s ease-out 0.4s backwards' }}>
          <SignIn
            path="/sign-in"
            routing="path"
            signUpUrl="/sign-up"
            afterSignInUrl="/"
          />
        </div>
      </div>
    </div>
  )
}

export default SignInPage
