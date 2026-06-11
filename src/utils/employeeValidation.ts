import { z } from 'zod'

// ─── Shared field schemas ─────────────────────────────────────────────────────

const fullNameSchema = z
  .string()
  .min(1, 'שם מלא הוא שדה חובה')
  .max(200, 'שם מלא לא יכול לעלות על 200 תווים')

const usernameSchema = z
  .string()
  .min(1, 'שם משתמש הוא שדה חובה')
  .max(100, 'שם משתמש לא יכול לעלות על 100 תווים')
  .regex(
    /^[a-zA-Z0-9._\-]+$/,
    'שם משתמש יכול להכיל רק אותיות, ספרות, נקודות, מקפים וקווים תחתיים'
  )

// Required password (add form)
const passwordRequiredSchema = z
  .string()
  .min(1, 'סיסמה היא שדה חובה')
  .min(8, 'הסיסמה חייבת להכיל לפחות 8 תווים')
  .max(128, 'הסיסמה לא יכולה לעלות על 128 תווים')
  .regex(/[A-Z]/, 'הסיסמה חייבת להכיל לפחות אות גדולה אחת')
  .regex(/[a-z]/, 'הסיסמה חייבת להכיל לפחות אות קטנה אחת')
  .regex(/[0-9]/, 'הסיסמה חייבת להכיל לפחות ספרה אחת')
  .regex(/[\W_]/, 'הסיסמה חייבת להכיל לפחות תו מיוחד אחד')

// Optional password (edit form) — empty string means "keep existing"
const passwordOptionalSchema = z.string().superRefine((val, ctx) => {
  if (!val) return
  if (val.length < 8) {
    ctx.addIssue({ code: 'custom', message: 'הסיסמה חייבת להכיל לפחות 8 תווים' })
    return
  }
  if (val.length > 128) {
    ctx.addIssue({ code: 'custom', message: 'הסיסמה לא יכולה לעלות על 128 תווים' })
    return
  }
  if (!/[A-Z]/.test(val)) {
    ctx.addIssue({ code: 'custom', message: 'הסיסמה חייבת להכיל לפחות אות גדולה אחת' })
    return
  }
  if (!/[a-z]/.test(val)) {
    ctx.addIssue({ code: 'custom', message: 'הסיסמה חייבת להכיל לפחות אות קטנה אחת' })
    return
  }
  if (!/[0-9]/.test(val)) {
    ctx.addIssue({ code: 'custom', message: 'הסיסמה חייבת להכיל לפחות ספרה אחת' })
    return
  }
  if (!/[\W_]/.test(val)) {
    ctx.addIssue({ code: 'custom', message: 'הסיסמה חייבת להכיל לפחות תו מיוחד אחד' })
  }
})

// ─── Form schemas ─────────────────────────────────────────────────────────────

export const addEmployeeSchema = z.object({
  fullName: fullNameSchema,
  username: usernameSchema,
  password: passwordRequiredSchema,
  role: z.enum(['Employee', 'Admin'] as const, 'יש לבחור תפקיד תקין'),
})

export const editEmployeeSchema = z.object({
  fullName: fullNameSchema,
  username: usernameSchema,
  password: passwordOptionalSchema,
})

export type AddEmployeeFormData = z.infer<typeof addEmployeeSchema>
export type EditEmployeeFormData = z.infer<typeof editEmployeeSchema>

// ─── Password checklist config ────────────────────────────────────────────────

export const passwordChecks: Array<{
  key: string
  label: string
  test: (value: string) => boolean
}> = [
  { key: 'length',  label: 'לפחות 8 תווים',          test: (v) => v.length >= 8 },
  { key: 'upper',   label: 'אות גדולה אחת (A–Z)',     test: (v) => /[A-Z]/.test(v) },
  { key: 'lower',   label: 'אות קטנה אחת (a–z)',     test: (v) => /[a-z]/.test(v) },
  { key: 'digit',   label: 'ספרה אחת לפחות (0–9)',   test: (v) => /[0-9]/.test(v) },
  { key: 'special', label: 'תו מיוחד (!@#$...)',      test: (v) => /[\W_]/.test(v) },
]
