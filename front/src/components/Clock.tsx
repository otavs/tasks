import { useAtomValue } from 'jotai'

import { RollingText } from './RollingText'
import { nowAtom } from '@/state/state'
import { pad2 } from '@/utils/date'

export function Clock() {
  const time = useAtomValue(nowAtom)
  const text = `${pad2(time.getHours())} : ${pad2(time.getMinutes())}`

  return (
    <time className="font-display text-xl font-medium text-ink-soft sm:text-2xl" dateTime={time.toISOString()}>
      <RollingText text={text} separatorClassName="text-ink-faint" />
    </time>
  )
}
