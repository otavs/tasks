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
          submitLabel="Save"
          onCancel={close}
          onSubmit={title => {
            if (title !== taskEdit.title) updateTask.mutate({ id: taskEdit.id, title })
            close()
          }}
        />
      )}
    </Modal>
  )
}
