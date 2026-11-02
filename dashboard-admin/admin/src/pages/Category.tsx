import { ResourceView } from '@/components/ResourceView'

export function Category({ notify }: { notify: (message: string) => void }) {
  return (
    <ResourceView
      resourceKey="Categories"
      title="Categories"
      addLabelText="Add category"
      notify={notify}
    />
  )
}

export default Category
