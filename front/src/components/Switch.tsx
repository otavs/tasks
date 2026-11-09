import { cn } from '@/utils/cn'

export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      title={label}
      onClick={e => {
        e.stopPropagation()
        onChange(!checked)
      }}
      onKeyDown={e => e.stopPropagation()}
      className={cn(
        'relative h-6 w-10 shrink-0 cursor-pointer rounded-full transition-colors',
        checked ? 'bg-primary-strong' : 'bg-ink/20'
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform duration-200',
          checked && 'translate-x-4'
        )}
      />
    </button>
  )
}
