import { useEffect, useRef } from 'react'

/*
 * The phone's back button (or gesture) closes whatever is open on top (a modal, a popover...) instead of
 * leaving the page. Each open layer gets a history entry of its own; going back pops it and closes the
 * topmost layer. A layer closed some other way (its button, Esc) takes its entry back out of the history.
 */

type Layer = { close: () => void }

/** The open layers, bottom to top. */
const layers: Layer[] = []
/** History entries we pushed that are still there. */
let entries = 0
/** We went back ourselves, and the popstate for it hasn't arrived yet. */
let goingBack = false
let syncScheduled = false

/** Brings the history in line with the open layers, once per tick (layers often open and close together). */
function scheduleSync() {
  if (syncScheduled) return
  syncScheduled = true
  queueMicrotask(() => {
    syncScheduled = false
    if (goingBack) return // runs again once that lands

    if (layers.length > entries) {
      for (; entries < layers.length; entries++) history.pushState({ layer: true }, '')
    } else if (layers.length < entries) {
      goingBack = true
      history.go(layers.length - entries)
      entries = layers.length
    }
  })
}

if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => {
    if (goingBack) {
      goingBack = false
      scheduleSync()
      return
    }
    if (entries === 0) return // a regular back, not one of ours

    entries--
    layers.at(-1)?.close()
    scheduleSync() // in case it didn't close
  })
}

/** While `isOpen`, the back button calls `onClose` (the most recently opened layer goes first). */
export function useCloseOnBack(isOpen: boolean, onClose: () => void) {
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!isOpen) return
    const layer: Layer = { close: () => onCloseRef.current() }
    layers.push(layer)
    scheduleSync()
    return () => {
      layers.splice(layers.indexOf(layer), 1)
      scheduleSync()
    }
  }, [isOpen])
}
