import type { MetadataRoute } from 'next'
import { getCMS } from '@/lib/payload'
import { siteURL, noIndexSite } from '@/lib/env'
import { contentSlugs } from '@/collections'
import { sitemapRecords } from '@/lib/sitemap-records'
export const dynamic = 'force-dynamic'
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (noIndexSite) return []
  const cms = await getCMS()
  const results = await Promise.all(
    contentSlugs.map(async (collection) => {
      const docs: any[] = []
      let page = 1,
        hasNextPage = true
      while (hasNextPage) {
        const result = await cms.find({
          collection,
          where: { _status: { equals: 'published' } },
          locale: 'all',
          fallbackLocale: false,
          limit: 250,
          page,
          depth: 0,
          overrideAccess: false,
        })
        docs.push(...result.docs)
        hasNextPage = result.hasNextPage
        page++
      }
      return { collection, docs }
    }),
  )
  return sitemapRecords(siteURL, results)
}
