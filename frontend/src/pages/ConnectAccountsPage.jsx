import { useNavigate } from 'react-router-dom'
import { MessageCircle, Linkedin, Facebook, Instagram, Send } from 'lucide-react'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

function ConnectAccountsPage() {
  const navigate = useNavigate()

  const handleConnectX = () => {
    window.location.href = `${API_BASE_URL}/api/auth/x/authorize`
  }

  const handleConnectThreads = () => {
    window.location.href = `${API_BASE_URL}/api/auth/threads`
  }

  const handleComingSoon = (platform) => {
    alert(`${platform} integration coming soon!`)
  }

  const handleSkip = () => {
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'monospace' }}>
              Omni Writes
            </h1>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/profile')}
                className="px-4 py-2 rounded-lg border-2 border-cyan-500 text-cyan-600 font-medium hover:bg-cyan-50 transition-colors"
              >
                Settings
              </button>
              <button
                onClick={() => navigate('/profile')}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium hover:from-purple-700 hover:to-indigo-700 transition-colors"
              >
                Profile
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl">
          <div className="bg-gradient-to-br from-cyan-100 to-cyan-200 rounded-2xl shadow-lg border-2 border-cyan-300 p-8 sm:p-12">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              Connect Your Social Media Accounts
            </h2>

            <div className="space-y-4 max-w-md mx-auto">
              {/* X (Twitter) - Functional */}
              <button
                onClick={handleConnectX}
                className="w-full py-4 px-6 bg-white border-2 border-gray-300 rounded-xl text-gray-900 font-semibold text-lg hover:border-sky-500 hover:bg-sky-50 transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-3"
              >
                <MessageCircle className="w-6 h-6 text-sky-500" />
                X (twitter)
              </button>

              {/* Threads - Functional */}
              <button
                onClick={handleConnectThreads}
                className="w-full py-4 px-6 bg-white border-2 border-gray-300 rounded-xl text-gray-900 font-semibold text-lg hover:border-purple-500 hover:bg-purple-50 transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-3"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8zm-1-13h2v6h-2V7zm0 8h2v2h-2v-2z"/>
                </svg>
                Threads
              </button>

              {/* LinkedIn - Coming Soon */}
              <button
                onClick={() => handleComingSoon('LinkedIn')}
                className="w-full py-4 px-6 bg-white border-2 border-gray-300 rounded-xl text-gray-900 font-semibold text-lg hover:border-blue-700 hover:bg-blue-50 transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-3 relative"
              >
                <Linkedin className="w-6 h-6 text-blue-700" />
                LinkedIn
                <span className="absolute right-4 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                  Coming Soon
                </span>
              </button>

              {/* Facebook - Coming Soon */}
              <button
                onClick={() => handleComingSoon('Facebook')}
                className="w-full py-4 px-6 bg-white border-2 border-gray-300 rounded-xl text-gray-900 font-semibold text-lg hover:border-blue-600 hover:bg-blue-50 transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-3 relative"
              >
                <Facebook className="w-6 h-6 text-blue-600" />
                Facebook
                <span className="absolute right-4 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                  Coming Soon
                </span>
              </button>

              {/* Instagram - Coming Soon */}
              <button
                onClick={() => handleComingSoon('Instagram')}
                className="w-full py-4 px-6 bg-white border-2 border-gray-300 rounded-xl text-gray-900 font-semibold text-lg hover:border-pink-600 hover:bg-pink-50 transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-3 relative"
              >
                <Instagram className="w-6 h-6 text-pink-600" />
                instagram
                <span className="absolute right-4 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                  Coming Soon
                </span>
              </button>

              {/* TikTok - Coming Soon */}
              <button
                onClick={() => handleComingSoon('TikTok')}
                className="w-full py-4 px-6 bg-white border-2 border-gray-300 rounded-xl text-gray-900 font-semibold text-lg hover:border-gray-900 hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-3 relative"
              >
                <Send className="w-6 h-6" />
                TikTok
                <span className="absolute right-4 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                  Coming Soon
                </span>
              </button>

              {/* Request Others */}
              <button
                onClick={() => {
                  const platform = prompt('Which social media platform would you like us to integrate?')
                  if (platform) {
                    alert(`Thank you for your feedback! We'll consider adding ${platform}.`)
                  }
                }}
                className="w-full py-4 px-6 bg-white border-2 border-dashed border-gray-400 rounded-xl text-gray-600 font-semibold text-lg hover:border-indigo-500 hover:bg-indigo-50 hover:text-indigo-700 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                Request others
              </button>
            </div>

            {/* Skip Button */}
            <div className="mt-8 text-center">
              <button
                onClick={handleSkip}
                className="text-gray-600 hover:text-gray-900 font-medium underline"
              >
                Skip for now
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default ConnectAccountsPage
