import { motion } from 'framer-motion'
import { FormEvent, useEffect, useRef, useState } from 'react'

import { Background } from '../Background'
import { Toaster } from '../Toaster'
import { fetchMe, login } from '@/api/auth'
import { toast } from '@/state/toast'
import { goToApp } from '@/utils/route'

const fieldClass =
  'block w-full rounded-2xl border border-field-border bg-field px-4 py-3 text-base font-semibold text-ink shadow-inner shadow-slate-900/5 transition outline-none placeholder:font-medium placeholder:text-ink-faint focus:border-primary-ring focus:ring-4 focus:ring-primary-ring/15'

export function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isPending, setIsPending] = useState(false)
  const passwordRef = useRef<HTMLInputElement>(null)

  // Already logged in: straight to the app.
  useEffect(() => {
    fetchMe().then(goToApp, () => {})
  }, [])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setIsPending(true)

    try {
      await login(username, password)
      goToApp()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Something went wrong', { tone: 'error', duration: 4000 })
      setPassword('')
      setIsPending(false)
      passwordRef.current?.focus()
    }
  }

  return (
    <>
      <Background />

      <main className="grid min-h-dvh place-items-center px-4 py-10">
        <div className="flex w-full max-w-xs flex-col items-center gap-5">
          <form
            onSubmit={submit}
            className="flex w-full flex-col gap-3 rounded-3xl border border-sheet-border bg-sheet p-5 shadow-lift sm:p-6"
          >
            <input
              aria-label="Username"
              placeholder="Username"
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              autoFocus
              required
              value={username}
              onChange={e => setUsername(e.target.value)}
              className={fieldClass}
            />
            <input
              ref={passwordRef}
              type="password"
              aria-label="Password"
              placeholder="Password"
              autoComplete="current-password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className={fieldClass}
            />

            <motion.button
              type="submit"
              disabled={isPending}
              whileTap={{ scale: 0.96 }}
              className="mt-1 cursor-pointer self-center rounded-full border-2 border-transparent bg-primary-strong px-7 py-1.5 font-bold text-primary-strong-ink shadow-md shadow-blue-600/25 transition-[border-color,opacity] hover:border-blue-900 disabled:cursor-wait disabled:opacity-60 dark:hover:border-white/60"
            >
              Enter
            </motion.button>
          </form>
        </div>
      </main>

      <Toaster />
    </>
  )
}
