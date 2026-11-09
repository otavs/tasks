import { AnimatePresence, motion } from 'framer-motion'
import { Clock3 } from 'lucide-react'
import { KeyboardEvent, RefObject, useEffect, useRef, useState } from 'react'

import { TimeGrid } from './TimeGrid'
import { cn } from '@/utils/cn'
import { pad2 } from '@/utils/date'
import { TimePart, TypedDigit, timeKeyAction } from '@/utils/timeKeys'

interface Props {
  /** Minutes since midnight. */
  value: number
  onChange: (minutes: number) => void
}

/**
 * A 24h time field for forms. Clicking the hour or the minute opens a grid with its values right away;
 * picking an hour moves on to the minutes. Keyboard: type digits, ↑/↓ to adjust, ←/→ to switch part,
 * Enter to submit the form, Esc to close the grid.
 */
export function TimeField({ value, onChange }: Props) {
  const hour = Math.floor(value / 60)
  const minute = value % 60

  const [open, setOpen] = useState<TimePart | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const hourRef = useRef<HTMLDivElement>(null)
  const minuteRef = useRef<HTMLDivElement>(null)
  const typed = useRef<TypedDigit>(null)

  // Close the grid when clicking anywhere else.
  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(null)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  const focusPart = (part: TimePart) => (part === 'hour' ? hourRef : minuteRef).current?.focus()
  const toggle = (part: TimePart) => setOpen(current => (current === part ? null : part))

  function pick(part: TimePart, picked: number) {
    if (part === 'hour') {
      onChange(picked * 60 + minute)
      setOpen('minute')
      focusPart('minute')
    } else {
      onChange(hour * 60 + picked)
      setOpen(null)
      focusPart('minute')
    }
  }

  function handleKeyDown(part: TimePart, e: KeyboardEvent<HTMLDivElement>) {
    const result = timeKeyAction(e.key, part, value, typed.current)
    if (result) {
      e.preventDefault()
      typed.current = result.typed
      if (result.value !== value) onChange(result.value)
      if (result.part !== part) {
        focusPart(result.part)
        setOpen(current => current && result.part) // keep the grid open, on the new part
      }
      return
    }

    if (e.key === ' ') {
      e.preventDefault()
      toggle(part)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (open) setOpen(null)
      else rootRef.current?.closest('form')?.requestSubmit()
    }
  }

  return (
    <div
      ref={rootRef}
      className="relative"
      onKeyDown={e => {
        // Esc closes just the grid (wherever the focus is inside the field), not the whole modal.
        if (e.key === 'Escape' && open) {
          e.preventDefault()
          e.stopPropagation()
          setOpen(null)
        }
      }}
    >
      <div
        className={cn(
          'flex items-center rounded-full border bg-field py-1 pr-1.5 pl-1 font-display text-base font-semibold text-ink shadow-inner shadow-slate-900/5 transition',
          open ? 'border-primary-ring ring-4 ring-primary-ring/15' : 'border-field-border'
        )}
      >
        <button
          type="button"
          tabIndex={-1}
          aria-label="Pick a time"
          onClick={() => {
            focusPart('hour')
            toggle('hour')
          }}
          className="grid size-7 cursor-pointer place-items-center rounded-full text-ink-soft transition-colors hover:bg-ink/5 hover:text-ink"
        >
          <Clock3 className="size-4" strokeWidth={2.5} />
        </button>
        <Segment
          segmentRef={hourRef}
          label="Hour"
          value={hour}
          max={23}
          active={open === 'hour'}
          onClick={() => toggle('hour')}
          onKeyDown={e => handleKeyDown('hour', e)}
        />
        <span className="px-px text-ink-faint">:</span>
        <Segment
          segmentRef={minuteRef}
          label="Minute"
          value={minute}
          max={59}
          active={open === 'minute'}
          onClick={() => toggle('minute')}
          onKeyDown={e => handleKeyDown('minute', e)}
        />
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            key="picker"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98, transition: { duration: 0.12 } }}
            transition={{ type: 'spring', stiffness: 520, damping: 34 }}
            // Clicking the grid must not steal focus from the hour/minute, so Enter still saves right after.
            onMouseDown={e => e.preventDefault()}
            className="absolute top-full left-0 z-20 mt-2 w-[17.5rem] origin-top-left rounded-2xl border border-sheet-border bg-sheet p-2 shadow-xl shadow-slate-900/20"
          >
            <TimeGrid part={open} value={value} onPick={pick} onChange={onChange} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Segment({
  segmentRef,
  label,
  value,
  max,
  active,
  onClick,
  onKeyDown,
}: {
  segmentRef: RefObject<HTMLDivElement | null>
  label: string
  value: number
  max: number
  active: boolean
  onClick: () => void
  onKeyDown: (e: KeyboardEvent<HTMLDivElement>) => void
}) {
  return (
    <div
      ref={segmentRef}
      role="spinbutton"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={pad2(value)}
      onClick={onClick}
      onKeyDown={onKeyDown}
      className={cn(
        'cursor-pointer rounded-lg px-1.5 py-0.5 transition-colors outline-none select-none',
        active ? 'bg-primary/60' : 'hover:bg-primary/30 focus-visible:bg-primary/40'
      )}
    >
      {pad2(value)}
    </div>
  )
}
