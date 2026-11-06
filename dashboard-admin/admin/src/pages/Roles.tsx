import { ResourceView } from '@/components/ResourceView'

export function Roles({ notify }: { notify: (message: string) => void }) {
  return (
    <ResourceView
      resourceKey="Roles"
      title="Roles"
      addLabelText="Add role"
      notify={notify}
    />
  )
}

export default Roles

