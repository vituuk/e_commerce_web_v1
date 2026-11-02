import { ResourceView } from '@/components/ResourceView'

export function UserRoles({ notify }: { notify: (message: string) => void }) {
  return (
    <ResourceView
      resourceKey="User roles"
      title="User roles"
      addLabelText="Assign role"
      notify={notify}
    />
  )
}

export default UserRoles

