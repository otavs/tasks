import { TaskModel } from '../types.tsx'
import { useSortable } from '@dnd-kit/sortable'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { isEditingTaskAtom, taskEditAtom } from '../state.ts'
import { useAtom } from 'jotai'
import { MdEdit } from 'react-icons/md'
import { RiDragMoveFill } from 'react-icons/ri'
import { VortexCheck } from './VortexCheck.tsx'
import Fireworks from 'react-canvas-confetti/dist/presets/fireworks/index'
import { TCanvasConfettiAnimationOptions } from 'react-canvas-confetti/dist/types/normalization'

interface Props {
  task: TaskModel
  onDelete: (taskId: number) => void
}

const initialStyles = {
  x: 0,
  y: 0,
  scale: 1,
}

export function Task({ task, onDelete }: Props) {
  const [deletingTaskId, setDeletingTaskId] = useState<number | null>(null)

  const [, setIsEditingTask] = useAtom(isEditingTaskAtom)
  const [taskEdit, setTaskEdit] = useAtom(taskEditAtom)

  const { attributes, setNodeRef, listeners, transform, isDragging } = useSortable({
    id: task.id,
    transition: null,
  })

  const [playConfetti, setPlayConfetti] = useState(false)

  return (
    <>
      <motion.div
        ref={setNodeRef}
        className={`${deletingTaskId === task.id ? 'delete-animation' : ''} m-2 flex w-[100%] items-center justify-between rounded border bg-blue-200 p-2 hover:bg-amber-100`}
        layoutId={String(task.id)}
        layout
        initial={{ opacity: 1, y: -10 }}
        animate={
          transform
            ? {
                x: transform.x,
                y: transform.y,
                scale: isDragging ? 1.05 : 1,
                zIndex: isDragging ? 2 : 0,
                boxShadow: isDragging
                  ? '0 0 0 1px rgba(63, 63, 68, 0.05), 0px 15px 15px 0 rgba(34, 33, 81, 0.25)'
                  : undefined,
              }
            : initialStyles
        }
        transition={{
          duration: !isDragging ? 0.25 : 0,
          easings: {
            type: 'spring',
          },
          scale: {
            duration: 0.25,
          },
          zIndex: {
            delay: isDragging ? 0 : 0.25,
          },
        }}
      >
        <div className="m-1 break-words">{task.title}</div>
        <div className="align-center flex justify-center gap-1">
          <button className="min-w-5 cursor-pointer hover:text-amber-700" onClick={openEdition}>
            <MdEdit className="text-2xl" />
          </button>
          <button className="min-w-5 cursor-move touch-none hover:text-amber-700" {...attributes} {...listeners}>
            <RiDragMoveFill className="text-2xl" />
          </button>
          <button className="min-w-5 cursor-pointer" onClick={handleDelete}>
            <VortexCheck />
          </button>
        </div>
      </motion.div>

      {playConfetti && (
        <Fireworks
          autorun={{ speed: 30, duration: 100 }}
          decorateOptions={(options: TCanvasConfettiAnimationOptions) => ({
            ...options,
          })}
        />
      )}
    </>
  )

  function handleDelete() {
    setDeletingTaskId(task.id)

    setTimeout(async () => {
      onDelete(task.id)
    }, 1500)

    setPlayConfetti(true)
  }

  function openEdition() {
    if (taskEdit?.id !== task.id) {
      setTaskEdit(task)
    }
    setIsEditingTask(true)
  }
}
