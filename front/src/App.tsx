import { useQuery } from '@tanstack/react-query'
import { useAtom } from 'jotai'
import { dateAtom } from './state.ts'
import { Task } from './types.tsx'

export default function App() {
  const [date] = useAtom(dateAtom)

  return (
    <>
      <div className="flex justify-around text-red-500">
        <ButtonChangeDay inc={-1} />
        {date.day} / {date.month} / {date.year}
        <ButtonChangeDay inc={1} />
      </div>

      <Tasks />

      <button className=""></button>
    </>
  )
}

function ButtonChangeDay({ inc }: { inc: number }) {
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

function Tasks() {
  const { isPending, isError, data, error } = useQuery({
    queryKey: ['tasks'],
    queryFn: fetchTasks,
  })

  if (isPending) {
    return <span>Loading...</span>
  }

  if (isError) {
    return <span>Error: {error.message}</span>
  }

  return (
    <div className="flex flex-col items-center justify-center">
      {data.map(task => (
        <div className="m-2 flex w-1/2 cursor-pointer justify-center rounded border p-2 hover:bg-amber-100">
          {task.title}
        </div>
      ))}
    </div>
  )
}

async function fetchTasks() {
  console.log('a')

  const res = await fetch('http://localhost:3000/tasks')

  if (!res.ok) {
    throw new Error(`Failed to fetch tasks: ${res.statusText}`)
  }

  return (await res.json()) as Task[]
}
