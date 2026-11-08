import { localizedPath, type Locale } from './locales'
export const contextKinds = [
  'materials',
  'applications',
  'solutions',
  'guides',
  'cases',
  'categories',
] as const
export type ContentContext = { kind: (typeof contextKinds)[number]; slug: string }
export function parseContentContext(value: unknown): ContentContext | undefined {
  if (typeof value !== 'string') return undefined
  const [kind, slug, extra] = value.split('/')
  if (extra) return undefined
  return contextKinds.includes(kind as ContentContext['kind']) &&
    typeof slug === 'string' &&
    slug.length <= 120 &&
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
    ? { kind: kind as ContentContext['kind'], slug }
    : undefined
}
export function contextRfqHref(locale: Locale, context?: ContentContext, line?: string) {
  const q = new URLSearchParams()
  if (line === 'brushes' || line === 'sealing') q.set('line', line)
  if (context) q.set('context', `${context.kind}/${context.slug}`)
  return `/${locale}/rfq${q.size ? `?${q}` : ''}`
}

export function localizedInquiryPath(
  path: string,
  locale: Locale,
  search: { get(name: string): string | null },
) {
  const localized = localizedPath(path, locale)
  if (!localized.endsWith('/rfq')) return localized
  const context = parseContentContext(search.get('context'))
  const url = contextRfqHref(locale, context, search.get('line') || undefined)
  const product = search.get('product')
  return product && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(product) && product.length <= 120
    ? `${url}${url.includes('?') ? '&' : '?'}product=${encodeURIComponent(product)}`
    : url
}
