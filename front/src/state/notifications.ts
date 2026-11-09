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
    // Wait (briefly) for it to be active, so a notification shown right away can use it.
    await Promise.race([navigator.serviceWorker.ready, new Promise(resolve => setTimeout(resolve, 3000))])
  } catch {
    // Desktop browsers can still use `new Notification`.
  }
}

/**
 * Shows a system notification: through the service worker when there is one (Android Chrome requires
 * it), otherwise with the page-level API.
 */
async function showSystemNotification(title: string, options: NotificationOptions) {
  try {
    const registration = await navigator.serviceWorker?.getRegistration()
    if (registration?.active) {
      await registration.showNotification(title, options)
      return
    }
  } catch {
    // Fall back to the page-level API below.
  }

  try {
    const notification = new Notification(title, options)
    notification.onclick = () => {
      window.focus()
      notification.close()
    }
  } catch {
    // Browsers that only allow service worker notifications, and there's none: nothing we can do.
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

  // A sample right away: if it doesn't show up, the system (not the app) is holding notifications back.
  showSystemNotification('Notifications on 🔔', {
    body: "This is how you'll be pinged when a task's time comes.",
    icon,
    tag: 'notifications-test',
  })
  toast("Notifications on 🔔 Sent you a test one. Didn't see it? Check your system's notification settings", {
    tone: 'success',
    duration: 6000,
  })
}

/**
 * A task's time has come: a system notification when enabled (even if you're looking at the app,
 * so it's never missed), plus a toast when the app is on screen.
 */
export function notifyTask(task: TaskModel) {
  if (document.visibilityState === 'visible') {
    toast(`⏰ ${formatTime(task.time)} · ${task.title}`, { duration: 6000 })
  }

  if (!getDefaultStore().get(notificationsEnabledAtom) || Notification.permission !== 'granted') return

  showSystemNotification(task.title, { body: `It's ${formatTime(task.time)} ⏰`, icon, tag: `task-${task.id}` })
}
