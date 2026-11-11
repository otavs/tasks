import { motion } from 'framer-motion'
import { KeyboardEvent, RefObject, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { TimeGrid } from './TimeGrid'
import { useCloseOnBack } from '@/hooks/useCloseOnBack'
import { cn } from '@/utils/cn'
import { pad2 } from '@/utils/date'
import { TimePart, TypedDigit, timeKeyAction } from '@/utils/timeKeys'

const WIDTH = 280 // 17.5rem
const HEIGHT = 224 // the hour grid; the minute grid is shorter
const MARGIN = 8

type Position = { top: number; left: number; above: boolean }

/**
 * Below the anchor, or above it when there's no room below and more room above.
 * Always kept inside the viewport, even on very short screens where neither side fully fits.
 */
function positionFor(anchor: HTMLElement, height = HEIGHT): Position {
  const rect = anchor.getBoundingClientRect()
  const spaceBelow = window.innerHeight - rect.bottom - MARGIN
  const spaceAbove = rect.top - MARGIN
  const above = spaceBelow < height && spaceAbove > spaceBelow
  const top = above ? rect.top - MARGIN - height : rect.bottom + MARGIN
  return {
    top: Math.max(MARGIN, Math.min(top, window.innerHeight - height - MARGIN)),
    left: Math.min(Math.max(MARGIN, rect.left - 8), window.innerWidth - WIDTH - MARGIN),
    above,
  }
}

interface Props {
  /** The element the popover hangs from (the task's time badge). */
  anchor: HTMLElement
  initialTime: number
  /** Lets the owner save & close from outside (e.g. clicking the badge again). */
  commitRef?: RefObject<(() => void) | null>
  onSave: (time: number) => void
  onClose: () => void
}

/**
 * A tiny picker that opens right where the task's time was clicked, to change just the time.
 * Pick an hour, then a minute, and it's saved. Clicking outside or Enter saves, Esc (or back) cancels.
 */
export function TimePopover({ anchor, initialTime, commitRef, onSave, onClose }: Props) {
  const [value, setValue] = useState(initialTime)
  const [part, setPart] = useState<TimePart>('hour')
  const [position, setPosition] = useState<Position>(() => positionFor(anchor))
  const rootRef = useRef<HTMLDivElement>(null)
  const typed = useRef<TypedDigit>(null)

  // Latest value for the outside-click handler, without re-subscribing on every change.
  const valueRef = useRef(value)
  valueRef.current = value

  const commit = (time = valueRef.current) => {
    if (time !== initialTime) onSave(time)
    onClose()
  }
  if (commitRef) commitRef.current = () => commit()

  // The phone's back button cancels, like Esc.
  useCloseOnBack(true, onClose)

  // Follow the anchor on scroll/resize (and refine with the real height).
  useLayoutEffect(() => {
    const place = () => setPosition(positionFor(anchor, rootRef.current?.offsetHeight))
    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [anchor])

  useEffect(() => {
    rootRef.current?.focus({ preventScroll: true })
  }, [])

  // Clicking anywhere else saves and closes (clicks on the badge itself are handled by the badge).
  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node
      if (rootRef.current?.contains(target) || anchor.contains(target)) return
      commit()
    }
    document.addEventListener('pointerdown', onPointerDown, true)
    return () => document.removeEventListener('pointerdown', onPointerDown, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchor])

  function pick(pickedPart: TimePart, picked: number) {
    const hour = Math.floor(value / 60)
    if (pickedPart === 'hour') {
      setValue(picked * 60 + (value % 60))
      setPart('minute')
    } else {
      commit(hour * 60 + picked)
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const result = timeKeyAction(e.key, part, value, typed.current)
    if (result) {
      e.preventDefault()
      typed.current = result.typed
      setValue(result.value)
      setPart(result.part)
      return
    }

    if (e.key === 'Enter') {
      e.preventDefault()
      commit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      onClose()
    }
  }

  return createPortal(
    <motion.div
      ref={rootRef}
      role="dialog"
      aria-label="Change time"
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      onMouseDown={e => e.preventDefault()}
      initial={{ opacity: 0, scale: 0.92, y: position.above ? 6 : -6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.12 } }}
      transition={{ type: 'spring', stiffness: 560, damping: 34 }}
      style={{ top: position.top, left: position.left, width: WIDTH }}
      className={cn(
        'fixed z-50 rounded-2xl border border-sheet-border bg-sheet p-2 shadow-2xl shadow-slate-900/25 outline-none',
        position.above ? 'origin-bottom-left' : 'origin-top-left'
      )}
    >
      <TimeGrid
        part={part}
        value={value}
        onPick={pick}
        onChange={setValue}
        label={
          <div className="flex items-center font-display text-base font-semibold text-ink">
            <PartButton active={part === 'hour'} onClick={() => setPart('hour')} label="Hour">
              {pad2(Math.floor(value / 60))}
            </PartButton>
            <span className="px-px text-ink-faint">:</span>
            <PartButton active={part === 'minute'} onClick={() => setPart('minute')} label="Minute">
              {pad2(value % 60)}
            </PartButton>
          </div>
        }
      />
    </motion.div>,
    document.body
  )
}

function PartButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean
  onClick: () => void
  label: string
  children: string
}) {
  return (
    <button
      type="button"
      tabIndex={-1}
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'cursor-pointer rounded-lg px-1.5 py-0.5 transition-colors',
        active ? 'bg-primary/60' : 'hover:bg-primary/30'
      )}
    >
      {children}
    </button>
  )
}
