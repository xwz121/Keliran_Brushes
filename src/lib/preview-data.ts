// Shape of a catalogue product as rendered by the site (CMS documents are mapped into it).
export type Product = {
  line?: string
  categorySlug?: string
  sections?: { key: string; heading?: string | null; text?: string | null }[]
  relatedGuides?: any[]
  relatedSolutions?: any[]
  source?: string
  id: string | number
  slug: string
  code: string
  title: string
  summary: string
  description: string
  materials: string[]
  category: string
  image?: string
  imageAlt?: string
  illustrative?: boolean
  images?: { url: string; alt: string; illustrative: boolean }[]
  seoTitle?: string
  seoDescription?: string
  specs: { label: string; value: string }[]
}
