import { useEffect } from 'react'

export function useKeyPress(targetKey: string, callback: () => void) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement

      if (
        (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target.isContentEditable) &&
        !['Escape'].includes(event.key)
      ) {
        return
      }

      if (event.key === targetKey) {
        event.preventDefault()
        callback()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [targetKey, callback])
}
