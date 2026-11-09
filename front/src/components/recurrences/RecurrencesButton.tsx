import { motion } from 'framer-motion'
import { useAtomValue, useSetAtom } from 'jotai'
import { Repeat } from 'lucide-react'

import { useRecurrencesQuery } from '@/api/recurrences'
import { useKeyPress } from '@/hooks/useKeyPress'
import { isAnyModalOpenAtom, isRecurrencesOpenAtom } from '@/state/state'

export function RecurrencesButton() {
  const setIsOpen = useSetAtom(isRecurrencesOpenAtom)
  const isAnyModalOpen = useAtomValue(isAnyModalOpenAtom)
  const { data: recurrences } = useRecurrencesQuery()
  const active = recurrences?.filter(recurrence => recurrence.enabled).length ?? 0

  useKeyPress('r', () => setIsOpen(true), { enabled: !isAnyModalOpen })

  return (
    <motion.button
      type="button"
      aria-label="Recurring tasks"
      title="Recurring tasks (R)"
      onClick={() => setIsOpen(true)}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 500, damping: 22 }}
      className="group relative grid size-11 cursor-pointer place-items-center rounded-full border-2 border-transparent bg-card text-ink-soft shadow-card transition-colors hover:border-primary-ring hover:text-ink"
    >
      <Repeat className="size-5 transition-transform duration-500 group-hover:rotate-180" strokeWidth={2.5} />
      {active > 0 && (
        <span className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-primary-strong px-1 text-[11px] font-extrabold text-primary-strong-ink shadow">
          {active}
        </span>
      )}
    </motion.button>
  )
}
