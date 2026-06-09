import api from './api'
import type { DashboardSummaryDto, EmployeeDetailsDto, EmployeeDto, PagedResult } from '../types'

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
}
