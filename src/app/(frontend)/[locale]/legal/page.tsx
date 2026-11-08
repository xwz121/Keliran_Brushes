import { ResourcePage, resourceMetadata, type ResourceProps } from '@/components/ResourcePage'
export const generateMetadata = (props: ResourceProps) => resourceMetadata('legal', props)
export default function Page(props: ResourceProps) {
  return <ResourcePage {...props} route="legal" />
}
