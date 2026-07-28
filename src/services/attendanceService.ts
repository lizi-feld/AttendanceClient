import api from './api'
import type {
  AbsenceRecordDto,
  AttendanceHistoryMonthDto,
  AttendanceRecordDto,
  CurrentAttendanceStatusDto,
  ManualAddShiftRequest,
  ManualAttendanceUpdateRequest,
  PagedResult,
  ReportAbsenceRequest,
  UploadDocumentResponseDto,
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

  uploadDocument: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    // Do not set a Content-Type header here — axios detects FormData and lets the
    // browser generate the multipart boundary itself.
    return api
      .post<UploadDocumentResponseDto>('/api/attendance/upload-document', formData)
      .then((r) => r.data)
  },

  reportAbsence: (data: ReportAbsenceRequest) =>
    api.post<AbsenceRecordDto>('/api/attendance/report-absence', data).then((r) => r.data),

  /**
   * Fetches a previously uploaded absence document as a blob and returns an object URL for it.
   * The download endpoint requires the Bearer token, so a plain `<a href>` can't be used —
   * the caller must revoke the returned URL (via `URL.revokeObjectURL`) once it's no longer needed.
   */
  getDocumentBlobUrl: (documentUrl: string) =>
    api
      .get<Blob>(documentUrl, { responseType: 'blob' })
      .then((r) => URL.createObjectURL(r.data)),
}
