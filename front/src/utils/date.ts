import { TaskDateModel } from '@/typings/types'

export function toTaskDate(date: Date): TaskDateModel {
  return { day: date.getDate(), month: date.getMonth() + 1, year: date.getFullYear() }
}

export function toJsDate({ day, month, year }: TaskDateModel) {
  return new Date(year, month - 1, day)
}

export function todayTaskDate() {
  return toTaskDate(new Date())
}

export function shiftDate(date: TaskDateModel, days: number): TaskDateModel {
  return toTaskDate(new Date(date.year, date.month - 1, date.day + days))
}

export function isSameDay(a: TaskDateModel, b: TaskDateModel) {
  return a.day === b.day && a.month === b.month && a.year === b.year
}

/** Whole days from `from` to `to` (positive when `to` is later). */
export function dayDiff(from: TaskDateModel, to: TaskDateModel) {
  const ms = Date.UTC(to.year, to.month - 1, to.day) - Date.UTC(from.year, from.month - 1, from.day)
  return Math.round(ms / 86_400_000)
}

export function relativeDayLabel(date: TaskDateModel, today: TaskDateModel) {
  const diff = dayDiff(today, date)
  if (diff === 0) return 'today'
  if (diff === 1) return 'tomorrow'
  if (diff === -1) return 'yesterday'
  return diff > 0 ? `in ${diff} days` : `${-diff} days ago`
}

export function weekdayName(date: TaskDateModel) {
  return toJsDate(date).toLocaleDateString('en-US', { weekday: 'long' })
}

export function shortDayLabel(date: TaskDateModel) {
  return `${toJsDate(date).toLocaleDateString('en-US', { weekday: 'short' })} ${date.day}`
}

/** "Today", "Tomorrow", "Yesterday" or something like "Fri 13". */
export function formDateLabel(date: TaskDateModel, today: TaskDateModel) {
  const diff = dayDiff(today, date)
  if (Math.abs(diff) <= 1) {
    const label = relativeDayLabel(date, today)
    return label[0].toUpperCase() + label.slice(1)
  }
  return shortDayLabel(date)
}

export function pad2(n: number) {
  return String(n).padStart(2, '0')
}

export function dateKey({ day, month, year }: TaskDateModel) {
  return `${day}-${month}-${year}`
}
