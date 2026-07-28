import { z } from 'zod'

export const manualUpdateSchema = z
  .object({
    newClockInTime: z.string().min(1, 'שעת כניסה היא שדה חובה'),
    newClockOutTime: z.string().min(1, 'שעת יציאה היא שדה חובה'),
    note: z
      .string()
      .min(1, 'הערה היא שדה חובה')
      .max(500, 'הערה לא יכולה לעלות על 500 תווים'),
  })
  .refine(
    (data) =>
      !data.newClockInTime ||
      !data.newClockOutTime ||
      data.newClockOutTime > data.newClockInTime,
    {
      message: 'שעת היציאה חייבת להיות לאחר שעת הכניסה',
      path: ['newClockOutTime'],
    }
  )

export type ManualUpdateFormData = z.infer<typeof manualUpdateSchema>

export const addShiftSchema = z
  .object({
    date: z.string().min(1, 'תאריך הוא שדה חובה'),
    clockInTime: z.string().min(1, 'שעת כניסה היא שדה חובה'),
    clockOutTime: z.string().min(1, 'שעת יציאה היא שדה חובה'),
    note: z
      .string()
      .min(1, 'הערה היא שדה חובה')
      .max(500, 'הערה לא יכולה לעלות על 500 תווים'),
  })
  .refine(
    (data) =>
      !data.clockInTime ||
      !data.clockOutTime ||
      data.clockOutTime > data.clockInTime,
    {
      message: 'שעת היציאה חייבת להיות לאחר שעת הכניסה',
      path: ['clockOutTime'],
    }
  )

export type AddShiftFormData = z.infer<typeof addShiftSchema>

// ─── Absence reporting ─────────────────────────────────────────────────────────

export const absenceTypeOptions = [
  { value: 'Vacation', label: 'חופשה' },
  { value: 'SickLeave', label: 'מחלה' },
  { value: 'ChildSickLeave', label: 'מחלת ילד' },
  { value: 'Pregnancy', label: 'הריון' },
  { value: 'Holiday', label: 'חג' },
  { value: 'CholHaMoed', label: 'חול המועד' },
  { value: 'Other', label: 'אחר' },
] as const

export type AbsenceTypeValue = (typeof absenceTypeOptions)[number]['value']

const absenceTypeValues = absenceTypeOptions.map((o) => o.value) as [
  AbsenceTypeValue,
  ...AbsenceTypeValue[],
]

/** Mirrors AbsenceRecord.RequiresDocument on the backend. */
export const documentRequiredTypes: readonly AbsenceTypeValue[] = [
  'SickLeave',
  'ChildSickLeave',
  'Other',
  'Pregnancy',
]

/** Maps the form's string value to the numeric AbsenceType enum value the API expects. */
export const absenceTypeToCode: Record<AbsenceTypeValue, number> = {
  Vacation: 1,
  SickLeave: 2,
  ChildSickLeave: 3,
  Pregnancy: 4,
  Holiday: 5,
  CholHaMoed: 6,
  Other: 7,
}

export const reportAbsenceSchema = z
  .object({
    date: z.string().min(1, 'תאריך הוא שדה חובה'),
    absenceType: z.enum(absenceTypeValues, 'יש לבחור סוג היעדרות'),
    documentUrl: z.string().optional(),
    note: z
      .string()
      .max(500, 'הערה לא יכולה לעלות על 500 תווים')
      .optional(),
  })
  .refine(
    (data) => !documentRequiredTypes.includes(data.absenceType) || Boolean(data.documentUrl),
    {
      message: 'יש לצרף מסמך תומך עבור סוג היעדרות זה',
      path: ['documentUrl'],
    }
  )

export type ReportAbsenceFormData = z.infer<typeof reportAbsenceSchema>
