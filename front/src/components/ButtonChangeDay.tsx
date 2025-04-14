import { dateAtom } from '@state/state'
import { useAtom } from 'jotai'
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
      <button className="cursor-pointer rounded-3xl border-2 border-transparent bg-blue-300 p-3 hover:border-blue-600">
        {inc == 1 ? <FaChevronRight /> : <FaChevronLeft />}
      </button>
    </div>
  )
}
