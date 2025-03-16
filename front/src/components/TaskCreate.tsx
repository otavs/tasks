import { useEffect, useRef, useState } from 'react'
import Modal from './Modal.tsx'
import { useAtom } from 'jotai'
import { dateAtom } from '../state.ts'
import { useCreateTask } from '../api/tasks.ts'

export function TaskCreate() {
  const [date] = useAtom(dateAtom)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [title, setTitle] = useState('')

  const inputTitleRef = useRef<HTMLInputElement>(null)
  const createTask = useCreateTask()

  useEffect(() => {
    if (isModalOpen) {
      inputTitleRef.current?.focus()
    }
  }, [isModalOpen])

  return (
    <>
      <div className="flex justify-center">
        <button className="min-w-5 cursor-pointer bg-amber-200" onClick={() => setIsModalOpen(true)}>
          +
        </button>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <form className="p-6" onSubmit={handleSubmit}>
          <div className="mb-4">
            <input
              type="text"
              value={title}
              ref={inputTitleRef}
              onChange={e => setTitle(e.target.value)}
              placeholder="Enter title"
              className="w-full rounded-md border border-gray-300 px-4 py-2"
            />
          </div>
          <div className="flex justify-center">
            <button type="submit" className="cursor-pointer rounded-md bg-blue-500 px-4 py-1 text-white">
              Submit
            </button>
          </div>
        </form>
      </Modal>
    </>
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    createTask.mutate(
      { title, date },
      {
        onSuccess: () => {
          setTitle('')
          setIsModalOpen(false)
        },
      }
    )
  }
}
