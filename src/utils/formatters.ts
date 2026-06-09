/**
 * All formatters use plain string operations — no Date objects created,
 * so no local browser timezone conversion ever occurs.
 * Values are displayed exactly as the server sends them.
 */

/** "2026-06-09T09:00:00" → "09/06/2026" */
export function formatDateFromServer(isoString: string | null | undefined): string {
  if (!isoString) return '—'
  const datePart = isoString.split('T')[0] // "2026-06-09"
  const parts = datePart.split('-')
  if (parts.length !== 3) return isoString
  return `${parts[2]}/${parts[1]}/${parts[0]}`
}

/** "2026-06-09T09:00:00" → "09:00" */
export function formatTimeFromServer(isoString: string | null | undefined): string {
  if (!isoString) return '—'
  const timePart = isoString.split('T')[1]
  if (!timePart) return '—'
  return timePart.substring(0, 5)
}

/** "2026-06-09T09:00:00" → "09/06/2026 09:00" */
export function formatDateTimeFromServer(isoString: string | null | undefined): string {
  if (!isoString) return '—'
  return `${formatDateFromServer(isoString)} ${formatTimeFromServer(isoString)}`
}

/** Pass-through for duration strings ("03:45:12") — displayed as-is from server. */
export function displayDuration(value: string | null | undefined): string {
  if (!value) return '—'
  return value
}
