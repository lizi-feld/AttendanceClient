// ─── Auth ─────────────────────────────────────────────────────────────────────
// Request bodies stay PascalCase — ASP.NET Core binding is case-insensitive.
// Response DTOs use camelCase — ASP.NET Core System.Text.Json default.

export interface LoginRequest {
  Username: string
  Password: string
}

export interface LoginResponse {
  token: string
  tokenType: string
  expiresAt: string
  refreshToken: string
  employee: EmployeeDto
}

export interface RefreshTokenRequestDto {
  AccessToken: string
  RefreshToken: string
}

export interface RefreshTokenResponseDto {
  accessToken: string
  refreshToken: string
}

// ─── Employees ────────────────────────────────────────────────────────────────

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

// ─── Attendance ───────────────────────────────────────────────────────────────

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

// ─── Admin ────────────────────────────────────────────────────────────────────

export interface DashboardSummaryDto {
  totalEmployees: number
  clockedInNow: number
  totalRecordsToday: number
  activeSessions: AttendanceRecordDto[]
  generatedAt: string
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PagedResult<T> {
  items: T[]
  pageNumber: number
  pageSize: number
  totalCount: number
}

// ─── App Auth State ───────────────────────────────────────────────────────────

export type UserRole = 'Employee' | 'Admin'

export interface AuthUser {
  employee: EmployeeDto
  accessToken: string
  refreshToken: string
}
