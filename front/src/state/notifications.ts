import { atom, getDefaultStore } from 'jotai'

import { toast } from './toast'
import { TaskModel } from '@/typings/types'
import { formatTime } from '@/utils/time'

const STORAGE_KEY = 'tasks:notifications'
const icon = `${import.meta.env.BASE_URL}icons8-rubber-duck-256.png`

export const notificationsSupported = typeof window !== 'undefined' && 'Notification' in window
export const notificationsAllowedHere = notificationsSupported && window.isSecureContext

function readPreference() {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'on'
  } catch {
    return false
  }
}

function writePreference(on: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off')
  } catch {
    // Private mode etc.: it just won't be remembered.
  }
}

/** The user wants system notifications (and the browser allows them). */
export const notificationsEnabledAtom = atom(
  notificationsAllowedHere && readPreference() && Notification.permission === 'granted'
)

async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return
  try {
    await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`)
  } catch {
    // Desktop browsers can still use `new Notification`.
  }
}

if (getDefaultStore().get(notificationsEnabledAtom)) registerServiceWorker()

export async function toggleNotifications() {
  const store = getDefaultStore()

  if (store.get(notificationsEnabledAtom)) {
    store.set(notificationsEnabledAtom, false)
    writePreference(false)
    toast('Notifications off 🔕')
    return
  }

  if (!notificationsAllowedHere) {
    toast(notificationsSupported ? 'Notifications need a secure (https) connection' : "This browser can't notify", {
      tone: 'error',
    })
    return
  }

  const permission =
    Notification.permission === 'default' ? await Notification.requestPermission() : Notification.permission
  if (permission !== 'granted') {
    toast('Notifications are blocked in your browser settings', { tone: 'error', duration: 4500 })
    return
  }

  await registerServiceWorker()
  store.set(notificationsEnabledAtom, true)
  writePreference(true)
  toast("Notifications on 🔔 I'll ping you when a task's time comes", { tone: 'success', duration: 4000 })
}

/**
 * A task's time has come. If you're looking at the app, a toast is enough;
 * otherwise (another tab or window) it's a system notification, when enabled.
 */
export async function notifyTask(task: TaskModel) {
  const message = `${formatTime(task.time)} · ${task.title}`

  if (document.visibilityState === 'visible' && document.hasFocus()) {
    toast(`⏰ ${message}`, { duration: 6000 })
    return
  }

  if (!getDefaultStore().get(notificationsEnabledAtom) || Notification.permission !== 'granted') return

  const options: NotificationOptions = { body: `It's ${formatTime(task.time)} ⏰`, icon, tag: `task-${task.id}` }

  try {
    const registration = await navigator.serviceWorker?.getRegistration()
    if (registration) {
      await registration.showNotification(task.title, options)
      return
    }
  } catch {
    // Fall back to the page-level API below.
  }

  const notification = new Notification(task.title, options)
  notification.onclick = () => {
    window.focus()
    notification.close()
  }
}
