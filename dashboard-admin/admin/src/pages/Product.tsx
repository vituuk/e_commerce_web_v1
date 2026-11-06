import { ResourceView } from '@/components/ResourceView'

export function Product({ notify }: { notify: (message: string) => void }) {
  return (
    <ResourceView
      resourceKey="Products"
      title="Products"
      addLabelText="Add product"
      notify={notify}
    />
  )
}

export default Product
