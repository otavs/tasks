export type TaskDateModel = {
  day: number
  month: number
  year: number
}

export type TaskCreateModel = {
  title: string
  date: TaskDateModel
}

export type TaskModel = {
  id: number
  title: string
  date?: TaskDateModel
  position: number
}
