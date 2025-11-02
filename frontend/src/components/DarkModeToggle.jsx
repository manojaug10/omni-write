import { useEffect, useState } from 'react'

function DarkModeToggle() {
  const [isDark, setIsDark] = useState(() => {
    // Check localStorage or system preference
    const stored = localStorage.getItem('theme')
    if (stored) {
      return stored === 'dark'
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    // Apply theme to document
    if (isDark) {
      document.documentElement.setAttribute('data-theme', 'dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.removeAttribute('data-theme')
      localStorage.setItem('theme', 'light')
    }
  }, [isDark])

  const toggleTheme = () => {
    setIsDark(!isDark)
  }

  return (
    <button
      onClick={toggleTheme}
      className="dark-mode-toggle"
      data-active={isDark}
      aria-label="Toggle dark mode"
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <div className="dark-mode-toggle-slider">
        {isDark ? '🌙' : '☀️'}
      </div>
    </button>
  )
}

export default DarkModeToggle
