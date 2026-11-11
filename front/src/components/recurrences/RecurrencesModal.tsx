import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { AnimatePresence, motion } from 'framer-motion'
import { useAtom } from 'jotai'
import { CalendarPlus, ChevronLeft, GripVertical, Plus, Repeat, Trash2, X } from 'lucide-react'
import { FormEvent, useMemo, useRef, useState } from 'react'

import { Modal } from '../Modal'
import { Switch } from '../Switch'
import { TimeField } from '../TimeField'
import { TypePicker } from '../TypePicker'
import { TypeTile } from '../TypeTile'
import { WeekdayPicker } from './WeekdayPicker'
import {
  useApplyRecurrenceMutation,
  useDeleteRecurrenceMutation,
  useRecurrencesQuery,
  useReorderRecurrencesMutation,
  useSaveRecurrenceMutation,
} from '@/api/recurrences'
import { useCloseOnBack } from '@/hooks/useCloseOnBack'
import { isRecurrencesOpenAtom } from '@/state/state'
import { toast } from '@/state/toast'
import { RecurrenceModel } from '@/typings/types'
import { cn } from '@/utils/cn'
import { DEFAULT_TASK_TYPE, TaskType, taskType } from '@/utils/taskTypes'
import { formatTime } from '@/utils/time'
import { EVERY_DAY, weekdaysLabel } from '@/utils/weekdays'

const HEADING_ID = 'recurrences-heading'

export function RecurrencesModal() {
  const [isOpen, setIsOpen] = useAtom(isRecurrencesOpenAtom)
  const close = () => setIsOpen(false)

  return (
    <Modal isOpen={isOpen} onClose={close} labelledBy={HEADING_ID} size="lg">
      {/* Remounted on every open, so it always starts on the list. */}
      <RecurrencesPanel onClose={close} />
    </Modal>
  )
}

function RecurrencesPanel({ onClose }: { onClose: () => void }) {
  const [editing, setEditing] = useState<RecurrenceModel | 'new' | null>(null)
  // Back from the editor goes to the list, like its ← button.
  useCloseOnBack(!!editing, () => setEditing(null))

  return (
    <AnimatePresence mode="wait" initial={false}>
      {editing ? (
        <motion.div
          key="editor"
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 24 }}
          transition={{ duration: 0.16 }}
        >
          <RecurrenceEditor recurrence={editing === 'new' ? undefined : editing} onDone={() => setEditing(null)} />
        </motion.div>
      ) : (
        <motion.div
          key="list"
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.16 }}
        >
          <RecurrenceList onEdit={setEditing} onNew={() => setEditing('new')} onClose={onClose} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

const toInput = ({ name, weekdays, enabled, items }: RecurrenceModel) => ({
  name,
  weekdays,
  enabled,
  items: items.map(({ title, time, type }) => ({ title, time, type })),
})

/** The (distinct) types a recurrence creates, as a little stack of tiles. */
function TypeStack({ items }: { items: RecurrenceModel['items'] }) {
  const types = [...new Set(items.map(item => item.type))].slice(0, 3)

  return (
    <div className="flex shrink-0 -space-x-1.5">
      {types.map(type => (
        <TypeTile key={type} type={type} className="size-8 rounded-[10px] ring-2 ring-card" iconClassName="size-4" />
      ))}
    </div>
  )
}

function RecurrenceList({
  onEdit,
  onNew,
  onClose,
}: {
  onEdit: (recurrence: RecurrenceModel) => void
  onNew: () => void
  onClose: () => void
}) {
  const { data, isPending, isError } = useRecurrencesQuery()
  const save = useSaveRecurrenceMutation()
  const reorder = useReorderRecurrencesMutation()

  // The order from the last drop, until it's saved. It's set in the same render as the drop, so the row doesn't
  // jump back to where it was for a moment.
  const [droppedOrder, setDroppedOrder] = useState<number[] | null>(null)
  const recurrences = useMemo(() => {
    if (!data || !droppedOrder) return data
    const rank = (id: number) => (droppedOrder.includes(id) ? droppedOrder.indexOf(id) : Infinity)
    return [...data].sort((a, b) => rank(a.id) - rank(b.id))
  }, [data, droppedOrder])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!recurrences || !over || active.id === over.id) return
    const ids = recurrences.map(recurrence => recurrence.id)
    const order = arrayMove(ids, ids.indexOf(Number(active.id)), ids.indexOf(Number(over.id)))
    setDroppedOrder(order)
    reorder.mutate(order, { onSettled: () => setDroppedOrder(null) })
  }

  return (
    <div className="p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 id={HEADING_ID} className="font-display text-xl font-semibold">
          Recurring tasks
        </h2>
        <button
          type="button"
          onClick={onNew}
          className="flex cursor-pointer items-center gap-1 rounded-full border-2 border-transparent bg-primary px-3 py-1 text-sm font-bold text-primary-ink transition-colors hover:border-primary-ring"
        >
          <Plus className="size-4" strokeWidth={3} />
          New
        </button>
      </div>
      <p className="mt-1 mb-4 text-sm font-medium text-ink-soft">
        Their tasks are added automatically at the start of each day.
      </p>

      {isError ? (
        <p className="py-6 text-center text-sm font-semibold text-danger">Couldn't load your recurring tasks.</p>
      ) : isPending ? (
        <div className="h-16 animate-pulse rounded-2xl bg-card/60" />
      ) : !recurrences || recurrences.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-ink/15 px-6 py-8 text-center">
          <Repeat className="size-7 text-ink-faint" strokeWidth={2.25} />
          <p className="text-sm font-semibold text-ink-soft">
            No recurring tasks yet. Like "Drink water" four times a day, or "Clock in" on weekdays at 08:00.
          </p>
          <button
            type="button"
            onClick={onNew}
            className="cursor-pointer rounded-full bg-primary-strong px-4 py-1.5 text-sm font-bold text-primary-strong-ink shadow-md shadow-blue-600/25"
          >
            Create one
          </button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis, restrictToParentElement]}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={recurrences.map(recurrence => recurrence.id)} strategy={verticalListSortingStrategy}>
            <ul className="flex flex-col gap-2">
              {recurrences.map(recurrence => (
                <RecurrenceRow
                  key={recurrence.id}
                  recurrence={recurrence}
                  onEdit={onEdit}
                  onToggle={enabled => save.mutate({ id: recurrence.id, ...toInput(recurrence), enabled })}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      <div className="mt-5 flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer rounded-full px-4 py-2 font-semibold text-ink-soft transition-colors hover:bg-ink/5 hover:text-ink"
        >
          Done
        </button>
      </div>
    </div>
  )
}

/** A recurrence in the list: click to edit it, drag its grip to move it. */
function RecurrenceRow({
  recurrence,
  onEdit,
  onToggle,
}: {
  recurrence: RecurrenceModel
  onEdit: (recurrence: RecurrenceModel) => void
  onToggle: (enabled: boolean) => void
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: recurrence.id,
  })

  return (
    <li
      ref={setNodeRef}
      style={{ transform: transform ? `translate3d(0, ${Math.round(transform.y)}px, 0)` : undefined, transition }}
      className={cn('relative', isDragging && 'z-10')}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() => onEdit(recurrence)}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onEdit(recurrence)
          }
        }}
        className={cn(
          'flex cursor-pointer items-center gap-2.5 rounded-2xl border border-card-border bg-card py-3 pr-4 pl-1.5 transition-[background-color,opacity,box-shadow,scale] duration-200 hover:bg-card-hover',
          isDragging ? 'scale-[1.02] bg-card-hover shadow-lift' : 'shadow-card',
          !recurrence.enabled && !isDragging && 'opacity-55'
        )}
      >
        <button
          ref={setActivatorNodeRef}
          type="button"
          aria-label={`Drag to reorder ${recurrence.name}`}
          title="Drag to reorder"
          {...attributes}
          {...listeners}
          // The row opens the editor on click and on Enter: the handle keeps both to itself.
          onClick={e => e.stopPropagation()}
          onKeyDown={e => {
            listeners?.onKeyDown?.(e)
            e.stopPropagation()
          }}
          className={cn(
            '-my-2 flex w-6 shrink-0 cursor-grab touch-none items-center justify-center self-stretch rounded-xl transition-colors active:cursor-grabbing',
            isDragging ? 'text-ink-soft' : 'text-ink-faint/60 hover:text-ink-soft'
          )}
        >
          <GripVertical className="size-4" strokeWidth={2.5} />
        </button>
        <TypeStack items={recurrence.items} />
        <div className="min-w-0 flex-1">
          <div className="font-semibold break-words">{recurrence.name}</div>
          <div className="text-xs font-semibold text-ink-soft">
            {weekdaysLabel(recurrence.weekdays)} · {recurrence.items.map(item => formatTime(item.time)).join(' · ')}
          </div>
        </div>
        <Switch
          checked={recurrence.enabled}
          label={recurrence.enabled ? 'Pause this recurrence' : 'Resume this recurrence'}
          onChange={onToggle}
        />
      </div>
    </li>
  )
}

type DraftItem = { key: number; title: string; time: number; type: TaskType }

function RecurrenceEditor({ recurrence, onDone }: { recurrence?: RecurrenceModel; onDone: () => void }) {
  const save = useSaveRecurrenceMutation()
  const remove = useDeleteRecurrenceMutation()
  const apply = useApplyRecurrenceMutation()

  const nextKey = useRef(1000)
  const [name, setName] = useState(recurrence?.name ?? '')
  const [weekdays, setWeekdays] = useState(recurrence?.weekdays ?? EVERY_DAY)
  const [items, setItems] = useState<DraftItem[]>(
    recurrence?.items.map(item => ({ key: item.id, title: item.title, time: item.time, type: item.type })) ?? [
      { key: 0, title: '', time: 9 * 60, type: DEFAULT_TASK_TYPE },
    ]
  )
  // The item whose type picker is open, if any.
  const [pickingType, setPickingType] = useState<number | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const trimmedName = name.trim()
  const isValid = !!trimmedName && weekdays !== 0 && items.length > 0

  const updateItem = (key: number, changes: Partial<DraftItem>) =>
    setItems(current => current.map(item => (item.key === key ? { ...item, ...changes } : item)))

  // A new item comes an hour after the last one, of the same type, which is usually what you want next.
  const addItem = () =>
    setItems(current => [
      ...current,
      {
        key: nextKey.current++,
        title: '',
        time: Math.min((current.at(-1)?.time ?? 8 * 60) + 60, 23 * 60),
        type: current.at(-1)?.type ?? DEFAULT_TASK_TYPE,
      },
    ])

  const input = () => ({
    name: trimmedName,
    weekdays,
    enabled: recurrence?.enabled ?? true,
    items: items.map(({ title, time, type }) => ({ title: title.trim(), time, type })),
  })
  const draft = () => ({ id: recurrence?.id, ...input() })
  const hasChanges = () => !recurrence || JSON.stringify(input()) !== JSON.stringify(toInput(recurrence))

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!isValid) return
    save.mutate(draft())
    toast(recurrence ? 'Recurring task saved' : 'Recurring task created ↻', { tone: 'success' })
    onDone()
  }

  /** Brings back today's tasks that were already completed or deleted (saving any changes first). */
  async function handleAddToToday() {
    if (!recurrence || !isValid) return
    try {
      if (hasChanges()) await save.mutateAsync(draft())
      const { created } = await apply.mutateAsync(recurrence.id)
      if (created === 0) toast('Today already has all of its tasks')
      else toast(`Added ${created === 1 ? '1 task' : `${created} tasks`} to today ↻`, { tone: 'success' })
      onDone()
    } catch {
      // The mutation cache already tells about the error.
    }
  }

  function handleDelete() {
    if (!recurrence) return
    if (!confirmDelete) return setConfirmDelete(true)
    remove.mutate(recurrence.id)
    toast('Recurring task deleted')
    onDone()
  }

  return (
    <form className="p-5 sm:p-6" onSubmit={handleSubmit}>
      <div className="mb-4 flex items-center gap-2">
        <button
          type="button"
          onClick={onDone}
          aria-label="Back to the list"
          className="-ml-2 grid size-8 cursor-pointer place-items-center rounded-full text-ink-soft transition-colors hover:bg-ink/5 hover:text-ink"
        >
          <ChevronLeft className="size-5" strokeWidth={2.75} />
        </button>
        <h2 id={HEADING_ID} className="font-display text-xl font-semibold">
          {recurrence ? 'Edit recurring task' : 'New recurring task'}
        </h2>
      </div>

      <Label>Name</Label>
      <input
        autoFocus={!recurrence}
        value={name}
        maxLength={200}
        onChange={e => setName(e.target.value)}
        placeholder="e.g. Drink water"
        className="mb-4 block w-full rounded-2xl border border-field-border bg-field px-4 py-2.5 text-base font-semibold text-ink shadow-inner shadow-slate-900/5 transition outline-none placeholder:font-medium placeholder:text-ink-faint focus:border-primary-ring focus:ring-4 focus:ring-primary-ring/15"
      />

      <Label>Repeat on</Label>
      <div className="mb-4">
        <WeekdayPicker value={weekdays} onChange={setWeekdays} />
      </div>

      <Label>Tasks it creates</Label>
      <ul className="flex flex-col gap-2">
        <AnimatePresence initial={false}>
          {items.map(item => (
            <motion.li
              key={item.key}
              layout
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, transition: { duration: 0.15 } }}
            >
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label={`Type: ${taskType(item.type).label}. Change it`}
                  title="Change the type"
                  aria-expanded={pickingType === item.key}
                  onClick={() => setPickingType(current => (current === item.key ? null : item.key))}
                  className="shrink-0 cursor-pointer rounded-xl transition-transform hover:-translate-y-0.5 active:scale-90"
                >
                  <TypeTile type={item.type} className="size-9 rounded-xl" iconClassName="size-[18px]" />
                </button>
                <TimeField value={item.time} onChange={time => updateItem(item.key, { time })} />
                <input
                  value={item.title}
                  maxLength={500}
                  onChange={e => updateItem(item.key, { title: e.target.value })}
                  placeholder={trimmedName || 'Task title'}
                  aria-label="Task title"
                  className="min-w-0 flex-1 rounded-full border border-field-border bg-field px-4 py-1.5 text-[15px] font-semibold text-ink shadow-inner shadow-slate-900/5 transition outline-none placeholder:font-medium placeholder:text-ink-faint focus:border-primary-ring focus:ring-4 focus:ring-primary-ring/15"
                />
                <button
                  type="button"
                  aria-label="Remove this task"
                  title="Remove"
                  disabled={items.length === 1}
                  onClick={() => setItems(current => current.filter(i => i.key !== item.key))}
                  className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-full text-ink-soft transition-colors hover:bg-ink/5 hover:text-ink disabled:pointer-events-none disabled:opacity-25"
                >
                  <X className="size-4" strokeWidth={2.75} />
                </button>
              </div>

              <AnimatePresence initial={false}>
                {pickingType === item.key && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="overflow-hidden"
                    // A click (or Enter) picks and closes; arrow keys just move through the options.
                    onClick={e => (e.target as HTMLElement).closest('[role="radio"]') && setPickingType(null)}
                  >
                    <TypePicker
                      value={item.type}
                      autoFocus
                      onChange={type => updateItem(item.key, { type })}
                      className="p-1.5 pt-2.5"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
      <button
        type="button"
        onClick={addItem}
        className="mt-2 flex cursor-pointer items-center gap-1 rounded-full px-3 py-1.5 text-sm font-bold text-ink-soft transition-colors hover:bg-ink/5 hover:text-ink"
      >
        <Plus className="size-4" strokeWidth={3} />
        Add another time
      </button>
      <p className="mt-1 px-3 text-xs font-medium text-ink-faint">An empty title uses the name.</p>

      {recurrence && (
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-2xl border border-dashed border-ink/15 px-3 py-2.5">
          <button
            type="button"
            onClick={handleAddToToday}
            disabled={!isValid || apply.isPending || save.isPending}
            className="flex cursor-pointer items-center gap-1.5 rounded-full bg-primary/70 px-3 py-1.5 text-sm font-bold text-primary-ink transition-colors hover:bg-primary disabled:cursor-wait disabled:opacity-50"
          >
            <CalendarPlus className="size-4" strokeWidth={2.5} />
            Add to today again
          </button>
          <span className="text-xs font-medium text-ink-soft">Brings back the ones already done or deleted today.</span>
        </div>
      )}

      <div className="mt-5 flex items-center gap-2">
        {recurrence && (
          <button
            type="button"
            onClick={handleDelete}
            onBlur={() => setConfirmDelete(false)}
            className={cn(
              'flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-2 text-sm font-bold transition-colors',
              confirmDelete ? 'bg-danger text-white' : 'text-danger hover:bg-danger/10'
            )}
          >
            <Trash2 className="size-4" strokeWidth={2.5} />
            {confirmDelete ? 'Click again to delete' : 'Delete'}
          </button>
        )}
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={onDone}
            className="cursor-pointer rounded-full px-4 py-2 font-semibold text-ink-soft transition-colors hover:bg-ink/5 hover:text-ink"
          >
            Cancel
          </button>
          <motion.button
            type="submit"
            disabled={!isValid}
            whileTap={{ scale: 0.94 }}
            className="cursor-pointer rounded-full border-2 border-transparent bg-primary-strong px-6 py-2 font-bold text-primary-strong-ink shadow-md shadow-blue-600/25 transition-[border-color,opacity] hover:border-blue-900 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:border-white/60"
          >
            Save
          </motion.button>
        </div>
      </div>
    </form>
  )
}

function Label({ children }: { children: string }) {
  return (
    <div className="mb-1.5 px-1 text-[11px] font-extrabold tracking-widest text-ink-soft uppercase">{children}</div>
  )
}
