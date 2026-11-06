import { ResourceView } from '@/components/ResourceView'

export function Users({ notify }: { notify: (message: string) => void }) {
  return (
    <ResourceView
      resourceKey="Users"
      title="Users"
      addLabelText="Add user"
      notify={notify}
    />
  )
}

export default Users

