import { SignIn } from '@clerk/clerk-react'
import { Link } from 'react-router-dom'

function SignInPage() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#eef2ff] via-white to-[#e0f2fe] flex items-center justify-center p-4">
      <div className="relative w-full max-w-md">
        <div className="absolute inset-0 -z-10">
          <div className="h-full w-full rounded-3xl bg-gradient-to-br from-indigo-200/80 via-purple-200/60 to-transparent blur-3xl" />
        </div>
        <div className="overflow-hidden rounded-3xl border border-white/40 bg-white/80 backdrop-blur-xl shadow-[0_24px_70px_-24px_rgba(79,70,229,0.45)]">
          <div className="px-8 pb-8 pt-10 sm:px-10">
            <div className="mb-8 flex flex-col items-center text-center">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 shadow-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="1.5"
                  className="h-8 w-8"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 7V5.5A1.5 1.5 0 0 1 9.5 4h5A1.5 1.5 0 0 1 16 5.5V7m-8 0h8m-8 0H7a3 3 0 0 0-3 3v6.5A3.5 3.5 0 0 0 7.5 20h9a3.5 3.5 0 0 0 3.5-3.5V10a3 3 0 0 0-3-3h-1"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 13h6m-6 3h3"
                  />
                </svg>
              </div>
              <h1 className="text-3xl font-semibold text-gray-900">Omni Write</h1>
              <p className="mt-1 text-base text-gray-500">Welcome back! Please sign in.</p>
            </div>

            <div className="mb-6 flex items-center gap-2 rounded-full bg-gray-100/80 p-1">
              <Link
                to="/sign-in"
                className="flex-1 rounded-full bg-white text-center text-sm font-semibold text-gray-900 shadow-sm transition-all"
              >
                Sign In
              </Link>
              <Link
                to="/sign-up"
                className="flex-1 rounded-full text-center text-sm font-medium text-gray-500 transition-all hover:text-gray-700"
              >
                Sign Up
              </Link>
            </div>

            <SignIn
              path="/sign-in"
              routing="path"
              signUpUrl="/sign-up"
              afterSignInUrl="/"
              appearance={{
                layout: {
                  showHeader: false,
                  showFooter: false,
                  socialButtonsPlacement: 'bottom',
                  socialButtonsVariant: 'iconButton',
                },
                variables: {
                  borderRadius: '1rem',
                  colorPrimary: '#6366f1',
                  fontSize: '0.95rem',
                },
                elements: {
                  rootBox: 'w-full',
                  card: 'shadow-none bg-transparent border-0 p-0',
                  form: 'space-y-5',
                  formFieldLabel: 'text-sm font-medium text-gray-700 mb-2',
                  formFieldInput:
                    'w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 shadow-sm transition focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-300/80',
                  formFieldInputGroup:
                    'rounded-xl border border-gray-200 bg-white shadow-sm transition focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-300/80',
                  formFieldAction: 'text-sm font-medium text-indigo-500 hover:text-indigo-600',
                  formButtonPrimary:
                    'mt-2 h-12 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-base font-semibold text-white shadow-lg transition transform hover:-translate-y-0.5 focus:ring-2 focus:ring-indigo-400/80 focus:ring-offset-2 focus:ring-offset-white',
                  footer: 'hidden',
                  identityPreview:
                    'rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600',
                  dividerLine: 'bg-gray-200',
                  dividerText: 'text-sm text-gray-400',
                  socialButtons: 'grid grid-cols-2 gap-3 mt-6',
                  socialButtonsIconButton:
                    'h-12 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600',
                  alternateMethods: 'text-sm text-gray-500',
                  otpCodeFieldInput:
                    'rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-300/80',
                  formFieldError: 'text-sm text-rose-500 mt-1',
                },
              }}
            />
          </div>
        </div>
        <p className="mt-6 text-center text-sm text-gray-500">
          Don&apos;t have an account?{' '}
          <Link to="/sign-up" className="font-medium text-indigo-500 hover:text-indigo-600">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}

export default SignInPage
