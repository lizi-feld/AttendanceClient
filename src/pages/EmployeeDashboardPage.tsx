import { useEffect, useRef, useState } from 'react'
import {
  LogIn,
  LogOut,
  CalendarDays,
  Calendar,
  AlertCircle,
  History,
  Settings,
  Plus,
  CalendarPlus,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { attendanceService } from '../services/attendanceService'
import { Spinner, FullPageSpinner } from '../components/ui/Spinner'
import { StatusBadge } from '../components/ui/StatusBadge'
import { EditEmployeeModal } from '../components/ui/EditEmployeeModal'
import { AddManualShiftModal } from '../components/ui/AddManualShiftModal'
import { ReportAbsenceModal } from '../components/ui/ReportAbsenceModal'
import { AttendanceHistorySidebar } from '../components/ui/AttendanceHistorySidebar'
import { AttendanceHistoryTable } from '../components/ui/AttendanceHistoryTable'
import {
  formatDateFromServer,
  formatTimeFromServer,
  displayDuration,
} from '../utils/formatters'
import type { AbsenceTypeValue } from '../utils/attendanceValidation'
import type {
  AttendanceHistoryMonthDto,
  CurrentAttendanceStatusDto,
  WorkedHoursDto,
} from '../types'

export function EmployeeDashboardPage() {
  const { user, updateCurrentEmployee } = useAuth()
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAddShiftModal, setShowAddShiftModal] = useState(false)
  const [showReportAbsenceModal, setShowReportAbsenceModal] = useState(false)
  const [absencePrefill, setAbsencePrefill] = useState<{ date: string; absenceType: AbsenceTypeValue } | null>(null)

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
      setActionError('שגיאה בביצוע כניסה . אנא נסה שוב.')
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
              <p className="text-xs text-green-600 font-medium mb-0.5">כניסה לעבודה</p>
              <p className="text-lg font-semibold text-gray-800 font-mono">
                {formatTimeFromServer(status.clockInTime)}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {formatDateFromServer(status.clockInTime)}
              </p>
            </div>
            <div className="w-px bg-green-200 self-stretch" />
            <div>
              <p className="text-xs text-green-600 font-medium mb-0.5">משך העבודה</p>
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
            כניסה
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
            יציאה
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
          initialDailyWorkHours={user.employee.dailyWorkHours}
          initialRole={user.employee.role}  
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

      <ReportAbsenceModal
        isOpen={showReportAbsenceModal}
        onClose={() => setShowReportAbsenceModal(false)}
        initialDate={absencePrefill?.date}
        initialAbsenceType={absencePrefill?.absenceType}
        onSuccess={() => { void fetchHistory(selectedYear, selectedMonth); void fetchHours() }}
      />

      {/* ── History table ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-6 xl:flex-row">
          <AttendanceHistorySidebar
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
          onYearChange={handleYearChange}
          onMonthChange={handleMonthChange}
          className="xl:sticky xl:top-6"
        />
        <div className="card flex-1">
          <div className="flex items-center gap-2 mb-5">
            
            <History className="h-5 w-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-800">היסטוריית נוכחות</h2>
            <div className="mr-auto flex items-center gap-2">
              <button
                onClick={() => { setAbsencePrefill(null); setShowReportAbsenceModal(true) }}
                className="btn-secondary flex items-center gap-2 text-sm"
              >
                <CalendarPlus className="h-4 w-4" />
                דווח היעדרות
              </button>
              <button
                onClick={() => setShowAddShiftModal(true)}
                className="btn-secondary flex items-center gap-2 text-sm"
              >
                <Plus className="h-4 w-4" />
                הוסף עדכון
              </button>
            </div>
          </div>

          <AttendanceHistoryTable
            history={history}
            loading={historyLoading}
            error={historyError}
            emptyMessage="אין רשומות נוכחות להצגה"
            onRowAction={() => setShowAddShiftModal(true)}
            onOpenAbsenceModal={(date, absenceType) => {
              setAbsencePrefill({ date, absenceType })
              setShowReportAbsenceModal(true)
            }}
            onAbsenceReported={() => { void fetchHistory(selectedYear, selectedMonth); void fetchHours() }}
          />
        </div>

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
