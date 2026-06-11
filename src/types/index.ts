// ─── Auth ────────────────────────────────────────────────────────────────────

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  tokenType: string
  expiresAt: string
  refreshToken: string
  employee: EmployeeDto
}

export interface RefreshTokenRequestDto {
  accessToken: string
  refreshToken: string
}

export interface RefreshTokenResponseDto {
  accessToken: string
  refreshToken: string
}

// ─── Employees ───────────────────────────────────────────────────────────────

export interface EmployeeDto {
  id: number
  username: string
  fullName: string
  role: string
  createdAt: string
}

export interface EmployeeDetailsDto extends EmployeeDto {
  attendanceRecords: AttendanceRecordDto[]
}

// ─── Attendance ──────────────────────────────────────────────────────────────

export interface AttendanceRecordDto {
  id: number
  employeeId: number
  employeeFullName: string
  clockInTime: string
  clockOutTime: string | null
  duration: string | null
  isActive: boolean
  createdAt: string
}

export interface CurrentAttendanceStatusDto {
  isClockedIn: boolean
  activeRecordId: number | null
  clockInTime: string | null
  currentDuration: string | null
}

export interface WorkedHoursDto {
  totalHours: number
  totalMinutes: number
  formatted: string
}

export interface TimeResponseDto {
  currentTime: string
  timeZone: string
  source: string
}

// ─── Admin ───────────────────────────────────────────────────────────────────

export interface DashboardSummaryDto {
  totalEmployees: number
  clockedInNow: number
  totalRecordsToday: number
  activeSessions: AttendanceRecordDto[]
  generatedAt: string
}

// ─── Pagination ──────────────────────────────────────────────────────────────

export interface PagedResult<T> {
  items: T[]
  pageNumber: number
  pageSize: number
  totalCount: number
}

// ─── Request Payloads ────────────────────────────────────────────────────────

export interface AddEmployeeRequest {
  fullName: string
  username: string
  password: string
  role: number
}

export interface UpdateEmployeeRequest {
  fullName: string
  username: string
  password?: string
}

// ─── App Auth State ──────────────────────────────────────────────────────────

export type UserRole = 'Employee' | 'Admin'

export interface AuthUser {
  employee: EmployeeDto
  accessToken: string
  refreshToken: string
}
