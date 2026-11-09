export type TaskDateModel = {
  day: number
  month: number
  year: number
}

export type TaskModel = {
  id: number
  title: string
  date?: TaskDateModel
  /** Minutes since midnight (0..1439). */
  time: number
  position: number
  /** "Loading": already being worked on. */
  inProgress: boolean
  uid: number
}
