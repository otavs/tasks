import { useEffect, useState } from 'react'

/** The part of the screen the on-screen keyboard leaves visible. */
export type VisibleArea = { top: number; height: number }

/** Shorter than the full height by at least this much: that's a keyboard, not a toolbar coming and going. */
const KEYBOARD_MIN_HEIGHT = 150

const isTouchScreen = () => window.matchMedia?.('(pointer: coarse)').matches ?? false

/**
 * While the on-screen keyboard is open (phones and tablets), the area still visible above it; null otherwise.
 * The keyboard only shrinks the visual viewport, so fixed elements would otherwise keep sitting under it.
 */
export function useKeyboardViewport(enabled = true): VisibleArea | null {
  const [area, setArea] = useState<VisibleArea | null>(null)

  useEffect(() => {
    const viewport = window.visualViewport
    if (!enabled || !viewport || !isTouchScreen()) return

    // The tallest the viewport has been at this width: the screen without a keyboard.
    let fullHeight = 0
    let width = 0

    const update = () => {
      // Zoomed in, the viewport is smaller too, but that's not a keyboard.
      const height = viewport.height * viewport.scale
      if (viewport.width * viewport.scale !== width) {
        width = viewport.width * viewport.scale // rotated: start over
        fullHeight = Math.max(height, window.innerHeight)
      }
      fullHeight = Math.max(fullHeight, height)

      const isKeyboardOpen = fullHeight - height >= KEYBOARD_MIN_HEIGHT && viewport.scale < 1.05
      setArea(current => {
        if (!isKeyboardOpen) return null
        const next = { top: viewport.offsetTop, height: viewport.height }
        return current && current.top === next.top && current.height === next.height ? current : next
      })
    }

    update()
    viewport.addEventListener('resize', update)
    viewport.addEventListener('scroll', update)
    return () => {
      viewport.removeEventListener('resize', update)
      viewport.removeEventListener('scroll', update)
      setArea(null)
    }
  }, [enabled])

  return area
}
