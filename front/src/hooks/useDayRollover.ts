import { useAtom, useAtomValue } from 'jotai'
import { useEffect, useRef } from 'react'

import { dateAtom, todayAtom } from '@/state/state'
import { isSameDay } from '@/utils/date'

/**
 * When the day changes while the app is open (midnight, or waking from sleep),
 * carry you along to the new day if you were looking at "today".
 */
export function useDayRollover() {
  const today = useAtomValue(todayAtom)
  const [date, setDate] = useAtom(dateAtom)
  const previousToday = useRef(today)

  useEffect(() => {
    if (isSameDay(previousToday.current, today)) return
    if (isSameDay(date, previousToday.current)) setDate(today)
    previousToday.current = today
  }, [today, date, setDate])
}
