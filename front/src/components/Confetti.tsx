import { useEffect } from 'react'
import ReactCanvasConfetti from 'react-canvas-confetti'

import { registerConfetti } from '@/utils/confetti'

/** One shared, full-screen confetti canvas. Fire it with `celebrate()` from anywhere. */
export function Confetti() {
  useEffect(() => () => registerConfetti(null), [])

  return (
    <ReactCanvasConfetti
      onInit={({ confetti }) => registerConfetti(confetti)}
      globalOptions={{ resize: true, useWorker: true, disableForReducedMotion: true }}
      style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 60 }}
    />
  )
}
