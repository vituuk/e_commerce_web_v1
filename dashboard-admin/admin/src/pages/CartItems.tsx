import { ResourceView } from '@/components/ResourceView'

export function CartItems({ notify }: { notify: (message: string) => void }) {
  return (
    <ResourceView
      resourceKey="Cart items"
      title="Cart items"
      addLabelText="Add cart item"
      notify={notify}
    />
  )
}

export default CartItems

