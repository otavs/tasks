import type { CreateTypes } from 'canvas-confetti'

const rainbow = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3']

let instance: CreateTypes | null = null

export function registerConfetti(confetti: CreateTypes | null) {
  instance = confetti
}

const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min

/**
 * Task done! A big burst (with some stars) from the element that was clicked, and three waves of
 * fireworks around the screen.
 */
export function celebrate(from?: DOMRect) {
  if (!instance) return

  if (from) {
    const origin = {
      x: (from.left + from.width / 2) / window.innerWidth,
      y: (from.top + from.height / 2) / window.innerHeight,
    }
    instance({ particleCount: 150, spread: 110, startVelocity: 45, ticks: 140, scalar: 0.95, colors: rainbow, origin })
    instance({
      particleCount: 40,
      spread: 70,
      startVelocity: 38,
      ticks: 150,
      scalar: 1.3,
      shapes: ['star'],
      colors: ['#FFD700', '#FFA500', '#FFF3B0'],
      origin,
    })
  }

  // Three waves of fireworks: left and right, then one more in the middle.
  const waves = [
    [0.1, 0.3],
    [0.7, 0.9],
    [0.35, 0.65],
  ]
  waves.forEach(([min, max], i) => {
    setTimeout(() => {
      instance?.({
        particleCount: 160,
        spread: 360,
        startVelocity: 32,
        ticks: 75,
        origin: { x: randomInRange(min, max), y: randomInRange(-0.1, 0.35) },
      })
    }, i * 220)
  })
}

/**
 * Glass dust for a shattering card: tiny bright splinters that fly out fast every way from `at`
 * (viewport coordinates) and fade. Drawn here, in the canvas's worker, it costs the page nothing.
 */
export function glassDust(at: { x: number; y: number }) {
  instance?.({
    particleCount: 18,
    spread: 360,
    startVelocity: 42,
    decay: 0.87,
    gravity: 0.7,
    ticks: 55,
    scalar: 0.45,
    shapes: ['square'],
    colors: ['#FFFFFF', '#E0F2FE'],
    origin: { x: at.x / window.innerWidth, y: at.y / window.innerHeight },
  })
}

/** The whole day is done: a longer show from both sides. */
export function celebrateBig() {
  if (!instance) return
  const end = Date.now() + 1800

  const frame = () => {
    instance?.({
      particleCount: 9,
      angle: 60,
      spread: 65,
      startVelocity: 55,
      origin: { x: 0, y: 0.75 },
      colors: rainbow,
    })
    instance?.({
      particleCount: 9,
      angle: 120,
      spread: 65,
      startVelocity: 55,
      origin: { x: 1, y: 0.75 },
      colors: rainbow,
    })
    if (Date.now() < end) requestAnimationFrame(frame)
  }
  frame()
}
