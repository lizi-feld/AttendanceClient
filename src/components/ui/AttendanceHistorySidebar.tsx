import type { ComponentPropsWithoutRef } from 'react'

interface AttendanceHistorySidebarProps extends ComponentPropsWithoutRef<'aside'> {
  selectedYear: number
  selectedMonth: number
  onYearChange: (year: number) => void
  onMonthChange: (month: number) => void
}

const MONTHS = [
  'ינואר',
  'פברואר',
  'מרץ',
  'אפריל',
  'מאי',
  'יוני',
  'יולי',
  'אוגוסט',
  'ספטמבר',
  'אוקטובר',
  'נובמבר',
  'דצמבר',
]

export function AttendanceHistorySidebar({
  selectedYear,
  selectedMonth,
  onYearChange,
  onMonthChange,
  className = '',
  ...props
}: AttendanceHistorySidebarProps) {
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 6 }, (_, index) => currentYear - 2 + index)

  return (
    <aside
      dir="rtl"
      className={`w-full rounded-2xl border border-gray-200 bg-white p-4 shadow-sm space-y-4 lg:w-52 ${className}`}
      {...props}
    >
      <div>
        <label htmlFor="history-year" className="mb-1.5 block text-xs font-medium text-gray-500">
          בחירת שנה
        </label>
        <select
          id="history-year"
          value={selectedYear}
          onChange={(event) => onYearChange(Number(event.target.value))}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
        >
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="history-month" className="mb-1.5 block text-xs font-medium text-gray-500">
          בחירת חודש
        </label>
        <select
          id="history-month"
          value={selectedMonth}
          onChange={(event) => onMonthChange(Number(event.target.value))}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
        >
          {MONTHS.map((monthName, index) => (
            <option key={monthName} value={index + 1}>
              {monthName}
            </option>
          ))}
        </select>
      </div>
    </aside>
  )
}
