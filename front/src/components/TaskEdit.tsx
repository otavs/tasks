import { useEffect, useRef } from 'react'
import Modal from './Modal.tsx'
import { useAtom } from 'jotai'
import { isEditingTaskAtom, taskEditAtom } from '../state.ts'
import { useUpdateTaskMutation } from '../api/tasks.ts'
import { useKeyPress } from '../hooks/useKeyPress.ts'

export function TaskEdit() {
  const inputTitleRef = useRef<HTMLInputElement>(null)
  const updateTask = useUpdateTaskMutation()

  const [isEditingTask, setIsEditingTask] = useAtom(isEditingTaskAtom)
  const [taskEdit, setTaskEdit] = useAtom(taskEditAtom)

  useEffect(() => {
    if (isEditingTask) {
      inputTitleRef.current?.focus()
    }
  }, [isEditingTask])

  useKeyPress('Escape', () => setIsEditingTask(false))

  return (
    <>
      <Modal isOpen={isEditingTask} onClose={() => setIsEditingTask(false)}>
        <form className="bg-nice-green p-6" onSubmit={handleSubmit}>
          <div className="mb-4">
            <input
              type="text"
              value={taskEdit?.title}
              ref={inputTitleRef}
              onChange={e => setTaskEdit({ ...taskEdit!, title: e.target.value })}
              placeholder="Title"
              className="w-full rounded-md border border-gray-300 bg-sky-50 px-4 py-2"
            />
          </div>
          <div className="flex justify-center">
            <button
              type="submit"
              className="cursor-pointer rounded-3xl border-2 border-transparent bg-blue-500 px-5 py-2 text-white hover:border-blue-900"
            >
              Update
            </button>
          </div>
        </form>
      </Modal>
    </>
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    updateTask.mutate(
      { title: taskEdit!.title, id: taskEdit!.id },
      {
        onSuccess: () => {
          setTaskEdit(undefined)
          setIsEditingTask(false)
        },
      }
    )
  }
}
