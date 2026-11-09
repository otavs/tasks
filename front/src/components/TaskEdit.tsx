import { useAtom, useAtomValue } from 'jotai'

import { Modal } from './Modal'
import { TASK_FORM_HEADING_ID, TaskForm } from './TaskForm'
import { useUpdateTaskMutation } from '@/api/tasks/update'
import { dateAtom, isEditingTaskAtom, taskEditAtom, todayAtom } from '@/state/state'
import { formDateLabel } from '@/utils/date'

export function TaskEdit() {
  const updateTask = useUpdateTaskMutation()
  const date = useAtomValue(dateAtom)
  const today = useAtomValue(todayAtom)

  const [isEditingTask, setIsEditingTask] = useAtom(isEditingTaskAtom)
  const [taskEdit] = useAtom(taskEditAtom)

  const close = () => setIsEditingTask(false)

  return (
    <Modal isOpen={isEditingTask && !!taskEdit} onClose={close} labelledBy={TASK_FORM_HEADING_ID}>
      {taskEdit && (
        <TaskForm
          key={taskEdit.uid}
          heading="Edit task"
          subheading={formDateLabel(date, today)}
          initialTitle={taskEdit.title}
          initialTime={taskEdit.time}
          submitLabel="Save"
          onCancel={close}
          onSubmit={(title, time) => {
            const titleChanged = title !== taskEdit.title
            const timeChanged = time !== taskEdit.time
            if (titleChanged || timeChanged) {
              updateTask.mutate({
                id: taskEdit.id,
                ...(titleChanged && { title }),
                ...(timeChanged && { time }),
              })
            }
            close()
          }}
        />
      )}
    </Modal>
  )
}
