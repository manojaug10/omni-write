import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import ErrorBoundary from './components/ErrorBoundary'
import './index.css'
import App from './App.jsx'

// Get the publishable key from environment variables
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

// Error handling for missing Clerk publishable key
if (!PUBLISHABLE_KEY) {
  console.error('Missing VITE_CLERK_PUBLISHABLE_KEY environment variable')
  throw new Error(
    'Missing Clerk Publishable Key. Please add VITE_CLERK_PUBLISHABLE_KEY to your .env file'
  )
}

// Custom Clerk theme matching Teenage Engineering design
const clerkAppearance = {
  baseTheme: undefined,
  variables: {
    colorPrimary: '#ff6b35',
    colorDanger: '#d94d1a',
    colorSuccess: '#4ade80',
    colorWarning: '#ff6b35',
    colorTextOnPrimaryBackground: '#ffffff',
    colorTextSecondary: 'var(--text-2)',
    colorBackground: 'var(--bg-alt)',
    colorInputBackground: 'var(--card)',
    colorInputText: 'var(--text)',
    fontFamily: '"IBM Plex Mono", "Space Mono", "Courier New", monospace',
    fontFamilyButtons: '"IBM Plex Mono", "Space Mono", "Courier New", monospace',
    fontSize: '0.95rem',
    fontWeight: {
      normal: 400,
      medium: 600,
      bold: 700,
    },
    borderRadius: '4px',
    spacingUnit: '1rem',
  },
  elements: {
    rootBox: {
      background: 'var(--bg)',
      width: '100%',
    },
    card: {
      background: 'var(--card)',
      border: '2px solid var(--border)',
      borderRadius: '8px',
      boxShadow: '0 8px 0 var(--shadow)',
      padding: '2.5rem',
      width: '100%',
      margin: '0 auto',
    },
    headerTitle: {
      fontFamily: '"Space Mono", monospace',
      fontSize: '1.75rem',
      fontWeight: 700,
      color: 'var(--text)',
      letterSpacing: '-0.5px',
      marginBottom: '0.75rem',
      textAlign: 'center',
    },
    headerSubtitle: {
      fontFamily: '"IBM Plex Mono", monospace',
      color: 'var(--text-2)',
      fontSize: '1rem',
      lineHeight: 1.6,
      textAlign: 'center',
    },
    socialButtonsBlockButton: {
      background: 'var(--card)',
      border: '2px solid var(--border)',
      borderRadius: '4px',
      boxShadow: '0 4px 0 var(--shadow)',
      color: 'var(--text)',
      fontWeight: 600,
      letterSpacing: '0.5px',
      fontSize: '0.9rem',
      padding: '0.85rem 1.25rem',
      transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
      '&:hover': {
        transform: 'translateY(2px)',
        boxShadow: '0 2px 0 var(--shadow)',
      },
      '&:active': {
        transform: 'translateY(4px)',
        boxShadow: '0 0 0 var(--shadow)',
      },
    },
    formButtonPrimary: {
      background: '#ff6b35',
      color: '#ffffff',
      border: 'none',
      borderRadius: '4px',
      boxShadow: '0 6px 0 #d94d1a',
      fontWeight: 700,
      letterSpacing: '1.5px',
      textTransform: 'uppercase',
      fontSize: '0.9rem',
      padding: '1rem 1.5rem',
      minHeight: '52px',
      transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
      '&:hover': {
        transform: 'translateY(3px)',
        boxShadow: '0 3px 0 #d94d1a',
        background: '#ff6b35',
      },
      '&:active': {
        transform: 'translateY(6px)',
        boxShadow: '0 0 0 #d94d1a',
      },
    },
    formFieldInput: {
      background: 'var(--card)',
      border: '2px solid var(--border)',
      borderRadius: '4px',
      color: 'var(--text)',
      fontSize: '0.95rem',
      padding: '0.85rem 1rem',
      fontFamily: '"IBM Plex Mono", monospace',
      '&:focus': {
        border: '2px solid #ff6b35',
        outline: 'none',
        boxShadow: '0 0 0 3px rgba(255, 107, 53, 0.1)',
      },
    },
    formFieldLabel: {
      color: 'var(--text)',
      fontWeight: 600,
      fontSize: '0.8rem',
      letterSpacing: '1px',
      textTransform: 'uppercase',
      fontFamily: '"IBM Plex Mono", monospace',
      marginBottom: '0.5rem',
    },
    identityPreviewText: {
      fontFamily: '"IBM Plex Mono", monospace',
      fontSize: '0.9rem',
    },
    formResendCodeLink: {
      color: '#ff6b35',
      fontWeight: 600,
      fontSize: '0.9rem',
      fontFamily: '"IBM Plex Mono", monospace',
      '&:hover': {
        color: '#d94d1a',
      },
    },
    footerActionText: {
      color: 'var(--text-2)',
      fontSize: '0.95rem',
      fontFamily: '"IBM Plex Mono", monospace',
    },
    footerActionLink: {
      color: '#ff6b35',
      fontWeight: 600,
      fontSize: '0.95rem',
      fontFamily: '"IBM Plex Mono", monospace',
      '&:hover': {
        color: '#d94d1a',
        textDecoration: 'underline',
      },
    },
    dividerLine: {
      background: 'var(--border)',
      height: '2px',
    },
    dividerText: {
      color: 'var(--text-3)',
      fontSize: '0.75rem',
      textTransform: 'uppercase',
      letterSpacing: '1.5px',
      fontFamily: '"IBM Plex Mono", monospace',
      fontWeight: 600,
      padding: '0 1rem',
    },
    alertText: {
      fontSize: '0.9rem',
      fontFamily: '"IBM Plex Mono", monospace',
      lineHeight: 1.6,
    },
    badge: {
      background: 'rgba(255, 107, 53, 0.15)',
      color: '#ff6b35',
      border: '2px solid rgba(255, 107, 53, 0.3)',
      fontSize: '0.7rem',
      letterSpacing: '1.5px',
      textTransform: 'uppercase',
      fontWeight: 700,
      fontFamily: '"IBM Plex Mono", monospace',
      padding: '0.4rem 0.8rem',
      borderRadius: '4px',
    },
    formFieldRow: {
      gap: '1rem',
    },
    otpCodeFieldInput: {
      background: 'var(--card)',
      border: '2px solid var(--border)',
      borderRadius: '4px',
      color: 'var(--text)',
      fontSize: '1.25rem',
      fontFamily: '"Space Mono", monospace',
      fontWeight: 700,
      '&:focus': {
        border: '2px solid #ff6b35',
        outline: 'none',
        boxShadow: '0 0 0 3px rgba(255, 107, 53, 0.1)',
      },
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '1.25rem',
    },
    formFieldAction: {
      color: '#ff6b35',
      fontWeight: 600,
      fontSize: '0.9rem',
      fontFamily: '"IBM Plex Mono", monospace',
      '&:hover': {
        color: '#d94d1a',
      },
    },
    socialButtons: {
      display: 'flex',
      gap: '1rem',
      marginTop: '1.5rem',
    },
    main: {
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem',
    },
  },
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <ClerkProvider publishableKey={PUBLISHABLE_KEY} appearance={clerkAppearance}>
        <App />
      </ClerkProvider>
    </ErrorBoundary>
  </StrictMode>,
)
