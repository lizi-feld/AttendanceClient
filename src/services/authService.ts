import api from './api'
import type {
  LoginRequest,
  LoginResponse,
  RefreshTokenRequestDto,
  AddEmployeeRequest,
  UpdateEmployeeRequest,
  EmployeeDto,
} from '../types'

export const authService = {
  login: (data: LoginRequest) =>
    api.post<LoginResponse>('/api/auth/login', data).then((r) => r.data),

  revokeToken: (data: RefreshTokenRequestDto) =>
    api.post('/api/auth/revoke-token', data),

  addEmployee: (data: AddEmployeeRequest) =>
    api.post<EmployeeDto>('/api/auth/add-employee', data).then((r) => r.data),

  updateEmployee: (id: number, data: UpdateEmployeeRequest) =>
    api.put<EmployeeDto>(`/api/auth/update/${id}`, data).then((r) => r.data),
}
