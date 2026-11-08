// Read-only export of strip-brush and shared content from the keliran.com Payload database.
// Usage: pnpm migration:export   (reads .env.migration-source; never writes to the source)
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
import { createLocalReq, getPayload } from 'payload'
import { locales } from '../../src/lib/locales'
import { routeFor } from '../../src/lib/routes'
import {
  appliedMigrations,
  bundleFormat,
  canonical,
  contentCollections,
  csv,
  databaseIdentity,
  exportLines,
  localisedTexts,
  readOnlySetting,
  refKey,
  relationFields,
  releaseEvidence,
  releaseOriginals,
  sha256,
  snapshotHash,
  sourceKey,
  acceptedSourceMigrations,
  sourceSite,
  tableExists,
  targetSite,
  type Bundle,
  type BundleMedia,
  type BundleRecord,
  type Ref,
} from './lib'

const env = loadEnv({ path: '.env.migration-source', processEnv: {} }).parsed || {}
const sourceURL = env.MIGRATION_SOURCE_DATABASE_URL
const mediaBase = env.MIGRATION_SOURCE_MEDIA_BASE_URL?.replace(/\/$/, '')
assert.ok(sourceURL, 'MIGRATION_SOURCE_DATABASE_URL is missing from .env.migration-source')
assert.ok(mediaBase?.startsWith('https://'), 'MIGRATION_SOURCE_MEDIA_BASE_URL must be the https media origin')
// Every new session starts read-only; the role itself must also be read-only (README).
const url = new URL(sourceURL)
if (env.MIGRATION_SOURCE_SESSION_OPTIONS !== 'off')
  url.searchParams.set('options', '-c default_transaction_read_only=on')
Object.assign(process.env, {
  DATABASE_URL: url.toString(),
  DATABASE_URL_UNPOOLED: '',
  // Production mode disables schema push; no storage or email service is configured here.
  NODE_ENV: 'production',
  PAYLOAD_SECRET: process.env.PAYLOAD_SECRET || 'read-only-export-no-sessions-issued',
  DEPLOYMENT_ENV: 'development',
  VERCEL_ENV: 'development',
  R2_BUCKET: '',
  POSTMARK_SERVER_TOKEN: '',
})
const config = (await import('../../src/payload.config')).default
const cms = await getPayload({ config })
const out = path.join('.local/migration', new Date().toISOString().replace(/[:.]/g, '-'))
let transactionID: string | number | null = null
try {
  transactionID = await cms.db.beginTransaction({
    isolationLevel: 'repeatable read',
    accessMode: 'read only',
  })
  assert.ok(transactionID, 'Transactions are required')
  const req = await createLocalReq({ req: { transactionID } }, cms)
  assert.equal(await readOnlySetting(cms, req), 'on', 'The export transaction is not read-only')
  assert.equal(
    await tableExists(cms, 'migration_records', req),
    false,
    'The source has a migration ledger: this looks like a brushes database, not keliran.com',
  )
  const migrations = await appliedMigrations(cms, req)
  assert.ok(acceptedSourceMigrations(migrations), `Unexpected source schema: ${migrations.join(', ')}`)
  const identity = await databaseIdentity(cms, req)

  // Every content document's slug and line, to describe relations by slug and to drop
  // those that point at the other product line.
  const refs = new Map<string, Ref>()
  const read = (collection: string, extra: Record<string, unknown> = {}) =>
    cms.find({
      collection: collection as any,
      locale: 'all',
      depth: 0,
      pagination: false,
      overrideAccess: true,
      req,
      ...extra,
    })
  for (const collection of contentCollections)
    for (const doc of (await read(collection)).docs as any[])
      refs.set(`${collection}:${doc.id}`, { collection, slug: doc.slug, line: doc.line ?? null })

  const included = new Set<string>()
  const latest = new Map<string, any>()
  const main = new Map<string, any>()
  for (const collection of contentCollections) {
    const docs = (await read(collection)).docs as any[]
    const drafts = (await read(collection, { draft: true })).docs as any[]
    for (const doc of docs) main.set(`${collection}:${doc.id}`, doc)
    for (const doc of drafts) latest.set(`${collection}:${doc.id}`, doc)
    for (const doc of [...docs, ...drafts])
      if (collection === 'pages' || exportLines.includes(doc.line)) included.add(`${collection}:${doc.id}`)
  }

  const media = new Map<number, BundleMedia>()
  const dropped: Bundle['dropped'] = []
  const resolveSource = (collection: string, id: unknown) => {
    if (collection === 'media') return media.has(id as number) ? `media/${id}` : undefined
    const ref = refs.get(`${collection}:${id}`)
    return ref && included.has(`${collection}:${id}`) ? refKey(ref) : undefined
  }
  const records: BundleRecord[] = []
  const mediaIds = new Set<number>()
  const sealingMentions: Bundle['sealingMentions'] = []
  const sealing = /\b(seal|seals|sealing|gasket|gaskets|o-ring|rubber|epdm|nbr|fkm|enclosure|nema|ip\d{2})\b/i
  for (const key of [...included].sort()) {
    const [collection, id] = key.split(':') as [(typeof contentCollections)[number], string]
    const fields = relationFields(cms, collection)
    const base = main.get(key)
    const newest = latest.get(key)
    const published = base?._status === 'published' ? base : null
    const draft = newest && (!published || newest.updatedAt !== published.updatedAt) ? newest : null
    // Drop relations to documents that are not exported (the sealing line), and record them.
    const keep = (doc: any) => {
      if (!doc) return null
      const copy = structuredClone(doc)
      for (const f of fields) {
        const values = Array.isArray(copy[f.name]) ? copy[f.name] : copy[f.name] == null ? [] : [copy[f.name]]
        const kept = values.filter((value: any) => {
          const target = typeof value === 'object' && value ? value.id : value
          if (f.relationTo === 'media') {
            mediaIds.add(target)
            return true
          }
          if (included.has(`${f.relationTo}:${target}`)) return true
          const ref = refs.get(`${f.relationTo}:${target}`)
          dropped.push({
            from: refKey({ collection, slug: doc.slug }),
            field: f.name,
            to: ref ? refKey(ref) : `${f.relationTo}:${target}`,
            toLine: ref?.line ?? null,
          })
          return false
        })
        copy[f.name] = f.hasMany ? kept : (kept[0] ?? null)
      }
      return copy
    }
    const p = keep(published)
    const d = keep(draft)
    records.push({
      sourceKey: sourceKey(collection, id),
      collection,
      sourceId: Number(id),
      slug: (base || newest).slug,
      line: (base || newest).line ?? null,
      published: p,
      draft: d,
      sourceHash: '', // filled after media hashes are known
      evidence: { status: 'needs-review', differences: [] },
    })
    if (collection === 'pages' || (base || newest).line === 'both')
      for (const doc of [p, d].filter(Boolean))
        for (const [field, values] of localisedTexts(doc))
          if (sealing.test(values.en || ''))
            sealingMentions.push({
              record: refKey({ collection, slug: doc.slug }),
              field,
              excerpt: (values.en || '').slice(0, 160),
            })
  }

  // Media referenced by exported documents: download, hash, and match approved originals.
  const originals = await releaseOriginals()
  await mkdir(path.join(out, 'media'), { recursive: true })
  for (const doc of (await read('media', { where: { id: { in: [...mediaIds] } } })).docs as any[]) {
    const fileURL = `${mediaBase}/${doc.prefix ? `${doc.prefix}/` : ''}${encodeURIComponent(doc.filename)}`
    const response = await fetch(fileURL, { signal: AbortSignal.timeout(30000) })
    assert.equal(response.status, 200, `Media unavailable: ${fileURL}`)
    const bytes = Buffer.from(await response.arrayBuffer())
    const digest = sha256(bytes)
    const file = path.join('media', `${doc.id}${path.extname(doc.filename)}`)
    await writeFile(path.join(out, file), bytes)
    const original = originals.get(digest)
    media.set(doc.id, {
      sourceKey: sourceKey('media', `${doc.id}:${digest.slice(0, 16)}`),
      sourceId: doc.id,
      filename: doc.filename,
      prefix: doc.prefix,
      mimeType: doc.mimeType,
      sha256: digest,
      file,
      alt: doc.alt || {},
      illustrative: Boolean(doc.illustrative),
      approved: Boolean(doc.approved),
      sourceNote: doc.sourceNote,
      original: original
        ? { path: original.sourcePath, slug: original.slug, approval: original.approval }
        : null,
    })
  }
  for (const id of mediaIds) assert.ok(media.has(id), `Referenced media ${id} not found`)

  const resolveMedia = (collection: string, id: unknown) =>
    collection === 'media'
      ? media.get(id as number)
        ? `media:${media.get(id as number)!.sha256}`
        : undefined
      : resolveSource(collection, id)
  for (const record of records) {
    const fields = relationFields(cms, record.collection)
    record.sourceHash = snapshotHash(
      canonical(record.published, fields, resolveMedia),
      canonical(record.draft, fields, resolveMedia),
    )
    const differences = [
      ...releaseEvidence(record.published).map((d) => `published ${d}`),
      ...releaseEvidence(record.draft).map((d) => `draft ${d}`),
    ]
    record.evidence = {
      status: differences.length ? 'needs-review' : 'release-20260924',
      differences,
    }
  }

  const bundle: Bundle = {
    format: bundleFormat,
    exportedAt: new Date().toISOString(),
    source: { site: sourceSite, identity, migrations },
    records,
    media: [...media.values()],
    globals: {
      'site-settings': await cms.findGlobal({ slug: 'site-settings', depth: 0, req, overrideAccess: true }),
    },
    glossary: (await read('glossary')).docs as any[],
    dropped,
    sealingMentions,
  }
  await writeFile(path.join(out, 'bundle.json'), JSON.stringify(bundle, null, 2), { mode: 0o600 })

  // Reviewable inventory: one row per record, with old and new URLs and evidence.
  const rows: (string | number | null)[][] = [
    [
      'collection',
      'slug',
      'line',
      'state',
      'locales',
      'relations_kept',
      'relations_dropped',
      'media',
      'old_url_en',
      'new_url_en',
      'evidence',
      'evidence_differences',
    ],
  ]
  for (const r of records) {
    const doc = r.draft || r.published!
    const titled = locales.filter((l) => typeof doc.title?.[l] === 'string' && doc.title[l].trim())
    const fields = relationFields(cms, r.collection)
    const kept = fields
      .filter((f) => f.relationTo !== 'media')
      .reduce((n, f) => n + (Array.isArray(doc[f.name]) ? doc[f.name].length : doc[f.name] ? 1 : 0), 0)
    const mediaRefs = fields
      .filter((f) => f.relationTo === 'media')
      .flatMap((f) => (Array.isArray(doc[f.name]) ? doc[f.name] : doc[f.name] ? [doc[f.name]] : []))
      .map((id: number) => media.get(id)?.original?.slug || `media:${id}`)
    const route = routeFor(r.collection, { slug: r.slug, line: r.line }, 'en')
    rows.push([
      r.collection,
      r.slug,
      r.line,
      r.published ? (r.draft ? 'published+newer-draft' : 'published') : 'draft-only',
      titled.join(' '),
      kept,
      dropped.filter((d) => d.from === refKey({ collection: r.collection, slug: r.slug })).length,
      mediaRefs.join(' '),
      `${sourceSite}${route}`,
      `${targetSite}${route}`,
      r.evidence.status,
      r.evidence.differences.slice(0, 12).join('; '),
    ])
  }
  await writeFile(path.join(out, 'inventory.csv'), csv(rows))
  console.log(
    JSON.stringify(
      {
        bundle: out,
        source: { database: identity.database, migrations: migrations.length },
        records: records.length,
        byLine: Object.fromEntries(
          ['brushes', 'both', 'pages'].map((l) => [
            l,
            records.filter((r) => (l === 'pages' ? r.collection === 'pages' : r.line === l)).length,
          ]),
        ),
        media: media.size,
        mediaFromOriginals: [...media.values()].filter((m) => m.original).length,
        droppedRelations: dropped.length,
        needsReview: records.filter((r) => r.evidence.status === 'needs-review').length,
        sealingMentions: sealingMentions.length,
      },
      null,
      2,
    ),
  )
} finally {
  // Read-only: always roll back, nothing to commit.
  if (transactionID) await cms.db.rollbackTransaction(transactionID)
  await cms.destroy()
}
process.exit(0)
