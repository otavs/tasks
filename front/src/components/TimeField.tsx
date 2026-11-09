import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Clock3 } from 'lucide-react'
import { KeyboardEvent, ReactNode, RefObject, useEffect, useRef, useState } from 'react'

import { cn } from '@/utils/cn'
import { pad2 } from '@/utils/date'

type Part = 'hour' | 'minute'

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5)

interface Props {
  /** Minutes since midnight. */
  value: number
  onChange: (minutes: number) => void
  /** Focus the hour and open its picker right away. */
  autoOpen?: boolean
}

/**
 * A 24h time field. Clicking the hour or the minute opens a grid with its values right away;
 * picking an hour moves on to the minutes. Fully keyboard friendly: type digits, ↑/↓ to adjust,
 * ←/→ to switch part, Enter to save the form, Esc to close the grid.
 */
export function TimeField({ value, onChange, autoOpen = false }: Props) {
  const hour = Math.floor(value / 60)
  const minute = value % 60

  const [open, setOpen] = useState<Part | null>(autoOpen ? 'hour' : null)
  const rootRef = useRef<HTMLDivElement>(null)
  const hourRef = useRef<HTMLDivElement>(null)
  const minuteRef = useRef<HTMLDivElement>(null)
  const typed = useRef<{ part: Part; digit: number; at: number } | null>(null)

  useEffect(() => {
    if (autoOpen) hourRef.current?.focus()
  }, [autoOpen])

  // Close the grid when clicking anywhere else.
  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(null)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  const setHour = (h: number) => onChange(h * 60 + minute)
  const setMinute = (m: number) => onChange(hour * 60 + m)
  const focusPart = (part: Part) => (part === 'hour' ? hourRef : minuteRef).current?.focus()

  /** Moves to the other part, keeping the grid open (on the new part) if it was open. */
  const goTo = (part: Part) => {
    focusPart(part)
    setOpen(current => current && part)
  }

  const toggle = (part: Part) => setOpen(current => (current === part ? null : part))

  function pickHour(h: number) {
    setHour(h)
    setOpen('minute')
    focusPart('minute')
  }

  function pickMinute(m: number) {
    setMinute(m)
    setOpen(null)
    focusPart('minute')
  }

  function handleKeyDown(part: Part, e: KeyboardEvent<HTMLDivElement>) {
    const max = part === 'hour' ? 23 : 59
    const current = part === 'hour' ? hour : minute
    const set = part === 'hour' ? setHour : setMinute

    if (/^\d$/.test(e.key)) {
      e.preventDefault()
      const digit = Number(e.key)
      const previous = typed.current

      if (previous && previous.part === part && Date.now() - previous.at < 1500) {
        // Second digit: "1" then "4" -> 14.
        set(Math.min(previous.digit * 10 + digit, max))
        typed.current = null
        if (part === 'hour') goTo('minute')
      } else {
        set(digit)
        if (digit * 10 > max) {
          // No two-digit value starts with this digit ("7" can only mean 07).
          typed.current = null
          if (part === 'hour') goTo('minute')
        } else {
          typed.current = { part, digit, at: Date.now() }
        }
      }
      return
    }

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault()
        set((current + 1) % (max + 1))
        break
      case 'ArrowDown':
        e.preventDefault()
        set((current + max) % (max + 1))
        break
      case 'ArrowRight':
        if (part === 'hour') {
          e.preventDefault()
          goTo('minute')
        }
        break
      case 'ArrowLeft':
        if (part === 'minute') {
          e.preventDefault()
          goTo('hour')
        }
        break
      case ' ':
        e.preventDefault()
        toggle(part)
        break
      case 'Enter':
        e.preventDefault()
        if (open) setOpen(null)
        else rootRef.current?.closest('form')?.requestSubmit()
        break
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
            <div className="mb-1.5 flex h-7 items-center justify-between px-1.5">
              <span className="text-[11px] font-extrabold tracking-widest text-ink-soft uppercase">
                {open === 'hour' ? 'Hour' : 'Minutes'}
              </span>
              {open === 'minute' && (
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
              key={open}
              role="listbox"
              aria-label={open === 'hour' ? 'Hour' : 'Minutes'}
              initial={{ opacity: 0, x: open === 'minute' ? 10 : -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.15 }}
              className="grid grid-cols-6 gap-1"
            >
              {(open === 'hour' ? HOURS : MINUTES).map(option => {
                const selected = option === (open === 'hour' ? hour : minute)
                return (
                  <button
                    key={option}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    tabIndex={-1}
                    onClick={() => (open === 'hour' ? pickHour(option) : pickMinute(option))}
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
