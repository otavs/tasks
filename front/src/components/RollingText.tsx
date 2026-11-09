import { AnimatePresence, Variants, motion } from 'framer-motion'

/** Renders text where every digit rolls like an odometer when it changes. */
export function RollingText({
  text,
  direction = 1,
  separatorClassName,
}: {
  text: string
  direction?: 1 | -1
  separatorClassName?: string
}) {
  return (
    <span className="inline-flex items-baseline">
      {text.split('').map((char, i) =>
        /\d/.test(char) ? (
          <Digit key={i} value={char} direction={direction} />
        ) : (
          <span key={i} className={separatorClassName}>
            {char === ' ' ? ' ' : char}
          </span>
        )
      )}
    </span>
  )
}

const variants: Variants = {
  enter: (direction: number) => ({ y: direction > 0 ? '65%' : '-65%', opacity: 0 }),
  center: { y: '0%', opacity: 1 },
  exit: (direction: number) => ({ y: direction > 0 ? '-65%' : '65%', opacity: 0 }),
}

function Digit({ value, direction }: { value: string; direction: number }) {
  return (
    <span className="relative inline-block w-[0.6em] overflow-hidden text-center">
      <span className="invisible">0</span>
      <AnimatePresence initial={false} custom={direction}>
        <motion.span
          key={value}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: 'spring', stiffness: 420, damping: 34 }}
          className="absolute inset-0"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}
