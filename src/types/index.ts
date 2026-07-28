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
  dailyWorkHours: number
  role: string
  createdAt: string
  attendanceRecords?: AttendanceRecordDto[]
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
  note?: string | null
}

export interface AttendanceHistoryMonthSummaryDto {
  totalWorkedHours: string
  regularHours: string
  deficitHours: string
  breakHours: string
  notesCount: number
}

export interface AttendanceHistoryDayDto {
  date: string
  dayNumber: number
  dayOfWeek: string
  displayDateLabel: string
  dayLabel: string
  dayTypeLabel: string
  hasAttendanceRecord: boolean
  isWeekend: boolean
  isFutureDate: boolean
  isDisabled: boolean
  isEditable: boolean
  isMonthClosed: boolean
  canClockIn: boolean
  canClockOut: boolean
  status: string
  clockInTime: string | null
  clockOutTime: string | null
  totalWorkedHours: string | null
  rowType: string
  hasAlert: boolean
  hasDeficit: boolean
  alertText: string | null
  displayBalance: string | null
  explanation: string | null
  /** The AbsenceType enum's name (e.g. "SickLeave"), or null/undefined when no absence was reported for this day. */
  absenceType?: string | null
  documentUrl?: string | null
  note?: string | null
}

export interface AttendanceHistoryMonthDto {
  year: number
  month: number
  summary: AttendanceHistoryMonthSummaryDto
  days: AttendanceHistoryDayDto[]
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

// ─── Absences ────────────────────────────────────────────────────────────────

export interface AbsenceRecordDto {
  id: number
  employeeId: number
  employeeFullName: string
  date: string // "YYYY-MM-DD" (DateOnly)
  absenceType: string
  documentUrl: string | null
  note: string | null
  createdAt: string
}

export interface UploadDocumentResponseDto {
  url: string
  fileName: string
}

// ─── Holidays ────────────────────────────────────────────────────────────────

export interface HolidayDto {
  date: string // "YYYY-MM-DD"
  hebrewName: string
  category: 'holiday' | 'cholhamoed' | 'parashat' | string
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
  dailyWorkHours: number
  role: number
}

export interface UpdateEmployeeRequest {
  fullName: string
  username: string
  password?: string
  dailyWorkHours?: number
}

export interface ManualAttendanceUpdateRequest {
  recordId: number
  newClockInTime: string
  newClockOutTime: string
  note: string
}

export interface ManualAddShiftRequest {
  date: string         // "YYYY-MM-DD"  → DateOnly on the backend
  clockInTime: string  // "HH:mm:ss"   → TimeOnly on the backend
  clockOutTime: string // "HH:mm:ss"   → TimeOnly on the backend
  note: string
  employeeId?: number  // admin endpoint only
}

export interface ReportAbsenceRequest {
  date: string          // "YYYY-MM-DD" → DateOnly on the backend
  absenceType: number   // AbsenceType enum value (Vacation=1 ... Other=7)
  documentUrl?: string
  note?: string
}

// ─── App Auth State ──────────────────────────────────────────────────────────

export type UserRole = 'Employee' | 'Admin'

export interface AuthUser {
  employee: EmployeeDto
  accessToken: string
  refreshToken: string
}
