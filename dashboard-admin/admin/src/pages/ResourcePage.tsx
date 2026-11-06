import { ResourceView } from '@/components/ResourceView'

export function ResourcePage({
  active,
  notify,
}: {
  active: string
  notify: (message: string) => void
}) {
  return <ResourceView resourceKey={active} title={active} notify={notify} />
}

export default ResourcePage

