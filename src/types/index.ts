// ─── Auth ────────────────────────────────────────────────────────────────────

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
  AccessToken: string
  RefreshToken: string
}

// ─── Employees ───────────────────────────────────────────────────────────────

export interface EmployeeDto {
  Id: number
  Username: string
  FullName: string
  Role: string
  CreatedAt: string
}

export interface EmployeeDetailsDto extends EmployeeDto {
  AttendanceRecords: AttendanceRecordDto[]
}

// ─── Attendance ──────────────────────────────────────────────────────────────

export interface AttendanceRecordDto {
  Id: number
  EmployeeId: number
  EmployeeFullName: string
  ClockInTime: string
  ClockOutTime: string | null
  Duration: string | null
  IsActive: boolean
  CreatedAt: string
}

export interface CurrentAttendanceStatusDto {
  IsClockedIn: boolean
  ActiveRecordId: number | null
  ClockInTime: string | null
  CurrentDuration: string | null
}

export interface WorkedHoursDto {
  TotalHours: number
  TotalMinutes: number
  Formatted: string
}

// ─── Admin ───────────────────────────────────────────────────────────────────

export interface DashboardSummaryDto {
  TotalEmployees: number
  ClockedInNow: number
  TotalRecordsToday: number
  ActiveSessions: AttendanceRecordDto[]
  GeneratedAt: string
}

// ─── Pagination ──────────────────────────────────────────────────────────────

export interface PagedResult<T> {
  Items: T[]
  PageNumber: number
  PageSize: number
  TotalCount: number
}

// ─── App Auth State ──────────────────────────────────────────────────────────

export type UserRole = 'Employee' | 'Admin'

export interface AuthUser {
  employee: EmployeeDto
  accessToken: string
  refreshToken: string
}
