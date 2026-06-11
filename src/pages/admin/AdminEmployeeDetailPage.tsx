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
} from 'lucide-react'
import { adminService } from '../../services/adminService'
import { FullPageSpinner, Spinner } from '../../components/ui/Spinner'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { Pagination } from '../../components/ui/Pagination'
import { EditEmployeeModal } from '../../components/ui/EditEmployeeModal'
import {
  formatDateFromServer,
  formatTimeFromServer,
  displayDuration,
  computeHoursSummary,
} from '../../utils/formatters'
import type { AttendanceRecordDto, EmployeeDetailsDto } from '../../types'

const PAGE_SIZE = 10

export function AdminEmployeeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [employee, setEmployee] = useState<EmployeeDetailsDto | null>(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)

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

  const hoursSummary = useMemo(() => computeHoursSummary(records), [records])

  // Client-side sort + pagination (newest first)
  const sortedRecords = useMemo(
    () => [...records].sort((a, b) => b.clockInTime.localeCompare(a.clockInTime)),
    [records]
  )

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
        <button
          onClick={() => setShowEditModal(true)}
          className="btn-secondary flex items-center gap-2 text-sm flex-shrink-0"
        >
          <Pencil className="h-4 w-4" />
          ערוך עובד
        </button>
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
      <div className="card">
        <div className="flex items-center gap-2 mb-5">
          <History className="h-5 w-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-800">היסטוריית נוכחות</h2>
          {records.length > 0 && (
            <span className="mr-auto text-xs text-gray-400 bg-gray-100 rounded-full px-2.5 py-0.5">
              {records.length} רשומות
            </span>
          )}
        </div>

        {refreshing ? (
          <div className="flex justify-center py-12">
            <Spinner size="md" />
          </div>
        ) : records.length === 0 ? (
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
                    <th>תאריך</th>
                    <th>שעת כניסה</th>
                    <th>שעת יציאה</th>
                    <th>סה"כ שעות</th>
                    <th>סטטוס</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedRecords.map((record) => (
                    <tr key={record.id}>
                      <td className="font-medium text-gray-700">
                        {formatDateFromServer(record.clockInTime)}
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
    </div>
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
