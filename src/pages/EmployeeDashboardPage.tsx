import { useEffect, useRef, useState } from 'react'
import {
  LogIn,
  LogOut,
  Clock,
  CalendarDays,
  Calendar,
  AlertCircle,
  History,
  Settings,
  Plus,
  Pencil,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { attendanceService } from '../services/attendanceService'
import { Spinner, FullPageSpinner } from '../components/ui/Spinner'
import { StatusBadge } from '../components/ui/StatusBadge'
import { EditEmployeeModal } from '../components/ui/EditEmployeeModal'
import { AddManualShiftModal } from '../components/ui/AddManualShiftModal'
import { AttendanceHistorySidebar } from '../components/ui/AttendanceHistorySidebar'
import {
  formatDateFromServer,
  formatTimeFromServer,
  displayDuration,
} from '../utils/formatters'
import type {
  AttendanceHistoryMonthDto,
  CurrentAttendanceStatusDto,
  WorkedHoursDto,
} from '../types'

export function EmployeeDashboardPage() {
  const { user, updateCurrentEmployee } = useAuth()
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAddShiftModal, setShowAddShiftModal] = useState(false)

  const [status, setStatus] = useState<CurrentAttendanceStatusDto | null>(null)
  const [weeklyHours, setWeeklyHours] = useState<WorkedHoursDto | null>(null)
  const [monthlyHours, setMonthlyHours] = useState<WorkedHoursDto | null>(null)
  const [history, setHistory] = useState<AttendanceHistoryMonthDto | null>(null)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)

  const [initLoading, setInitLoading] = useState(true)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [initError, setInitError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  // ── Data fetchers ────────────────────────────────────────────────────────

  async function fetchStatus() {
    const s = await attendanceService.getStatus()
    if (mountedRef.current) setStatus(s)
  }

  async function fetchHours() {
    const [w, m] = await Promise.all([
      attendanceService.getWeeklyHours(),
      attendanceService.getMonthlyHours(),
    ])
    if (mountedRef.current) {
      setWeeklyHours(w)
      setMonthlyHours(m)
    }
  }

  async function fetchHistory(year = selectedYear, month = selectedMonth) {
    if (mountedRef.current) {
      setHistoryLoading(true)
      setHistoryError(null)
    }

    try {
      const data = await attendanceService.getHistoryCalendar(year, month)
      if (mountedRef.current) setHistory(data)
    } catch {
      if (mountedRef.current) {
        setHistoryError('שגיאה בטעינת ההיסטוריה. אנא נסה שוב.')
      }
    } finally {
      if (mountedRef.current) setHistoryLoading(false)
    }
  }

  // ── Initial load ─────────────────────────────────────────────────────────

  useEffect(() => {
    setInitLoading(true)
    setInitError(null)
    Promise.all([fetchStatus(), fetchHours(), fetchHistory(selectedYear, selectedMonth)])
      .catch(() => {
        if (mountedRef.current) setInitError('שגיאה בטעינת הנתונים. אנא רענן את הדף.')
      })
      .finally(() => {
        if (mountedRef.current) setInitLoading(false)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Auto-poll current duration every 30s while clocked in ────────────────

  useEffect(() => {
    if (!status?.isClockedIn) return
    const id = setInterval(fetchStatus, 30_000)
    return () => clearInterval(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status?.isClockedIn])

  // ── Clock In / Out ───────────────────────────────────────────────────────

  async function handleClockIn() {
    setActionLoading(true)
    setActionError(null)
    try {
      await attendanceService.clockIn()
      await Promise.all([fetchStatus(), fetchHours(), fetchHistory(selectedYear, selectedMonth)])
    } catch {
      setActionError('שגיאה בביצוע כניסה למשמרת. אנא נסה שוב.')
    } finally {
      if (mountedRef.current) setActionLoading(false)
    }
  }

  async function handleClockOut() {
    setActionLoading(true)
    setActionError(null)
    try {
      await attendanceService.clockOut()
      await Promise.all([fetchStatus(), fetchHours(), fetchHistory(selectedYear, selectedMonth)])
    } catch {
      setActionError('שגיאה בביצוע יציאה ממשמרת. אנא נסה שוב.')
    } finally {
      if (mountedRef.current) setActionLoading(false)
    }
  }

  function handleYearChange(year: number) {
    setSelectedYear(year)
    void fetchHistory(year, selectedMonth)
  }

  function handleMonthChange(month: number) {
    setSelectedMonth(month)
    void fetchHistory(selectedYear, month)
  }

  // ── Render ───────────────────────────────────────────────────────────────

  if (initLoading) return <FullPageSpinner />

  if (initError) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <AlertCircle className="h-12 w-12 text-red-400" />
        <p className="text-gray-600 text-lg">{initError}</p>
        <button
          onClick={() => window.location.reload()}
          className="btn-primary"
        >
          רענן דף
        </button>
      </div>
    )
  }

  const isClockedIn = status?.isClockedIn ?? false

  return (
    <div className="space-y-6">

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            שלום, {user?.employee.fullName}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">לוח בקרה אישי</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowEditModal(true)}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <Settings className="h-4 w-4" />
            ערוך פרופיל
          </button>
          <StatusBadge isClockedIn={isClockedIn} />
        </div>
      </div>

      {/* ── Status + Actions card ─────────────────────────────────────────── */}
      <div className="card space-y-5">
        {/* Current shift info */}
        {isClockedIn && status && (
          <div className="flex flex-wrap gap-6 bg-green-50 rounded-xl px-5 py-4 border border-green-100">
            <div>
              <p className="text-xs text-green-600 font-medium mb-0.5">כניסה למשמרת</p>
              <p className="text-lg font-semibold text-gray-800 font-mono">
                {formatTimeFromServer(status.clockInTime)}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {formatDateFromServer(status.clockInTime)}
              </p>
            </div>
            <div className="w-px bg-green-200 self-stretch" />
            <div>
              <p className="text-xs text-green-600 font-medium mb-0.5">משך המשמרת</p>
              <p className="text-lg font-semibold text-gray-800 font-mono">
                {displayDuration(status.currentDuration)}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">מתעדכן כל 30 שניות</p>
            </div>
          </div>
        )}

        {/* Action error */}
        {actionError && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {actionError}
          </div>
        )}

        {/* Buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleClockIn}
            disabled={isClockedIn || actionLoading}
            className="btn-primary flex-1 sm:flex-none sm:min-w-[160px] py-3 text-base"
          >
            {actionLoading && !isClockedIn ? (
              <Spinner size="sm" className="text-white" />
            ) : (
              <LogIn className="h-5 w-5" />
            )}
            כניסה למשמרת
          </button>

          <button
            onClick={handleClockOut}
            disabled={!isClockedIn || actionLoading}
            className="btn-danger flex-1 sm:flex-none sm:min-w-[160px] py-3 text-base"
          >
            {actionLoading && isClockedIn ? (
              <Spinner size="sm" className="text-white" />
            ) : (
              <LogOut className="h-5 w-5" />
            )}
            יציאה ממשמרת
          </button>
        </div>
      </div>

      {/* ── Hours summary cards ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <HoursCard
          icon={<CalendarDays className="h-5 w-5 text-primary-500" />}
          label="שעות שבועיות"
          data={weeklyHours}
        />
        <HoursCard
          icon={<Calendar className="h-5 w-5 text-primary-500" />}
          label="שעות חודשיות"
          data={monthlyHours}
        />
      </div>

      {user && (
        <EditEmployeeModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          employeeId={user.employee.id}
          initialFullName={user.employee.fullName}
          initialUsername={user.employee.username}
          onSuccess={(updated) => {
            updateCurrentEmployee(updated)
            setShowEditModal(false)
          }}
        />
      )}

      <AddManualShiftModal
        isOpen={showAddShiftModal}
        onClose={() => setShowAddShiftModal(false)}
        onSuccess={() => { void fetchHistory(selectedYear, selectedMonth); void fetchHours() }}
      />

      {/* ── History table ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-6 xl:flex-row">
        <div className="card flex-1">
          <div className="flex items-center gap-2 mb-5">
            <History className="h-5 w-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-800">היסטוריית נוכחות</h2>
            <button
              onClick={() => setShowAddShiftModal(true)}
              className="mr-auto btn-secondary flex items-center gap-2 text-sm"
            >
              <Plus className="h-4 w-4" />
              הוסף משמרת ידנית
            </button>
          </div>

          {historyError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {historyError}
            </div>
          ) : historyLoading ? (
            <div className="flex justify-center py-12">
              <Spinner size="md" />
            </div>
          ) : !history || history.days?.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Clock className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>אין רשומות נוכחות להצגה</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto -mx-6 px-6">
                <table className="table-base min-w-[980px]">
                  <thead>
                    <tr>
                      <th>תאריך + יום</th>
                      <th>סוג יום</th>
                      <th>כניסה</th>
                      <th>יציאה</th>
                      <th>סה"כ</th>
                      <th>פער/עודף</th>
                      <th>הסבר</th>
                      <th>פעולות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.days?.map((day) => {
                      const rowClassName = day.hasAlert
                        ? 'border-l-4 border-red-400 bg-red-50/70'
                        : day.isWeekend
                          ? 'border-l-4 border-amber-400 bg-amber-50/70'
                          : 'border-l-4 border-blue-500 bg-white'

                      return (
                        <tr key={day.date} className={rowClassName}>
                          <td className="min-w-[220px] py-4">
                            <div className="flex items-center gap-2.5">
                              <div className={`h-2.5 w-2.5 rounded-full ${day.hasAttendanceRecord ? 'bg-blue-600' : day.isWeekend ? 'bg-amber-500' : 'bg-slate-300'}`} />
                              <div>
                                <div className="font-semibold text-gray-800">{day.displayDateLabel}</div>
                                <div className="text-xs text-gray-500">{day.dayLabel}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4">
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${day.isWeekend ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>
                              {day.dayTypeLabel}
                            </span>
                          </td>
                          <td className="py-4 font-mono text-sm">
                            {day.clockInTime ? formatTimeFromServer(day.clockInTime) : '—'}
                          </td>
                          <td className="py-4 font-mono text-sm">
                            {day.clockOutTime ? formatTimeFromServer(day.clockOutTime) : '—'}
                          </td>
                          <td className="py-4 font-mono text-sm">
                            {day.totalWorkedHours ? displayDuration(day.totalWorkedHours) : '—'}
                          </td>
                          <td className="py-4">
                            <div className={`flex items-center gap-1.5 text-sm ${day.hasDeficit ? 'text-red-600' : 'text-emerald-600'}`}>
                              {day.hasAlert && <AlertCircle className="h-4 w-4" />}
                              <span>{day.displayBalance ?? '—'}</span>
                            </div>
                            {day.alertText && <div className="mt-1 text-xs text-red-600">{day.alertText}</div>}
                          </td>
                          <td className="py-4 max-w-[220px] text-sm text-gray-600">
                            {day.explanation ?? '—'}
                          </td>
                          <td className="py-4 text-left">
                            <button
                              type="button"
                              onClick={() => setShowAddShiftModal(true)}
                              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${day.isWeekend ? 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'}`}
                            >
                              {day.isWeekend ? <Plus className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                              {day.isWeekend ? 'הוסף דיווח' : 'ערוך'}
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-100 shadow-inner">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-4">
                    <span><span className="text-slate-400">סה"כ שעות:</span> {history.summary.totalWorkedHours}</span>
                    <span><span className="text-slate-400">שעות רגילות:</span> {history.summary.regularHours}</span>
                    <span><span className="text-slate-400">פער:</span> {history.summary.deficitHours}</span>
                    <span><span className="text-slate-400">הפסקות:</span> {history.summary.breakHours}</span>
                  </div>
                  <span className="text-slate-400">הערות: {history.summary.notesCount}</span>
                </div>
              </div>
            </>
          )}
        </div>

        <AttendanceHistorySidebar
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
          onYearChange={handleYearChange}
          onMonthChange={handleMonthChange}
          className="xl:sticky xl:top-6"
        />
      </div>
    </div>
  )
}

// ── Hours card sub-component ──────────────────────────────────────────────────

interface HoursCardProps {
  icon: React.ReactNode
  label: string
  data: WorkedHoursDto | null
}

function HoursCard({ icon, label, data }: HoursCardProps) {
  return (
    <div className="card flex items-center gap-4">
      <div className="h-12 w-12 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        {data ? (
          <p className="text-2xl font-bold text-gray-900 mt-0.5 font-mono">
            {data.formatted}
          </p>
        ) : (
          <div className="h-7 w-24 bg-gray-100 rounded animate-pulse mt-1" />
        )}
      </div>
    </div>
  )
}
