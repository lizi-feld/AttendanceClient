import api from './api'
import type {
  AttendanceHistoryMonthDto,
  AttendanceRecordDto,
  CurrentAttendanceStatusDto,
  ManualAddShiftRequest,
  ManualAttendanceUpdateRequest,
  PagedResult,
  WorkedHoursDto,
} from '../types'

export const attendanceService = {
  getStatus: () =>
    api.get<CurrentAttendanceStatusDto>('/api/attendance/status').then((r) => r.data),

  clockIn: () =>
    api.post<AttendanceRecordDto>('/api/attendance/clock-in').then((r) => r.data),

  clockOut: () =>
    api.post<AttendanceRecordDto>('/api/attendance/clock-out').then((r) => r.data),

  getHistory: (pageNumber = 1, pageSize = 10, year?: number, month?: number) => {
    const params: Record<string, number> = { pageNumber, pageSize }

    if (typeof year === 'number') params.year = year
    if (typeof month === 'number') params.month = month

    return api
      .get<PagedResult<AttendanceRecordDto>>('/api/attendance/history', { params })
      .then((r) => r.data)
  },

  getHistoryCalendar: (year: number, month: number, employeeId?: number) =>
    api
      .get<AttendanceHistoryMonthDto>('/api/attendance/history/calendar', {
        params: { year, month, employeeId },
      })
      .then((r) => r.data),

  getWeeklyHours: () =>
    api.get<WorkedHoursDto>('/api/attendance/weekly-hours').then((r) => r.data),

  getMonthlyHours: () =>
    api.get<WorkedHoursDto>('/api/attendance/monthly-hours').then((r) => r.data),

  manualUpdate: (data: ManualAttendanceUpdateRequest) =>
    api.put<AttendanceRecordDto>('/api/attendance/manual-update', data).then((r) => r.data),

  manualAddShift: (data: ManualAddShiftRequest) =>
    api.post<AttendanceRecordDto>('/api/attendance/manual-add', data).then((r) => r.data),
}
