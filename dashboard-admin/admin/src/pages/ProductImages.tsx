import { ResourceView } from '@/components/ResourceView'

export function ProductImages({ notify }: { notify: (message: string) => void }) {
  return (
    <ResourceView
      resourceKey="Product images"
      title="Product images"
      addLabelText="Add product image"
      notify={notify}
    />
  )
}

export default ProductImages

