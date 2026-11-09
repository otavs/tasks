import {
  BriefcaseBusiness,
  CodeXml,
  Coffee,
  Droplet,
  Dumbbell,
  Gamepad2,
  LucideIcon,
  MessageSquare,
  Package,
  ShoppingCart,
  UsersRound,
  Video,
  WandSparkles,
} from 'lucide-react'

import {
  BottleRefill,
  Broom,
  Capsule,
  CleanShirt,
  FoodDelivery,
  Meal,
  PlayButton,
  Shower,
  TaskLines,
  Tooth,
} from '@/components/icons/typeIcons'

/**
 * What kind of task it is. Only visual: each type has its own colours, icon and pattern (see the
 * "Task types" section of index.css, keyed by `data-type`). Keep the ids in sync with the backend's
 * `src/utils/taskTypes.ts`. Listed in the order the picker shows them; each blank-line group shares a
 * colour (see "Theme colours, by group" in index.css).
 */
export const TASK_TYPES = [
  { id: 'task', label: 'Task', icon: TaskLines },

  { id: 'work', label: 'Work', icon: BriefcaseBusiness },
  { id: 'meeting', label: 'Meeting', icon: Video },

  { id: 'refill', label: 'Refill bottles', icon: BottleRefill },
  { id: 'water', label: 'Drink water', icon: Droplet },

  { id: 'meal', label: 'Meal', icon: Meal },
  { id: 'food', label: 'Food delivery', icon: FoodDelivery },
  { id: 'coffee', label: 'Coffee', icon: Coffee },
  { id: 'medicine', label: 'Medicine', icon: Capsule },

  { id: 'workout', label: 'Workout', icon: Dumbbell },
  { id: 'shower', label: 'Shower', icon: Shower },
  { id: 'teeth', label: 'Brush teeth', icon: Tooth },

  { id: 'cleaning', label: 'Cleaning', icon: Broom },
  { id: 'laundry', label: 'Laundry', icon: CleanShirt },

  { id: 'shopping', label: 'Shopping', icon: ShoppingCart },

  { id: 'package', label: 'Package', icon: Package },

  { id: 'chat', label: 'Talk to someone', icon: MessageSquare },

  { id: 'coding', label: 'Coding', icon: CodeXml },
  { id: 'print', label: '3D print', icon: WandSparkles },

  { id: 'gaming', label: 'Gaming', icon: Gamepad2 },
  { id: 'video', label: 'Watch video', icon: PlayButton },
  { id: 'friends', label: 'Play with friends', icon: UsersRound },
] as const satisfies readonly { id: string; label: string; icon: LucideIcon }[]

export type TaskType = (typeof TASK_TYPES)[number]['id']
export type TaskTypeInfo = (typeof TASK_TYPES)[number]

export const DEFAULT_TASK_TYPE: TaskType = 'task'

const byId = new Map<string, TaskTypeInfo>(TASK_TYPES.map(type => [type.id, type]))

/** The type's info; unknown ids (e.g. from a newer server) fall back to the plain task. */
export const taskType = (id: string | undefined): TaskTypeInfo => byId.get(id ?? '') ?? TASK_TYPES[0]
