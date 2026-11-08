import type { MetadataRoute } from 'next'
import { locales } from './locales'
import { routeFor } from './routes'
import { legacyContent } from './legacy-content'
import { categoryRoute } from './site'
import { sharedCanonicalPaths } from './shared-canonical'

// locale: 'all', fallbackLocale: false: only real localized titles are advertised.
export function sitemapRecords(
  origin: string,
  results: { collection: string; docs: any[] }[],
): MetadataRoute.Sitemap {
  const rows = new Map<string, MetadataRoute.Sitemap[number]>()
  const add = (row: MetadataRoute.Sitemap[number]) => rows.set(row.url, row)
  for (const { collection, docs } of results) {
    const listed = new Set<string>()
    for (const doc of docs) {
      if (
        doc._status !== 'published' ||
        legacyContent.some(([kind, slug]) => kind === collection && slug === doc.slug) ||
        sharedCanonicalPaths.has(routeFor(collection, doc, 'en').slice('/en'.length))
      )
        continue
      const available = locales.filter((l) => typeof doc.title?.[l] === 'string' && doc.title[l].trim())
      const languages = Object.fromEntries(
        available.map((l) => [l, `${origin}${routeFor(collection, doc, l)}`]),
      )
      if (available.includes('en')) languages['x-default'] = `${origin}${routeFor(collection, doc, 'en')}`
      for (const locale of available) {
        listed.add(locale)
        add({
          url: `${origin}${routeFor(collection, doc, locale)}`,
          ...(doc.updatedAt && Number.isFinite(Date.parse(doc.updatedAt))
            ? { lastModified: doc.updatedAt }
            : {}),
          alternates: { languages },
        })
      }
    }
    if (collection !== 'pages' && collection !== 'categories') {
      const path = collection === 'faqs' ? 'faq' : collection
      const languages = Object.fromEntries([...listed].map((l) => [l, `${origin}/${l}/${path}`]))
      if (listed.has('en')) languages['x-default'] = `${origin}/en/${path}`
      for (const locale of listed) add({ url: `${origin}/${locale}/${path}`, alternates: { languages } })
    }
  }
  for (const path of [categoryRoute, 'rfq']) {
    const languages = Object.fromEntries([
      ...locales.map((l) => [l, `${origin}/${l}/${path}`]),
      ['x-default', `${origin}/en/${path}`],
    ])
    for (const locale of locales) add({ url: `${origin}/${locale}/${path}`, alternates: { languages } })
  }
  return [...rows.values()]
}
