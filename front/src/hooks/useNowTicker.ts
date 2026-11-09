import { useSetAtom } from 'jotai'
import { useEffect } from 'react'

import { nowAtom } from '@/state/state'

const sameMinute = (a: Date, b: Date) =>
  a.getMinutes() === b.getMinutes() && a.getHours() === b.getHours() && a.getDate() === b.getDate()

/** Keeps `nowAtom` fresh: checks every second, publishes only when the minute changes. */
export function useNowTicker() {
  const setNow = useSetAtom(nowAtom)

  useEffect(() => {
    const tick = () =>
      setNow(prev => {
        const now = new Date()
        return sameMinute(prev, now) ? prev : now
      })

    const interval = setInterval(tick, 1000)
    document.addEventListener('visibilitychange', tick)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [setNow])
}
