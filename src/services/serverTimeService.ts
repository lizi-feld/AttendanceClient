import api from './api'
import type { TimeResponseDto } from '../types'

export interface ServerTimeSync {
  serverSecondsFromMidnight: number
  localMsAtSync: number
}

/** Parses "HH:MM:SS" or "HH:MM:SS.fffffff" → total whole seconds from midnight */
function parseTimeToSeconds(timeStr: string): number | null {
  const stripped = timeStr.split('.')[0]
  const parts = stripped.split(':')
  const h = parseInt(parts[0] ?? '', 10)
  const m = parseInt(parts[1] ?? '', 10)
  const s = parseInt(parts[2] ?? '', 10)
  if (isNaN(h) || isNaN(m) || isNaN(s)) return null
  return h * 3600 + m * 60 + s
}

/**
 * Fetches the server's current local time from GET /api/time/current.
 *
 * Parses currentTime as a server-local ISO string — no Date object, no
 * browser timezone, no getHours(). The NTP midpoint formula is applied to
 * compensate for ~half the network round-trip latency.
 */
export async function fetchServerTimeSync(): Promise<ServerTimeSync | null> {
  const localBefore = Date.now()
  const { data } = await api.get<TimeResponseDto>('/api/time/current')
  const localAfter = Date.now()

  if (!data.currentTime) return null

  // "2026-06-10T17:05:33.1234567" → "17:05:33"
  const timePart = data.currentTime.split('T')[1]
  if (!timePart) return null

  const serverSec = parseTimeToSeconds(timePart)
  if (serverSec === null) return null

  return {
    serverSecondsFromMidnight: serverSec,
    // Midpoint: the server computed currentTime roughly halfway through the trip
    localMsAtSync: Math.round((localBefore + localAfter) / 2),
  }
}
