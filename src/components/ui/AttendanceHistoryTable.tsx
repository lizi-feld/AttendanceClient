import { useState } from 'react'
import { AlertCircle, CalendarOff, Clock, Paperclip, Pencil, Plus } from 'lucide-react'
import { Spinner } from './Spinner'
import { useToast } from './Toast'
import { attendanceService } from '../../services/attendanceService'
import {
  absenceTypeOptions,
  absenceTypeToCode,
  documentRequiredTypes,
  type AbsenceTypeValue,
} from '../../utils/attendanceValidation'
import { formatTimeFromServer, displayDuration } from '../../utils/formatters'
import type { AttendanceHistoryDayDto, AttendanceHistoryMonthDto } from '../../types'

interface Props {
  history: AttendanceHistoryMonthDto | null
  loading: boolean
  error?: string | null
  emptyMessage?: string
  onRowAction: () => void
  /**
   * Enables the inline "report absence" dropdown on empty days (no record, not a weekend,
   * not in the future). Both callbacks must be provided together — omit both to disable
   * the feature entirely (e.g. the admin page, which doesn't yet support reporting an
   * absence on behalf of another employee).
   */
  onOpenAbsenceModal?: (date: string, absenceType: AbsenceTypeValue) => void
  onAbsenceReported?: () => void
}

function absenceTypeLabel(value: string): string {
  return absenceTypeOptions.find((o) => o.value === value)?.label ?? value
}

/**
 * Maps a day to one of the four daily work statuses, independent of the free-text
 * Explanation column. Absence takes priority; otherwise derived from the backend's
 * `status` field ("Active"/"Completed"/"Weekend"/"Future"/"Empty").
 */
function getDailyStatus(day: AttendanceHistoryDayDto): { label: string; className: string } {
  if (day.absenceType) {
    return { label: 'דווח היעדרות', className: 'bg-indigo-100 text-indigo-700' }
  }
  if (day.status === 'Active') {
    return { label: 'בעבודה', className: 'bg-emerald-100 text-emerald-700' }
  }
  if (day.status === 'Completed') {
    return { label: 'הושלם', className: 'bg-blue-100 text-blue-700' }
  }
  return { label: 'טרם החל', className: 'bg-gray-100 text-gray-500' }
}

/**
 * Opens a previously uploaded absence document in a new tab.
 * The download endpoint requires the Bearer token, so we fetch it as a blob via the
 * authenticated `api` client rather than using a plain `<a href>`. The blank tab is opened
 * synchronously (before the `await`) so browsers don't treat the later redirect as a
 * popup blocked outside a user gesture.
 */
async function openDocument(documentUrl: string) {
  const newTab = window.open('', '_blank')
  try {
    const blobUrl = await attendanceService.getDocumentBlobUrl(documentUrl)
    if (newTab) newTab.location.href = blobUrl
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000)
  } catch {
    newTab?.close()
  }
}

export function AttendanceHistoryTable({
  history,
  loading,
  error,
  emptyMessage = 'אין נתונים להצגה בחודש זה',
  onRowAction,
  onOpenAbsenceModal,
  onAbsenceReported,
}: Props) {
  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {error}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="md" />
      </div>
    )
  }

  if (!history || history.days.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <Clock className="h-10 w-10 mx-auto mb-3 opacity-40" />
        <p>{emptyMessage}</p>
      </div>
    )
  }

  const canQuickReportAbsence = Boolean(onOpenAbsenceModal && onAbsenceReported)

  return (
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
              <th>חוסר</th>
              <th>הסבר</th>
              <th>סטטוס</th>
              <th>פעולות</th>
            </tr>
          </thead>
          <tbody>
            {history.days.map((day) => (
              <DayRow
                key={day.date}
                day={day}
                onRowAction={onRowAction}
                onOpenAbsenceModal={canQuickReportAbsence ? onOpenAbsenceModal : undefined}
                onAbsenceReported={canQuickReportAbsence ? onAbsenceReported : undefined}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="sticky bottom-4 z-20 mt-4 rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-100 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-4">
            <span><span className="text-slate-400">סה"כ שעות:</span> {history.summary.totalWorkedHours}</span>
            <span><span className="text-slate-400">שעות רגילות:</span> {history.summary.regularHours}</span>
            <span><span className="text-slate-400">חוסר:</span> {history.summary.deficitHours}</span>
            <span><span className="text-slate-400">הפסקות:</span> {history.summary.breakHours}</span>
          </div>
          <span className="text-slate-400">הערות: {history.summary.notesCount}</span>
        </div>
      </div>
    </>
  )
}

// ── Row sub-component ──────────────────────────────────────────────────────────

interface DayRowProps {
  day: AttendanceHistoryDayDto
  onRowAction: () => void
  onOpenAbsenceModal?: (date: string, absenceType: AbsenceTypeValue) => void
  onAbsenceReported?: () => void
}

function DayRow({ day, onRowAction, onOpenAbsenceModal, onAbsenceReported }: DayRowProps) {
  const [submitting, setSubmitting] = useState(false)
  const toast = useToast()

  const isAbsence = Boolean(day.absenceType)
  const canQuickReport = Boolean(onOpenAbsenceModal && onAbsenceReported && day.rowType === 'Empty')

  const rowClassName = isAbsence
    ? 'border-r-4 border-indigo-400 bg-indigo-50/70'
    : day.isWeekend
      ? 'border-r-4 border-gray-300 bg-gray-100/70 text-gray-400'
      : day.hasAlert
        ? 'border-r-4 border-red-400 bg-red-50/70'
        : 'border-r-4 border-blue-500 bg-white'

  async function handleAbsenceSelect(value: string) {
    const absenceType = value as AbsenceTypeValue
    if (!absenceType) return

    if (documentRequiredTypes.includes(absenceType)) {
      onOpenAbsenceModal?.(day.date, absenceType)
      return
    }

    setSubmitting(true)
    try {
      await attendanceService.reportAbsence({
        date: day.date,
        absenceType: absenceTypeToCode[absenceType],
      })
      toast.show('ההיעדרות דווחה בהצלחה')
      onAbsenceReported?.()
    } catch {
      toast.show('שגיאה בדיווח ההיעדרות', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <tr className={rowClassName}>
      <td className="min-w-[220px] py-2.5">
        <div className="font-semibold text-gray-800">{day.displayDateLabel}</div>
        <div className="text-xs text-gray-500">{day.dayLabel}</div>
      </td>
      <td className="py-2.5">
        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${day.isWeekend ? 'bg-gray-200 text-gray-500' : 'bg-slate-100 text-slate-700'}`}>
          {day.dayTypeLabel}
        </span>
      </td>

      {isAbsence ? (
        <td colSpan={2} className="py-2.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-medium text-indigo-700">
              <CalendarOff className="h-3.5 w-3.5" />
              {absenceTypeLabel(day.absenceType!)}
            </span>
            {day.documentUrl && (
              <button
                type="button"
                onClick={() => { void openDocument(day.documentUrl!) }}
                title="פתח מסמך תומך"
                className="text-gray-400 hover:text-primary-600 transition-colors"
              >
                <Paperclip className="h-4 w-4" />
              </button>
            )}
          </div>
        </td>
      ) : (
        <>
          <td className="py-2.5 font-mono text-sm">
            {day.clockInTime ? formatTimeFromServer(day.clockInTime) : '—'}
          </td>
          <td className="py-2.5 font-mono text-sm">
            {day.clockOutTime ? formatTimeFromServer(day.clockOutTime) : '—'}
          </td>
        </>
      )}

      <td className="py-2.5 font-mono text-sm">
        {!isAbsence && day.totalWorkedHours ? displayDuration(day.totalWorkedHours) : '—'}
      </td>
      <td className="py-2.5">
        {!isAbsence && (
          <div className={`flex items-center gap-1.5 text-sm font-mono ${day.hasDeficit ? 'text-red-600' : day.displayBalance ? 'text-emerald-600' : 'text-gray-400'}`}>
            {day.hasAlert && <AlertCircle className="h-4 w-4" />}
            <span>{day.displayBalance ?? '—'}</span>
          </div>
        )}
        {!isAbsence && day.alertText && <div className="mt-1 text-xs text-red-600">{day.alertText}</div>}
        {isAbsence && '—'}
      </td>
      <td className="py-2.5 max-w-[220px] text-sm text-gray-600">
        {canQuickReport ? (
          <select
            value=""
            disabled={submitting}
            onChange={(e) => { void handleAbsenceSelect(e.target.value) }}
            className="w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-700 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100 disabled:opacity-50"
          >
            <option value="">{submitting ? 'שולח...' : 'דווח היעדרות...'}</option>
            {absenceTypeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        ) : (
          day.note ?? '—'
        )}
      </td>
      <td className="py-2.5">
        {(() => {
          const dailyStatus = getDailyStatus(day)
          return (
            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${dailyStatus.className}`}>
              {dailyStatus.label}
            </span>
          )
        })()}
      </td>
      <td className="py-2.5 text-left">
        <button
          type="button"
          onClick={onRowAction}
          title={day.isWeekend ? 'הוסף דיווח' : 'ערוך'}
          className={`inline-flex items-center justify-center rounded-lg border p-2 transition ${day.isWeekend ? 'border-gray-300 bg-gray-100 text-gray-400 hover:bg-gray-200' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'}`}
        >
          {day.isWeekend ? <Plus className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
        </button>
      </td>
    </tr>
  )
}
