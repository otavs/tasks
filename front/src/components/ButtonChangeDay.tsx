import { useAtom } from 'jotai'
import { dateAtom } from '../state.ts'
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa6'

export function ButtonChangeDay({ inc }: { inc: number }) {
  const [_, setDate] = useAtom(dateAtom)

  function onClick() {
    setDate(prev => {
      const newDate = new Date(prev.year, prev.month - 1, prev.day + inc)
      return {
        day: newDate.getDate(),
        month: newDate.getMonth() + 1,
        year: newDate.getFullYear(),
      }
    })
  }

  return (
    <div className="flex flex-col justify-center" onClick={onClick}>
      <button className="cursor-pointer rounded-3xl bg-blue-300 p-3 border-2 border-transparent hover:border-blue-600">
        {inc == 1 ? <FaChevronRight /> : <FaChevronLeft />}
      </button>
    </div>
  )
}
