import type { Locale } from './locales'
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
        ? `/${doc.line === 'brushes' ? 'strip-brushes' : 'sealing'}/${doc.slug}`
        : `/${collection === 'faqs' ? 'faq' : collection}/${doc.slug}`
  return `/${locale}${path}`
}

export function materialSlug(material: string) {
  const map: Record<string, string> = {
    EPDM: 'epdm',
    NBR: 'nbr',
    FKM: 'fkm',
    Silicone: 'silicone',
    VMQ: 'silicone',
    CR: 'cr',
    'EPDM sponge': 'foam',
    'Silicone foam': 'foam',
    'PU foam': 'foam',
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
