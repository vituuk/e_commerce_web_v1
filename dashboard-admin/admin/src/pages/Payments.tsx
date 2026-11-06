import { ResourceView } from '@/components/ResourceView'

export function Payments({ notify }: { notify: (message: string) => void }) {
  return (
    <ResourceView
      resourceKey="Payments"
      title="Payments"
      addLabelText="Record payment"
      notify={notify}
    />
  )
}

export default Payments
