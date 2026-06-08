/** Display a value received from the server exactly as-is (no local timezone conversion). */
export function displayTime(value: string | null | undefined): string {
  if (!value) return '—'
  return value
}

export function displayDuration(value: string | null | undefined): string {
  if (!value) return '—'
  return value
}
