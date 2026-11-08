import { writeFile } from 'node:fs/promises'
import { contentSlugs } from '../src/collections'
import { procurementRelations } from '../src/lib/procurement-relations'
import { sitemapRecords } from '../src/lib/sitemap-records'
const database = new URL(process.env.DATABASE_URL || 'http://invalid')
if (database.hostname !== '127.0.0.1' || database.pathname !== '/keliran_brushes')
  throw Error('Local review database required')
const { getCMS } = await import('../src/lib/payload')
const cms = await getCMS()
try {
  const results = await Promise.all(
    contentSlugs.map(async (collection) => ({
      collection,
      docs: (
        await cms.find({
          collection,
          locale: 'all',
          fallbackLocale: false,
          overrideAccess: false,
          where: { _status: { equals: 'published' } },
          limit: 250,
          depth: 0,
        })
      ).docs,
    })),
  )
  const ids = new Set(
    results.flatMap(({ collection, docs }) => docs.map((doc) => `${collection}/${doc.slug}`)),
  )
  const missing = Object.entries(procurementRelations).flatMap(([source, targets]) =>
    [source, ...targets.map((r) => `${r.kind}/${r.slug}`)].filter((id) => !ids.has(id)),
  )
  const rows = sitemapRecords('https://keliran.com', results)
  const report = {
    at: new Date().toISOString(),
    scope: 'isolated local published CMS records; not production database access',
    result: missing.length ? 'fail' : 'pass',
    configuredSources: Object.keys(procurementRelations).length,
    configuredLinks: Object.values(procurementRelations).reduce((n, r) => n + r.length, 0),
    missing: [...new Set(missing)],
    sitemapURLs: rows.length,
    localizedFamilyURLs: rows.filter((r) => r.url.includes('/products/')).length,
    uniqueURLs: new Set(rows.map((r) => r.url)).size,
  }
  await writeFile('reports/keliran-relations-check.json', JSON.stringify(report, null, 2) + '\n')
  console.log(JSON.stringify(report, null, 2))
  if (missing.length || rows.length !== new Set(rows.map((r) => r.url)).size) process.exitCode = 1
} finally {
  await cms.destroy()
}
// Payload's development hooks may retain timers after the read-only CLI has finished.
process.exit(process.exitCode ?? 0)
