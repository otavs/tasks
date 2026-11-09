import { motion, useAnimationControls } from 'framer-motion'

import { Kbd } from './Kbd'

const duck = `${import.meta.env.BASE_URL}icons8-rubber-duck-256.png`

export function EmptyState() {
  const controls = useAnimationControls()

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.15, type: 'spring', stiffness: 300, damping: 24 }}
      className="flex flex-col items-center py-8 text-center select-none"
    >
      <motion.button
        type="button"
        aria-label="Quack"
        title="Quack!"
        onClick={() =>
          controls.start({ rotate: [0, -18, 14, -8, 4, 0], scale: [1, 1.12, 1], transition: { duration: 0.6 } })
        }
        animate={{ y: [0, -7, 0] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
        className="cursor-pointer"
      >
        <motion.img
          src={duck}
          alt=""
          draggable={false}
          animate={controls}
          className="size-24 drop-shadow-[0_10px_12px_rgb(0_0_0/0.15)]"
        />
      </motion.button>
      <p className="mt-4 font-display text-2xl font-semibold">All clear!</p>
      <p className="mt-1 text-sm font-medium text-ink-soft">
        <span className="pointer-fine:hidden">Tap + to add a task.</span>
        <span className="hidden pointer-fine:inline">
          Press <Kbd>N</Kbd> or click + to add a task.
        </span>
      </p>
    </motion.div>
  )
}
