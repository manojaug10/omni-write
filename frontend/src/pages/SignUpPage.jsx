import { SignUp } from '@clerk/clerk-react'

function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Get Started</h1>
          <p className="text-gray-600">Create your Omni Write account</p>
        </div>
        <SignUp 
          path="/sign-up"
          routing="path"
          signInUrl="/sign-in"
          afterSignUpUrl="/"
        />
      </div>
    </div>
  )
}

export default SignUpPage

