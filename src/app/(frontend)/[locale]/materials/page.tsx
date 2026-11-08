import { ResourcePage, resourceMetadata, type ResourceProps } from '@/components/ResourcePage'
export const generateMetadata = (props: ResourceProps) => resourceMetadata('materials', props)
export default function Page(props: ResourceProps) {
  return <ResourcePage {...props} route="materials" />
}
