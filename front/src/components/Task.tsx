import { TaskModel } from '../types'
import { useSortable } from '@dnd-kit/sortable'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { draggingTaskIdAtom, isEditingTaskAtom, taskEditAtom } from '../state'
import { useAtom } from 'jotai'
import { MdEdit } from 'react-icons/md'
import { RiDragMoveFill } from 'react-icons/ri'
import { VortexCheck } from './VortexCheck'
import Fireworks from 'react-canvas-confetti/dist/presets/fireworks/index'
import { TCanvasConfettiAnimationOptions } from 'react-canvas-confetti/dist/types/normalization'
import CircleLoader from 'react-spinners/CircleLoader'

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
  const [draggingTaskId] = useAtom(draggingTaskIdAtom)

  const [, setIsEditingTask] = useAtom(isEditingTaskAtom)
  const [taskEdit, setTaskEdit] = useAtom(taskEditAtom)

  const [isDeleted, setIsDeleted] = useState(false)

  const { attributes, setNodeRef, listeners, transform, isDragging } = useSortable({
    id: task.uid,
    transition: null,
  })

  const [playConfetti, setPlayConfetti] = useState(false)

  return (
    <>
      <motion.div
        ref={setNodeRef}
        className={`m-2 flex w-[100%] items-center justify-between rounded border ${draggingTaskId !== task.id ? 'bg-blue-200' : 'bg-amber-100'} p-2 hover:bg-amber-100`}
        layoutId={String(task.uid)}
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
        exit={
          isDeleted
            ? {
                opacity: 0.5,
                rotate: -2000,
                scale: 0,
                transition: {
                  duration: 1.6,
                  ease: 'easeOut',
                },
              }
            : {}
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
          {task.id != -1 ? (
            <>
              <button className="min-w-5 cursor-pointer hover:text-amber-700" onClick={openEdition}>
                <MdEdit className="text-2xl" />
              </button>
              <button className="min-w-5 cursor-move touch-none hover:text-amber-700" {...attributes} {...listeners}>
                <RiDragMoveFill className="text-2xl" />
              </button>
              <button className="min-w-5 cursor-pointer" onClick={handleDelete}>
                <VortexCheck />
              </button>
            </>
          ) : (
            <CircleLoader size={20} color="#0519ff" />
          )}
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
    setIsDeleted(true)
    setPlayConfetti(true)
    onDelete(task.id)
  }

  function openEdition() {
    if (taskEdit?.uid !== task.uid) {
      setTaskEdit(task)
    }
    setIsEditingTask(true)
  }
}
