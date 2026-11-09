import { motion } from 'framer-motion'
import { useState } from 'react'

import { TimeField } from './TimeField'

interface Props {
  heading: string
  subheading?: string
  initialTitle?: string
  initialTime: number
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
  submitLabel,
  onSubmit,
  onCancel,
}: Props) {
  const [title, setTitle] = useState(initialTitle)
  const [time, setTime] = useState(initialTime)

  const trimmed = title.trim()
  const isValid = !!trimmed

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
        autoFocus
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
        <TimeField value={time} onChange={setTime} />

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
