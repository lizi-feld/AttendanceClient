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
      className={`w-full rounded-2xl border border-gray-200 bg-white p-4 shadow-sm lg:w-72 ${className}`}
      {...props}
    >
      <div className="mb-4">
        <label htmlFor="history-year" className="mb-2 block text-sm font-medium text-gray-700">
          שנה
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
        <p className="mb-3 text-sm font-medium text-gray-700">חודשים</p>
        <div className="space-y-2">
          {MONTHS.map((monthName, index) => {
            const monthNumber = index + 1
            const isActive = selectedMonth === monthNumber

            return (
              <button
                key={monthName}
                type="button"
                onClick={() => onMonthChange(monthNumber)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition ${
                  isActive
                    ? 'bg-primary-50 text-primary-700 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                }`}
              >
                <span>{monthName}</span>
                {isActive && <span className="text-primary-600">✓</span>}
              </button>
            )
          })}
        </div>
      </div>
    </aside>
  )
}
