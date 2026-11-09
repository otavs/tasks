import { cn } from '@/utils/cn'
import { EVERY_DAY, WEEK, WEEKDAYS, WEEKENDS, hasDay } from '@/utils/weekdays'

const PRESETS = [
  { mask: EVERY_DAY, label: 'Every day' },
  { mask: WEEKDAYS, label: 'Weekdays' },
  { mask: WEEKENDS, label: 'Weekends' },
]

export function WeekdayPicker({ value, onChange }: { value: number; onChange: (mask: number) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-7 gap-1">
        {WEEK.map(day => {
          const selected = hasDay(value, day.bit)
          return (
            <button
              key={day.bit}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(value ^ (1 << day.bit))}
              className={cn(
                'h-9 cursor-pointer rounded-xl text-sm font-bold transition-colors',
                selected
                  ? 'bg-primary-strong text-primary-strong-ink shadow-md shadow-blue-600/20'
                  : 'border border-field-border bg-field text-ink-soft hover:text-ink'
              )}
            >
              {day.short}
            </button>
          )
        })}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map(preset => (
          <button
            key={preset.mask}
            type="button"
            onClick={() => onChange(preset.mask)}
            className={cn(
              'cursor-pointer rounded-full px-3 py-1 text-xs font-bold transition-colors',
              value === preset.mask ? 'bg-primary/70 text-primary-ink' : 'bg-ink/5 text-ink-soft hover:bg-ink/10'
            )}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  )
}
