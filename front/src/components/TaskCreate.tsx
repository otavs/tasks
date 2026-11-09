import { motion } from 'framer-motion'
import { useAtom, useAtomValue } from 'jotai'
import { Plus } from 'lucide-react'

import { Modal } from './Modal'
import { TASK_FORM_HEADING_ID, TaskForm } from './TaskForm'
import { useCreateTaskMutation } from '@/api/tasks/create'
import { useKeyPress } from '@/hooks/useKeyPress'
import { dateAtom, isAnyModalOpenAtom, isCreatingTaskAtom, todayAtom } from '@/state/state'
import { formDateLabel } from '@/utils/date'

export function TaskCreate() {
  const date = useAtomValue(dateAtom)
  const today = useAtomValue(todayAtom)
  const [isOpen, setIsOpen] = useAtom(isCreatingTaskAtom)
  const isAnyModalOpen = useAtomValue(isAnyModalOpenAtom)
  const createTask = useCreateTaskMutation()

  useKeyPress('n', () => setIsOpen(true), { enabled: !isAnyModalOpen })

  return (
    <>
      <div className="flex justify-center pt-2">
        <motion.button
          type="button"
          aria-label="New task"
          title="New task (N)"
          onClick={() => setIsOpen(true)}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 500, damping: 22 }}
          className="group grid size-14 cursor-pointer place-items-center rounded-full border-2 border-transparent bg-primary text-primary-ink shadow-card transition-colors hover:border-primary-ring"
        >
          <Plus className="size-6 transition-transform duration-300 group-hover:rotate-90" strokeWidth={2.75} />
        </motion.button>
      </div>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} labelledBy={TASK_FORM_HEADING_ID}>
        <TaskForm
          heading="New task"
          subheading={formDateLabel(date, today)}
          submitLabel="Add"
          onCancel={() => setIsOpen(false)}
          onSubmit={title => {
            createTask.mutate({ title, date })
            setIsOpen(false)
          }}
        />
      </Modal>
    </>
  )
}
