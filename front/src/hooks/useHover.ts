import { useState, useEffect, useRef } from 'react'

export function useHover<T extends HTMLElement>() {
  const [hovered, setHovered] = useState(false)
  const ref = useRef<T | null>(null)

  useEffect(() => {
    let animationFrame: number

    const checkMousePosition = (event: MouseEvent) => {
      if (!ref.current) return

      animationFrame = requestAnimationFrame(() => {
        const rect = ref.current!.getBoundingClientRect()
        const inside =
          event.clientX >= rect.left &&
          event.clientX <= rect.right &&
          event.clientY >= rect.top &&
          event.clientY <= rect.bottom

        setHovered(inside)
      })
    }

    document.addEventListener('mousemove', checkMousePosition)
    return () => {
      document.removeEventListener('mousemove', checkMousePosition)
      cancelAnimationFrame(animationFrame)
    }
  }, [])

  return { ref, hovered }
}
