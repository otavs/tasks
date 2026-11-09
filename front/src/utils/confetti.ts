import type { CreateTypes } from 'canvas-confetti'

const rainbow = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3']

let instance: CreateTypes | null = null

export function registerConfetti(confetti: CreateTypes | null) {
  instance = confetti
}

const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min

/** A burst from the element that was clicked, plus the classic pair of fireworks. */
export function celebrate(from?: DOMRect) {
  if (!instance) return

  if (from) {
    instance({
      particleCount: 70,
      spread: 75,
      startVelocity: 32,
      ticks: 110,
      scalar: 0.9,
      colors: rainbow,
      origin: {
        x: (from.left + from.width / 2) / window.innerWidth,
        y: (from.top + from.height / 2) / window.innerHeight,
      },
    })
  }

  for (const [min, max] of [
    [0.1, 0.3],
    [0.7, 0.9],
  ]) {
    instance({
      particleCount: 110,
      spread: 360,
      startVelocity: 30,
      ticks: 60,
      origin: { x: randomInRange(min, max), y: Math.random() - 0.2 },
    })
  }
}

/** The whole day is done: a longer show. */
export function celebrateBig() {
  if (!instance) return
  const end = Date.now() + 1400

  const frame = () => {
    instance?.({ particleCount: 6, angle: 60, spread: 60, origin: { x: 0, y: 0.75 }, colors: rainbow })
    instance?.({ particleCount: 6, angle: 120, spread: 60, origin: { x: 1, y: 0.75 }, colors: rainbow })
    if (Date.now() < end) requestAnimationFrame(frame)
  }
  frame()
}
