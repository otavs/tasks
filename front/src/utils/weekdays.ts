/** Weekday bitmasks: bit 0 = Sunday ... bit 6 = Saturday (same as Date#getDay). */
export const EVERY_DAY = 0b1111111
export const WEEKDAYS = 0b0111110
export const WEEKENDS = 0b1000001

/** Monday first, the way a week is usually planned. */
export const WEEK = [
  { bit: 1, short: 'Mon' },
  { bit: 2, short: 'Tue' },
  { bit: 3, short: 'Wed' },
  { bit: 4, short: 'Thu' },
  { bit: 5, short: 'Fri' },
  { bit: 6, short: 'Sat' },
  { bit: 0, short: 'Sun' },
]

export const hasDay = (mask: number, bit: number) => (mask & (1 << bit)) !== 0

export function weekdaysLabel(mask: number) {
  if (mask === EVERY_DAY) return 'Every day'
  if (mask === WEEKDAYS) return 'Weekdays'
  if (mask === WEEKENDS) return 'Weekends'
  return WEEK.filter(day => hasDay(mask, day.bit))
    .map(day => day.short)
    .join(', ')
}
