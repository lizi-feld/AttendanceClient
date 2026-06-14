import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, Plus } from 'lucide-react'
import { Modal } from './Modal'
import { Spinner } from './Spinner'
import { useToast } from './Toast'
import { attendanceService } from '../../services/attendanceService'
import { adminService } from '../../services/adminService'
import { addShiftSchema, type AddShiftFormData } from '../../utils/attendanceValidation'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  /**
   * When provided the admin endpoint is used and this value is sent as the
   * target `employeeId`. Omit for the employee self-service endpoint.
   */
  targetEmployeeId?: number
}

export function AddManualShiftModal({ isOpen, onClose, onSuccess, targetEmployeeId }: Props) {
  const [submitError, setSubmitError] = useState<string | null>(null)
  const toast = useToast()

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddShiftFormData>({
    resolver: zodResolver(addShiftSchema),
    mode: 'onTouched',
    defaultValues: { date: '', clockInTime: '', clockOutTime: '', note: '' },
  })

  const noteValue = watch('note') ?? ''
  const isFormValid = addShiftSchema.safeParse(watch()).success

  useEffect(() => {
    if (isOpen) {
      reset({ date: '', clockInTime: '', clockOutTime: '', note: '' })
      setSubmitError(null)
    }
  }, [isOpen, reset])

  async function onSubmit(data: AddShiftFormData) {
    setSubmitError(null)
    try {
      const payload = {
        date: data.date,
        clockInTime: `${data.clockInTime}:00`,
        clockOutTime: `${data.clockOutTime}:00`,
        note: data.note,
      }

      if (targetEmployeeId !== undefined) {
        await adminService.adminManualAddShift({ ...payload, employeeId: targetEmployeeId })
      } else {
        await attendanceService.manualAddShift(payload)
      }

      toast.show('המשמרת נוספה בהצלחה')
      onSuccess()
      onClose()
    } catch {
      setSubmitError('שגיאה בהוספת המשמרת. אנא נסה שוב.')
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="הוספת משמרת ידנית">
      <form onSubmit={(e) => { void handleSubmit(onSubmit)(e) }} noValidate className="space-y-4">

        {/* ── Date ────────────────────────────────────────────────────────── */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">תאריך</label>
          <input
            type="date"
            {...register('date')}
            dir="ltr"
            className={inputCls(Boolean(errors.date))}
          />
          <Hint error={errors.date?.message} hint="תאריך המשמרת" />
        </div>

        {/* ── Clock-in ────────────────────────────────────────────────────── */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">שעת כניסה</label>
          <input
            type="time"
            {...register('clockInTime')}
            dir="ltr"
            className={inputCls(Boolean(errors.clockInTime))}
          />
          <Hint error={errors.clockInTime?.message} hint="שעת תחילת המשמרת" />
        </div>

        {/* ── Clock-out ───────────────────────────────────────────────────── */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">שעת יציאה</label>
          <input
            type="time"
            {...register('clockOutTime')}
            dir="ltr"
            className={inputCls(Boolean(errors.clockOutTime))}
          />
          <Hint error={errors.clockOutTime?.message} hint="חייבת להיות לאחר שעת הכניסה" />
        </div>

        {/* ── Note ────────────────────────────────────────────────────────── */}
        <div>
          <div className="flex items-baseline justify-between mb-1">
            <label className="text-sm font-medium text-gray-700">הערה</label>
            <span
              className={`text-xs tabular-nums ${noteValue.length > 450 ? 'text-red-400' : 'text-gray-400'}`}
            >
              {noteValue.length} / 500
            </span>
          </div>
          <textarea
            {...register('note')}
            rows={3}
            placeholder="תאר את סיבת הוספת המשמרת הידנית..."
            className={`${inputCls(Boolean(errors.note))} resize-none`}
          />
          <Hint error={errors.note?.message} hint="חובה · עד 500 תווים" />
        </div>

        {/* ── Server error ─────────────────────────────────────────────────── */}
        {submitError && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {submitError}
          </div>
        )}

        {/* ── Actions ──────────────────────────────────────────────────────── */}
        <div className="flex gap-3 pt-1">
          <button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            className="btn-primary flex-1"
          >
            {isSubmitting ? <Spinner size="sm" className="text-white" /> : <Plus className="h-4 w-4" />}
            הוסף משמרת
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="btn-secondary flex-1"
          >
            ביטול
          </button>
        </div>

      </form>
    </Modal>
  )
}

// ── Shared sub-components ─────────────────────────────────────────────────────

function inputCls(hasError: boolean) {
  return `input-field w-full${hasError ? ' border-red-400 focus:ring-red-400 focus:border-red-400' : ''}`
}

function Hint({ error, hint }: { error?: string; hint: string }) {
  if (error) return <p className="text-xs text-red-500 mt-1">{error}</p>
  return <p className="text-xs text-gray-400 mt-1">{hint}</p>
}
