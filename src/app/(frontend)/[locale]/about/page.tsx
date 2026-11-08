import { ResourcePage, resourceMetadata, type ResourceProps } from '@/components/ResourcePage'
export const generateMetadata = (props: ResourceProps) => resourceMetadata('about', props)
export default function Page(props: ResourceProps) {
  return <ResourcePage {...props} route="about" />
}
