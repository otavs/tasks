import { useEffect, useRef } from 'react'

type Options = {
  /** Set to false to temporarily ignore the shortcut. */
  enabled?: boolean
  /** Fire again while the key is held down. */
  repeat?: boolean
}

/**
 * Global single-key shortcut. Ignores key presses with modifiers and, except for Escape,
 * key presses while the user is typing in a field.
 */
export function useKeyPress(targetKey: string, callback: () => void, { enabled = true, repeat = false }: Options = {}) {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== targetKey.toLowerCase()) return
      if (event.ctrlKey || event.metaKey || event.altKey || (event.repeat && !repeat)) return

      const target = event.target as HTMLElement
      const isTyping =
        target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target.isContentEditable
      if (isTyping && event.key !== 'Escape') return

      event.preventDefault()
      callbackRef.current()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [targetKey, enabled, repeat])
}
