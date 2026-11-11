import { AnimatePresence, motion } from 'framer-motion'
import { ReactNode, useEffect } from 'react'
import { createPortal } from 'react-dom'

import { useCloseOnBack } from '@/hooks/useCloseOnBack'
import { useKeyPress } from '@/hooks/useKeyPress'
import { useKeyboardViewport } from '@/hooks/useKeyboardViewport'
import { cn } from '@/utils/cn'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  labelledBy?: string
  /** 'lg' is wider and sits higher, for taller content. */
  size?: 'md' | 'lg'
  children: ReactNode
}

export function Modal({ isOpen, onClose, labelledBy, size = 'md', children }: ModalProps) {
  useKeyPress('Escape', onClose, { enabled: isOpen })
  useCloseOnBack(isOpen, onClose)
  // With the phone's keyboard up, the modal moves to the top of what's still visible, so it isn't hidden under it.
  const keyboard = useKeyboardViewport(isOpen)

  useEffect(() => {
    if (!isOpen) return
    const { style } = document.documentElement
    const previous = style.overflow
    style.overflow = 'hidden'
    return () => {
      style.overflow = previous
    }
  }, [isOpen])

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          key="modal"
          className="fixed inset-0 z-40 overflow-y-auto overscroll-contain"
          style={keyboard ? { top: keyboard.top, bottom: 'auto', height: keyboard.height } : undefined}
          role="dialog"
          aria-modal="true"
          aria-labelledby={labelledBy}
        >
          <motion.div
            // No blur on phones: re-blurring the moving background every frame makes typing and scrolling lag.
            className="fixed inset-0 bg-slate-900/35 dark:bg-black/65 pointer-fine:bg-slate-900/25 pointer-fine:backdrop-blur-[3px] dark:pointer-fine:bg-black/55"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            onClick={onClose}
          />
          <div
            className={cn(
              'pointer-events-none relative flex min-h-full items-start justify-center p-4 transition-[padding] duration-200 ease-out',
              keyboard ? 'pt-2 pb-2' : size === 'lg' ? 'pt-[6vh] pb-24 sm:pt-[10vh]' : 'pt-[16vh] sm:pt-[20vh]'
            )}
          >
            <motion.div
              className={cn(
                'pointer-events-auto w-full rounded-3xl border border-sheet-border bg-sheet shadow-2xl shadow-slate-900/20',
                size === 'lg' ? 'max-w-lg' : 'max-w-md'
              )}
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.97, transition: { duration: 0.15 } }}
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            >
              {children}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  )
}
