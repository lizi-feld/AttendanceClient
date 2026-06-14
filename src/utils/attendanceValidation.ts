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
