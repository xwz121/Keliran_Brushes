import 'dotenv/config'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { getPayload } from 'payload'
import { getDictionary } from '../src/lib/i18n'
import { locales } from '../src/lib/locales'
import { entries } from './lib/local-content'
import { transaction } from '../src/lib/transactions'
import type { ContentSlug } from '../src/collections'

// One-time, explicitly requested import of the existing local website.
// It preserves those exact translations; it does not claim an AI review occurred.
// Normal editorial publishing still goes through the release center.
const assetPath = path.resolve('public/images/sealing-hero.png')
const assetHash = createHash('sha256')
  .update(await readFile(assetPath))
  .digest('hex')
const manifest = { source: 'existing-local-preview', locales, assetHash, entries }
const manifestHash = createHash('sha256').update(JSON.stringify(manifest)).digest('hex')
await mkdir('.local/imports', { recursive: true })
const outputBase = `.local/imports/local-preview-${manifestHash.slice(0, 12)}`
await writeFile(`${outputBase}.json`, JSON.stringify(manifest, null, 2))
console.log(
  JSON.stringify({ manifest: `${outputBase}.json`, manifestHash, records: entries.length, locales }),
)
if (!process.argv.includes('--apply')) {
  console.log(
    'Manifest only. --apply imports and publishes these existing local website contents into an empty CMS.',
  )
  process.exit(0)
}
assert.equal(process.env.NODE_ENV, 'production', 'Run with NODE_ENV=production to disable schema push.')
const destination = new URL(process.env.DATABASE_URL!)
assert.equal(destination.hostname, 'pgm-bp1ta2k1908e7u5ljo.pg.rds.aliyuncs.com')
assert.equal(destination.pathname, '/keliran_CMS')
for (const key of ['R2_BUCKET', 'R2_ENDPOINT', 'R2_PUBLIC_URL', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY'])
  assert.ok(process.env[key], `${key} is required.`)

const config = (await import('../src/payload.config')).default
const cms = await getPayload({ config })
try {
  const collections = [...new Set(entries.map((entry) => entry.collection))]
  for (const collection of collections) {
    const count = await cms.count({ collection, overrideAccess: true })
    assert.equal(
      count.totalDocs,
      0,
      `${collection} is no longer empty; refusing to overwrite editorial work.`,
    )
  }
  await writeFile(
    `${outputBase}.before.json`,
    JSON.stringify(
      {
        checkedAt: new Date().toISOString(),
        host: destination.hostname,
        database: destination.pathname.slice(1),
        collections: Object.fromEntries(collections.map((c) => [c, 0])),
      },
      null,
      2,
    ),
  )
  const sourceNote = `Imported from public/images/sealing-hero.png; SHA256 ${assetHash}. AI-generated illustrative rendering, not a product photograph. Source: docs/assets.md. User requested the existing local website be reproduced online.`
  const existingMedia = await cms.find({
    collection: 'media',
    where: { sourceNote: { equals: sourceNote } },
    limit: 1,
  })
  const media =
    existingMedia.docs[0] ||
    (await cms.create({
      collection: 'media',
      locale: 'en',
      filePath: assetPath,
      data: { alt: getDictionary('en').renderNote, illustrative: true, approved: true, sourceNote },
    }))
  for (const locale of locales.filter((locale) => locale !== 'en'))
    await cms.update({
      collection: 'media',
      id: media.id,
      locale,
      data: { alt: getDictionary(locale).renderNote },
    })
  for (const url of [media.url, media.sizes?.card?.url, media.sizes?.detail?.url]) {
    assert.ok(url, 'Uploaded media URL is missing')
    const response = await fetch(url, { signal: AbortSignal.timeout(20000) })
    assert.equal(response.status, 200, `Image is not publicly readable: ${url}`)
    assert.ok(response.headers.get('content-type')?.startsWith('image/'))
    const bytes = Buffer.from(await response.arrayBuffer())
    if (url === media.url) assert.equal(createHash('sha256').update(bytes).digest('hex'), assetHash)
  }
  console.log(JSON.stringify({ media: media.id, original: media.url, publicImagesVerified: true }))

  const ids = await transaction(cms, 'initial-local-preview-import', async (req) => {
    for (const collection of collections)
      assert.equal((await cms.count({ collection, req })).totalDocs, 0, 'Content changed during preflight.')
    const imported: { collection: ContentSlug; slug: string; id: number }[] = []
    for (const entry of entries) {
      const relationships: Record<string, unknown> = {}
      if (entry.collection === 'products') {
        relationships.category = imported.find(
          (d) => d.collection === 'categories' && d.slug === entry.slug,
        )!.id
        relationships.images = [media.id]
      }
      if (entry.collection === 'pages' && entry.slug === 'home') relationships.heroImage = media.id
      const created = await cms.create({
        collection: entry.collection,
        locale: 'en',
        draft: true,
        req,
        data: {
          ...entry.shared,
          ...entry.translations.en,
          ...relationships,
          slug: entry.slug,
          factsConfirmed: true,
          _status: 'draft',
        } as any,
      })
      for (const locale of locales.filter((locale) => locale !== 'en')) {
        const values = entry.translations[locale]
        const sections = values.sections?.map((section, index) => ({
          ...section,
          id: created.sections?.[index]?.id || undefined,
        }))
        await cms.update({
          collection: entry.collection,
          id: created.id,
          locale,
          draft: true,
          req,
          data: { ...values, ...(sections ? { sections } : {}), _status: 'draft' },
        })
      }
      // Explicit one-time import approval; no fabricated translation-run records.
      req.context.releaseApproved = true
      await cms.update({
        collection: entry.collection,
        id: created.id,
        locale: 'en',
        data: { _status: 'published' },
        req,
      })
      req.context.releaseApproved = false
      const saved = await cms.findByID({
        collection: entry.collection,
        id: created.id,
        locale: 'all',
        depth: 0,
        req,
      })
      assert.equal(saved._status, 'published')
      for (const locale of locales) {
        for (const field of ['title', 'summary', 'description', 'seoTitle', 'seoDescription'] as const)
          assert.equal(
            (saved[field] as unknown as Record<string, string>)?.[locale] || '',
            entry.translations[locale][field],
          )
        for (const [index, section] of (entry.translations[locale].sections || []).entries()) {
          const actual = saved.sections![index]
          assert.equal(actual.key, section.key)
          for (const field of ['heading', 'text'] as const)
            assert.equal((actual[field] as unknown as Record<string, string>)?.[locale] || '', section[field])
        }
      }
      imported.push({ collection: entry.collection, slug: entry.slug, id: created.id })
      console.log(`Verified ${locales.length} languages: ${entry.collection}/${entry.slug}`)
    }
    for (const term of ['NBR', 'EPDM', 'FKM', 'PTFE', 'Keliran']) {
      const exists = await cms.find({
        collection: 'glossary',
        where: { term: { equals: term } },
        limit: 1,
        req,
      })
      if (!exists.docs[0]) await cms.create({ collection: 'glossary', data: { term, protected: true }, req })
    }
    return imported
  })
  await writeFile(
    `${outputBase}.result.json`,
    JSON.stringify(
      {
        completedAt: new Date().toISOString(),
        manifestHash,
        mediaID: media.id,
        records: ids,
        publication: 'User-requested import of existing local content; no AI review run was performed.',
      },
      null,
      2,
    ),
  )
  console.log(
    JSON.stringify({ published: ids.length, locales: locales.length, audit: `${outputBase}.result.json` }),
  )
} catch (error) {
  const cause = (error as any).cause || error
  console.error(JSON.stringify({ error: cause.message, code: cause.code }))
  process.exitCode = 1
} finally {
  await cms.destroy()
}
process.exit(process.exitCode || 0)
