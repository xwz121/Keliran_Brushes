// Publish an eight-language content update prepared by an editor or a coding agent.
//
//   node scripts/local-env.mjs pnpm content:publish <bundle.json>            # dry run on the local CMS
//   node scripts/local-env.mjs pnpm content:publish <bundle.json> --apply    # write to the local CMS
//   pnpm content:publish <bundle.json> --apply --production --revalidate=https://brushes.keliran.com
//
// The dry run performs every write inside a transaction, runs the normal publish checks and rolls
// back. --apply commits. Writing to a non-local database needs --production and a separate,
// explicit authorisation for that production change; DATABASE_URL must point at it.
//
// Bundle: { collection, slug, shared?: {non-localized fields}, draftOnly?: boolean,
//           locales: { en: {title, summary, description, seoTitle, seoDescription,
//                           sections: [{key, heading, text}], specifications: [{key, label, value, unit}]},
//                      fr: {...}, ... } }
// Fields that are left out keep their current value. Array rows are matched by key; a new key must
// first appear in English. Every locale is published together, and the publish checks require all
// eight to be complete and consistent with English.
import 'dotenv/config'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { APIError, getPayload } from 'payload'
import { isContentSlug } from '../src/collections'
import { locales, type Locale } from '../src/lib/locales'
import { localizedRowFields, localizedTextFields } from '../src/lib/content-checks'
import { transaction } from '../src/lib/transactions'

type Row = Record<string, any> & { key: string }
type LocaleData = Record<string, any> & { sections?: Row[]; specifications?: Row[] }
type Bundle = {
  collection: string
  slug: string
  shared?: Record<string, unknown>
  draftOnly?: boolean
  locales: Partial<Record<Locale, LocaleData>>
}
const args = process.argv.slice(2)
const file = args.find((a) => !a.startsWith('--'))
const apply = args.includes('--apply')
const production = args.includes('--production')
const revalidate = args.find((a) => a.startsWith('--revalidate='))?.slice('--revalidate='.length)
assert.ok(
  file,
  'Usage: pnpm content:publish <bundle.json> [--apply] [--production] [--revalidate=<site URL>]',
)

const bundle = JSON.parse(await readFile(file, 'utf8')) as Bundle
assert.ok(isContentSlug(bundle.collection), `Unknown content collection: ${bundle.collection}`)
assert.ok(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(bundle.slug || ''), 'A valid slug is required')
for (const locale of Object.keys(bundle.locales || {}))
  assert.ok((locales as readonly string[]).includes(locale), `Unknown locale: ${locale}`)
const collection = bundle.collection
const textFields = localizedTextFields as readonly string[]
for (const [locale, data] of Object.entries(bundle.locales))
  for (const key of Object.keys(data!))
    assert.ok(
      textFields.includes(key) || key in localizedRowFields,
      `${locale}: ${key} is not a localized field`,
    )

const database = new URL(process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL || '')
const local = ['127.0.0.1', 'localhost', '::1'].includes(database.hostname)
assert.ok(local || production, `Refusing to write to ${database.hostname} without --production`)
// Scripts never change the schema; production schema changes go through migrations.
Object.assign(process.env, { NODE_ENV: 'production', DATABASE_URL: database.href })
const config = (await import('../src/payload.config')).default
const cms = await getPayload({ config })

const short = (v: unknown) => {
  const s = typeof v === 'string' ? v : JSON.stringify(v ?? '')
  return s.length > 90 ? `${s.slice(0, 87)}…` : s
}
const changes: string[] = []
function note(locale: string, field: string, before: unknown, after: unknown) {
  if (JSON.stringify(before ?? '') !== JSON.stringify(after ?? ''))
    changes.push(`${locale} ${field}: ${short(before)} → ${short(after)}`)
}
// One locale's update: given text fields, and array rows merged by key into the current rows.
function localeUpdate(locale: Locale, current: Record<string, any>, data: LocaleData) {
  const update: Record<string, any> = {}
  for (const field of textFields)
    if (field in data) {
      note(locale, field, current[field], data[field])
      update[field] = data[field]
    }
  for (const [name, fields] of Object.entries(localizedRowFields) as [string, readonly string[]][]) {
    const given: Row[] | undefined = data[name]
    if (!given) continue
    const rows: Row[] = (current[name] || []).map((row: Row) => ({ ...row }))
    for (const item of given) {
      assert.ok(item.key, `${locale} ${name}: every row needs a key`)
      let row = rows.find((r) => r.key === item.key)
      if (!row) {
        assert.equal(locale, 'en', `${name}.${item.key} must be added in English first`)
        row = { key: item.key }
        rows.push(row)
      }
      for (const [field, value] of Object.entries(item))
        if (field !== 'key' && (fields.includes(field) || locale === 'en')) {
          note(locale, `${name}.${item.key}.${field}`, row[field], value)
          row[field] = value
        }
    }
    update[name] = rows
  }
  return update
}

class DryRun extends Error {}
let id: number | string | undefined
try {
  await transaction(cms, `content:${collection}:${bundle.slug}`, async (req) => {
    const read = async (locale: Locale) =>
      (await cms.findByID({
        collection,
        id: id!,
        locale,
        fallbackLocale: false,
        draft: true,
        depth: 0,
        overrideAccess: true,
        req,
      })) as Record<string, any>
    const existing = await cms.find({
      collection,
      where: { slug: { equals: bundle.slug } },
      draft: true,
      limit: 1,
      depth: 0,
      overrideAccess: true,
      req,
    })
    id = existing.docs[0]?.id
    const english = bundle.locales.en || {}
    if (!id) {
      const created = await cms.create({
        collection,
        locale: 'en',
        draft: true,
        data: {
          slug: bundle.slug,
          ...bundle.shared,
          ...localeUpdate('en', {}, english),
          _status: 'draft',
        } as any,
        overrideAccess: true,
        req,
      })
      id = created.id
      changes.push(`en: created ${collection}/${bundle.slug}`)
    } else {
      const current = await read('en')
      for (const [field, value] of Object.entries(bundle.shared || {}))
        note('shared', field, current[field], value)
      await cms.update({
        collection,
        id,
        locale: 'en',
        draft: true,
        data: { ...bundle.shared, ...localeUpdate('en', current, english), _status: 'draft' } as any,
        overrideAccess: true,
        req,
      })
    }
    // Other locales after English, so rows added in English already have their shared ids.
    for (const locale of locales.filter((l) => l !== 'en' && bundle.locales[l])) {
      const update = localeUpdate(locale, await read(locale), bundle.locales[locale]!)
      await cms.update({
        collection,
        id,
        locale,
        draft: true,
        data: { ...update, _status: 'draft' } as any,
        overrideAccess: true,
        req,
      })
    }
    if (!bundle.draftOnly)
      await cms.update({
        collection,
        id,
        locale: 'en',
        data: { _status: 'published' } as any,
        overrideAccess: true,
        req,
      })
    if (!apply) throw new DryRun()
  })
} catch (error) {
  if (!(error instanceof DryRun)) {
    console.log(changes.join('\n'))
    const issues =
      error instanceof APIError ? (error.data as { issues?: string[] } | null)?.issues : undefined
    console.error(issues?.length ? `Publish checks failed:\n- ${issues.join('\n- ')}` : error)
    process.exit(1)
  }
}
console.log(changes.length ? changes.join('\n') : 'No field changes.')
const action = bundle.draftOnly ? 'saved as draft' : 'published in all locales'
console.log(
  apply
    ? `${collection}/${bundle.slug} (id ${id}) ${action}.`
    : `Dry run passed; nothing was written. Re-run with --apply.`,
)
if (apply && revalidate) {
  assert.ok(process.env.CRON_SECRET, 'CRON_SECRET is required to refresh the site cache')
  const response = await fetch(new URL('/api/revalidate', revalidate), {
    method: 'POST',
    headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
    signal: AbortSignal.timeout(15000),
  })
  console.log(
    response.ok ? `Cache refreshed on ${revalidate}.` : `Cache refresh failed: HTTP ${response.status}`,
  )
  if (!response.ok) process.exitCode = 1
} else if (apply && !local)
  console.log(
    'The live site picks the change up within an hour; pass --revalidate=<site URL> to refresh now.',
  )
process.exit(process.exitCode ?? 0)
