import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, Save } from 'lucide-react'
import { Modal } from './Modal'
import { Spinner } from './Spinner'
import { PasswordChecklist } from './PasswordChecklist'
import { authService } from '../../services/authService'
import { editEmployeeSchema, type EditEmployeeFormData } from '../../utils/employeeValidation'
import type { EmployeeDto } from '../../types'

interface Props {
  isOpen: boolean
  onClose: () => void
  employeeId: number
  initialFullName: string
  initialUsername: string
  initialDailyWorkHours: number
  initialRole: string
  onSuccess: (updated: EmployeeDto) => void
}

export function EditEmployeeModal({
  isOpen,
  onClose,
  employeeId,
  initialFullName,
  initialUsername,
  initialDailyWorkHours,
  initialRole,
  onSuccess,
}: Props) {
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditEmployeeFormData>({
    resolver: zodResolver(editEmployeeSchema as never) as never,
    mode: 'onTouched',
    defaultValues: { fullName: initialFullName, username: initialUsername, password: '',dailyWorkHours: initialDailyWorkHours,
  role: (initialRole as 'Employee' | 'Admin') || 'Employee',},
  })
  const selectedRole = watch('role');
  const passwordValue = watch('password')
  // Accurate real-time validity for the submit button (independent of touch state)
  const isFormValid = editEmployeeSchema.safeParse(watch()).success

  // Re-seed form each time the modal opens or initial values change
  useEffect(() => {
    if (isOpen) {
      reset({ fullName: initialFullName, username: initialUsername, password: '', dailyWorkHours: initialDailyWorkHours,
  role: (initialRole as 'Employee' | 'Admin') || 'Employee', })
      setSubmitError(null)
    }
  }, [isOpen, initialFullName, initialUsername, initialDailyWorkHours, reset])

  async function onSubmit(data: EditEmployeeFormData) {
    setSubmitError(null)
    try {
      const updated = await authService.updateEmployee(employeeId, {
        fullName: data.fullName,
        username: data.username,
        ...(data.password ? { password: data.password } : {}),
        dailyWorkHours: data.dailyWorkHours,
      })
      onSuccess(updated)
      onClose()
    } catch {
      setSubmitError('שגיאה בעדכון הפרטים. ייתכן ששם המשתמש כבר קיים.')
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="עריכת פרטי עובד">
      <form onSubmit={(e) => { void handleSubmit(onSubmit)(e) }} noValidate className="space-y-4">

        {/* ── Full Name ──────────────────────────────────────────────────── */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">שם מלא</label>
          <input
            type="text"
            {...register('fullName')}
            className={inputCls(Boolean(errors.fullName))}
          />
          <Hint error={errors.fullName?.message} hint="עד 200 תווים" />
        </div>

        {/* ── Username ────────────────────────────────────────────────────── */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">שם משתמש</label>
          <input
            type="text"
            {...register('username')}
            dir="ltr"
            autoComplete="username"
            className={inputCls(Boolean(errors.username))}
          />
          <Hint
            error={errors.username?.message}
            hint="אותיות אנגליות, ספרות, נקודות, מקפים וקווים תחתיים בלבד · עד 100 תווים"
          />
        </div>

        {/* ── Daily Work Hours ─────────────────────────────────────────────── */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">שעות עבודה יומיות</label>
          <input
            type="number"
            step="0.5"
            min="0.5"
            max="24"
            {...register('dailyWorkHours')}
            disabled={selectedRole == 'Employee'}
            placeholder="8"
            className={inputCls(Boolean(errors.dailyWorkHours))}
          />
          <Hint error={errors.dailyWorkHours?.message} hint="מספר בין 0.5 ל-24" />
        </div>

        {/* ── New Password ─────────────────────────────────────────────────── */}
        <div>
          <div className="flex items-baseline justify-between mb-1">
            <label className="text-sm font-medium text-gray-700">סיסמה חדשה</label>
            <span className="text-xs text-gray-400">השאר ריק לשמירת הסיסמה הנוכחית</span>
          </div>
          <input
            type="password"
            {...register('password')}
            placeholder="הקלד סיסמה חדשה (אופציונלי)"
            dir="ltr"
            autoComplete="new-password"
            className={inputCls(Boolean(errors.password && passwordValue))}
          />
          {/* Show text error only when field is non-empty (checklist covers the detail) */}
          {errors.password && passwordValue && (
            <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
          )}
          <PasswordChecklist value={passwordValue} />
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
            disabled={!isFormValid || isSubmitting}
            className="btn-primary flex-1"
          >
            {isSubmitting ? <Spinner size="sm" className="text-white" /> : <Save className="h-4 w-4" />}
            שמור שינויים
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
  return `input-field${hasError ? ' border-red-400 focus:ring-red-400 focus:border-red-400' : ''}`
}

function Hint({ error, hint }: { error?: string; hint: string }) {
  if (error) return <p className="text-xs text-red-500 mt-1">{error}</p>
  return <p className="text-xs text-gray-400 mt-1">{hint}</p>
}
