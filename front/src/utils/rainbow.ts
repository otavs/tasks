import type { CSSProperties } from 'react'

// The same rainbow, nudged per theme so every colour stays visible on the cards.
const lightColors = ['#FF0000', '#FF7F00', '#F2C200', '#00C800', '#0000FF', '#4B0082', '#9400D3']
const darkColors = ['#FF4D4D', '#FF9933', '#FFE033', '#33E633', '#5C7CFF', '#A35CFF', '#D65CFF']

/** The rainbow in a random order, closed into a loop (first colour repeated at the end) for colour cycling. */
export function rainbowCycle() {
  const isDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
  const shuffled = [...(isDark ? darkColors : lightColors)]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  shuffled.push(shuffled[0])
  return shuffled
}

/** A random rainbow cycle as the CSS variables the `rainbow-fill` / `rainbow-stroke` animations read (index.css). */
export function rainbowStyle(duration: number) {
  const style: Record<string, string> = { '--rainbow-duration': `${duration}s` }
  rainbowCycle()
    .slice(0, -1)
    .forEach((color, i) => (style[`--c${i}`] = color))
  return style as CSSProperties
}
