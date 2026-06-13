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
