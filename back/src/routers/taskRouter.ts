import { Router } from 'express'
import { listTasks } from '../endpoints/tasks/listTasks.ts'
import { createTask } from '../endpoints/tasks/createTask.ts'
import { deleteTask } from '../endpoints/tasks/deleteTask.ts'
import { reorderTask } from '../endpoints/tasks/reorderTask.ts'
import { moveTask } from '../endpoints/tasks/moveTask.ts'
import { updateTask } from '../endpoints/tasks/updateTask.ts'

export const taskRouter = Router()

taskRouter.get('/:date', listTasks)
taskRouter.post('/', createTask)
taskRouter.delete('/:id', deleteTask)
taskRouter.put('/reorder', reorderTask)
taskRouter.put('/move', moveTask)
taskRouter.put('/:id', updateTask)
