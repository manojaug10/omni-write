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

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
        <App />
      </ClerkProvider>
    </ErrorBoundary>
  </StrictMode>,
)
