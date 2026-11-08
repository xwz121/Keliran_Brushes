import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import type { Payload, PayloadRequest } from 'payload'
import type { ContentSlug } from '../../src/collections'
import { locales } from '../../src/lib/locales'
import type { approvedRelease } from './approved-release'

type Manifest = Awaited<ReturnType<typeof approvedRelease>>['manifest']
const arrayID = () => randomBytes(12).toString('hex')

// Only the immutable, independently reviewed release may use the adapter's
// all-locale representation. Normal CMS validation/publishing hooks stay intact.
// The caller supplies the transaction, verified media IDs and unchanged baseline.
export async function bulkApprovedRelease(
  cms: Payload,
  req: PayloadRequest,
  manifest: Manifest,
  before: { collections: Record<string, any[]> },
  mediaIDs: Map<string, number>,
) {
  const now = new Date().toISOString()
  for (const asset of manifest.media) {
    const current = await cms.findByID({
      collection: 'media',
      id: mediaIDs.get(asset.slug)!,
      locale: 'all',
      depth: 0,
      req,
    })
    await cms.db.updateOne({
      collection: 'media',
      id: mediaIDs.get(asset.slug)!,
      req,
      data: {
        ...current,
        alt: asset.alt,
        approved: true,
        illustrative: true,
        updatedAt: now,
        sourceNote: `Keliran approved release 2026-09-24 / ${asset.slug} / SHA256 ${asset.sha256}. ${asset.approval} Source: ${asset.sourcePath}; docs/assets-v2.md.`,
      },
    })
  }
  const ids = new Map<string, number>()
  const prepared = new Map<string, Record<string, any>>()
  const result: { collection: ContentSlug; slug: string; id: number }[] = []
  for (const entry of manifest.entries) {
    const collection = entry.collection as ContentSlug
    const old = before.collections[collection].filter((d) => d.slug === entry.slug)
    assert.ok(old.length <= 1, `Duplicate slug ${collection}/${entry.slug}`)
    const { imageKey, categorySlug, productSlugs, guideSlugs, solutionSlugs, ...shared } = entry.shared
    if (imageKey) {
      assert.ok(mediaIDs.has(imageKey))
      shared[collection === 'pages' ? 'heroImage' : collection === 'products' ? 'images' : 'image'] =
        collection === 'products' ? [mediaIDs.get(imageKey)] : mediaIDs.get(imageKey)
    }
    if (categorySlug) {
      assert.ok(ids.has(`categories/${categorySlug}`))
      shared.category = ids.get(`categories/${categorySlug}`)
    }
    const en = entry.translations.en as Record<string, any>
    const localized = (field: string, index?: number, child?: string) =>
      Object.fromEntries(
        locales.map((locale) => {
          const value = (entry.translations[locale] as Record<string, any>)[field]
          return [locale, index === undefined ? value : value[index][child!]]
        }),
      )
    const data: Record<string, any> = {
      ...old[0],
      ...shared,
      slug: entry.slug,
      factsConfirmed: true,
      _status: 'draft',
      updatedAt: now,
      createdAt: old[0]?.createdAt || now,
    }
    for (const field of ['title', 'summary', 'description', 'seoTitle', 'seoDescription'])
      data[field] = localized(field)
    data.sections = en.sections.map((section: any, i: number) => ({
      id: old[0]?.sections?.find((s: any) => s.key === section.key)?.id || arrayID(),
      key: section.key,
      heading: localized('sections', i, 'heading'),
      text: localized('sections', i, 'text'),
    }))
    if (en.specifications)
      data.specifications = en.specifications.map((spec: any, i: number) => ({
        ...spec,
        id: old[0]?.specifications?.find((s: any) => s.key === spec.key)?.id || arrayID(),
        label: localized('specifications', i, 'label'),
      }))
    const doc = old[0]
      ? await cms.db.updateOne({ collection, id: old[0].id, data, req })
      : await cms.db.create({ collection, data, req })
    assert.ok(doc?.id)
    ids.set(`${collection}/${entry.slug}`, Number(doc.id))
    prepared.set(`${collection}/${entry.slug}`, structuredClone(doc))
    result.push({ collection, slug: entry.slug, id: Number(doc.id) })
    console.log(`Prepared ${collection}/${entry.slug}: 8 locales`)
  }
  for (const entry of manifest.entries) {
    const collection = entry.collection as ContentSlug,
      id = ids.get(`${collection}/${entry.slug}`)!
    // Adapter updates replace complex arrays/relations, unlike the Local API.
    // Supply the complete prepared document so no field is implicitly cleared.
    const data: Record<string, any> = {
      ...prepared.get(`${collection}/${entry.slug}`),
      _status: 'published',
      updatedAt: now,
    }
    for (const [from, to, target] of [
      ['productSlugs', 'relatedProducts', 'products'],
      ['guideSlugs', 'relatedGuides', 'guides'],
      ['solutionSlugs', 'relatedSolutions', 'solutions'],
    ])
      if (entry.shared[from])
        data[to] = entry.shared[from].map((slug: string) => {
          const related = ids.get(`${target}/${slug}`)
          assert.ok(related, `Missing relation ${target}/${slug}`)
          return related
        })
    await cms.db.updateOne({ collection, id, data, req })
    const saved: any = await cms.findByID({
      collection,
      id,
      locale: 'all',
      fallbackLocale: false,
      depth: 0,
      overrideAccess: true,
      req,
    })
    assert.equal(saved._status, 'published')
    assert.equal(saved.factsConfirmed, true)
    for (const locale of locales) {
      const expected = entry.translations[locale] as Record<string, any>
      for (const field of ['title', 'summary', 'description', 'seoTitle', 'seoDescription'])
        assert.equal(saved[field]?.[locale] || '', expected[field])
      for (const [i, section] of expected.sections.entries()) {
        assert.equal(saved.sections[i].key, section.key)
        for (const field of ['heading', 'text'])
          assert.equal(saved.sections[i][field]?.[locale] || '', section[field])
      }
      for (const [i, spec] of (expected.specifications || []).entries()) {
        assert.equal(saved.specifications[i].label?.[locale], spec.label)
        for (const field of ['key', 'value', 'unit'])
          assert.equal(saved.specifications[i][field] || '', spec[field] || '')
      }
    }
    // Payload's adapter retains existing versions and marks this complete
    // published revision as latest, using its native version-table handling.
    await cms.db.createVersion({
      collectionSlug: collection,
      parent: id,
      versionData: structuredClone(saved),
      createdAt: now,
      updatedAt: now,
      autosave: false,
      req,
      returning: false,
    })
    const draft: any = await cms.findByID({ collection, id, locale: 'all', draft: true, depth: 0, req })
    assert.deepEqual(draft.title, saved.title, 'Latest editor version must match all published locales')
    assert.deepEqual(draft.sections, saved.sections)
    console.log(`Verified publication ${collection}/${entry.slug}: 8 locales`)
  }
  await cms.updateGlobal({ slug: 'site-settings', data: manifest.businessProfile, overrideAccess: true, req })
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
    assert.deepEqual(saved.alt, asset.alt)
  }
  return result
}
