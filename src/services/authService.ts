import api from './api'
import type { LoginRequest, LoginResponse, RefreshTokenRequestDto } from '../types'

export const authService = {
  login: (data: LoginRequest) =>
    api.post<LoginResponse>('/api/auth/login', data).then((r) => r.data),

  revokeToken: (data: RefreshTokenRequestDto) =>
    api.post('/api/auth/revoke-token', data),
}
