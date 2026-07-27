import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, UserPlus } from 'lucide-react'
import { Modal } from './Modal'
import { Spinner } from './Spinner'
import { PasswordChecklist } from './PasswordChecklist'
import { authService } from '../../services/authService'
import { addEmployeeSchema, type AddEmployeeFormData } from '../../utils/employeeValidation'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function AddEmployeeModal({ isOpen, onClose, onSuccess }: Props) {
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddEmployeeFormData>({
    resolver: zodResolver(addEmployeeSchema as never) as never,
    mode: 'onTouched',
    defaultValues: { fullName: '', username: '', password: '', dailyWorkHours: 8, role: undefined },
  })

  const passwordValue = watch('password') ?? ''

  // Accurate real-time validity for the submit button (independent of touch state)
  const isFormValid = addEmployeeSchema.safeParse(watch()).success

  useEffect(() => {
    if (isOpen) {
      reset({ fullName: '', username: '', password: '', dailyWorkHours: 8, role: undefined })
      setSubmitError(null)
    }
  }, [isOpen, reset])

  async function onSubmit(data: AddEmployeeFormData) {
    setSubmitError(null)
    try {
      const mappedRole = data.role === 'Admin' ? 2 : 1
      const payloadToSend = { ...data, role: mappedRole }
      await authService.addEmployee({
        fullName: payloadToSend.fullName,
        username: payloadToSend.username,
        password: payloadToSend.password,
        dailyWorkHours: payloadToSend.dailyWorkHours,
        role: payloadToSend.role,
      })
      onSuccess()
      onClose()
    } catch {
      setSubmitError('שגיאה בהוספת העובד. ייתכן ששם המשתמש כבר קיים.')
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="הוסף עובד חדש">
      <form onSubmit={(e) => { void handleSubmit(onSubmit)(e) }} noValidate className="space-y-4">

        {/* ── Full Name ──────────────────────────────────────────────────── */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">שם מלא</label>
          <input
            type="text"
            {...register('fullName')}
            placeholder="ישראל ישראלי"
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
            placeholder="user123"
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
            placeholder="8"
            className={inputCls(Boolean(errors.dailyWorkHours))}
          />
          <Hint error={errors.dailyWorkHours?.message} hint="מספר בין 0.5 ל-24" />
        </div>

        {/* ── Password ─────────────────────────────────────────────────────── */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">סיסמה</label>
          <input
            type="password"
            {...register('password')}
            placeholder="לפחות 8 תווים"
            dir="ltr"
            autoComplete="new-password"
            className={inputCls(Boolean(errors.password))}
          />
          {errors.password && passwordValue && (
            <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
          )}
          <PasswordChecklist value={passwordValue} />
        </div>

        {/* ── Role ─────────────────────────────────────────────────────────── */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">תפקיד</label>
          <select
            {...register('role')}
            className={inputCls(Boolean(errors.role))}
          >
            <option value="">בחר תפקיד...</option>
            <option value="Employee">עובד</option>
            <option value="Admin">מנהל</option>
          </select>
          <Hint error={errors.role?.message} hint="בחר את תפקיד העובד במערכת" />
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
            {isSubmitting ? <Spinner size="sm" className="text-white" /> : <UserPlus className="h-4 w-4" />}
            הוסף עובד
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
