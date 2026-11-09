import { AnimatePresence, motion } from 'framer-motion'
import { ReactNode, useEffect } from 'react'
import { createPortal } from 'react-dom'

import { useKeyPress } from '@/hooks/useKeyPress'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  labelledBy?: string
  children: ReactNode
}

export function Modal({ isOpen, onClose, labelledBy, children }: ModalProps) {
  useKeyPress('Escape', onClose, { enabled: isOpen })

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
        <div key="modal" className="fixed inset-0 z-40" role="dialog" aria-modal="true" aria-labelledby={labelledBy}>
          <motion.div
            className="absolute inset-0 bg-slate-900/25 backdrop-blur-[3px] dark:bg-black/55"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            onClick={onClose}
          />
          <div className="pointer-events-none relative flex min-h-full items-start justify-center p-4 pt-[16vh] sm:pt-[20vh]">
            <motion.div
              className="pointer-events-auto w-full max-w-md rounded-3xl border border-sheet-border bg-sheet shadow-2xl shadow-slate-900/20"
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
