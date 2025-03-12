import { useEffect, useState } from 'react'

type TaskDate = {
  day: number
  month: number
  year: number
}

type Task = {
  title: string
  time: number
}

export default function App() {
  const today = new Date()
  const [date, setDate] = useState<TaskDate>({
    day: today.getDate(),
    month: today.getMonth() + 1,
    year: today.getFullYear(),
  })

  const [tasks, setTasks] = useState<Task[]>(randomTasks(5))

  useEffect(() => {})

  return (
    <>
      <div className="flex justify-around text-red-500">
        <div>&lt;</div>
        <div>
          {date.day} / {date.month} / {date.year}
        </div>
        <div>&gt;</div>
      </div>

      <div className="flex flex-col items-center justify-center">
        {tasks.map(task => (
          <div className="m-2 flex w-1/2 cursor-pointer justify-center rounded border p-2 hover:bg-amber-100">
            {task.title}
          </div>
        ))}
      </div>
    </>
  )
}

function randomTasks(n: number): Task[] {
  const titles = ['Task A', 'Task B', 'Task C', 'Task D', 'Task E']

  const tasks: Task[] = []

  for (let i = 0; i < n; i++) {
    const title = titles[Math.floor(Math.random() * titles.length)]
    const time = Math.floor(Math.random() * 100) + 1

    tasks.push({ title, time })
  }

  return tasks
}
