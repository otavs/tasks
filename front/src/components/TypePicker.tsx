import { KeyboardEvent, useRef } from 'react'

import { cn } from '@/utils/cn'
import { TASK_TYPES, TaskType } from '@/utils/taskTypes'

interface Props {
  value: TaskType
  onChange: (type: TaskType) => void
  /** Focus the selected option on mount (e.g. when the picker opens on demand). */
  autoFocus?: boolean
  className?: string
}

/**
 * Every type as a tile, in a grid: soft tiles in the type's tint, the chosen one in full colour.
 * A radio group: one tab stop, arrow keys move (up and down by whole rows).
 */
export function TypePicker({ value, onChange, autoFocus, className }: Props) {
  const groupRef = useRef<HTMLDivElement>(null)

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const options = [...(groupRef.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]') ?? [])]
    const index = options.findIndex(option => option === document.activeElement)
    if (index === -1) return

    // Options in the first row share its top: that's how many columns the grid has right now.
    const columns = options.filter(option => option.offsetTop === options[0].offsetTop).length
    const step = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: columns, ArrowUp: -columns }[e.key]
    const target =
      e.key === 'Home' ? 0 : e.key === 'End' ? options.length - 1 : step !== undefined ? index + step : undefined
    if (target === undefined || target < 0 || target >= options.length) return

    e.preventDefault()
    options[target].focus()
    onChange(TASK_TYPES[target].id)
  }

  return (
    <div
      ref={groupRef}
      role="radiogroup"
      aria-label="Type"
      onKeyDown={handleKeyDown}
      className={cn('grid grid-cols-[repeat(auto-fill,minmax(2.5rem,1fr))] gap-1.5', className)}
    >
      {TASK_TYPES.map(({ id, label, icon: Icon }) => {
        const selected = id === value
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={label}
            title={label}
            tabIndex={selected ? 0 : -1}
            autoFocus={autoFocus && selected}
            data-type={id}
            onClick={() => onChange(id)}
            className="type-option grid aspect-square cursor-pointer place-items-center rounded-xl"
          >
            <Icon aria-hidden className="size-[18px]" strokeWidth={2.25} />
          </button>
        )
      })}
    </div>
  )
}
