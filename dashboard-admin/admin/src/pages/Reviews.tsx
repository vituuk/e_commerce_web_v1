import { ResourceView } from '@/components/ResourceView'

export function Reviews({ notify }: { notify: (message: string) => void }) {
  return (
    <ResourceView
      resourceKey="Reviews"
      title="Reviews"
      addLabelText="Add review"
      notify={notify}
    />
  )
}

export default Reviews
