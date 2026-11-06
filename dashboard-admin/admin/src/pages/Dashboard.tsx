import { Overview, PopularProducts } from './Overview'

export function DashboardPage({
  notify,
  onSelect,
}: {
  notify: (message: string) => void
  onSelect?: (resource: string) => void
}) {
  return (
    <div className="dashboard-page-scroll">
      <Overview notify={notify} onSelect={onSelect} />
      <PopularProducts notify={notify} onSelect={onSelect} />
    </div>
  )
}

export default DashboardPage


