import { Kbd } from './Kbd'

export function ShortcutsHint() {
  return (
    <p className="mt-10 hidden items-center justify-center gap-x-4 gap-y-2 text-xs font-semibold text-ink-faint pointer-fine:flex sm:flex-wrap">
      <span>
        <Kbd>N</Kbd> new task
      </span>
      <span>
        <Kbd>←</Kbd>
        <Kbd>→</Kbd> change day
      </span>
      <span>
        <Kbd>T</Kbd> today
      </span>
      <span>
        <Kbd>R</Kbd> recurring
      </span>
    </p>
  )
}
