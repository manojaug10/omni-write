import { useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import {
  ArrowRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  Gauge,
  Layers,
  LineChart,
  MessageCircle,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react'

export default function LandingPage() {
  const navigate = useNavigate()
  const { isSignedIn } = useUser()

  const handleGetStarted = () => {
    if (isSignedIn) {
      navigate('/dashboard')
    } else {
      navigate('/sign-up')
    }
  }

  const handleSignIn = () => {
    navigate('/sign-in')
  }

  const statHighlights = [
    { label: 'Scheduled posts', value: '12k+', change: '+340% QoQ' },
    { label: 'Average time saved', value: '14h', change: 'per team each month' },
    { label: 'Teams onboarded', value: '1.8k', change: 'marketing orgs worldwide' },
  ]

  const featureHighlights = [
    {
      icon: Calendar,
      title: 'Unified Scheduler',
      description: 'Drag-and-drop calendar for single tweets, threads, and reposts in one streamlined view.',
      accent: 'from-sky-500 via-blue-500 to-indigo-500',
    },
    {
      icon: BarChart3,
      title: 'Real-time Insights',
      description: 'Performance analytics and audience trends refresh instantly so you can adjust quickly.',
      accent: 'from-indigo-500 via-purple-500 to-pink-500',
    },
    {
      icon: ShieldCheck,
      title: 'Enterprise-grade Security',
      description: 'Clerk authentication, OAuth 2.0, and audit trails keep brand accounts locked down.',
      accent: 'from-emerald-500 via-teal-500 to-cyan-500',
    },
    {
      icon: MessageCircle,
      title: 'Smart Content Assist',
      description: 'AI-assisted copy suggestions match your tone and surface trending topics instantly.',
      accent: 'from-amber-500 via-orange-500 to-rose-500',
    },
  ]

  const workflowSteps = [
    {
      step: '01',
      title: 'Connect your brand accounts',
      description: 'Link X profiles in seconds with OAuth 2.0 and define roles for collaborators.',
    },
    {
      step: '02',
      title: 'Plan your campaign timeline',
      description: 'Drop content onto the visual planner, assign owners, and set approval checkpoints.',
    },
    {
      step: '03',
      title: 'Automate publishing & approvals',
      description: 'Omni Writes triggers reminders, auto-posts when approved, and pauses when needed.',
    },
    {
      step: '04',
      title: 'Monitor performance live',
      description: 'Real-time dashboards track reach, engagement, and suggest next best actions.',
    },
  ]

  const automationHighlights = [
    {
      icon: Zap,
      title: 'Workflow Automation',
      description: 'Sequences cover drafting, approvals, posting, and reporting so nothing slips through.',
    },
    {
      icon: Layers,
      title: 'Team Collaboration',
      description: 'Shared workspaces, brand kits, and contextual notes keep everyone aligned.',
    },
  ]

  const testimonials = [
    {
      quote:
        'Omni Writes replaced three separate tools and finally gave our team the visibility we needed. Launching campaigns takes half the time now.',
      name: 'Maya Chen',
      role: 'Head of Social @ PulseWave',
      metric: '258% engagement lift',
    },
    {
      quote:
        'Scheduling threads used to be chaos. The planner and approval flow are so intuitive that freelancers and stakeholders all stay in sync.',
      name: 'Jordan Reyes',
      role: 'Content Lead @ Orbit Labs',
      metric: '6h saved every week',
    },
  ]

  const faqs = [
    {
      question: 'Can I invite my whole social team?',
      answer: 'Yes. Unlimited collaborators with custom roles, approval chains, and activity logs.',
    },
    {
      question: 'Do you support media-rich threads?',
      answer: 'Absolutely. Upload media, reorder tweets, and preview the full thread before scheduling.',
    },
    {
      question: 'How secure is the connection to X?',
      answer:
        'We rely on Clerk for authentication, utilize OAuth 2.0, and never store your credentials in plain text.',
    },
    {
      question: 'Is there a free trial?',
      answer: 'Start free with core scheduling tools, then upgrade only when you need advanced analytics.',
    },
  ]

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.18),transparent_55%)]" />

      <header className="relative z-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-8 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 shadow-lg shadow-indigo-500/30">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="block text-xl font-semibold tracking-tight text-slate-100">Omni Writes</span>
              <span className="text-xs font-medium uppercase tracking-[0.3em] text-slate-400">Social OS</span>
            </div>
          </div>

          <div className="hidden items-center gap-8 text-sm font-medium text-slate-300 md:flex">
            <span className="cursor-pointer transition hover:text-white">Platform</span>
            <span className="cursor-pointer transition hover:text-white">Solutions</span>
            <span className="cursor-pointer transition hover:text-white">Pricing</span>
            <span className="cursor-pointer transition hover:text-white">Resources</span>
          </div>

          <div className="flex items-center gap-3">
            {!isSignedIn && (
              <button
                onClick={handleSignIn}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-300 transition hover:text-white"
              >
                Sign In
              </button>
            )}
            <button
              onClick={handleGetStarted}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:scale-[1.02]"
            >
              {isSignedIn ? 'Go to Dashboard' : 'Start Free'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        <section className="mx-auto flex max-w-6xl flex-col gap-12 px-6 pb-28 pt-10 lg:flex-row lg:items-center lg:pb-32 lg:pt-16">
          <div className="flex-1">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-400/10 px-4 py-2 text-sm font-semibold text-indigo-200">
              <PlayCircle className="h-4 w-4" />
              Launch campaigns that feel curated, not chaotic
            </div>

            <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
              The social media mission control for bold, fast-moving teams.
            </h1>

            <p className="mt-6 text-lg text-slate-300 sm:text-xl">
              Connect your X accounts, orchestrate threads, and automate approvals from one beautiful dashboard.
              Omni Writes keeps your campaign cadence sharp while the analytics guide every iteration.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <button
                onClick={handleGetStarted}
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3 text-base font-semibold text-slate-900 shadow-lg shadow-indigo-500/30 transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                {isSignedIn ? 'Open Dashboard' : 'Create Free Account'}
                <ArrowRight className="h-4 w-4" />
              </button>
              {!isSignedIn && (
                <button
                  onClick={handleSignIn}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 px-6 py-3 text-base font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
                >
                  Preview the Planner
                </button>
              )}
            </div>

            <div className="mt-10 flex flex-wrap gap-6 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                No credit card required
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                Secure OAuth 2.0 connection
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                Cancel anytime
              </div>
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-6">
            <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl shadow-indigo-500/20 backdrop-blur">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-500">
                <span>Campaign Timeline</span>
                <span>Week 32</span>
              </div>
              <div className="mt-6 space-y-4">
                {['Product Drop', 'Thought Leadership Thread', 'Influencer Collab', 'Launch Recap'].map(
                  (label, index) => (
                    <div
                      key={label}
                      className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/50 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-white">{label}</p>
                        <p className="text-xs text-slate-500">
                          {['Aug 14 • 9:00 AM', 'Aug 15 • 4:30 PM', 'Aug 16 • 1:00 PM', 'Aug 18 • 8:45 AM'][index]}
                        </p>
                      </div>
                      <div className="rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-200">
                        Scheduled
                      </div>
                    </div>
                  ),
                )}
              </div>
              <div className="mt-6 rounded-2xl bg-gradient-to-r from-indigo-500/30 via-blue-500/20 to-slate-900 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-indigo-200">Live insight</p>
                <p className="mt-2 text-sm text-slate-200">
                  Engagement projections trending <span className="font-semibold text-emerald-300">+42%</span> vs last
                  week’s launch window.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm text-slate-400">
              {statHighlights.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-slate-800 bg-slate-900/50 px-4 py-5 shadow-lg shadow-indigo-500/10"
                >
                  <span className="text-xs uppercase tracking-[0.3em] text-slate-500">{stat.label}</span>
                  <p className="mt-2 text-2xl font-semibold text-white">{stat.value}</p>
                  <p className="mt-2 text-xs text-slate-500">{stat.change}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-24 lg:px-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-3xl font-semibold text-white sm:text-4xl">Platform built for performance</h2>
              <p className="mt-3 max-w-2xl text-base text-slate-300">
                Precision scheduling, automated approvals, and intelligence layered into every workflow. Omni Writes
                gives your team the control room they deserve.
              </p>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <Gauge className="h-4 w-4 text-indigo-300" />
                Live dashboards
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-indigo-300" />
                Multi-team ready
              </div>
            </div>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {featureHighlights.map((feature) => (
              <div
                key={feature.title}
                className="group relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/60 p-8 shadow-xl shadow-indigo-500/10 transition hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/20"
              >
                <div className={`inline-flex items-center justify-center rounded-2xl bg-gradient-to-br ${feature.accent} p-3 text-white shadow-lg shadow-indigo-500/20`}>
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-6 text-xl font-semibold text-white">{feature.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-300">{feature.description}</p>
                <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-indigo-200 transition group-hover:translate-x-1">
                  Explore capabilities
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-24 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr]">
            <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900/60 to-slate-950 p-10 shadow-2xl shadow-indigo-500/20">
              <h2 className="text-3xl font-semibold text-white sm:text-4xl">Playbooks that ship campaigns faster</h2>
              <p className="mt-4 text-base text-slate-300">
                We built Omni Writes with the rituals of social-first teams in mind. From briefing to analytics, your
                momentum never stalls.
              </p>
              <div className="mt-10 grid gap-6 sm:grid-cols-2">
                {automationHighlights.map((item) => (
                  <div key={item.title} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
                    <item.icon className="h-6 w-6 text-indigo-200" />
                    <p className="mt-4 text-lg font-semibold text-white">{item.title}</p>
                    <p className="mt-2 text-sm text-slate-300">{item.description}</p>
                  </div>
                ))}
              </div>
              <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
                <div className="flex items-center gap-3 text-sm text-slate-400">
                  <LineChart className="h-5 w-5 text-indigo-300" />
                  Live Smart Suggestions
                </div>
                <p className="mt-3 text-sm text-slate-300">
                  Let the platform highlight best send times, flag risk keywords, and auto-generate recap reports.
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-10">
              <h3 className="text-2xl font-semibold text-white">Built for clarity</h3>
              <p className="mt-3 text-sm text-slate-300">
                Visual timelines, approval status at a glance, and campaign summaries that stakeholders actually read.
              </p>

              <div className="mt-8 space-y-6">
                {workflowSteps.map((step) => (
                  <div key={step.step} className="flex gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-400/30 bg-indigo-400/10 text-sm font-semibold text-indigo-200">
                      {step.step}
                    </div>
                    <div>
                      <p className="text-base font-semibold text-white">{step.title}</p>
                      <p className="mt-1 text-sm text-slate-300">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-24 lg:px-8">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-10 shadow-2xl shadow-indigo-500/20">
            <div className="flex flex-col gap-12 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-xl">
                <h2 className="text-3xl font-semibold text-white sm:text-4xl">Teams scaling with Omni Writes</h2>
                <p className="mt-3 text-base text-slate-300">
                  From startups launching products to global brands managing daily chatter, Omni Writes powers social
                  efforts that actually move metrics.
                </p>
              </div>
              <div className="flex items-center gap-6 text-sm text-slate-400">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-indigo-300" />
                  Marketers & Strategists
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-indigo-300" />
                  Weekly status clarity
                </div>
              </div>
            </div>

            <div className="mt-12 grid gap-8 md:grid-cols-2">
              {testimonials.map((testimonial) => (
                <div key={testimonial.name} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-8">
                  <p className="text-sm leading-relaxed text-slate-200">“{testimonial.quote}”</p>
                  <div className="mt-6 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white">{testimonial.name}</p>
                      <p className="text-xs text-slate-400">{testimonial.role}</p>
                    </div>
                    <div className="rounded-full border border-indigo-400/40 bg-indigo-400/10 px-3 py-1 text-xs font-semibold text-indigo-200">
                      {testimonial.metric}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 pb-24 lg:px-8">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-10 shadow-2xl shadow-indigo-500/20">
            <h2 className="text-3xl font-semibold text-white sm:text-4xl">Frequently asked questions</h2>
            <div className="mt-10 space-y-6">
              {faqs.map((faq) => (
                <div key={faq.question} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
                  <p className="text-sm font-semibold text-white">{faq.question}</p>
                  <p className="mt-2 text-sm text-slate-300">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 pb-24 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl border border-indigo-400/30 bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-600 p-10 shadow-2xl shadow-indigo-500/30">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.2),transparent_60%)] opacity-60" />
            <div className="relative text-center text-white">
              <p className="text-sm font-semibold uppercase tracking-[0.4em] text-white/70">Ready to launch</p>
              <h2 className="mt-4 text-3xl font-semibold sm:text-4xl">
                Bring your next social campaign to life in record time.
              </h2>
              <p className="mt-4 text-base text-indigo-100">
                Start free today and upgrade once you are ready for deeper analytics, custom roles, and dedicated
                success support.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <button
                  onClick={handleGetStarted}
                  className="inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3 text-base font-semibold text-slate-900 shadow-lg shadow-indigo-900/30 transition hover:-translate-y-0.5"
                >
                  {isSignedIn ? 'Back to Dashboard' : 'Start Free Trial'}
                  <ArrowRight className="h-4 w-4" />
                </button>
                {!isSignedIn && (
                  <button
                    onClick={handleSignIn}
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/30 px-6 py-3 text-base font-semibold text-white transition hover:bg-white/10"
                  >
                    View Live Demo
                  </button>
                )}
              </div>
              <p className="mt-6 text-xs text-indigo-100">
                No credit card required • Cancel anytime • Support that answers in minutes
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-slate-800 bg-slate-950/90">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8 text-sm text-slate-500 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3 text-slate-400">
            <Sparkles className="h-4 w-4 text-indigo-300" />
            © {new Date().getFullYear()} Omni Writes. Crafted for social-first teams.
          </div>
          <div className="flex items-center gap-6">
            <span className="cursor-pointer transition hover:text-white">Status</span>
            <span
              onClick={() => navigate('/privacy')}
              className="cursor-pointer transition hover:text-white"
            >
              Privacy
            </span>
            <span className="cursor-pointer transition hover:text-white">Support</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
