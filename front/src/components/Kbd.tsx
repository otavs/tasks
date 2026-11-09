import { ReactNode } from 'react'

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="mx-0.5 inline-grid min-w-6 place-items-center rounded-md border border-ink/15 bg-white/60 px-1.5 py-px font-sans text-xs font-bold text-ink shadow-[0_1px_0_rgb(0_0_0/0.12)] dark:bg-white/10">
      {children}
    </kbd>
  )
}
