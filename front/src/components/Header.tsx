import { AnimatePresence, motion } from 'framer-motion'
import { useAtom, useAtomValue } from 'jotai'
import { ArrowLeft, ArrowRight } from 'lucide-react'

import { ButtonChangeDay } from './ButtonChangeDay'
import { Clock } from './Clock'
import { RollingText } from './RollingText'
import { useKeyPress } from '@/hooks/useKeyPress'
import { dateAtom, dayDirectionAtom, isAnyModalOpenAtom, isDraggingTaskAtom, todayAtom } from '@/state/state'
import { dayDiff, isSameDay, pad2, relativeDayLabel, shiftDate, weekdayName } from '@/utils/date'

export function Header() {
  const [date, setDate] = useAtom(dateAtom)
  const today = useAtomValue(todayAtom)
  const direction = useAtomValue(dayDirectionAtom)
  const isModalOpen = useAtomValue(isAnyModalOpenAtom)
  const isDragging = useAtomValue(isDraggingTaskAtom)

  const isToday = isSameDay(date, today)
  const shortcutsEnabled = !isModalOpen && !isDragging

  const go = (days: number) => setDate(shiftDate(date, days))
  const goToday = () => setDate(today)

  useKeyPress('ArrowLeft', () => go(-1), { enabled: shortcutsEnabled, repeat: true })
  useKeyPress('ArrowRight', () => go(1), { enabled: shortcutsEnabled, repeat: true })
  useKeyPress('t', goToday, { enabled: shortcutsEnabled })

  const weekday = weekdayName(date)

  return (
    <header className="flex items-center justify-between gap-2 pt-6 pb-5 sm:justify-evenly sm:pt-10 sm:pb-8">
      <div className="flex justify-center sm:w-[20%]">
        <ButtonChangeDay dir={-1} onClick={() => go(-1)} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col items-center sm:w-[440px] sm:flex-none">
        <div className="relative h-5 w-full overflow-hidden text-center">
          <AnimatePresence initial={false} mode="popLayout" custom={direction}>
            <motion.div
              key={weekday}
              custom={direction}
              initial={{ opacity: 0, x: direction * 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -16 }}
              transition={{ duration: 0.2 }}
              className="text-xs font-extrabold tracking-[0.25em] text-ink-soft uppercase"
            >
              {weekday}
            </motion.div>
          </AnimatePresence>
        </div>

        <button
          type="button"
          onClick={goToday}
          disabled={isToday}
          title={isToday ? undefined : 'Back to today (T)'}
          className="font-display text-[2.1rem] leading-tight font-semibold tracking-tight enabled:cursor-pointer sm:text-5xl"
        >
          <RollingText
            text={`${pad2(date.day)}-${pad2(date.month)}-${date.year}`}
            direction={direction}
            separatorClassName="mx-[0.15em] text-ink-faint"
          />
        </button>

        <div className="relative mt-1 flex h-9 items-center justify-center">
          <AnimatePresence initial={false} mode="wait">
            {isToday ? (
              <motion.div
                key="clock"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
              >
                <Clock />
              </motion.div>
            ) : (
              <motion.div
                key="relative"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
                className="flex items-center gap-2.5"
              >
                <span className="font-display text-lg font-medium text-ink-soft">{relativeDayLabel(date, today)}</span>
                <BackToToday isFuture={dayDiff(today, date) > 0} onClick={goToday} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex justify-center sm:w-[20%]">
        <ButtonChangeDay dir={1} onClick={() => go(1)} />
      </div>
    </header>
  )
}

function BackToToday({ isFuture, onClick }: { isFuture: boolean; onClick: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.92 }}
      title="Back to today (T)"
      className="flex cursor-pointer items-center gap-1 rounded-full border border-transparent bg-primary/70 px-3 py-1 text-sm font-bold text-primary-ink transition-colors hover:border-primary-ring hover:bg-primary"
    >
      {isFuture && <ArrowLeft className="size-3.5" strokeWidth={3} />}
      Today
      {!isFuture && <ArrowRight className="size-3.5" strokeWidth={3} />}
    </motion.button>
  )
}
