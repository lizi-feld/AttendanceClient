import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowRight,
  CalendarDays,
  Calendar,
  Clock,
  UserCircle,
  AlertCircle,
  History,
  RefreshCw,
  Pencil,
  Plus,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
} from 'lucide-react'
import { adminService } from '../../services/adminService'
import { FullPageSpinner, Spinner } from '../../components/ui/Spinner'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { Pagination } from '../../components/ui/Pagination'
import { EditEmployeeModal } from '../../components/ui/EditEmployeeModal'
import { ManualTimeUpdateModal } from '../../components/ui/ManualTimeUpdateModal'
import { AddManualShiftModal } from '../../components/ui/AddManualShiftModal'
import { AttendanceHistorySidebar } from '../../components/ui/AttendanceHistorySidebar'
import {
  formatDateFromServer,
  formatTimeFromServer,
  displayDuration,
  computeHoursSummary,
} from '../../utils/formatters'
import type { AttendanceRecordDto, EmployeeDetailsDto } from '../../types'

const PAGE_SIZE = 10

type SortKey = 'date' | 'clockIn' | 'clockOut' | 'duration' | 'status'
type SortDir = 'asc' | 'desc'

function SortTh({
  label, col, active, dir, onSort,
}: {
  label: string
  col: SortKey
  active: SortKey
  dir: SortDir
  onSort: (k: SortKey) => void
}) {
  const isActive = col === active
  return (
    <th>
      <button
        onClick={() => onSort(col)}
        className="inline-flex items-center gap-1 group select-none hover:text-primary-600 transition-colors"
      >
        {label}
        {isActive ? (
          dir === 'asc'
            ? <ChevronUp className="h-3.5 w-3.5 text-primary-500" />
            : <ChevronDown className="h-3.5 w-3.5 text-primary-500" />
        ) : (
          <ArrowUpDown className="h-3.5 w-3.5 text-gray-300 group-hover:text-gray-400" />
        )}
      </button>
    </th>
  )
}

export function AdminEmployeeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [employee, setEmployee] = useState<EmployeeDetailsDto | null>(null)
  const [page, setPage] = useState(1)
  const [sortKey, setSortKey] = useState<SortKey>('date')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showManualModal, setShowManualModal] = useState(false)
  const [showAddShiftModal, setShowAddShiftModal] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecordDto | null>(null)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)

  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  // ── Fetch ─────────────────────────────────────────────────────────────────

  async function loadEmployee(showSpinner = true) {
    if (!id) return
    if (showSpinner && mountedRef.current) setLoading(true)
    else if (mountedRef.current) setRefreshing(true)
    setError(null)
    try {
      const data = await adminService.getEmployeeDetails(id)
      if (mountedRef.current) setEmployee(data)
    } catch {
      if (mountedRef.current) setError('שגיאה בטעינת פרטי העובד.')
    } finally {
      if (mountedRef.current) {
        setLoading(false)
        setRefreshing(false)
      }
    }
  }

  useEffect(() => {
    loadEmployee(true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // ── Derived data ──────────────────────────────────────────────────────────

  // Defensive: backend might return the array under different casing
  const records = useMemo<AttendanceRecordDto[]>(() => {
    if (!employee) return []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = employee as any
    const arr =
      raw.attendanceRecords ??
      raw.AttendanceRecords ??
      raw.records ??
      []
    return Array.isArray(arr) ? arr : []
  }, [employee])

  const activeRecord = useMemo(
    () => records.find((r) => r.isActive),
    [records]
  )

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const recordDate = new Date(record.clockInTime)
      return recordDate.getFullYear() === selectedYear && recordDate.getMonth() + 1 === selectedMonth
    })
  }, [records, selectedYear, selectedMonth])

  const hoursSummary = useMemo(() => computeHoursSummary(filteredRecords), [filteredRecords])

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
    setPage(1)
  }

  function handleYearChange(year: number) {
    setSelectedYear(year)
    setPage(1)
  }

  function handleMonthChange(month: number) {
    setSelectedMonth(month)
    setPage(1)
  }

  // Client-side sort + pagination
  const sortedRecords = useMemo(() => {
    const dir = sortDir === 'asc' ? 1 : -1
    const parseDuration = (d: string | null) => {
      if (!d) return -1
      const parts = d.split(':').map(Number)
      return parts.length === 3 ? parts[0] * 3600 + parts[1] * 60 + parts[2] : 0
    }
    return [...filteredRecords].sort((a, b) => {
      switch (sortKey) {
        case 'date':
        case 'clockIn':
          return dir * a.clockInTime.localeCompare(b.clockInTime)
        case 'clockOut':
          if (!a.clockOutTime && !b.clockOutTime) return 0
          if (!a.clockOutTime) return 1
          if (!b.clockOutTime) return -1
          return dir * a.clockOutTime.localeCompare(b.clockOutTime)
        case 'duration':
          return dir * (parseDuration(a.duration) - parseDuration(b.duration))
        case 'status':
          return dir * ((a.isActive ? 1 : 0) - (b.isActive ? 1 : 0))
        default:
          return 0
      }
    })
  }, [filteredRecords, sortKey, sortDir])

  const pagedRecords = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return sortedRecords.slice(start, start + PAGE_SIZE)
  }, [sortedRecords, page])

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) return <FullPageSpinner />

  if (error || !employee) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <AlertCircle className="h-12 w-12 text-red-400" />
        <p className="text-gray-600 text-lg">{error ?? 'עובד לא נמצא'}</p>
        <button onClick={() => navigate('/admin/dashboard')} className="btn-secondary">
          חזרה לדשבורד
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* ── Back button ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/admin/dashboard')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600
                     transition-colors font-medium"
        >
          <ArrowRight className="h-4 w-4" />
          חזרה לרשימת עובדים
        </button>

        <button
          onClick={() => loadEmployee(false)}
          disabled={refreshing}
          className="btn-secondary flex items-center gap-2 text-sm"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'מרענן...' : 'רענן'}
        </button>
      </div>

      {/* ── Employee header card ──────────────────────────────────────────── */}
      <div className="card flex flex-wrap items-center gap-5">
        <div className="h-16 w-16 rounded-2xl bg-primary-50 flex items-center justify-center flex-shrink-0">
          <UserCircle className="h-9 w-9 text-primary-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gray-900 truncate">
              {employee.fullName}
            </h1>
            <StatusBadge isClockedIn={Boolean(activeRecord)} />
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
            <span>
              <span className="font-medium text-gray-600">שם משתמש: </span>
              {employee.username}
            </span>
            <span>
              <span className="font-medium text-gray-600">תפקיד: </span>
              {employee.role === 'Admin' ? 'מנהל' : 'עובד'}
            </span>
            <span>
              <span className="font-medium text-gray-600">הצטרף: </span>
              {formatDateFromServer(employee.createdAt)}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 flex-shrink-0">
          <button
            onClick={() => setShowAddShiftModal(true)}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <Plus className="h-4 w-4" />
            הוסף משמרת ידנית
          </button>
          <button
            onClick={() => setShowEditModal(true)}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <Pencil className="h-4 w-4" />
            ערוך עובד
          </button>
        </div>
      </div>

      {/* ── Active shift info ─────────────────────────────────────────────── */}
      {activeRecord && (
        <div className="flex flex-wrap gap-6 bg-green-50 rounded-xl px-5 py-4 border border-green-100">
          <div>
            <p className="text-xs text-green-600 font-medium mb-0.5">כניסה למשמרת</p>
            <p className="text-lg font-semibold text-gray-800 font-mono">
              {formatTimeFromServer(activeRecord.clockInTime)}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {formatDateFromServer(activeRecord.clockInTime)}
            </p>
          </div>
        </div>
      )}

      {/* ── Hours summary ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <HoursCard
          icon={<CalendarDays className="h-5 w-5 text-primary-500" />}
          label="שעות שבועיות (7 ימים)"
          value={hoursSummary.weekly}
          noData={records.length === 0}
        />
        <HoursCard
          icon={<Calendar className="h-5 w-5 text-primary-500" />}
          label="שעות חודשיות (30 ימים)"
          value={hoursSummary.monthly}
          noData={records.length === 0}
        />
      </div>

      {/* ── Attendance history ────────────────────────────────────────────── */}
      <div className="flex flex-col gap-6 xl:flex-row">
        <div className="card flex-1">
          <div className="flex items-center gap-2 mb-5">
            <History className="h-5 w-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-800">היסטוריית נוכחות</h2>
            {filteredRecords.length > 0 && (
              <span className="mr-auto text-xs text-gray-400 bg-gray-100 rounded-full px-2.5 py-0.5">
                {filteredRecords.length} רשומות
              </span>
            )}
          </div>

          {refreshing ? (
            <div className="flex justify-center py-12">
              <Spinner size="md" />
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Clock className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">אין רשומות נוכחות להצגה</p>
              <p className="text-xs mt-1">
                הרשומות יוצגו לאחר שהעובד יתחיל לדווח נוכחות
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto -mx-6 px-6">
                <table className="table-base">
                  <thead>
                    <tr>
                      <SortTh label="תאריך"      col="date"     active={sortKey} dir={sortDir} onSort={handleSort} />
                      <SortTh label="שעת כניסה"  col="clockIn"  active={sortKey} dir={sortDir} onSort={handleSort} />
                      <SortTh label="שעת יציאה"  col="clockOut" active={sortKey} dir={sortDir} onSort={handleSort} />
                      <SortTh label='סה"כ שעות'  col="duration" active={sortKey} dir={sortDir} onSort={handleSort} />
                      <SortTh label="סטטוס"      col="status"   active={sortKey} dir={sortDir} onSort={handleSort} />
                      <th> </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedRecords.map((record) => (
                      <tr key={record.id}>
                        <td className="font-medium text-gray-700">
                          <div className="flex items-center gap-1.5">
                            {formatDateFromServer(record.clockInTime)}
                             {record.note && (
                              <ManualUpdateBadge note={record.note} />
                            )}
                          </div>
                        </td>
                        <td className="font-mono text-gray-600">
                          {formatTimeFromServer(record.clockInTime)}
                        </td>
                        <td className="font-mono text-gray-600">
                          {record.clockOutTime ? (
                            formatTimeFromServer(record.clockOutTime)
                          ) : (
                            <span className="text-green-600 font-medium">פעיל</span>
                          )}
                        </td>
                        <td className="font-mono text-gray-600">
                          {displayDuration(record.duration)}
                        </td>
                        <td>
                          <StatusBadge isClockedIn={record.isActive} />
                        </td>
                        <td>
                          <button
                            onClick={() => { setSelectedRecord(record); setShowManualModal(true) }}
                            className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-800
                                       font-medium transition-colors"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            עדכן
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Pagination
                page={page}
                pageSize={PAGE_SIZE}
                totalCount={sortedRecords.length}
                onPageChange={setPage}
              />
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

      <EditEmployeeModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        employeeId={employee.id}
        initialFullName={employee.fullName}
        initialUsername={employee.username}
        onSuccess={(updated) => {
          setEmployee((prev) => prev ? { ...prev, ...updated } : prev)
          setShowEditModal(false)
        }}
      />

      {selectedRecord && (
        <ManualTimeUpdateModal
          isOpen={showManualModal}
          onClose={() => setShowManualModal(false)}
          recordId={selectedRecord.id}
          initialClockInTime={selectedRecord.clockInTime}
          initialClockOutTime={selectedRecord.clockOutTime}
          onSuccess={() => loadEmployee(false)}
        />
      )}

      <AddManualShiftModal
        isOpen={showAddShiftModal}
        onClose={() => setShowAddShiftModal(false)}
        targetEmployeeId={employee.id}
        onSuccess={() => loadEmployee(false)}
      />
    </div>
  )
}

// ── Manual update badge ───────────────────────────────────────────────────────

function ManualUpdateBadge({ note }: { note?: string | null }) {
  return (
    <span
      title={note ? `עודכן ידנית\n${note}` : 'עודכן ידנית'}
      className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-amber-100 text-amber-600 cursor-help flex-shrink-0"
    >
      <Pencil className="h-2.5 w-2.5" />
    </span>
  )
}

// ── Hours card sub-component ──────────────────────────────────────────────────

interface HoursCardProps {
  icon: React.ReactNode
  label: string
  value: string
  noData: boolean
}

function HoursCard({ icon, label, value, noData }: HoursCardProps) {
  return (
    <div className="card flex items-center gap-4">
      <div className="h-12 w-12 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        {noData ? (
          <p className="text-sm text-gray-400 mt-1">אין נתונים</p>
        ) : (
          <p className="text-2xl font-bold text-gray-900 mt-0.5 font-mono">{value}</p>
        )}
      </div>
    </div>
  )
}
