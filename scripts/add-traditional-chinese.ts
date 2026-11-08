import 'dotenv/config'
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { getPayload } from 'payload'
import { entries, type Entry } from './lib/local-content'
import type { Config, Media } from '../src/payload-types'
import { getDictionary } from '../src/lib/i18n'
import { transaction } from '../src/lib/transactions'

// Extend the user-approved initial content without overwriting other locales,
// shared fields, image references, or pending editorial drafts.
const locale = 'zh-Hant' as const
const fields = ['title', 'summary', 'description', 'seoTitle', 'seoDescription'] as const
function previousContent(value: any): any {
  if (Array.isArray(value)) return value.map(previousContent)
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => key !== locale && key !== 'updatedAt')
        .map(([key, v]) => [key, previousContent(v)]),
    )
  return value
}
assert.equal(process.env.NODE_ENV, 'production', 'Disable schema push before connecting.')
const destination = new URL(process.env.DATABASE_URL!)
assert.equal(destination.hostname, 'pgm-bp1ta2k1908e7u5ljo.pg.rds.aliyuncs.com')
assert.equal(destination.pathname, '/keliran_CMS')
const cms = await getPayload({ config: (await import('../src/payload.config')).default })
try {
  const source: { entry: Entry; doc: Config['collections'][Entry['collection']]; hasTranslation: boolean }[] =
    []
  for (const entry of entries) {
    const result = await cms.find({
      collection: entry.collection,
      where: { slug: { equals: entry.slug } },
      locale: 'all',
      fallbackLocale: false,
      draft: true,
      depth: 0,
      limit: 1,
    })
    const doc = result.docs[0]
    assert.ok(doc, `Missing ${entry.collection}/${entry.slug}`)
    assert.equal(doc._status, 'published', `Pending draft: ${entry.slug}; refusing to overwrite.`)
    for (const field of fields)
      assert.equal(
        (doc[field] as any)?.en || '',
        entry.translations.en[field],
        `English source changed: ${entry.slug}/${field}`,
      )
    const hasTranslation = fields.some((field) => (doc[field] as any)?.[locale])
    if (hasTranslation) {
      for (const field of fields)
        assert.equal(
          (doc[field] as any)?.[locale] || '',
          entry.translations[locale][field],
          `Existing Chinese editorial change: ${entry.slug}/${field}`,
        )
    }
    assert.equal(doc.sections?.length || 0, entry.translations.en.sections?.length || 0)
    for (const [i, section] of (entry.translations.en.sections || []).entries()) {
      const actual = doc.sections![i]
      assert.equal(actual.key, section.key)
      for (const field of ['heading', 'text'] as const)
        assert.equal(
          (actual[field] as any)?.en || '',
          section[field],
          `English section changed: ${entry.slug}/${section.key}`,
        )
      if (hasTranslation)
        for (const field of ['heading', 'text'] as const)
          assert.equal((actual[field] as any)?.[locale] || '', entry.translations[locale].sections![i][field])
    }
    source.push({ entry, doc, hasTranslation })
  }
  const mediaIds = new Set<number>()
  for (const { doc } of source) {
    const d = doc as any
    for (const id of [...(d.images || []), ...(d.heroImage ? [d.heroImage] : [])]) mediaIds.add(id)
  }
  const media: Media[] = []
  for (const id of mediaIds) {
    const doc = await cms.findByID({
      collection: 'media',
      id,
      locale: 'all',
      fallbackLocale: false,
      depth: 0,
    })
    assert.equal(doc.illustrative, true, 'New source image requires its own translated alt text.')
    assert.equal((doc.alt as any)?.en, getDictionary('en').renderNote)
    if ((doc.alt as any)?.[locale]) assert.equal((doc.alt as any)[locale], getDictionary(locale).renderNote)
    media.push(doc)
  }
  await mkdir('.local/imports', { recursive: true })
  const auditPath = `.local/imports/traditional-chinese-${Date.now()}`
  await writeFile(
    `${auditPath}.before.json`,
    JSON.stringify(
      { source: source.map(({ entry, doc }) => ({ collection: entry.collection, doc })), media },
      null,
      2,
    ),
  )
  console.log(
    JSON.stringify({
      records: source.length,
      alreadyTranslated: source.filter((s) => s.hasTranslation).length,
      media: media.length,
      backup: `${auditPath}.before.json`,
    }),
  )
  if (process.argv.includes('--apply')) {
    await transaction(cms, 'add-traditional-chinese', async (req) => {
      req.context.releaseApproved = true
      for (const { entry, doc, hasTranslation } of source) {
        const current = await cms.findByID({
          collection: entry.collection,
          id: doc.id,
          locale: 'all',
          draft: true,
          depth: 0,
          req,
        })
        assert.deepEqual(current, doc, `Concurrent edit: ${entry.slug}`)
        if (hasTranslation) continue
        const values = entry.translations[locale]
        await cms.update({
          collection: entry.collection,
          id: doc.id,
          locale,
          req,
          data: {
            ...values,
            ...(values.sections
              ? { sections: values.sections.map((s, i) => ({ ...s, id: doc.sections![i].id! })) }
              : {}),
            _status: 'published',
          },
        })
        const saved = await cms.findByID({
          collection: entry.collection,
          id: doc.id,
          locale: 'all',
          fallbackLocale: false,
          depth: 0,
          req,
        })
        assert.deepEqual(
          previousContent(saved),
          previousContent(doc),
          `Existing content changed: ${entry.slug}`,
        )
        for (const field of fields) assert.equal((saved[field] as any)?.[locale] || '', values[field])
        for (const [i, section] of (values.sections || []).entries())
          for (const field of ['heading', 'text'] as const)
            assert.equal((saved.sections![i][field] as any)?.[locale] || '', section[field])
        console.log(
          `Verified ${entry.collection}/${entry.slug}: Chinese added, seven existing locales preserved.`,
        )
      }
      for (const doc of media) {
        const current = await cms.findByID({ collection: 'media', id: doc.id, locale: 'all', depth: 0, req })
        assert.deepEqual(current, doc, `Concurrent media edit: ${doc.id}`)
        await cms.update({
          collection: 'media',
          id: doc.id,
          locale,
          req,
          data: { alt: getDictionary(locale).renderNote },
        })
        const saved = await cms.findByID({ collection: 'media', id: doc.id, locale: 'all', depth: 0, req })
        assert.deepEqual(previousContent(saved), previousContent(doc))
        assert.equal((saved.alt as any)?.[locale], getDictionary(locale).renderNote)
      }
    })
    await writeFile(
      `${auditPath}.result.json`,
      JSON.stringify(
        {
          completedAt: new Date().toISOString(),
          locale,
          records: source.length,
          media: media.length,
          previousLocalesPreserved: true,
        },
        null,
        2,
      ),
    )
    console.log('Traditional Chinese content committed. Existing content preserved.')
  } else console.log('Read-only check complete. Use --apply to add this locale.')
} catch (error) {
  const cause = (error as any).cause || error
  console.error(JSON.stringify({ error: cause.message, code: cause.code }))
  process.exitCode = 1
} finally {
  await cms.destroy()
}
process.exit(process.exitCode || 0)
