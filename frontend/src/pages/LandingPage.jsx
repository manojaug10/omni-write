import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import {
  Calendar,
  Zap,
  BarChart3,
  Users,
  CheckCircle2,
  ArrowRight
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
      icon: Calendar,
      title: 'Smart Scheduling',
      description: 'Schedule posts across all platforms with intelligent timing suggestions',
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Create and publish content in seconds with our intuitive interface',
    },
    {
      icon: BarChart3,
      title: 'Analytics Dashboard',
      description: 'Track performance and engagement with detailed insights',
    },
    {
      icon: Users,
      title: 'Team Collaboration',
      description: 'Work together seamlessly with your team members',
    },
  ];

  const benefits = [
    'Post to multiple platforms simultaneously',
    'AI-powered content suggestions',
    'Automated posting schedules',
    'Real-time analytics and reporting',
    'Content calendar visualization',
    'Team approval workflows',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="container mx-auto px-6 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-blue-600">Omni Writes</span>
          </div>
          <div className="flex items-center gap-4">
            {!isSignedIn && (
              <button
                onClick={handleSignIn}
                className="px-4 py-2 text-gray-700 hover:text-blue-600 transition-colors"
              >
                Sign In
              </button>
            )}
            <button
              onClick={handleGetStarted}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all"
            >
              Get Started
            </button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
          Schedule Your Social Media
          <br />
          <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Like a Pro
          </span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Manage all your social media accounts in one place. Create, schedule, and
          analyze your posts with powerful automation tools.
        </p>
        <button
          onClick={handleGetStarted}
          className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-lg font-semibold hover:shadow-xl transition-all"
        >
          Sign Up
          <ArrowRight className="w-5 h-5" />
        </button>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-6 py-20">
        <h2 className="text-4xl font-bold text-gray-900 text-center mb-12">
          Everything You Need to Succeed
        </h2>
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-6 py-20">
        <h2 className="text-4xl font-bold text-gray-900 text-center mb-4">
          Why Choose SocialScheduler?
        </h2>
        <p className="text-gray-600 text-center mb-12 max-w-3xl mx-auto">
          Join thousands of marketers and businesses who trust us to manage their
          social media presence.
        </p>
        <div className="max-w-2xl mx-auto space-y-4">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0" />
              <span className="text-gray-700 text-lg">{benefit}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 rounded-3xl p-12 max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl p-10 text-center shadow-lg">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-gray-600 mb-8 text-lg">
              Join our platform today and transform your social media strategy.
            </p>
            <button
              onClick={handleGetStarted}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-lg font-semibold hover:shadow-xl transition-all"
            >
              Sign Up Now
            </button>
            <div className="mt-8 flex items-center justify-center gap-2 text-sm text-gray-500">
              <span>Made with</span>
              <span className="font-semibold text-gray-700">MagicPath</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Spacing */}
      <div className="h-20"></div>
    </div>
  );
}
