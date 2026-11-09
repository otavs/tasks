import { LogOut } from 'lucide-react'
import { useState } from 'react'

import { logout } from '@/api/auth'
import { toast } from '@/state/toast'
import { goToLogin, isDemo } from '@/utils/route'

export function LogoutButton() {
  const [isPending, setIsPending] = useState(false)

  const leave = async () => {
    // The demo has no session: leaving is just going back to the login page.
    if (isDemo) return goToLogin()

    setIsPending(true)
    try {
      await logout()
      goToLogin()
    } catch {
      toast("Couldn't log out. Try again.", { tone: 'error', duration: 4000 })
      setIsPending(false)
    }
  }

  return (
    <button
      type="button"
      onClick={leave}
      disabled={isPending}
      className="flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold text-ink-faint transition-colors hover:bg-ink/5 hover:text-ink disabled:cursor-wait disabled:opacity-60"
    >
      <LogOut className="size-4" strokeWidth={2.5} />
      Exit
    </button>
  )
}
