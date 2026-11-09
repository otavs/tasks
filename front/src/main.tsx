import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createRoot } from 'react-dom/client'

import App from './App'
import { UnauthorizedError } from './api/api'
import { LoginPage } from './components/auth/LoginPage'
import { RequireLogin } from './components/auth/RequireLogin'
import './index.css'
import { toast } from './state/toast'
import { goToLogin, isLoginPage } from './utils/route'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5_000,
      // Logged out isn't going to fix itself by retrying.
      retry: (failureCount, error) => !(error instanceof UnauthorizedError) && failureCount < 3,
    },
  },
  // Logged out (or the session expired): back to the login page.
  queryCache: new QueryCache({
    onError: error => {
      if (error instanceof UnauthorizedError) goToLogin()
    },
  }),
  mutationCache: new MutationCache({
    onError: error => {
      if (error instanceof UnauthorizedError) goToLogin()
      else toast("Couldn't save that change. It was undone.", { tone: 'error', duration: 4000 })
    },
  }),
})

createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    {isLoginPage ? (
      <LoginPage />
    ) : (
      <RequireLogin>
        <App />
      </RequireLogin>
    )}
  </QueryClientProvider>
)
