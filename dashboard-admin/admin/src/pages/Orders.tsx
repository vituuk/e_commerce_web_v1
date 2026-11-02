import { ResourceView } from '@/components/ResourceView'

export function Orders({ notify }: { notify: (message: string) => void }) {
  return (
    <ResourceView
      resourceKey="Orders"
      title="Orders"
      addLabelText="Create order"
      notify={notify}
    />
  )
}

export default Orders
