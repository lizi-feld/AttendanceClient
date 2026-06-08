import React, {
  createContext,
  useCallback,
  useEffect,
  useState,
} from 'react'
import { useNavigate } from 'react-router-dom'
import type { AuthUser, LoginRequest } from '../types'
import { authService } from '../services/authService'
import { tokenStore } from '../services/api'

// ─── Context shape ────────────────────────────────────────────────────────────

interface AuthContextValue {
  user: AuthUser | null
  isLoading: boolean
  login: (credentials: LoginRequest) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  // Called both by the user clicking "Logout" AND by the 401 interceptor
  const performLogout = useCallback(() => {
    tokenStore.accessToken = null
    tokenStore.refreshToken = null
    setUser(null)
    navigate('/login', { replace: true })
  }, [navigate])

  const logout = useCallback(async () => {
    // Best-effort server-side token revocation
    if (tokenStore.accessToken && tokenStore.refreshToken) {
      try {
        await authService.revokeToken({
          AccessToken: tokenStore.accessToken,
          RefreshToken: tokenStore.refreshToken,
        })
      } catch {
        // ignore — we still clear local state below
      }
    }
    performLogout()
  }, [performLogout])

  const login = useCallback(
    async (credentials: LoginRequest) => {
      const data = await authService.login(credentials)

      // Store tokens in memory (never localStorage)
      tokenStore.accessToken = data.Token
      tokenStore.refreshToken = data.RefreshToken

      setUser({
        employee: data.Employee,
        accessToken: data.Token,
        refreshToken: data.RefreshToken,
      })

      // Route based on role
      if (data.Employee.Role === 'Admin') {
        navigate('/admin/dashboard', { replace: true })
      } else {
        navigate('/employee', { replace: true })
      }
    },
    [navigate]
  )

  // Register the logout callback so the Axios interceptor can trigger it
  // without needing to import React context directly.
  useEffect(() => {
    tokenStore.onLogout = performLogout
    setIsLoading(false)
    return () => {
      tokenStore.onLogout = null
    }
  }, [performLogout])

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
