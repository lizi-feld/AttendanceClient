import { useEffect, useRef, useState } from 'react'
import { Clock } from 'lucide-react'
import { fetchServerTimeSync } from '../../services/serverTimeService'
import type { ServerTimeSync } from '../../services/serverTimeService'

/** Pure integer → "HH:mm:ss" (no Date object, no timezone) */
function secondsToHHmmss(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':')
}

export function LiveClock() {
  const syncRef = useRef<ServerTimeSync | null>(null)
  // מתחילים ללא שעה בכלל
  const [time, setTime] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    let id: ReturnType<typeof setInterval>

    const tick = () => {
      if (!mounted) return
      const sync = syncRef.current
      if (sync) {
        // אם יש נתונים מהשרת - מחשבים את הזמן ומציגים
        const elapsed = Math.floor((Date.now() - sync.localMsAtSync) / 1000)
        setTime(secondsToHHmmss((sync.serverSecondsFromMidnight + elapsed) % 86400))
      } else {
        // אם הנתונים טרם הגיעו או שהייתה שגיאה - לא מציגים שעה
        setTime(null)
      }
    }

    fetchServerTimeSync()
      .then((sync) => { 
        if (mounted) syncRef.current = sync 
      })
      .catch(() => {
        // במקרה של שגיאה (חריגה מהשרת), syncRef נשאר null 
        // והפונקציה tick תדאג שהשעה תישאר null
      })
      .finally(() => {
        if (!mounted) return
        tick()
        id = setInterval(tick, 1000)
      })

    return () => {
      mounted = false
      clearInterval(id)
    }
  }, [])

  // אם אין שעה מהשרת, אפשר לא לרנדר את הקומפוננטה בכלל:
  if (!time) return null

  /* * לחלופין, אם אתה רוצה שהריבוע של השעון כן יוצג אבל ללא שעה, 
   * אתה יכול למחוק את ה-if למעלה ולהשתמש בשורה הזו בתוך ה-<time>:
   * {time || '--:--:--'}
   */

  return (
    <div
      className="fixed bottom-4 left-4 z-20 flex items-center gap-2
                 bg-white/90 backdrop-blur-sm border border-gray-200
                 shadow-sm rounded-xl px-4 py-2 select-none"
    >
      <Clock className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
      <time className="font-mono text-sm font-semibold text-gray-700 tabular-nums">
        {time}
      </time>
    </div>
  )
}