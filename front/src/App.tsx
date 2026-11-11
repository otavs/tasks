import { MotionConfig } from 'framer-motion'

import { Background } from '@/components/Background'
import { Confetti } from '@/components/Confetti'
import { Header } from '@/components/Header'
import { LogoutButton } from '@/components/LogoutButton'
import { NotificationsButton } from '@/components/NotificationsButton'
import { ShortcutsHint } from '@/components/ShortcutsHint'
import { TaskCreate } from '@/components/TaskCreate'
import { TaskEdit } from '@/components/TaskEdit'
import { TaskList } from '@/components/TaskList'
import { Toaster } from '@/components/Toaster'
import { RecurrencesButton } from '@/components/recurrences/RecurrencesButton'
import { RecurrencesModal } from '@/components/recurrences/RecurrencesModal'
import { useDayRollover } from '@/hooks/useDayRollover'
import { useNowTicker } from '@/hooks/useNowTicker'
import { useTaskNotifications } from '@/hooks/useTaskNotifications'

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <TimeKeeper />
      <Background />

      {/* At least a screen tall, so Exit sits at the very bottom even with only a few tasks. */}
      <main className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-3 sm:px-6">
        <Header />
        <TaskList />
        {/* The + stays centred; secondary actions sit on its sides. */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 pt-2">
          <div className="justify-self-end">
            <NotificationsButton />
          </div>
          <TaskCreate />
          <div className="justify-self-start">
            <RecurrencesButton />
          </div>
        </div>
        <ShortcutsHint />
        <div className="mt-auto flex justify-center pt-12 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <LogoutButton />
        </div>
      </main>

      <TaskEdit />
      <RecurrencesModal />
      <Toaster />
      <Confetti />
    </MotionConfig>
  )
}

/** Keeps "now" ticking, follows midnight and sends due-task pings, without re-rendering the whole app. */
function TimeKeeper() {
  useNowTicker()
  useDayRollover()
  useTaskNotifications()
  return null
}
