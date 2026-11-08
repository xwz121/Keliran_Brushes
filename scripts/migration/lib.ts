// Shared pieces of the keliran.com → brushes.keliran.com content migration.
// See scripts/migration/README.md for the procedure and its guards.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import type { Payload, PayloadRequest } from 'payload'
import { sql } from '@payloadcms/db-postgres'
import { hash } from '../../src/lib/content-checks'
import { locales, type Locale } from '../../src/lib/locales'

export const bundleFormat = 'keliran.brushes-migration.v1'
// The keliran.com schema this export understands. A source with any other migration
// history stops the export instead of copying a structure we have not reviewed.
export const sourceMigrations = [
  '20260915_072726_initial',
  '20260916_072505_r2_media_prefix',
  '20260916_083601_traditional_chinese',
  '20260923_220302_redesign_two_lines',
  '20260923_231224_release_contacts',
  '20260924_112728_inquiry_attribution',
]
// keliran.com migrations that may follow the list above. They drop the AI translation records and
// add enquiry email columns, none of which this export reads, so it runs before or after them.
export const optionalSourceMigrations = ['20261108_131736_postmark_autoreply']
export function acceptedSourceMigrations(applied: string[]) {
  const extra = applied.slice(sourceMigrations.length)
  return (
    sourceMigrations.every((name, i) => applied[i] === name) &&
    extra.every((name, i) => name === optionalSourceMigrations[i])
  )
}
export const exportLines = ['brushes', 'both'] as const
export const lineCollections = [
  'products',
  'categories',
  'materials',
  'applications',
  'solutions',
  'cases',
  'guides',
  'faqs',
] as const
export const contentCollections = [...lineCollections, 'pages'] as const
export type ContentCollection = (typeof contentCollections)[number]
export const releaseDir = 'content/release-20260924'
export const sourceSite = 'https://keliran.com'
export const targetSite = 'https://brushes.keliran.com'

export type RelationField = { name: string; relationTo: string; hasMany: boolean }
export type Ref = { collection: string; slug: string; line?: string | null }
export type BundleMedia = {
  sourceKey: string
  sourceId: number
  filename: string
  prefix?: string | null
  mimeType?: string | null
  sha256: string
  file: string
  alt: Record<string, string | null>
  illustrative: boolean
  approved: boolean
  sourceNote?: string | null
  // An approved original in this repository whose Payload re-encoding equals the source bytes.
  original?: { path: string; slug: string; approval: string } | null
}
export type BundleRecord = {
  sourceKey: string
  collection: ContentCollection
  sourceId: number
  slug: string
  line: string | null
  published: Record<string, any> | null
  draft: Record<string, any> | null
  sourceHash: string
  evidence: Evidence
}
export type Evidence = {
  status: 'release-20260924' | 'needs-review'
  differences: string[]
  // Only in bundles exported before keliran.com removed its AI translation records.
  translationRuns?: { id: number; status: string; releasedAt?: string | null }[]
}
export type Bundle = {
  format: string
  exportedAt: string
  source: { site: string; identity: DatabaseIdentity; migrations: string[] }
  records: BundleRecord[]
  media: BundleMedia[]
  globals: { 'site-settings': Record<string, any> | null }
  glossary: Record<string, any>[]
  dropped: { from: string; field: string; to: string; toLine: string | null }[]
  sealingMentions: { record: string; field: string; excerpt: string }[]
}

export const sha256 = (data: Buffer | string) => createHash('sha256').update(data).digest('hex')
export const sourceKey = (collection: string, id: number | string) => `${collection}:${id}`
export const refKey = (ref: Ref) => `${ref.collection}/${ref.slug}`

// Top-level relationship/upload fields of a collection, read from the Payload config.
export function relationFields(cms: Payload, collection: string): RelationField[] {
  const config = cms.collections[collection as keyof typeof cms.collections]?.config
  assert.ok(config, `Unknown collection ${collection}`)
  return config.fields.flatMap((f: any) =>
    (f.type === 'relationship' || f.type === 'upload') && typeof f.relationTo === 'string'
      ? [{ name: f.name, relationTo: f.relationTo, hasMany: Boolean(f.hasMany) }]
      : [],
  )
}

const idOf = (value: unknown) =>
  value && typeof value === 'object' && 'id' in value ? (value as { id: number }).id : value

// A database-independent view of a document for change detection: no IDs or timestamps,
// relations as collection/slug (media as its file hash), array rows without row IDs,
// and empty values dropped so a blank locale equals a missing one.
export function canonical(
  doc: Record<string, any> | null,
  fields: RelationField[],
  resolve: (collection: string, id: unknown) => string | undefined,
) {
  if (!doc) return null
  const out: Record<string, any> = {}
  for (const [key, value] of Object.entries(doc)) {
    if (['id', 'createdAt', 'updatedAt', 'parent', 'latest', 'autosave'].includes(key)) continue
    const relation = fields.find((f) => f.name === key)
    if (relation) {
      const list = (Array.isArray(value) ? value : value == null ? [] : [value])
        .map((item) => resolve(relation.relationTo, idOf(item)))
        .filter(Boolean)
      out[key] = relation.hasMany ? list : (list[0] ?? null)
      continue
    }
    out[key] = value
  }
  return prune(out)
}
function prune(value: any): any {
  if (Array.isArray(value)) return value.map((row) => prune(stripRowId(row))).filter((v) => v !== undefined)
  if (value && typeof value === 'object') {
    const entries = Object.entries(value)
      .map(([k, v]) => [k, prune(v)] as const)
      .filter(([, v]) => v !== undefined)
    return entries.length ? Object.fromEntries(entries) : undefined
  }
  return value === null || value === '' ? undefined : value
}
function stripRowId(row: any) {
  if (row && typeof row === 'object' && !Array.isArray(row) && 'id' in row) {
    const { id: _id, ...rest } = row
    return rest
  }
  return row
}
export const snapshotHash = (published: unknown, draft: unknown) =>
  hash({ published: published ?? null, draft: draft ?? null })

// ---------------------------------------------------------------------------------------
// Database identity and guards

export type DatabaseIdentity = {
  database: string
  systemIdentifier: string | null
  neonTimeline: string | null
  neonEndpoint: string | null
  // Address and port the server itself reports. Alibaba RDS gives ordinary accounts no access to
  // the system identifier, and its public and internal endpoints use different host names.
  serverAddress: string | null
  host: string
}
async function query<T = any>(cms: Payload, text: ReturnType<typeof sql>, req?: PayloadRequest) {
  const id = req ? await req.transactionID : undefined
  const db: any = id ? cms.db.sessions?.[id as string]?.db : (cms.db as any).drizzle
  assert.ok(db, 'No database handle')
  const result = await db.execute(text)
  return (result.rows || result) as T[]
}
const optional = async (cms: Payload, text: ReturnType<typeof sql>, req?: PayloadRequest) => {
  try {
    const rows = await query<{ value: string }>(cms, text, req)
    return rows[0]?.value ? String(rows[0].value) : null
  } catch {
    return null
  }
}
// Server-side identity: the same database reached through another host name or role
// (public or internal endpoint, connection pooler, read-only account) reports the same values.
export async function databaseIdentity(cms: Payload, req?: PayloadRequest): Promise<DatabaseIdentity> {
  const [row] = await query<{ database: string }>(cms, sql`select current_database() as database`, req)
  return {
    database: row.database,
    systemIdentifier: await optional(
      cms,
      sql`select system_identifier::text as value from pg_control_system()`,
      req,
    ),
    neonTimeline: await optional(cms, sql`select current_setting('neon.timeline_id', true) as value`, req),
    neonEndpoint: await optional(cms, sql`select current_setting('neon.endpoint_id', true) as value`, req),
    serverAddress: await optional(
      cms,
      sql`select inet_server_addr()::text || ':' || inet_server_port()::text as value`,
      req,
    ),
    host: new URL(process.env.DATABASE_URL!).hostname,
  }
}
export const identityFingerprint = (identity: DatabaseIdentity) =>
  sha256(
    JSON.stringify([identity.database, identity.host, identity.systemIdentifier, identity.neonTimeline]),
  ).slice(0, 16)
export function sameDatabase(a: DatabaseIdentity, b: DatabaseIdentity) {
  if (a.database !== b.database) return false
  // Strongest identifier available on both sides first. A Neon branch keeps the system identifier
  // but gets its own timeline; on Alibaba RDS usually only the server address is readable.
  for (const key of ['neonTimeline', 'systemIdentifier', 'serverAddress'] as const)
    if (a[key] && b[key]) return a[key] === b[key]
  // Without any server identifier, the same name on the same host is the same database.
  return a.host === b.host
}
export async function tableExists(cms: Payload, table: string, req?: PayloadRequest) {
  const [row] = await query<{ name: string | null }>(
    cms,
    sql`select to_regclass(${`public.${table}`})::text as name`,
    req,
  )
  return Boolean(row?.name)
}
export async function appliedMigrations(cms: Payload, req?: PayloadRequest) {
  if (!(await tableExists(cms, 'payload_migrations', req))) return []
  const rows = await query<{ name: string }>(
    cms,
    sql`select name from payload_migrations where name <> 'dev' order by name`,
    req,
  )
  return rows.map((r) => r.name)
}
export async function readOnlySetting(cms: Payload, req: PayloadRequest) {
  const [row] = await query<{ value: string }>(cms, sql`show transaction_read_only`, req)
  return (row as any)?.transaction_read_only ?? (row as any)?.value
}

// ---------------------------------------------------------------------------------------
// Review evidence carried by content/release-20260924 (text keyed by its English hash)

const textKey = (text: string) => hash(text).slice(0, 20)
let release: Record<Locale, Record<string, string>> | undefined
function releaseTexts() {
  release ||= Object.fromEntries(
    locales.map((l) => [l, JSON.parse(readFileSync(path.join(releaseDir, `${l}.json`), 'utf8'))]),
  ) as Record<Locale, Record<string, string>>
  return release
}
const textFields = ['title', 'summary', 'description', 'seoTitle', 'seoDescription']
// Localised strings of a document as [path, {locale: text}] pairs.
export function localisedTexts(doc: Record<string, any>) {
  const out: [string, Record<string, string>][] = []
  for (const f of textFields) if (doc[f] && typeof doc[f] === 'object') out.push([f, doc[f]])
  for (const [i, s] of (doc.sections || []).entries())
    for (const f of ['heading', 'text'])
      if (s?.[f] && typeof s[f] === 'object') out.push([`sections.${i}.${f}`, s[f]])
  for (const [i, s] of (doc.specifications || []).entries())
    if (s?.label && typeof s.label === 'object') out.push([`specifications.${i}.label`, s.label])
  return out
}
// A copied text keeps its review evidence only if the English and every translation
// are exactly the reviewed final texts. Anything else is listed for review.
export function releaseEvidence(doc: Record<string, any> | null): string[] {
  if (!doc) return []
  const dictionaries = releaseTexts()
  const differences: string[] = []
  for (const [field, values] of localisedTexts(doc)) {
    const en = values.en || ''
    if (!en) continue
    const key = textKey(en)
    if (dictionaries.en[key] !== en) {
      differences.push(`${field}: English not in reviewed release`)
      continue
    }
    for (const locale of locales)
      if (locale !== 'en' && (values[locale] || '') !== (dictionaries[locale][key] || ''))
        differences.push(`${field}.${locale}`)
  }
  return differences
}

type ReleaseMedia = { slug: string; sourcePath: string; approval: string; sha256: string }
let originals: Map<string, ReleaseMedia> | undefined
// Payload re-encodes uploads with sharp({ animated: true }).rotate(); the production object is
// that re-encoding of an approved original. Index originals by the hash of that re-encoding.
export async function releaseOriginals() {
  if (originals) return originals
  originals = new Map()
  const media: ReleaseMedia[] = JSON.parse(readFileSync(path.join(releaseDir, 'media.json'), 'utf8'))
  for (const asset of media) {
    if (!existsSync(asset.sourcePath)) continue
    assert.equal(
      sha256(readFileSync(asset.sourcePath)),
      asset.sha256,
      `Original changed: ${asset.sourcePath}`,
    )
    const encoded = await sharp(asset.sourcePath, { animated: true }).rotate().toBuffer()
    originals.set(sha256(encoded), asset)
  }
  return originals
}

export function latestBundleDir(root = '.local/migration') {
  assert.ok(existsSync(root), `No exports in ${root}`)
  const dirs = readdirSync(root)
    .filter((d) => existsSync(path.join(root, d, 'bundle.json')))
    .sort()
  assert.ok(dirs.length, `No bundle.json under ${root}`)
  return path.join(root, dirs[dirs.length - 1])
}
export const arg = (name: string) =>
  process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3)
export const flag = (name: string) => process.argv.includes(`--${name}`)

export function csv(rows: (string | number | null | undefined)[][]) {
  return (
    rows
      .map((row) =>
        row.map((cell) => {
          const text = cell == null ? '' : String(cell)
          return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
        }),
      )
      .map((r) => r.join(','))
      .join('\n') + '\n'
  )
}
