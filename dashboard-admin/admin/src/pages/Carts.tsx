import { ResourceView } from '@/components/ResourceView'

export function Carts({ notify }: { notify: (message: string) => void }) {
  return (
    <ResourceView
      resourceKey="Carts"
      title="Carts"
      addLabelText="Add cart"
      notify={notify}
    />
  )
}

export default Carts

