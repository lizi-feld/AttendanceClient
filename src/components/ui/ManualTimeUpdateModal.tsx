import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, Clock } from 'lucide-react'
import { Modal } from './Modal'
import { Spinner } from './Spinner'
import { useToast } from './Toast'
import { attendanceService } from '../../services/attendanceService'
import { manualUpdateSchema, type ManualUpdateFormData } from '../../utils/attendanceValidation'

interface Props {
  isOpen: boolean
  onClose: () => void
  recordId: number
  initialClockInTime: string
  initialClockOutTime: string | null
  onSuccess: () => void
}

// "2026-06-09T09:00:00" → "2026-06-09T09:00"  (pure string slice, no Date object)
const toDatetimeLocal = (iso: string) => iso.slice(0, 16)

export function ManualTimeUpdateModal({
  isOpen,
  onClose,
  recordId,
  initialClockInTime,
  initialClockOutTime,
  onSuccess,
}: Props) {
  const [submitError, setSubmitError] = useState<string | null>(null)
  const toast = useToast()

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ManualUpdateFormData>({
    resolver: zodResolver(manualUpdateSchema),
    mode: 'onTouched',
    defaultValues: {
      newClockInTime: '',
      newClockOutTime: '',
      note: '',
    },
  })

  const noteValue = watch('note') ?? ''

  const isFormValid = manualUpdateSchema.safeParse(watch()).success

  useEffect(() => {
    if (isOpen) {
      reset({
        newClockInTime: toDatetimeLocal(initialClockInTime),
        newClockOutTime: initialClockOutTime ? toDatetimeLocal(initialClockOutTime) : '',
        note: '',
      })
      setSubmitError(null)
    }
  }, [isOpen, initialClockInTime, initialClockOutTime, reset])

  async function onSubmit(data: ManualUpdateFormData) {
    setSubmitError(null)
    try {
      await attendanceService.manualUpdate({
        recordId,
        newClockInTime: `${data.newClockInTime}:00`,
        newClockOutTime: `${data.newClockOutTime}:00`,
        note: data.note,
      })
      toast.show('הרשומה עודכנה בהצלחה')
      onSuccess()
      onClose()
    } catch {
      setSubmitError('שגיאה בעדכון הרשומה. אנא נסה שוב.')
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="עדכון נוכחות ידני">
      <form onSubmit={(e) => { void handleSubmit(onSubmit)(e) }} noValidate className="space-y-4">

        {/* ── Clock-in ──────────────────────────────────────────────────────── */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">שעת כניסה</label>
          <div className="relative">
            <Clock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              type="datetime-local"
              {...register('newClockInTime')}
              dir="ltr"
              className={`${inputCls(Boolean(errors.newClockInTime))} pr-9`}
            />
          </div>
          <Hint error={errors.newClockInTime?.message} hint="תאריך ושעת הכניסה בפועל" />
        </div>

        {/* ── Clock-out ─────────────────────────────────────────────────────── */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">שעת יציאה</label>
          <div className="relative">
            <Clock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              type="datetime-local"
              {...register('newClockOutTime')}
              dir="ltr"
              className={`${inputCls(Boolean(errors.newClockOutTime))} pr-9`}
            />
          </div>
          <Hint error={errors.newClockOutTime?.message} hint="חייבת להיות לאחר שעת הכניסה" />
        </div>

        {/* ── Note ──────────────────────────────────────────────────────────── */}
        <div>
          <div className="flex items-baseline justify-between mb-1">
            <label className="text-sm font-medium text-gray-700">הערה</label>
            <span className={`text-xs tabular-nums ${noteValue.length > 450 ? 'text-red-400' : 'text-gray-400'}`}>
              {noteValue.length} / 500
            </span>
          </div>
          <textarea
            {...register('note')}
            rows={3}
            placeholder="תאר את סיבת העדכון הידני..."
            className={`${inputCls(Boolean(errors.note))} resize-none`}
          />
          <Hint error={errors.note?.message} hint="חובה · עד 500 תווים" />
        </div>

        {/* ── Server error ──────────────────────────────────────────────────── */}
        {submitError && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {submitError}
          </div>
        )}

        {/* ── Actions ───────────────────────────────────────────────────────── */}
        <div className="flex gap-3 pt-1">
          <button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            className="btn-primary flex-1"
          >
            {isSubmitting ? <Spinner size="sm" className="text-white" /> : <Clock className="h-4 w-4" />}
            שמור עדכון
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

// ── Shared sub-components ──────────────────────────────────────────────────────

function inputCls(hasError: boolean) {
  return `input-field w-full${hasError ? ' border-red-400 focus:ring-red-400 focus:border-red-400' : ''}`
}

function Hint({ error, hint }: { error?: string; hint: string }) {
  if (error) return <p className="text-xs text-red-500 mt-1">{error}</p>
  return <p className="text-xs text-gray-400 mt-1">{hint}</p>
}
