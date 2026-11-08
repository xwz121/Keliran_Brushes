import 'dotenv/config'
import { writeFile, mkdir } from 'node:fs/promises'
import { getPayload } from 'payload'
import { contentSlugs } from '../src/collections'
import { locales } from '../src/lib/locales'
import { englishTexts } from '../src/lib/content-checks'
const url = new URL(process.env.DATABASE_URL!)
if (!['127.0.0.1', 'localhost'].includes(url.hostname) || url.pathname !== '/keliran_brushes')
  throw Error('This audit only reads the isolated local review database.')
// Disable development schema push: an audit must not change the database.
Object.assign(process.env, { NODE_ENV: 'production' })
const config = (await import('../src/payload.config')).default
const cms = await getPayload({ config })
try {
  const documents: any[] = []
  const mediaReferences = new Set<number>()
  const coverage = Object.fromEntries(locales.map((l) => [l, { complete: 0, incomplete: 0 }]))
  for (const collection of contentSlugs) {
    const result = await cms.find({
      collection,
      locale: 'all',
      fallbackLocale: false,
      draft: true,
      depth: 0,
      pagination: false,
    })
    for (const doc of result.docs as any[]) {
      for (const id of [doc.heroImage, doc.image, ...(doc.images || [])])
        if (typeof id === 'number') mediaReferences.add(id)
      const missing: Record<string, string[]> = {}
      const source = englishTexts(doc)
      for (const locale of locales) {
        const absent = Object.entries(source)
          .filter(([key, value]) => {
            if (!value.trim()) return false
            const path = key.split('.')
            let field: any = doc
            for (const segment of path) field = field?.[segment]
            return !field?.[locale]?.trim()
          })
          .map(([key]) => key)
        if (absent.length) {
          missing[locale] = absent
          coverage[locale].incomplete++
        } else coverage[locale].complete++
      }
      documents.push({
        collection,
        id: doc.id,
        slug: doc.slug,
        status: doc._status,
        factsConfirmed: doc.factsConfirmed,
        sourceIncomplete: ['title', 'summary', 'description'].filter((key) => !source[key]?.trim()),
        imageMissing:
          (collection === 'products' && !doc.images?.length) ||
          (collection === 'pages' && doc.slug === 'home' && !doc.heroImage),
        missing,
      })
    }
  }
  const settings = await cms.findGlobal({ slug: 'site-settings' })
  const media = await cms.find({
    collection: 'media',
    locale: 'all',
    fallbackLocale: false,
    pagination: false,
    depth: 0,
  })
  const mediaIssues = [...mediaReferences].flatMap((id) => {
    const m = media.docs.find((item) => item.id === id)
    if (!m) return [`${id}: referenced image missing`]
    return [
      ...(!m.approved ? [`${id}: image approval missing`] : []),
      ...locales.filter((l) => !(m.alt as any)?.[l]?.trim()).map((l) => `${id}: ${l} alt missing`),
    ]
  })
  const blockers = [
    ...(!documents.length ? ['CMS content is empty.'] : []),
    ...(documents.some((d) => d.sourceIncomplete.length)
      ? ['Required English source fields are incomplete.']
      : []),
    ...(Object.values(coverage).some((c) => c.incomplete)
      ? ['One or more languages have incomplete content fields.']
      : []),
    ...(documents.some((d) => d.imageMissing)
      ? ['A product or homepage is missing its required image.']
      : []),
    ...(!settings.secondaryRegistrationNo ? ['UK company registration number is pending from owner.'] : []),
    ...(!settings.secondaryRegistrationJurisdiction
      ? ['UK registration jurisdiction and registered-office status must be confirmed with company record.']
      : []),
    ...(documents.some((d) => d.status !== 'published')
      ? [
          'CMS content remains in draft; complete all eight locales and publish them together (publish checks or pnpm content:publish).',
        ]
      : []),
    ...(documents.some((d) => !d.factsConfirmed)
      ? ['Content fact-confirmation gates have not been cleared.']
      : []),
    ...mediaIssues,
  ]
  const report = {
    auditedAt: new Date().toISOString(),
    environment: 'isolated-local',
    networkCalls: false,
    totalDocuments: documents.length,
    referencedImages: mediaReferences.size,
    coverage,
    mediaIssues,
    blockers,
    ready: blockers.length === 0,
    documents,
  }
  await mkdir('docs/review', { recursive: true })
  await writeFile('docs/review/release-audit.json', JSON.stringify(report, null, 2) + '\n')
  console.log(
    JSON.stringify(
      {
        totalDocuments: documents.length,
        referencedImages: mediaReferences.size,
        coverage,
        mediaIssueCount: mediaIssues.length,
        blockers: blockers.filter((b) => !mediaIssues.includes(b)),
        ready: report.ready,
      },
      null,
      2,
    ),
  )
  const exitCode = process.argv.includes('--strict') && !report.ready ? 1 : 0
  await cms.destroy()
  process.exit(exitCode)
} catch (error) {
  await cms.destroy()
  throw error
}
