import { AnimatePresence, motion } from 'framer-motion'
import { useAtomValue } from 'jotai'
import { CircleAlert, PartyPopper } from 'lucide-react'

import { dismissToast, toastsAtom } from '@/state/toast'
import { cn } from '@/utils/cn'

export function Toaster() {
  const toasts = useAtomValue(toastsAtom)

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
    >
      <AnimatePresence initial={false} mode="popLayout">
        {toasts.map(toast => (
          <motion.div
            layout
            key={toast.id}
            initial={{ opacity: 0, y: 24, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
            transition={{ type: 'spring', stiffness: 500, damping: 32 }}
            className={cn(
              'pointer-events-auto flex items-center gap-2.5 rounded-full bg-toast py-2 pl-4 text-sm font-bold text-toast-ink shadow-xl shadow-slate-900/20',
              toast.action ? 'pr-2' : 'pr-5'
            )}
          >
            {toast.tone === 'success' && <PartyPopper className="size-4 shrink-0" strokeWidth={2.5} />}
            {toast.tone === 'error' && <CircleAlert className="size-4 shrink-0 text-danger" strokeWidth={2.5} />}
            <span>{toast.message}</span>
            {toast.action && (
              <button
                type="button"
                onClick={() => {
                  toast.action!.run()
                  dismissToast(toast.id)
                }}
                className="cursor-pointer rounded-full bg-toast-ink/15 px-3 py-1 transition-colors hover:bg-toast-ink/25"
              >
                {toast.action.label}
              </button>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
