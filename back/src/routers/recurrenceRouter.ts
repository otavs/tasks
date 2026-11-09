import { Router } from 'express'
import { createRecurrence } from '../endpoints/recurrences/createRecurrence.ts'
import { deleteRecurrence } from '../endpoints/recurrences/deleteRecurrence.ts'
import { listRecurrences } from '../endpoints/recurrences/listRecurrences.ts'
import { updateRecurrence } from '../endpoints/recurrences/updateRecurrence.ts'

export const recurrenceRouter = Router()

recurrenceRouter.get('/', listRecurrences)
recurrenceRouter.post('/', createRecurrence)
recurrenceRouter.put('/:id', updateRecurrence)
recurrenceRouter.delete('/:id', deleteRecurrence)
