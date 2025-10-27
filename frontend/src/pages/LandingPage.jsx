import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import {
  Calendar,
  Clock,
  MessageCircle,
  Shield,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Lock,
  Rocket
} from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();
  const { isSignedIn } = useUser();

  const handleGetStarted = () => {
    if (isSignedIn) {
      navigate('/profile');
    } else {
      navigate('/sign-up');
    }
  };

  const handleSignIn = () => {
    navigate('/sign-in');
  };

  const features = [
    {
      icon: MessageCircle,
      title: 'X (Twitter) Integration',
      description: 'Connect your X account securely with OAuth 2.0 and start posting directly from Omni Writes',
      gradient: 'from-sky-500 to-blue-600'
    },
    {
      icon: Calendar,
      title: 'Schedule Your Tweets',
      description: 'Plan your content strategy ahead of time. Schedule tweets for optimal engagement times',
      gradient: 'from-violet-500 to-purple-600'
    },
    {
      icon: Clock,
      title: 'Automatic Publishing',
      description: 'Our background job system automatically posts your scheduled tweets at the perfect time',
      gradient: 'from-amber-500 to-orange-600'
    },
    {
      icon: Shield,
      title: 'Secure Authentication',
      description: 'Enterprise-grade security with Clerk authentication. Your data and accounts are always protected',
      gradient: 'from-emerald-500 to-green-600'
    },
  ];

  const benefits = [
    'One-click X (Twitter) account connection',
    'Schedule unlimited tweets in advance',
    'Automatic posting with background jobs',
    'Secure OAuth 2.0 authentication',
    'Track scheduled and posted tweets',
    'Cancel or edit scheduled tweets anytime',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="container mx-auto px-6 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Omni Writes
            </span>
          </div>
          <div className="flex items-center gap-4">
            {!isSignedIn && (
              <button
                onClick={handleSignIn}
                className="px-5 py-2.5 text-gray-700 hover:text-blue-600 font-medium transition-colors"
              >
                Sign In
              </button>
            )}
            <button
              onClick={handleGetStarted}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-xl transform hover:scale-105 transition-all font-semibold"
            >
              {isSignedIn ? 'Dashboard' : 'Get Started'}
            </button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-16 md:py-24">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full text-blue-700 font-medium mb-6">
            <Rocket className="w-4 h-4" />
            <span>Now with X (Twitter) Integration</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            Schedule Your Tweets.
            <br />
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Grow Your Audience.
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
            The smart way to manage your X (Twitter) presence. Connect your account,
            schedule tweets, and let our automation handle the rest.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={handleGetStarted}
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-lg font-semibold hover:shadow-2xl transform hover:scale-105 transition-all"
            >
              Start Free
              <ArrowRight className="w-5 h-5" />
            </button>

            {!isSignedIn && (
              <button
                onClick={handleSignIn}
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-gray-700 rounded-xl text-lg font-semibold border-2 border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all"
              >
                <Lock className="w-5 h-5" />
                Sign In
              </button>
            )}
          </div>

          <div className="mt-12 flex items-center justify-center gap-8 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span>Free to start</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span>Secure OAuth</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-6 py-16 md:py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Everything You Need to Succeed
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Powerful features built for modern content creators and social media managers
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group bg-white p-8 rounded-3xl shadow-sm hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-blue-200"
            >
              <div className={`w-14 h-14 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-lg`}>
                <feature.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 text-lg leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="container mx-auto px-6 py-16 md:py-24 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl my-16">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-xl text-gray-600">
            Get started in minutes, no technical knowledge required
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
              <span className="text-white text-2xl font-bold">1</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Connect X Account</h3>
            <p className="text-gray-600">
              Securely link your X (Twitter) account using OAuth 2.0 authentication
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-violet-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
              <span className="text-white text-2xl font-bold">2</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Schedule Tweets</h3>
            <p className="text-gray-600">
              Create and schedule your tweets for optimal posting times
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-600 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
              <span className="text-white text-2xl font-bold">3</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Auto-Publish</h3>
            <p className="text-gray-600">
              Sit back while our system automatically posts at the scheduled time
            </p>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-6 py-16 md:py-24">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Why Choose Omni Writes?
            </h2>
            <p className="text-xl text-gray-600">
              Built with the features you need and the security you deserve
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="flex items-center gap-4 bg-white p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex-shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                </div>
                <span className="text-gray-700 text-lg font-medium">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="container mx-auto px-6 py-16 md:py-24">
        <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-12 md:p-16 max-w-4xl mx-auto relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-white/10"></div>
          <div className="relative text-center text-white">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Transform Your X Strategy?
            </h2>
            <p className="text-xl md:text-2xl mb-10 text-blue-100 max-w-2xl mx-auto">
              Join content creators who are already scheduling smarter with Omni Writes
            </p>
            <button
              onClick={handleGetStarted}
              className="inline-flex items-center gap-2 px-10 py-5 bg-white text-blue-600 rounded-xl text-lg font-bold hover:shadow-2xl transform hover:scale-105 transition-all"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </button>
            <p className="mt-6 text-blue-100 text-sm">
              No credit card required • Set up in 2 minutes
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-8 text-center text-gray-500 text-sm">
        <p>© 2025 Omni Writes. Built with cutting-edge technology and care.</p>
      </footer>
    </div>
  );
}
