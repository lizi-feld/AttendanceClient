import api from './api'
import type {
  AttendanceRecordDto,
  CurrentAttendanceStatusDto,
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

  getHistory: (pageNumber = 1, pageSize = 10) =>
    api
      .get<PagedResult<AttendanceRecordDto>>('/api/attendance/history', {
        params: { pageNumber, pageSize },
      })
      .then((r) => r.data),

  getWeeklyHours: () =>
    api.get<WorkedHoursDto>('/api/attendance/weekly-hours').then((r) => r.data),

  getMonthlyHours: () =>
    api.get<WorkedHoursDto>('/api/attendance/monthly-hours').then((r) => r.data),
}
