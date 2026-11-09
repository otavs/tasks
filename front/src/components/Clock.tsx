import { useEffect, useState } from 'react'

import { RollingText } from './RollingText'
import { pad2 } from '@/utils/date'

export function Clock() {
  const [time, setTime] = useState(() => new Date())

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  const text = `${pad2(time.getHours())} : ${pad2(time.getMinutes())} : ${pad2(time.getSeconds())}`

  return (
    <time className="font-display text-xl font-medium text-ink-soft sm:text-2xl" dateTime={time.toISOString()}>
      <RollingText text={text} separatorClassName="text-ink-faint" />
    </time>
  )
}
