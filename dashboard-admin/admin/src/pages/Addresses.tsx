import { ResourceView } from '@/components/ResourceView'

export function Addresses({ notify }: { notify: (message: string) => void }) {
  return (
    <ResourceView
      resourceKey="Addresses"
      title="Addresses"
      addLabelText="Add address"
      notify={notify}
    />
  )
}

export default Addresses
