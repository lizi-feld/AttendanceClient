import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  UserCheck,
  UserX,
  Search,
  ChevronLeft,
  AlertCircle,
  RefreshCw,
  UserPlus,
} from 'lucide-react'
import { adminService } from '../../services/adminService'
import { Spinner, FullPageSpinner } from '../../components/ui/Spinner'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { Pagination } from '../../components/ui/Pagination'
import { AddEmployeeModal } from '../../components/ui/AddEmployeeModal'
import { formatTimeFromServer, formatDateFromServer } from '../../utils/formatters'
import type { AttendanceRecordDto, DashboardSummaryDto, EmployeeDto, PagedResult } from '../../types'

type StatusFilter = 'all' | 'active' | 'inactive'

const PAGE_SIZE = 10

export function AdminDashboardPage() {
  const navigate = useNavigate()

  const [dashboard, setDashboard] = useState<DashboardSummaryDto | null>(null)
  const [employees, setEmployees] = useState<PagedResult<EmployeeDto> | null>(null)
  const [page, setPage] = useState(1)

  const [initLoading, setInitLoading] = useState(true)
  const [tableLoading, setTableLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [showAddModal, setShowAddModal] = useState(false)

  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  // Keep a ref to current page so the auto-refresh interval can use it
  // without being re-created on every page change
  const pageRef = useRef(page)
  useEffect(() => { pageRef.current = page }, [page])

  // ── Active sessions lookup map ────────────────────────────────────────────

  const activeMap = useMemo<Map<number, AttendanceRecordDto>>(() => {
    if (!dashboard) return new Map()
    return new Map(dashboard.activeSessions.map((s) => [s.employeeId, s]))
  }, [dashboard])

  // ── Get most recent clock-in for an employee ──────────────────────────────
  // Returns the active session if exists, otherwise the most recent historical record
  const getMostRecentClockIn = (emp: EmployeeDto): AttendanceRecordDto | null => {
    const activeSession = activeMap.get(emp.id)
    if (activeSession) return activeSession

    if (!emp.attendanceRecords || emp.attendanceRecords.length === 0) return null

    // Sort by createdAt descending and return the most recent
    return emp.attendanceRecords.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0]
  }

  // ── Fetchers ──────────────────────────────────────────────────────────────

  async function fetchEmployees(pageNum: number) {
    if (mountedRef.current) setTableLoading(true)
    try {
      const data = await adminService.getEmployees(pageNum, PAGE_SIZE)
      if (mountedRef.current) setEmployees(data)
    } finally {
      if (mountedRef.current) setTableLoading(false)
    }
  }

  // Silent background refresh (dashboard + current page of employees)
  async function doRefresh(showSpinner = false) {
    if (showSpinner && mountedRef.current) setRefreshing(true)
    try {
      const [dash, emps] = await Promise.all([
        adminService.getDashboard(),
        adminService.getEmployees(pageRef.current, PAGE_SIZE),
      ])
      if (!mountedRef.current) return
      setDashboard(dash)
      setEmployees(emps)
      setLastRefreshed(new Date())
    } catch {
      // silent — don't disrupt the user for a background refresh failure
    } finally {
      if (mountedRef.current) setRefreshing(false)
    }
  }

  // ── Initial load ──────────────────────────────────────────────────────────

  useEffect(() => {
    setInitLoading(true)
    Promise.all([adminService.getDashboard(), adminService.getEmployees(1, PAGE_SIZE)])
      .then(([dash, emps]) => {
        if (!mountedRef.current) return
        setDashboard(dash)
        setEmployees(emps)
        setLastRefreshed(new Date())
      })
      .catch(() => {
        if (mountedRef.current) setError('שגיאה בטעינת הנתונים. אנא רענן את הדף.')
      })
      .finally(() => {
        if (mountedRef.current) setInitLoading(false)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Auto-refresh every 5 minutes ──────────────────────────────────────────

  useEffect(() => {
    const id = setInterval(() => doRefresh(), 5 * 60 * 1000)
    return () => clearInterval(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Filtered employees (client-side, current page) ────────────────────────

  const filteredEmployees = useMemo(() => {
    if (!employees) return []
    let list = employees.items

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      list = list.filter(
        (e) =>
          e.fullName.toLowerCase().includes(q) ||
          e.username.toLowerCase().includes(q)
      )
    }

    if (statusFilter === 'active') {
      list = list.filter((e) => activeMap.has(e.id))
    } else if (statusFilter === 'inactive') {
      list = list.filter((e) => !activeMap.has(e.id))
    }

    return list
  }, [employees, searchQuery, statusFilter, activeMap])

  // ── Pagination ────────────────────────────────────────────────────────────

  function handlePageChange(newPage: number) {
    setPage(newPage)
    fetchEmployees(newPage)
  }

  // ── When filters change, go back to page 1 ────────────────────────────────

  useEffect(() => {
    if (page !== 1) {
      setPage(1)
      fetchEmployees(1)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, statusFilter])

  // ── Render ────────────────────────────────────────────────────────────────

  if (initLoading) return <FullPageSpinner />

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <AlertCircle className="h-12 w-12 text-red-400" />
        <p className="text-gray-600 text-lg">{error}</p>
        <button onClick={() => window.location.reload()} className="btn-primary">
          רענן דף
        </button>
      </div>
    )
  }

  const offShift = (dashboard?.totalEmployees ?? 0) - (dashboard?.clockedInNow ?? 0)

  return (
    <div className="space-y-6">

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">לוח בקרה מנהל</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {lastRefreshed
              ? `עודכן בשעה ${lastRefreshed.getHours().toString().padStart(2,'0')}:${lastRefreshed.getMinutes().toString().padStart(2,'0')} — רענון אוטומטי כל 5 דקות`
              : 'טוען נתונים...'}
          </p>
        </div>
        <button
          onClick={() => doRefresh(true)}
          disabled={refreshing}
          className="btn-secondary flex items-center gap-2 text-sm"
          title="רענן נתונים עכשיו"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'מרענן...' : 'רענן'}
        </button>
      </div>

      {/* ── Summary cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard
          icon={<Users className="h-6 w-6 text-primary-600" />}
          bgColor="bg-primary-50"
          label="סה״כ עובדים"
          value={dashboard?.totalEmployees ?? 0}
        />
        <SummaryCard
          icon={<UserCheck className="h-6 w-6 text-green-600" />}
          bgColor="bg-green-50"
          label="בעבודה כעת"
          value={dashboard?.clockedInNow ?? 0}
          highlight="green"
        />
        <SummaryCard
          icon={<UserX className="h-6 w-6 text-gray-400" />}
          bgColor="bg-gray-50"
          label="לא בעבודה"
          value={offShift}
        />
      </div>

      {/* ── Employees table card ──────────────────────────────────────────── */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <h2 className="text-lg font-semibold text-gray-800 self-center flex-1">
            רשימת עובדים
          </h2>

          {/* Search */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="חיפוש לפי שם..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pr-9 w-full sm:w-56"
            />
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="input-field w-full sm:w-40"
          >
            <option value="all">כל הסטטוסים</option>
            <option value="active">במשמרת</option>
            <option value="inactive">לא במשמרת</option>
          </select>

          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center gap-2 text-sm whitespace-nowrap"
          >
            <UserPlus className="h-4 w-4" />
            הוסף עובד
          </button>
        </div>

        {tableLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="md" />
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p>לא נמצאו עובדים התואמים את הסינון</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto -mx-6 px-6">
              <table className="table-base">
                <thead>
                  <tr>
                    <th>שם מלא</th>
                    <th>שם משתמש</th>
                    <th>סטטוס</th>
                    <th>כניסה אחרונה</th>
                    <th>שעת כניסה</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map((emp) => {
                    const session = activeMap.get(emp.id)
                    const lastClockIn = getMostRecentClockIn(emp)
                    return (
                      <tr key={emp.id}>
                        <td className="font-medium text-gray-800">{emp.fullName}</td>
                        <td className="text-gray-500 text-xs">{emp.username}</td>
                        <td>
                          <StatusBadge isClockedIn={Boolean(session)} />
                        </td>
                        <td className="text-gray-600 text-sm">
                          {lastClockIn
                            ? formatDateFromServer(lastClockIn.clockInTime)
                            : '—'}
                        </td>
                        <td className="font-mono text-gray-600 text-sm">
                          {lastClockIn
                            ? formatTimeFromServer(lastClockIn.clockInTime)
                            : '—'}
                        </td>
                        <td>
                          <button
                            onClick={() => navigate(`/admin/employee/${emp.id}`)}
                            className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-800
                                       font-medium transition-colors"
                          >
                            פרטים
                            <ChevronLeft className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {employees && (
              <Pagination
                page={page}
                pageSize={PAGE_SIZE}
                totalCount={employees.totalCount}
                onPageChange={handlePageChange}
                disabled={tableLoading}
              />
            )}
          </>
        )}
      </div>

      <AddEmployeeModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => doRefresh()}
      />
    </div>
  )
}

// ── Summary card ──────────────────────────────────────────────────────────────

interface SummaryCardProps {
  icon: React.ReactNode
  bgColor: string
  label: string
  value: number
  highlight?: 'green'
}

function SummaryCard({ icon, bgColor, label, value, highlight }: SummaryCardProps) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`h-12 w-12 rounded-xl ${bgColor} flex items-center justify-center flex-shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p
          className={`text-3xl font-bold mt-0.5 ${
            highlight === 'green' ? 'text-green-600' : 'text-gray-900'
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  )
}
