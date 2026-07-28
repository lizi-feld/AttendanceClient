import api from './api'
import type { HolidayDto } from '../types'

export const holidayService = {
  getByYear: (year: number) =>
    api.get<HolidayDto[]>(`/api/holidays/${year}`).then((r) => r.data),
}
