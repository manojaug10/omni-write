import defaultTheme from 'tailwindcss/defaultTheme'

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: '#FF6A00',
        surface: '#F6F6F6',
        ink: '#222222',
      },
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
        mono: ['Space Mono', 'IBM Plex Mono', ...defaultTheme.fontFamily.mono],
      },
      boxShadow: {
        card: '0 6px 14px rgba(0, 0, 0, 0.06)',
      },
      borderRadius: {
        card: '12px',
      },
    },
  },
  plugins: [],
}
