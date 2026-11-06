import { ResourceView } from '@/components/ResourceView'

export function Customer({ notify }: { notify: (message: string) => void }) {
  return (
    <ResourceView
      resourceKey="Customers"
      title="Customers"
      addLabelText="Add customer"
      notify={notify}
    />
  )
}

export default Customer
