import { ResourceView } from '@/components/ResourceView'

export function ProductVariants({ notify }: { notify: (message: string) => void }) {
  return (
    <ResourceView
      resourceKey="Product variants"
      title="Product variants"
      addLabelText="Add product variant"
      notify={notify}
    />
  )
}

export default ProductVariants

