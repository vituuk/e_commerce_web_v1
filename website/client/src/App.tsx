import '@/assets/fonts'
import '@/styles'
import './App.css'
import {
  I18nProvider,
  QueryClient,
  QueryClientProvider,
  StorefrontProvider,
} from '@/context'
import Storefront from '@/layouts'

export { getProductSlug, getPathSlug } from '@/utils/slug'

const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <StorefrontProvider>
          <Storefront />
        </StorefrontProvider>
      </I18nProvider>
    </QueryClientProvider>
  )
}
