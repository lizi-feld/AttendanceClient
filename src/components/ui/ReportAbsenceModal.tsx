import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, CalendarPlus, Paperclip, X } from 'lucide-react'
import { Modal } from './Modal'
import { Spinner } from './Spinner'
import { useToast } from './Toast'
import { attendanceService } from '../../services/attendanceService'
import {
  absenceTypeOptions,
  absenceTypeToCode,
  documentRequiredTypes,
  reportAbsenceSchema,
  type AbsenceTypeValue,
  type ReportAbsenceFormData,
} from '../../utils/attendanceValidation'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  /** Pre-fills the form when opened via the history table's inline absence dropdown. */
  initialDate?: string
  initialAbsenceType?: AbsenceTypeValue
}

export function ReportAbsenceModal({ isOpen, onClose, onSuccess, initialDate, initialAbsenceType }: Props) {
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const toast = useToast()

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ReportAbsenceFormData>({
    resolver: zodResolver(reportAbsenceSchema),
    mode: 'onTouched',
    defaultValues: { date: '', absenceType: undefined, documentUrl: '', note: '' },
  })

  const absenceType = watch('absenceType')
  const documentUrl = watch('documentUrl')
  const noteValue = watch('note') ?? ''
  const requiresDocument = Boolean(
    absenceType && documentRequiredTypes.includes(absenceType)
  )
  const isFormValid = reportAbsenceSchema.safeParse(watch()).success

  useEffect(() => {
    if (isOpen) {
      reset({ date: initialDate ?? '', absenceType: initialAbsenceType, documentUrl: '', note: '' })
      setSelectedFileName(null)
      setSubmitError(null)
    }
  }, [isOpen, initialDate, initialAbsenceType, reset])

  // Clear a previously uploaded document if the user switches to a type that doesn't need one.
  useEffect(() => {
    if (!requiresDocument && documentUrl) {
      setValue('documentUrl', '')
      setSelectedFileName(null)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requiresDocument])

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-selecting the same file afterwards
    if (!file) return

    setUploading(true)
    setSubmitError(null)
    try {
      const result = await attendanceService.uploadDocument(file)
      setValue('documentUrl', result.url, { shouldValidate: true })
      setSelectedFileName(file.name)
    } catch {
      setSubmitError('שגיאה בהעלאת הקובץ. ודא שהקובץ מסוג PDF/JPG/PNG ועד 10MB.')
    } finally {
      setUploading(false)
    }
  }

  function handleRemoveFile() {
    setValue('documentUrl', '', { shouldValidate: true })
    setSelectedFileName(null)
  }

  async function onSubmit(data: ReportAbsenceFormData) {
    setSubmitError(null)
    try {
      await attendanceService.reportAbsence({
        date: data.date,
        absenceType: absenceTypeToCode[data.absenceType],
        documentUrl: data.documentUrl || undefined,
        note: data.note || undefined,
      })
      toast.show('ההיעדרות דווחה בהצלחה')
      onSuccess()
      onClose()
    } catch {
      setSubmitError('שגיאה בדיווח ההיעדרות. אנא נסה שוב.')
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="דיווח היעדרות">
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
          <Hint error={errors.date?.message} hint="תאריך ההיעדרות" />
        </div>

        {/* ── Absence type ────────────────────────────────────────────────── */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">סוג היעדרות</label>
          <select
            {...register('absenceType')}
            className={inputCls(Boolean(errors.absenceType))}
          >
            <option value="">בחר סוג היעדרות...</option>
            {absenceTypeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <Hint error={errors.absenceType?.message} hint="בחר את סוג ההיעדרות המתאים" />
        </div>

        {/* ── Supporting document ─────────────────────────────────────────── */}
        {requiresDocument && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              מסמך תומך <span className="text-red-500">*</span>
            </label>

            {selectedFileName || documentUrl ? (
              <div className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Paperclip className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-700 truncate">
                    {selectedFileName ?? 'קובץ הועלה'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="text-gray-400 hover:text-red-500 flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label
                className={`flex items-center justify-center gap-2 rounded-lg border-2 border-dashed px-3 py-4 text-sm cursor-pointer transition-colors
                  ${errors.documentUrl ? 'border-red-300 text-red-500 hover:bg-red-50' : 'border-gray-300 text-gray-500 hover:bg-gray-50'}`}
              >
                {uploading ? (
                  <Spinner size="sm" />
                ) : (
                  <>
                    <Paperclip className="h-4 w-4" />
                    לחץ לבחירת קובץ (PDF/JPG/PNG, עד 10MB)
                  </>
                )}
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => { void handleFileChange(e) }}
                />
              </label>
            )}
            <Hint error={errors.documentUrl?.message} hint="נדרש עבור סוג היעדרות זה" />
          </div>
        )}

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
            placeholder="פרטים נוספים (אופציונלי)..."
            className={`${inputCls(Boolean(errors.note))} resize-none`}
          />
          <Hint error={errors.note?.message} hint="אופציונלי · עד 500 תווים" />
        </div>

        {/* ── Server error ─────────────────────────────────────────────────── */}
        {submitError && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {submitError}
          </div>
        )}

        {/* ── Actions ─────────────────────────────────────────────────────── */}
        <div className="flex gap-3 pt-1">
          <button
            type="submit"
            disabled={!isFormValid || isSubmitting || uploading}
            className="btn-primary flex-1"
          >
            {isSubmitting ? <Spinner size="sm" className="text-white" /> : <CalendarPlus className="h-4 w-4" />}
            דווח היעדרות
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
