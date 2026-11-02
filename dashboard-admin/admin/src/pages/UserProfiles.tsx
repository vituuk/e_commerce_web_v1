import { ResourceView } from '@/components/ResourceView'

export function UserProfiles({ notify }: { notify: (message: string) => void }) {
  return (
    <ResourceView
      resourceKey="User profiles"
      title="User profiles"
      addLabelText="Add user profile"
      notify={notify}
    />
  )
}

export default UserProfiles

