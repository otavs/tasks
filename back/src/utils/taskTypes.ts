/**
 * What kind of task it is. It only changes how the task looks (colours, icon, pattern), so the list is
 * fixed here. Keep it in sync with the front end's `src/utils/taskTypes.ts`.
 */
export const TASK_TYPES = [
  'task',
  'work',
  'meeting',
  'refill',
  'water',
  'meal',
  'food',
  'coffee',
  'medicine',
  'workout',
  'shower',
  'teeth',
  'cleaning',
  'laundry',
  'shopping',
  'package',
  'chat',
  'coding',
  'print',
  'gaming',
  'video',
  'friends',
] as const

export type TaskType = (typeof TASK_TYPES)[number]

export const DEFAULT_TASK_TYPE: TaskType = 'task'

export const isTaskType = (value: unknown): value is TaskType =>
  typeof value === 'string' && (TASK_TYPES as readonly string[]).includes(value)

export const TASK_TYPE_ERROR = `type must be one of: ${TASK_TYPES.join(', ')}`
