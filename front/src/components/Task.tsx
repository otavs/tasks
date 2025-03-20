import { useState } from 'react'
import { useDeleteTask } from '../api/tasks.ts'
import { TaskModel } from '../types.tsx'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useAtom } from 'jotai'
import { isEditingTaskAtom, taskEditAtom } from '../state.ts'
import { RiDragMoveFill } from 'react-icons/ri'
import { MdEdit } from 'react-icons/md'
import { VortexCheck } from './VortexCheck.tsx'
import Confetti from 'react-canvas-confetti';

interface Props {
  task: TaskModel
}

export function Task({ task }: Props) {
  const deleteTask = useDeleteTask()
  const [deletingTaskId, setDeletingTaskId] = useState<number | null>(null)

  const [, setIsEditingTask] = useAtom(isEditingTaskAtom)
  const [taskEdit, setTaskEdit] = useAtom(taskEditAtom)

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id! })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={`${deletingTaskId === task.id ? 'delete-animation' : ''} m-2 flex w-8/10 justify-between items-center rounded border bg-blue-200 p-2 hover:bg-amber-100 sm:w-100`}
      >
        <div className="m-1">{task.title}</div>
        <div className="align-center flex justify-center gap-1">
          <button
            className="min-w-5 cursor-pointer hover:text-amber-700"
            onClick={openEdition}
            disabled={deleteTask.isPending}
          >
            <MdEdit className="text-2xl" />
          </button>
          <button
            className="min-w-5 cursor-move hover:text-amber-700"
            disabled={deleteTask.isPending}
            {...attributes}
            {...listeners}
          >
            <RiDragMoveFill className="text-2xl" />
          </button>
          <button className="min-w-5 cursor-pointer" onClick={handleDelete} disabled={deleteTask.isPending}>
            <VortexCheck />
          </button>
        </div>
      </div>
    </>
  )

  function handleDelete() {
    setDeletingTaskId(task.id)

    setTimeout(async () => {
      deleteTask.mutate(task.id)
    }, 500)
  }

  function openEdition() {
    if (taskEdit?.id !== task.id) {
      setTaskEdit(task)
    }
    setIsEditingTask(true)
  }
}
