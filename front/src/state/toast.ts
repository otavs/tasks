import { atom, getDefaultStore } from 'jotai'

export type Toast = {
  id: number
  message: string
  tone: 'info' | 'success' | 'error'
  action?: { label: string; run: () => void }
  duration: number
}

export const toastsAtom = atom<Toast[]>([])

let nextId = 1

export function toast(message: string, options: Partial<Omit<Toast, 'id' | 'message'>> = {}) {
  const store = getDefaultStore()
  const item: Toast = { id: nextId++, message, tone: 'info', duration: 3000, ...options }

  // Keep at most 3 on screen; the newest wins.
  store.set(toastsAtom, prev => [...prev.slice(-2), item])
  setTimeout(() => dismissToast(item.id), item.duration)

  return item.id
}

export function dismissToast(id: number) {
  getDefaultStore().set(toastsAtom, prev => prev.filter(t => t.id !== id))
}
