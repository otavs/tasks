import { MotionConfig } from 'framer-motion'

import { Background } from '@/components/Background'
import { Confetti } from '@/components/Confetti'
import { Header } from '@/components/Header'
import { ShortcutsHint } from '@/components/ShortcutsHint'
import { TaskCreate } from '@/components/TaskCreate'
import { TaskEdit } from '@/components/TaskEdit'
import { TaskList } from '@/components/TaskList'
import { Toaster } from '@/components/Toaster'
import { useDayRollover } from '@/hooks/useDayRollover'
import { useNowTicker } from '@/hooks/useNowTicker'

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <TimeKeeper />
      <Background />

      <main className="mx-auto w-full max-w-5xl px-3 pb-28 sm:px-6">
        <Header />
        <TaskList />
        <TaskCreate />
        <ShortcutsHint />
      </main>

      <TaskEdit />
      <Toaster />
      <Confetti />
    </MotionConfig>
  )
}

/** Keeps "now" ticking and follows midnight, without re-rendering the whole app. */
function TimeKeeper() {
  useNowTicker()
  useDayRollover()
  return null
}
