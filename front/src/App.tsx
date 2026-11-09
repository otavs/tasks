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

      <main className="mx-auto w-full max-w-5xl px-3 pb-28 sm:px-6">
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
        <div className="mt-8 flex justify-center">
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
