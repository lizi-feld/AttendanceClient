import axios, { type InternalAxiosRequestConfig } from 'axios'
import type { RefreshTokenRequestDto, RefreshTokenResponseDto } from '../types'

/**
 * In-memory token store.
 * Never written to localStorage — only lives in the JS heap for XSS mitigation.
 * The AuthProvider registers `onLogout` so the interceptor can trigger a
 * full logout without importing React context directly.
 */
export const tokenStore: {
  accessToken: string | null
  refreshToken: string | null
  onLogout: (() => void) | null
} = {
  accessToken: null,
  refreshToken: null,
  onLogout: null,
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // transmit HttpOnly refresh-token cookie
})

// ─── Request interceptor: attach Bearer token ────────────────────────────────
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (tokenStore.accessToken) {
    config.headers.set('Authorization', `Bearer ${tokenStore.accessToken}`)
  }
  return config
})

// ─── Response interceptor: 401 → refresh → retry ────────────────────────────
let isRefreshing = false
let pendingQueue: Array<{
  resolve: (token: string) => void
  reject: (err: unknown) => void
}> = []

function flushQueue(err: unknown, newToken: string | null) {
  pendingQueue.forEach(({ resolve, reject }) =>
    err ? reject(err) : resolve(newToken!)
  )
  pendingQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    // Only intercept 401s that haven't already been retried
    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error)
    }

    // No tokens available → force logout immediately
    if (!tokenStore.accessToken || !tokenStore.refreshToken) {
      tokenStore.onLogout?.()
      return Promise.reject(error)
    }

    // Another refresh is already in flight → queue this request
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        pendingQueue.push({ resolve, reject })
      }).then((token) => {
        original.headers.set('Authorization', `Bearer ${token}`)
        return api(original)
      })
    }

    original._retry = true
    isRefreshing = true

    try {
      const body: RefreshTokenRequestDto = {
        accessToken: tokenStore.accessToken,
        refreshToken: tokenStore.refreshToken,
      }
      // Use a plain axios call (not the intercepted instance) to avoid loops
      const { data } = await axios.post<RefreshTokenResponseDto>(
        `${BASE_URL}/api/auth/refresh-token`,
        body,
        { withCredentials: true }
      )

      tokenStore.accessToken = data.accessToken
      tokenStore.refreshToken = data.refreshToken
      flushQueue(null, data.accessToken)

      original.headers.set('Authorization', `Bearer ${data.accessToken}`)
      return api(original)
    } catch (refreshErr) {
      flushQueue(refreshErr, null)
      tokenStore.accessToken = null
      tokenStore.refreshToken = null
      tokenStore.onLogout?.()
      return Promise.reject(refreshErr)
    } finally {
      isRefreshing = false
    }
  }
)

export default api
