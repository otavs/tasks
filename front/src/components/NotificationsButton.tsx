import { motion } from 'framer-motion'
import { useAtomValue } from 'jotai'
import { Bell, BellOff } from 'lucide-react'

import { notificationsEnabledAtom, notificationsSupported, toggleNotifications } from '@/state/notifications'
import { cn } from '@/utils/cn'

export function NotificationsButton() {
  const enabled = useAtomValue(notificationsEnabledAtom)
  if (!notificationsSupported) return null

  const label = enabled ? 'Turn notifications off' : 'Notify me when a task is due'

  return (
    <motion.button
      type="button"
      aria-label={label}
      aria-pressed={enabled}
      title={label}
      onClick={toggleNotifications}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 500, damping: 22 }}
      className={cn(
        'group grid size-11 cursor-pointer place-items-center rounded-full border-2 border-transparent shadow-card transition-colors hover:border-primary-ring',
        enabled ? 'bg-primary text-primary-ink' : 'bg-card text-ink-soft hover:text-ink'
      )}
    >
      {enabled ? (
        <Bell className="animate-bell-hover size-5 origin-top" strokeWidth={2.5} />
      ) : (
        <BellOff className="size-5" strokeWidth={2.5} />
      )}
    </motion.button>
  )
}
