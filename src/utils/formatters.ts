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

// ─── Client-side hours aggregation (no timezone involvement) ─────────────────

/** Parses "HH:MM:SS" or "HH:MM" → total seconds. */
function parseDurationToSeconds(duration: string | null | undefined): number {
  if (!duration) return 0
  const parts = duration.split(':')
  const h = parseInt(parts[0] ?? '0', 10) || 0
  const m = parseInt(parts[1] ?? '0', 10) || 0
  const s = parseInt(parts[2] ?? '0', 10) || 0
  return h * 3600 + m * 60 + s
}

/** Formats total seconds → "HH:MM" string. */
function secondsToHHMM(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/**
 * Computes weekly (last 7 days) and monthly (last 30 days) totals from an
 * array of AttendanceRecord-like objects. Uses ISO date string comparison so
 * no timezone conversion occurs on the clock times themselves.
 */
export function computeHoursSummary(
  records: Array<{ clockInTime: string; duration: string | null }>
): { weekly: string; monthly: string } {
  const weekAgoStr = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0]
  const monthAgoStr = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0]

  const weekly = records
    .filter((r) => r.clockInTime.split('T')[0] >= weekAgoStr)
    .reduce((sum, r) => sum + parseDurationToSeconds(r.duration), 0)

  const monthly = records
    .filter((r) => r.clockInTime.split('T')[0] >= monthAgoStr)
    .reduce((sum, r) => sum + parseDurationToSeconds(r.duration), 0)

  return { weekly: secondsToHHMM(weekly), monthly: secondsToHHMM(monthly) }
}
