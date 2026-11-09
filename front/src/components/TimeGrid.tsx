import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { ReactNode } from 'react'

import { cn } from '@/utils/cn'
import { pad2 } from '@/utils/date'
import { TimePart } from '@/utils/timeKeys'

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5)

interface Props {
  part: TimePart
  /** Minutes since midnight. */
  value: number
  /** A cell was clicked. */
  onPick: (part: TimePart, picked: number) => void
  /** The ±1 minute buttons changed the value. */
  onChange: (value: number) => void
  /** Replaces the "Hour"/"Minutes" label on the left of the header. */
  label?: ReactNode
}

/** The body of a time picker: hours 00-23 in a 6x4 grid, or minutes in 5-minute steps with ±1 buttons. */
export function TimeGrid({ part, value, onPick, onChange, label }: Props) {
  const hour = Math.floor(value / 60)
  const minute = value % 60
  const setMinute = (m: number) => onChange(hour * 60 + m)

  return (
    <>
      <div className="mb-1.5 flex h-7 items-center justify-between px-1.5">
        {label ?? (
          <span className="text-[11px] font-extrabold tracking-widest text-ink-soft uppercase">
            {part === 'hour' ? 'Hour' : 'Minutes'}
          </span>
        )}
        {part === 'minute' && (
          <div className="flex items-center gap-0.5 font-display text-sm font-semibold text-ink-soft">
            <StepButton label="One minute earlier" onClick={() => setMinute((minute + 59) % 60)}>
              <ChevronLeft className="size-4" strokeWidth={2.75} />
            </StepButton>
            <span className="w-7 text-center text-ink">:{pad2(minute)}</span>
            <StepButton label="One minute later" onClick={() => setMinute((minute + 1) % 60)}>
              <ChevronRight className="size-4" strokeWidth={2.75} />
            </StepButton>
          </div>
        )}
      </div>

      <motion.div
        key={part}
        role="listbox"
        aria-label={part === 'hour' ? 'Hour' : 'Minutes'}
        initial={{ opacity: 0, x: part === 'minute' ? 10 : -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.15 }}
        className="grid grid-cols-6 gap-1"
      >
        {(part === 'hour' ? HOURS : MINUTES).map(option => {
          const selected = option === (part === 'hour' ? hour : minute)
          return (
            <button
              key={option}
              type="button"
              role="option"
              aria-selected={selected}
              tabIndex={-1}
              onClick={() => onPick(part, option)}
              className={cn(
                'h-10 cursor-pointer rounded-xl font-display text-base font-semibold transition-colors',
                selected
                  ? 'bg-primary-strong text-primary-strong-ink shadow-md shadow-blue-600/25'
                  : 'text-ink hover:bg-primary/45'
              )}
            >
              {pad2(option)}
            </button>
          )
        })}
      </motion.div>
    </>
  )
}

function StepButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      tabIndex={-1}
      aria-label={label}
      title={label}
      onClick={onClick}
      className="grid size-7 cursor-pointer place-items-center rounded-full transition-colors hover:bg-ink/5 hover:text-ink"
    >
      {children}
    </button>
  )
}
