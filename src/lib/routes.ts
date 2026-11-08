import type { Locale } from './locales'
import { categoryRoute } from './site'
export function routeFor(
  collection: string,
  doc: { slug: string; line?: string | null },
  locale: Locale = 'en',
) {
  const path =
    collection === 'pages'
      ? doc.slug === 'home'
        ? ''
        : `/${doc.slug}`
      : collection === 'categories'
        ? `/${categoryRoute}/${doc.slug}`
        : `/${collection === 'faqs' ? 'faq' : collection}/${doc.slug}`
  return `/${locale}${path}`
}

export function materialSlug(material: string) {
  const map: Record<string, string> = {
    PA6: 'pa6',
    PA66: 'pa66',
    PA612: 'pa612',
    PBT: 'pbt',
    PP: 'pp',
    PEEK: 'peek',
    SS304: 'ss304',
    SS316: 'ss316',
  }
  return map[material]
}
