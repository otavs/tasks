export type TaskDateModel = {
  day: number
  month: number
  year: number
}

export type TaskModel = {
  id?: number
  title: string
  date?: TaskDateModel
  position?: number
}
