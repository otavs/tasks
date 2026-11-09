import { motion } from 'framer-motion'
import { useAtomValue, useSetAtom } from 'jotai'
import { Repeat } from 'lucide-react'

import { useKeyPress } from '@/hooks/useKeyPress'
import { isAnyModalOpenAtom, isRecurrencesOpenAtom } from '@/state/state'

export function RecurrencesButton() {
  const setIsOpen = useSetAtom(isRecurrencesOpenAtom)
  const isAnyModalOpen = useAtomValue(isAnyModalOpenAtom)

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
      className="group grid size-11 cursor-pointer place-items-center rounded-full border-2 border-transparent bg-primary text-primary-ink shadow-card transition-colors hover:border-primary-ring"
    >
      <Repeat className="size-5 transition-transform duration-500 group-hover:rotate-180" strokeWidth={2.5} />
    </motion.button>
  )
}
