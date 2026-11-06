import { DashboardPage } from './Dashboard'

export function HomePage({ notify }: { notify: (message: string) => void }) {
  return <DashboardPage notify={notify} />
}

export default HomePage
