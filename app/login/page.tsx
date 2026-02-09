import { login, signup } from './actions'

export default function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; message?: string }>
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg px-8 py-10">
          <h1 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-2">
            WorthFlow
          </h1>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
            Sign in or create an account
          </p>

          <LoginForm searchParams={searchParams} />
        </div>

        <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
          Your financial data is encrypted and secure.
        </p>
      </div>
    </div>
  )
}

async function LoginForm({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; message?: string }>
}) {
  const params = await searchParams
  const error = params?.error
  const message = params?.message

  return (
    <>
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-800 dark:text-red-200">
            {decodeURIComponent(error)}
          </p>
        </div>
      )}

      {message && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-sm text-green-800 dark:text-green-200">
            {decodeURIComponent(message)}
          </p>
        </div>
      )}

      <form className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition"
            placeholder="••••••••"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            formAction={login}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
          >
            Log in
          </button>
          <button
            formAction={signup}
            className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
          >
            Sign up
          </button>
        </div>
      </form>
    </>
  )
}

