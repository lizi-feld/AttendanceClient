import api from './api'
import type {
  AttendanceRecordDto,
  DashboardSummaryDto,
  EmployeeDetailsDto,
  EmployeeDto,
  ManualAddShiftRequest,
  PagedResult,
} from '../types'

export const adminService = {
  getDashboard: () =>
    api.get<DashboardSummaryDto>('/api/admin/dashboard').then((r) => r.data),

  getEmployees: (pageNumber = 1, pageSize = 10) =>
    api
      .get<PagedResult<EmployeeDto>>('/api/admin/employees', {
        params: { pageNumber, pageSize },
      })
      .then((r) => r.data),

  getEmployeeDetails: (id: number | string) =>
    api.get<EmployeeDetailsDto>(`/api/admin/employees/${id}`).then((r) => r.data),

  adminManualAddShift: (data: ManualAddShiftRequest) =>
    api.post<AttendanceRecordDto>('/api/admin/attendance/manual-add', data).then((r) => r.data),
}
