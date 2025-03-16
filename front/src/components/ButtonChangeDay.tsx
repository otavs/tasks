import { useAtom } from 'jotai'
import { dateAtom } from '../state.ts'

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
    <button className="min-w-5 cursor-pointer bg-amber-200" onClick={onClick}>
      {inc == 1 ? `>` : `<`}
    </button>
  )
}
