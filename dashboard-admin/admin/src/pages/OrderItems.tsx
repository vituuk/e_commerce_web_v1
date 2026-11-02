import { ResourceView } from '@/components/ResourceView'

export function OrderItems({ notify }: { notify: (message: string) => void }) {
  return (
    <ResourceView
      resourceKey="Order items"
      title="Order items"
      addLabelText="Add order item"
      notify={notify}
    />
  )
}

export default OrderItems

