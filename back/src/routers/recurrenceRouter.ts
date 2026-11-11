import { Router } from 'express'
import { createRecurrence } from '../endpoints/recurrences/createRecurrence.ts'
import { deleteRecurrence } from '../endpoints/recurrences/deleteRecurrence.ts'
import { applyAllRecurrences, applyRecurrence } from '../endpoints/recurrences/applyRecurrence.ts'
import { listRecurrences } from '../endpoints/recurrences/listRecurrences.ts'
import { reorderRecurrences } from '../endpoints/recurrences/reorderRecurrences.ts'
import { updateRecurrence } from '../endpoints/recurrences/updateRecurrence.ts'

export const recurrenceRouter = Router()

recurrenceRouter.get('/', listRecurrences)
recurrenceRouter.post('/', createRecurrence)
// Before '/:id', or "reorder" would be taken for an id.
recurrenceRouter.put('/reorder', reorderRecurrences)
recurrenceRouter.put('/:id', updateRecurrence)
recurrenceRouter.post('/apply', applyAllRecurrences)
recurrenceRouter.post('/:id/apply', applyRecurrence)
recurrenceRouter.delete('/:id', deleteRecurrence)
