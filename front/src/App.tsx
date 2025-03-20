import { useAtom } from 'jotai'
import { dateAtom } from './state.ts'
import { ButtonChangeDay } from './components/ButtonChangeDay.tsx'
import { TaskList } from './components/TaskList.tsx'
import { TaskCreate } from './components/TaskCreate.tsx'
import { TaskEdit } from './components/TaskEdit.tsx'
import { useEffect, useState } from 'react'

export default function App() {
  const [date] = useAtom(dateAtom)
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <>
      <div className="my-3 flex justify-around items-center">
        <ButtonChangeDay inc={-1} />
        <div>
          <div className="flex justify-center text-2xl">{dateFormatted()}</div>
          <div className="flex justify-center text-2xl">{timeFormatted()}</div>
        </div>
        <ButtonChangeDay inc={1} />
      </div>

      <TaskList />

      <TaskCreate />

      <TaskEdit />
    </>
  )

  function dateFormatted() {
    return `${padZero(date.day, 2)} - ${padZero(date.month, 2)} - ${date.year}`
  }

  function timeFormatted() {
    const hours = String(time.getHours()).padStart(2, '0')
    const minutes = String(time.getMinutes()).padStart(2, '0')
    const seconds = String(time.getSeconds()).padStart(2, '0')

    return `${hours} : ${minutes} : ${seconds}`
  }

  function padZero(n: number, digits: number) {
    return n.toString().padStart(digits, '0')
  }
}
