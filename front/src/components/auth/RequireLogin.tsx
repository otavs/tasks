import { useQuery } from '@tanstack/react-query'
import { ReactNode } from 'react'

import { UnauthorizedError } from '@/api/api'
import { fetchMe, meKey } from '@/api/auth'
import { isDemo } from '@/utils/route'

/**
 * Shows the app once logged in (the demo needs no login). When logged out, the query cache sends you to the login
 * page (see main.tsx). If the server can't be reached, the app shows anyway, with its own error states.
 */
export function RequireLogin({ children }: { children: ReactNode }) {
  const { isSuccess, error } = useQuery({ queryKey: meKey, queryFn: fetchMe, enabled: !isDemo, staleTime: Infinity })

  if (isDemo || isSuccess || (error && !(error instanceof UnauthorizedError))) return children
  return null
}
