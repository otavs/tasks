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

export default function App() {
  useDayRollover()

  return (
    <MotionConfig reducedMotion="user">
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
