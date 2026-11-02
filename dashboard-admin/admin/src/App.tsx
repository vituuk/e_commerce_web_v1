import '@/assets/fonts'
import './app/globals.css'
import './App.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Dashboard from '@/layouts'

const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Dashboard />
    </QueryClientProvider>
  )
}
