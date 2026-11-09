import type { TaskType } from '@/utils/taskTypes'

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
  /** What kind of task it is: sets its colours, icon and pattern. */
  type: TaskType
  /** The recurrence that created it, if any. */
  recurrenceId?: number | null
  uid: number
}

export type RecurrenceItemModel = {
  id: number
  /** Empty means "use the recurrence's name". */
  title: string
  time: number
  /** The type of the task it creates. */
  type: TaskType
}

export type RecurrenceModel = {
  id: number
  name: string
  /** Bitmask of weekdays: bit 0 = Sunday ... bit 6 = Saturday. */
  weekdays: number
  enabled: boolean
  items: RecurrenceItemModel[]
}

export type RecurrenceInput = Omit<RecurrenceModel, 'id' | 'items'> & { items: Omit<RecurrenceItemModel, 'id'>[] }
