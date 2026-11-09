import { motion } from 'framer-motion'
import { Clock3 } from 'lucide-react'
import { useRef, useState } from 'react'

import { formatTime, parseTime } from '@/utils/time'

interface Props {
  heading: string
  subheading?: string
  initialTitle?: string
  initialTime: number
  /** Focus the time field instead of the title. */
  focusTime?: boolean
  submitLabel: string
  onSubmit: (title: string, time: number) => void
  onCancel: () => void
}

export const TASK_FORM_HEADING_ID = 'task-form-heading'

export function TaskForm({
  heading,
  subheading,
  initialTitle = '',
  initialTime,
  focusTime = false,
  submitLabel,
  onSubmit,
  onCancel,
}: Props) {
  const [title, setTitle] = useState(initialTitle)
  const [timeText, setTimeText] = useState(formatTime(initialTime))
  const timeInputRef = useRef<HTMLInputElement>(null)

  const trimmed = title.trim()
  const time = parseTime(timeText)
  const isValid = !!trimmed && time !== null

  return (
    <form
      className="p-5 sm:p-6"
      onSubmit={e => {
        e.preventDefault()
        if (isValid) onSubmit(trimmed, time)
      }}
    >
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 id={TASK_FORM_HEADING_ID} className="font-display text-xl font-semibold">
          {heading}
        </h2>
        {subheading && <span className="text-sm font-semibold text-ink-soft">{subheading}</span>}
      </div>

      <textarea
        autoFocus={!focusTime}
        required
        rows={2}
        value={title}
        maxLength={500}
        placeholder="What needs doing?"
        onChange={e => setTitle(e.target.value.replace(/\n/g, ' '))}
        onFocus={e => e.currentTarget.setSelectionRange(e.currentTarget.value.length, e.currentTarget.value.length)}
        onKeyDown={e => {
          if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault()
            e.currentTarget.form?.requestSubmit()
          }
        }}
        className="field-sizing-content block max-h-60 min-h-[3.25rem] w-full resize-none rounded-2xl border border-field-border bg-field px-4 py-3 text-base font-semibold text-ink shadow-inner shadow-slate-900/5 transition outline-none placeholder:font-medium placeholder:text-ink-faint focus:border-primary-ring focus:ring-4 focus:ring-primary-ring/15"
      />

      <div className="mt-4 flex items-center gap-2">
        <label className="flex items-center gap-1.5 rounded-full border border-field-border bg-field py-1 pr-3 pl-1 shadow-inner shadow-slate-900/5 transition focus-within:border-primary-ring focus-within:ring-4 focus-within:ring-primary-ring/15">
          <button
            type="button"
            aria-label="Pick a time"
            tabIndex={-1}
            onClick={() => {
              try {
                timeInputRef.current?.showPicker()
              } catch {
                timeInputRef.current?.focus()
              }
            }}
            className="grid size-7 cursor-pointer place-items-center rounded-full text-ink-soft transition-colors hover:bg-ink/5 hover:text-ink"
          >
            <Clock3 className="size-4" strokeWidth={2.5} />
          </button>
          <span className="sr-only">Time</span>
          <input
            ref={timeInputRef}
            type="time"
            required
            autoFocus={focusTime}
            value={timeText}
            onChange={e => setTimeText(e.target.value)}
            className="w-[4.6rem] bg-transparent font-display text-base font-semibold text-ink outline-none [&::-webkit-calendar-picker-indicator]:hidden"
          />
        </label>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="cursor-pointer rounded-full px-4 py-2 font-semibold text-ink-soft transition-colors hover:bg-ink/5 hover:text-ink"
          >
            Cancel
          </button>
          <motion.button
            type="submit"
            disabled={!isValid}
            whileTap={{ scale: 0.94 }}
            className="cursor-pointer rounded-full border-2 border-transparent bg-primary-strong px-6 py-2 font-bold text-primary-strong-ink shadow-md shadow-blue-600/25 transition-[border-color,opacity] hover:border-blue-900 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:border-white/60"
          >
            {submitLabel}
          </motion.button>
        </div>
      </div>
    </form>
  )
}
