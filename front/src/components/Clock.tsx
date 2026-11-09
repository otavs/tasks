import { useEffect, useState } from 'react'

import { RollingText } from './RollingText'
import { pad2 } from '@/utils/date'

export function Clock() {
  const [time, setTime] = useState(() => new Date())

  useEffect(() => {
    // Check every second, but only re-render when the minute actually changes.
    const interval = setInterval(() => {
      const now = new Date()
      setTime(prev => (prev.getMinutes() === now.getMinutes() && prev.getHours() === now.getHours() ? prev : now))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const text = `${pad2(time.getHours())} : ${pad2(time.getMinutes())}`

  return (
    <time className="font-display text-xl font-medium text-ink-soft sm:text-2xl" dateTime={time.toISOString()}>
      <RollingText text={text} separatorClassName="text-ink-faint" />
    </time>
  )
}
