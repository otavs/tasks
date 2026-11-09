import { useAtom } from 'jotai'
import { useEffect } from 'react'

import { dateAtom, todayAtom } from '@/state/state'
import { isSameDay, todayTaskDate } from '@/utils/date'

/**
 * Keeps `todayAtom` correct when the app stays open past midnight (or wakes from sleep).
 * If you were looking at "today", you're carried along to the new day.
 */
export function useDayRollover() {
  const [today, setToday] = useAtom(todayAtom)
  const [date, setDate] = useAtom(dateAtom)

  useEffect(() => {
    const check = () => {
      const now = todayTaskDate()
      if (isSameDay(now, today)) return
      if (isSameDay(date, today)) setDate(now)
      setToday(now)
    }

    const interval = setInterval(check, 30_000)
    document.addEventListener('visibilitychange', check)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', check)
    }
  }, [today, date, setToday, setDate])
}
