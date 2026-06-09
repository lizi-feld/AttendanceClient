import { useEffect, useState, type SyntheticEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { Spinner } from '../components/ui/Spinner'
import type { AxiosError } from 'axios'

export function LoginPage() {
  const { login, user, isLoading } = useAuth()
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Already logged in → redirect to the right dashboard
  useEffect(() => {
    if (!isLoading && user) {
      const target = user.employee?.role === 'Admin' ? '/admin/dashboard' : '/employee'
      navigate(target, { replace: true })
    }
  }, [user, isLoading, navigate])

  async function handleSubmit(e: SyntheticEvent) {
    e.preventDefault()
    setError(null)

    if (!username.trim() || !password.trim()) {
      setError('אנא מלא את כל השדות')
      return
    }

    setSubmitting(true)
    try {
      await login({ Username: username.trim(), Password: password })
      // Navigation is handled inside AuthContext.login()
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string; title?: string }>
      const serverMsg =
        axiosErr.response?.data?.message ||
        axiosErr.response?.data?.title

      if (axiosErr.response?.status === 401 || axiosErr.response?.status === 400) {
        setError('שם משתמש או סיסמה שגויים')
      } else if (serverMsg) {
        setError(serverMsg)
      } else {
        setError('אירעה שגיאה, אנא נסה שוב')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary-600 shadow-lg mb-4">
            <Clock className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">מערכת נוכחות</h1>
          <p className="text-gray-500 mt-1 text-sm">התחבר לחשבונך כדי להמשיך</p>
        </div>

        {/* Card */}
        <div className="card shadow-md">
          <form onSubmit={handleSubmit} noValidate className="space-y-5">

            {/* Error banner */}
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Username */}
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                שם משתמש
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="הכנס שם משתמש"
                className="input-field"
                disabled={submitting}
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                סיסמה
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="הכנס סיסמה"
                  className="input-field pl-10"
                  disabled={submitting}
                />
                {/* Toggle visibility — positioned on the left (RTL end) */}
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                  aria-label={showPassword ? 'הסתר סיסמה' : 'הצג סיסמה'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full py-2.5 text-base mt-2"
            >
              {submitting ? (
                <>
                  <Spinner size="sm" className="text-white" />
                  מתחבר...
                </>
              ) : (
                'כניסה למערכת'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          מערכת ניהול נוכחות עובדים &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
