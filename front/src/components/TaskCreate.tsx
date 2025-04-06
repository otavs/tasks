import { useEffect, useRef, useState } from 'react'
import Modal from './Modal.tsx'
import { useAtom } from 'jotai'
import { motion } from 'framer-motion'
import { dateAtom } from '../state.ts'
import { useCreateTaskMutation } from '../api/tasks/create.ts'
import { FaPlus } from 'react-icons/fa6'
import { useKeyPress } from '../hooks/useKeyPress.ts'

export function TaskCreate() {
  const [date] = useAtom(dateAtom)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [title, setTitle] = useState('')

  const inputTitleRef = useRef<HTMLInputElement>(null)
  const createTask = useCreateTaskMutation()

  useEffect(() => {
    if (isModalOpen) {
      inputTitleRef.current?.focus()
    }
  }, [isModalOpen])

  useKeyPress('n', () => setIsModalOpen(true))
  useKeyPress('Escape', () => setIsModalOpen(false))

  return (
    <>
      <motion.div className="flex justify-center">
        <button
          className="my-4 cursor-pointer rounded-3xl border-2 border-transparent bg-blue-300 p-3 hover:border-blue-600"
          onClick={() => setIsModalOpen(true)}
        >
          <FaPlus />
        </button>
      </motion.div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <form className="bg-nice-green p-6" onSubmit={handleSubmit}>
          <div className="mb-4">
            <input
              type="text"
              value={title}
              ref={inputTitleRef}
              onChange={e => setTitle(e.target.value)}
              placeholder="Title"
              className="w-full rounded-md border border-gray-300 bg-sky-50 px-4 py-2"
            />
          </div>
          <div className="flex justify-center">
            <button className="cursor-pointer rounded-3xl border-2 border-transparent bg-blue-500 px-5 py-2 text-white hover:border-blue-900">
              Add
            </button>
          </div>
        </form>
      </Modal>
    </>
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    createTask.mutate({ title, date })

    setTitle('')
    setIsModalOpen(false)
  }
}
