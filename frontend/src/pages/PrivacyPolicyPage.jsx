import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Shield } from 'lucide-react'

export default function PrivacyPolicyPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Title Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 mb-6">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent mb-4">
            Privacy Policy
          </h1>
          <p className="text-gray-600">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 md:p-12 space-y-8">
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Introduction</h2>
            <p className="text-gray-600 leading-relaxed">
              Welcome to Omni Write. We respect your privacy and are committed to protecting your personal data.
              This privacy policy explains how we collect, use, and safeguard your information when you use our service.
            </p>
          </section>

          {/* Information We Collect */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Information We Collect</h2>
            <div className="space-y-3 text-gray-600">
              <p className="leading-relaxed">
                <strong className="text-gray-900">Account Information:</strong> When you create an account, we collect your email address and name through our authentication provider.
              </p>
              <p className="leading-relaxed">
                <strong className="text-gray-900">Social Media Connections:</strong> When you connect your X (Twitter) or Threads accounts, we store access tokens to post on your behalf.
              </p>
              <p className="leading-relaxed">
                <strong className="text-gray-900">Content:</strong> We store the tweets and posts you schedule through our platform.
              </p>
              <p className="leading-relaxed">
                <strong className="text-gray-900">Usage Data:</strong> We collect basic usage information to improve our service.
              </p>
            </div>
          </section>

          {/* How We Use Your Information */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">How We Use Your Information</h2>
            <div className="space-y-3 text-gray-600">
              <p className="leading-relaxed">We use your information to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Provide and maintain our scheduling service</li>
                <li>Post content to your connected social media accounts</li>
                <li>Send you important service updates</li>
                <li>Improve and optimize our platform</li>
                <li>Provide customer support</li>
              </ul>
            </div>
          </section>

          {/* Data Security */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Security</h2>
            <p className="text-gray-600 leading-relaxed">
              We implement industry-standard security measures to protect your data. Your social media tokens are
              encrypted, and we use secure authentication methods. However, no method of transmission over the internet
              is 100% secure.
            </p>
          </section>

          {/* Third-Party Services */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Third-Party Services</h2>
            <p className="text-gray-600 leading-relaxed">
              We use trusted third-party services including authentication providers (Clerk), database hosting (Supabase),
              and social media APIs (X, Threads). These services have their own privacy policies governing their use of your data.
            </p>
          </section>

          {/* Your Rights */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your Rights</h2>
            <div className="space-y-3 text-gray-600">
              <p className="leading-relaxed">You have the right to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Access your personal data</li>
                <li>Update or correct your information</li>
                <li>Delete your account and associated data</li>
                <li>Disconnect social media accounts at any time</li>
                <li>Export your scheduled content</li>
              </ul>
            </div>
          </section>

          {/* Data Retention */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Retention</h2>
            <p className="text-gray-600 leading-relaxed">
              We retain your data for as long as your account is active. When you delete your account, we remove
              your personal information and scheduled posts from our servers within 30 days.
            </p>
          </section>

          {/* Changes to This Policy */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Changes to This Policy</h2>
            <p className="text-gray-600 leading-relaxed">
              We may update this privacy policy from time to time. We will notify you of any changes by updating
              the "Last updated" date at the top of this policy.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Us</h2>
            <p className="text-gray-600 leading-relaxed">
              If you have any questions about this privacy policy or how we handle your data, please contact us
              through our support channels.
            </p>
          </section>
        </div>

        {/* Footer CTA */}
        <div className="text-center mt-12">
          <button
            onClick={() => navigate('/')}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            Back to Home
          </button>
        </div>
      </main>
    </div>
  )
}
