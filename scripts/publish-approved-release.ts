import 'dotenv/config'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { getPayload } from 'payload'
import sharp from 'sharp'
import { Client } from 'pg'
import { sql } from '@payloadcms/db-postgres'
import { contentSlugs, type ContentSlug } from '../src/collections'
import { locales, type Locale } from '../src/lib/locales'
import { hash } from '../src/lib/ai/checks'
import { transaction } from '../src/lib/transactions'
import { approvedRelease } from './lib/approved-release'
import { cloudDatabase, databaseFingerprint, releaseState } from './lib/vercel-release'

const { manifest, manifestHash } = await approvedRelease()
await mkdir('.local/release', { recursive: true, mode: 0o700 })
const out = `.local/release/${manifestHash.slice(0, 16)}`
await writeFile(`${out}.manifest.json`, JSON.stringify(manifest, null, 2), { mode: 0o600 })
console.log(JSON.stringify({ manifestHash, records: manifest.entries.length, media: manifest.media.length }))
if (!process.argv.includes('--preflight') && !process.argv.includes('--apply')) process.exit(0)

const cloud = process.argv.includes('--vercel-release')
const destination = new URL(
  cloud
    ? cloudDatabase(process.env, manifestHash)
    : process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL!,
)
const local = ['127.0.0.1', 'localhost'].includes(destination.hostname)
if (local) assert.equal(destination.pathname, '/keliran_redesign')
else {
  if (cloud) {
    const db = new Client({ connectionString: destination.href })
    try {
      await db.connect()
      const state = await releaseState(db)
      assert.ok(state?.snapshot_at, 'Durable pre-migration snapshot required')
      assert.equal(state.database_fingerprint, databaseFingerprint(destination.href))
      assert.ok(!state.completed_at, 'Release already completed; do not overwrite subsequent edits')
    } finally {
      await db.end()
    }
  } else {
    assert.equal(destination.hostname, 'pgm-bp1ta2k1908e7u5ljo.pg.rds.aliyuncs.com')
    assert.equal(destination.pathname, '/keliran_CMS')
  }
  for (const key of ['R2_BUCKET', 'R2_ENDPOINT', 'R2_PUBLIC_URL', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY'])
    assert.ok(process.env[key], `${key} required`)
  if (!cloud && process.argv.includes('--apply')) {
    const backup = process.argv.find((a) => a.startsWith('--backup='))?.slice(9)
    assert.ok(
      backup && backup.startsWith('.local/release/'),
      'A private production pg_dump backup is required',
    )
    const bytes = await readFile(backup)
    assert.ok(bytes.length > 10000 && bytes.subarray(0, 5).toString() === 'PGDMP', 'Invalid backup')
    const proof = JSON.parse(await readFile(`${backup}.json`, 'utf8'))
    assert.equal(proof.database, 'keliran_CMS')
    assert.equal(proof.archiveReadable, true)
    assert.equal(proof.sha256, createHash('sha256').update(bytes).digest('hex'))
    assert.ok(Date.now() - Date.parse(proof.completedAt) < 86400000, 'Create a fresh production backup')
  }
}
Object.assign(process.env, { NODE_ENV: 'production', DATABASE_URL: destination.href })
const config = (await import('../src/payload.config')).default
const cms = await getPayload({ config })
try {
  const snapshot = async (req?: any) => {
    const collections: Record<string, any[]> = {}
    for (const collection of contentSlugs)
      collections[collection] = (
        await cms.find({
          collection,
          locale: 'all',
          fallbackLocale: false,
          draft: true,
          depth: 0,
          pagination: false,
          sort: 'id',
          overrideAccess: true,
          req,
        })
      ).docs
    return {
      collections,
      settings: await cms.findGlobal({
        slug: 'site-settings',
        locale: 'all',
        depth: 0,
        overrideAccess: true,
        req,
      }),
    }
  }
  const before = await snapshot()
  const baseline = hash(before)
  await writeFile(
    `${out}.${local ? 'local' : 'production'}.before-${baseline.slice(0, 12)}.json`,
    JSON.stringify(before, null, 2),
    { mode: 0o600 },
  )
  console.log(
    JSON.stringify({
      environment: local ? 'local' : 'production',
      baseline,
      existing: Object.fromEntries(Object.entries(before.collections).map(([k, v]) => [k, v.length])),
    }),
  )
  if (!process.argv.includes('--apply')) {
    await cms.destroy()
    process.exit(0)
  }
  if (!cloud)
    assert.equal(
      process.argv.find((a) => a.startsWith('--baseline='))?.slice(11),
      baseline,
      'Use the current reviewed preflight baseline',
    )
  const mediaIDs = new Map<string, number>()
  const currentMedia = (
    await cms.find({ collection: 'media', pagination: false, depth: 0, locale: 'all', overrideAccess: true })
  ).docs
  for (const asset of manifest.media) {
    const found = currentMedia.filter(
      (m) =>
        m.sourceNote?.includes(`/ ${asset.slug} /`) ||
        (asset.slug === 'components-hero' && m.sourceNote?.includes('/ components-hero.')),
    )
    assert.ok(found.length <= 1, `Ambiguous media ${asset.slug}`)
    const sourceNote = `Keliran approved release 2026-09-24 / ${asset.slug} / SHA256 ${asset.sha256}. ${asset.approval} Source: ${asset.sourcePath}; docs/assets-v2.md.`
    const media =
      found[0] ||
      (await cms.create({
        collection: 'media',
        locale: 'en',
        filePath: asset.sourcePath,
        data: { alt: asset.alt.en, illustrative: true, approved: true, sourceNote },
        context: { skipRevalidation: true },
      }))
    // Payload 3.89 processes WebP through sharp({ animated: true }).rotate(),
    // even for a single frame. Verify the expected uploaded bytes separately
    // from the approved source-file hash instead of rejecting normal re-encoding.
    assert.ok(asset.sourcePath.endsWith('.webp'))
    const expectedUploadHash = createHash('sha256')
      .update(await sharp(asset.sourcePath, { animated: true }).rotate().toBuffer())
      .digest('hex')
    if (local)
      assert.equal(
        createHash('sha256')
          .update(await readFile(`media/${media.filename}`))
          .digest('hex'),
        expectedUploadHash,
        `Local media differs: ${asset.slug}`,
      )
    if (!local)
      for (const url of [media.url, media.sizes?.card?.url, media.sizes?.detail?.url]) {
        assert.ok(url, `Missing image URL: ${asset.slug}`)
        const response = await fetch(url, { signal: AbortSignal.timeout(30000) })
        assert.equal(response.status, 200, `Image unavailable: ${asset.slug}`)
        assert.ok(response.headers.get('content-type')?.startsWith('image/'))
        if (url === media.url)
          assert.equal(
            createHash('sha256')
              .update(Buffer.from(await response.arrayBuffer()))
              .digest('hex'),
            expectedUploadHash,
          )
      }
    mediaIDs.set(asset.slug, media.id)
  }
  const published = await transaction(cms, '20260924-approved-content-release', async (req) => {
    assert.equal(hash(await snapshot(req)), baseline, 'Editorial content changed after preflight')
    if (cloud || process.argv.includes('--bulk-local')) {
      assert.ok(cloud || local)
      const { bulkApprovedRelease } = await import('./lib/bulk-approved-release')
      const result = await bulkApprovedRelease(cms, req, manifest, before, mediaIDs)
      if (cloud) {
        const id = await req.transactionID
        assert.ok(id !== undefined && id !== null)
        const session = cms.db.sessions?.[id]
        assert.ok(session)
        await (session.db as { execute: (query: ReturnType<typeof sql>) => Promise<unknown> }).execute(sql`
          UPDATE public._keliran_release_20260924_state SET completed_at = now(),
            deployment_commit = ${process.env.VERCEL_GIT_COMMIT_SHA || ''},
            result = ${JSON.stringify({ records: result.length, locales: locales.length, media: mediaIDs.size, baseline })}::jsonb
          WHERE manifest_hash = ${manifestHash} AND completed_at IS NULL
        `)
      }
      return result
    }
    for (const asset of manifest.media)
      for (const locale of locales)
        await cms.update({
          collection: 'media',
          id: mediaIDs.get(asset.slug)!,
          locale,
          req,
          data: {
            alt: asset.alt[locale],
            illustrative: true,
            approved: true,
            sourceNote: `Keliran approved release 2026-09-24 / ${asset.slug} / SHA256 ${asset.sha256}. ${asset.approval} Source: ${asset.sourcePath}; docs/assets-v2.md.`,
          },
        })
    const ids = new Map<string, number>()
    const result: { collection: ContentSlug; slug: string; id: number }[] = []
    for (const entry of manifest.entries) {
      const collection = entry.collection as ContentSlug
      const existing = before.collections[collection].filter((d) => d.slug === entry.slug)
      assert.ok(existing.length <= 1, `Duplicate slug ${collection}/${entry.slug}`)
      const { imageKey, categorySlug, productSlugs, guideSlugs, solutionSlugs, ...shared } = entry.shared
      if (imageKey) {
        assert.ok(mediaIDs.has(imageKey), `Unknown image ${imageKey}`)
        shared[collection === 'pages' ? 'heroImage' : collection === 'products' ? 'images' : 'image'] =
          collection === 'products' ? [mediaIDs.get(imageKey)] : mediaIDs.get(imageKey)
      }
      if (categorySlug) {
        assert.ok(ids.has(`categories/${categorySlug}`))
        shared.category = ids.get(`categories/${categorySlug}`)
      }
      const data = {
        ...shared,
        ...entry.translations.en,
        slug: entry.slug,
        factsConfirmed: true,
        _status: 'draft',
      }
      // Preserve shared array IDs across all locales and existing editorial versions.
      data.sections = data.sections.map((s: any) => ({
        ...s,
        id: existing[0]?.sections?.find((old: any) => old.key === s.key)?.id,
      }))
      const args = { collection, locale: 'en' as const, draft: true, req, data: data as any }
      const doc = existing[0] ? await cms.update({ ...args, id: existing[0].id }) : await cms.create(args)
      ids.set(`${collection}/${entry.slug}`, doc.id)
      for (const locale of locales.filter((l) => l !== 'en')) {
        const translated = entry.translations[locale]
        await cms.update({
          collection,
          id: doc.id,
          locale,
          draft: true,
          req,
          data: {
            ...translated,
            sections: translated.sections.map((s: any, i: number) => ({ ...s, id: doc.sections?.[i]?.id })),
            ...(translated.specifications
              ? {
                  specifications: translated.specifications.map((s: any, i: number) => ({
                    ...s,
                    id: (doc as any).specifications?.[i]?.id,
                  })),
                }
              : {}),
            _status: 'draft',
          } as any,
        })
      }
      result.push({ collection, slug: entry.slug, id: doc.id })
    }
    for (const entry of manifest.entries) {
      const collection = entry.collection as ContentSlug
      const id = ids.get(`${collection}/${entry.slug}`)!
      const links: Record<string, number[]> = {}
      for (const [from, to, target] of [
        ['productSlugs', 'relatedProducts', 'products'],
        ['guideSlugs', 'relatedGuides', 'guides'],
        ['solutionSlugs', 'relatedSolutions', 'solutions'],
      ]) {
        if (entry.shared[from])
          links[to] = entry.shared[from].map((slug: string) => {
            const related = ids.get(`${target}/${slug}`)
            assert.ok(related, `Missing relation ${target}/${slug}`)
            return related
          })
      }
      // This explicit import approval follows the immutable, independently reviewed release bundle.
      // Normal CMS editorial publishing gates are unchanged; no translation-run records are fabricated.
      req.context.releaseApproved = true
      await cms.update({ collection, id, locale: 'en', req, data: { ...links, _status: 'published' } })
      req.context.releaseApproved = false
      const saved = (await cms.findByID({
        collection,
        id,
        locale: 'all',
        fallbackLocale: false,
        depth: 0,
        req,
      })) as any
      assert.equal(saved._status, 'published')
      assert.equal(saved.factsConfirmed, true)
      for (const locale of locales) {
        const expected: Record<string, any> = entry.translations[locale]
        for (const field of ['title', 'summary', 'description', 'seoTitle', 'seoDescription'])
          assert.equal(saved[field]?.[locale] || '', expected[field])
        for (const [i, section] of expected.sections.entries()) {
          assert.equal(saved.sections[i].key, section.key)
          for (const field of ['heading', 'text'])
            assert.equal(saved.sections[i][field]?.[locale] || '', section[field])
        }
      }
      console.log(`Verified publication ${collection}/${entry.slug}: 8 locales`)
    }
    await cms.updateGlobal({
      slug: 'site-settings',
      req,
      data: manifest.businessProfile,
      overrideAccess: true,
    })
    for (const asset of manifest.media) {
      const saved = await cms.findByID({
        collection: 'media',
        id: mediaIDs.get(asset.slug)!,
        locale: 'all',
        depth: 0,
        req,
      })
      assert.equal(saved.approved, true)
      assert.equal(saved.illustrative, true)
      for (const locale of locales) assert.equal((saved.alt as any)?.[locale], asset.alt[locale])
    }
    return result
  })
  const proof = {
    completedAt: new Date().toISOString(),
    environment: local ? 'local' : 'production',
    manifestHash,
    baseline,
    published,
    media: Object.fromEntries(mediaIDs),
    approval: manifest.approval,
  }
  await writeFile(`${out}.${local ? 'local' : 'production'}.result.json`, JSON.stringify(proof, null, 2), {
    mode: 0o600,
  })
  console.log(
    JSON.stringify({
      published: published.length,
      locales: locales.length,
      result: `${out}.${local ? 'local' : 'production'}.result.json`,
    }),
  )
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Release failed')
  process.exitCode = 1
} finally {
  await cms.destroy()
}
process.exit(process.exitCode || 0)
