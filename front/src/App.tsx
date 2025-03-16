import { useAtom } from 'jotai'
import { dateAtom } from './state.ts'
import { ButtonChangeDay } from './components/ButtonChangeDay.tsx'
import { TaskList } from './components/TaskList.tsx'
import { TaskCreate } from './components/TaskCreate.tsx'

export default function App() {
  const [date] = useAtom(dateAtom)

  return (
    <>
      <div className="flex justify-around text-red-500">
        <ButtonChangeDay inc={-1} />
        {date.day} / {date.month} / {date.year}
        <ButtonChangeDay inc={1} />
      </div>

      <TaskList />

      <TaskCreate />
    </>
  )
}
