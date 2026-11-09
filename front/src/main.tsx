import { MutationCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createRoot } from 'react-dom/client'

import App from './App'
import './index.css'
import { toast } from './state/toast'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 5_000 },
  },
  mutationCache: new MutationCache({
    onError: () => toast("Couldn't save that change. It was undone.", { tone: 'error', duration: 4000 }),
  }),
})

createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
)
