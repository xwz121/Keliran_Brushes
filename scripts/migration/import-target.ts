// Import a migration bundle into this site's database without duplicating records or
// overwriting later edits. Usage (local isolated database):
//   node scripts/local-env.mjs pnpm migration:import --plan
//   node scripts/local-env.mjs pnpm migration:import --apply
// A remote target also needs --target-fingerprint=<value printed by --plan>.
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { createLocalReq, getPayload, type PayloadRequest } from 'payload'
import { migrations as repoMigrations } from '../../src/migrations'
import { transaction } from '../../src/lib/transactions'
import {
  appliedMigrations,
  arg,
  bundleFormat,
  canonical,
  contentCollections,
  csv,
  databaseIdentity,
  flag,
  identityFingerprint,
  latestBundleDir,
  relationFields,
  sameDatabase,
  sha256,
  snapshotHash,
  tableExists,
  type Bundle,
  type BundleRecord,
} from './lib'

const apply = flag('apply')
assert.ok(apply || flag('plan'), 'Pass --plan to check and preview, or --apply to import')
Object.assign(process.env, { NODE_ENV: 'production' }) // never push schema into the target
const bundleDir = arg('bundle') || latestBundleDir()
const bundle: Bundle = JSON.parse(await readFile(path.join(bundleDir, 'bundle.json'), 'utf8'))
assert.equal(bundle.format, bundleFormat, 'Unknown bundle format')
const reportDir = arg('report-dir') || bundleDir
const runId = `${new Date().toISOString()}-${randomUUID().slice(0, 8)}`
const config = (await import('../../src/payload.config')).default
const cms = await getPayload({ config })
const fatal: string[] = []
const report: Record<string, any> = { runId, mode: apply ? 'apply' : 'plan', bundle: bundleDir }
const finish = async (code: number) => {
  report.fatal = fatal
  await mkdir(reportDir, { recursive: true })
  await writeFile(
    path.join(reportDir, `import-${apply ? 'apply' : 'plan'}.json`),
    JSON.stringify(report, null, 2),
  )
  console.log(JSON.stringify({ ...report, records: undefined, media: undefined }, null, 2))
  await cms.destroy()
  process.exit(code)
}
try {
  // 1. Is this the right, prepared database? Checked before reading any content.
  const identity = await databaseIdentity(cms)
  const fingerprint = identityFingerprint(identity)
  report.target = { database: identity.database, host: identity.host, fingerprint }
  if (sameDatabase(identity, bundle.source.identity)) fatal.push('The target is the source database.')
  if (!(await tableExists(cms, 'migration_records')))
    fatal.push('The target has no migration ledger: run pnpm migrate against the brushes database first.')
  const host = new URL(process.env.DATABASE_URL!).hostname
  if (['127.0.0.1', 'localhost', '::1'].includes(host)) {
    if (identity.database !== 'keliran_brushes')
      fatal.push(`A local target must be keliran_brushes, not ${identity.database}.`)
  } else if (arg('target-fingerprint') !== fingerprint)
    fatal.push(
      `A remote target needs --target-fingerprint=${fingerprint} (confirm it is the brushes database).`,
    )
  const applied = await appliedMigrations(cms)
  const missing = repoMigrations.map((m) => m.name).filter((n) => !applied.includes(n))
  if (missing.length) fatal.push(`Target migrations missing: ${missing.join(', ')}`)
  if (fatal.length) await finish(1)

  // 2. Ledger; a first import requires an empty target (guards against a production branch copy).
  const ledger = (
    await cms.find({ collection: 'migration-records', pagination: false, depth: 0, overrideAccess: true })
  ).docs
  const byKey = new Map(ledger.map((l) => [l.sourceKey, l]))
  if (!ledger.length)
    for (const collection of [...contentCollections, 'media', 'inquiries'] as const) {
      const n = (await cms.count({ collection, overrideAccess: true })).totalDocs
      if (n) fatal.push(`A first import needs an empty target, but ${collection} has ${n} documents.`)
    }

  // 3. Is the bundle complete? Every file, original and relation must be present.
  const mediaBySource = new Map(bundle.media.map((m) => [m.sourceId, m]))
  const recordBySource = new Map(bundle.records.map((r) => [`${r.collection}:${r.sourceId}`, r]))
  for (const m of bundle.media) {
    const file = path.join(bundleDir, m.file)
    if (!existsSync(file)) fatal.push(`Missing media file ${m.file}`)
    else if (sha256(await readFile(file)) !== m.sha256) fatal.push(`Media file changed: ${m.file}`)
    if (m.original) {
      if (!existsSync(m.original.path)) fatal.push(`Missing approved original ${m.original.path}`)
      else if (sha256(await sharp(m.original.path, { animated: true }).rotate().toBuffer()) !== m.sha256)
        fatal.push(`Approved original no longer reproduces ${m.file}`)
    }
  }
  const relationsOf = (r: BundleRecord) =>
    relationFields(cms, r.collection).flatMap((f) =>
      [r.published, r.draft]
        .filter(Boolean)
        .flatMap((doc) =>
          Array.isArray(doc![f.name]) ? doc![f.name] : doc![f.name] == null ? [] : [doc![f.name]],
        )
        .map((id: number) => ({ field: f, id })),
    )
  for (const r of bundle.records) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(r.slug)) fatal.push(`Invalid slug ${r.collection}/${r.slug}`)
    if (!(r.published || r.draft)?.title?.en) fatal.push(`No English title: ${r.collection}/${r.slug}`)
    for (const { field, id } of relationsOf(r))
      if (
        field.relationTo === 'media'
          ? !mediaBySource.has(id)
          : !recordBySource.has(`${field.relationTo}:${id}`)
      )
        fatal.push(`Missing dependency: ${r.collection}/${r.slug}.${field.name} -> ${field.relationTo}:${id}`)
  }
  const seen = new Set<string>()
  for (const r of bundle.records) {
    const key = `${r.collection}/${r.slug}`
    if (seen.has(key)) fatal.push(`Duplicate slug in bundle: ${key}`)
    seen.add(key)
  }

  // 4. Target state as collection/slug references, and the plan.
  const targetSlug = new Map<string, number>() // collection/slug -> id
  const targetRef = new Map<string, string>() // collection:id -> collection/slug
  const targetMain = new Map<string, any>()
  const targetLatest = new Map<string, any>()
  const readTarget = async (req?: PayloadRequest) => {
    for (const collection of contentCollections) {
      const base = {
        collection,
        locale: 'all' as const,
        depth: 0,
        pagination: false,
        overrideAccess: true,
        req,
      }
      for (const doc of (await cms.find(base)).docs as any[]) {
        targetSlug.set(`${collection}/${doc.slug}`, doc.id)
        targetRef.set(`${collection}:${doc.id}`, `${collection}/${doc.slug}`)
        targetMain.set(`${collection}:${doc.id}`, doc)
      }
      for (const doc of (await cms.find({ ...base, draft: true })).docs as any[])
        targetLatest.set(`${collection}:${doc.id}`, doc)
    }
  }
  await readTarget()
  // Media are compared by the source file hash recorded in the ledger.
  const mediaSha = new Map<number, string>()
  const mediaTarget = new Map<number, number>()
  for (const l of ledger)
    if (l.sourceCollection === 'media') {
      mediaSha.set(Number(l.targetId), (l.evidence as any)?.sourceSha256)
      mediaTarget.set(Number(l.sourceId), Number(l.targetId))
    }
  const resolveTarget = (collection: string, id: unknown) =>
    collection === 'media'
      ? mediaSha.has(Number(id))
        ? `media:${mediaSha.get(Number(id))}`
        : undefined
      : targetRef.get(`${collection}:${id}`)
  const targetHash = (collection: string, id: number) => {
    const main = targetMain.get(`${collection}:${id}`)
    if (!main) return null
    const newest = targetLatest.get(`${collection}:${id}`)
    const published = main._status === 'published' ? main : null
    const draft = newest && (!published || newest.updatedAt !== published.updatedAt) ? newest : null
    const fields = relationFields(cms, collection)
    return snapshotHash(canonical(published, fields, resolveTarget), canonical(draft, fields, resolveTarget))
  }
  type Step = {
    record: BundleRecord
    action: 'create' | 'update' | 'skip' | 'conflict'
    reason?: string
    targetId?: number
  }
  const plan: Step[] = bundle.records.map((record) => {
    const entry = byKey.get(record.sourceKey)
    if (!entry) {
      const existing = targetSlug.get(`${record.collection}/${record.slug}`)
      return existing
        ? { record, action: 'conflict', reason: 'exists in target but was not imported', targetId: existing }
        : { record, action: 'create' }
    }
    const targetId = Number(entry.targetId)
    const current = targetHash(record.collection, targetId)
    if (current === null) return { record, action: 'conflict', reason: 'deleted in target', targetId }
    if (current !== entry.importedHash)
      return { record, action: 'conflict', reason: 'edited in target', targetId }
    if (entry.sourceHash === record.sourceHash) return { record, action: 'skip', targetId }
    return { record, action: 'update', targetId }
  })
  const bundleKeys = new Set([
    ...bundle.records.map((r) => r.sourceKey),
    ...bundle.media.map((m) => m.sourceKey),
  ])
  report.removedInSource = ledger
    .filter(
      (l) =>
        !l.sourceKey.startsWith('global:') &&
        !l.sourceKey.startsWith('glossary:') &&
        !bundleKeys.has(l.sourceKey),
    )
    .map((l) => l.sourceKey)
  const newMedia = bundle.media.filter((m) => !byKey.has(m.sourceKey))
  report.counts = {
    create: plan.filter((p) => p.action === 'create').length,
    update: plan.filter((p) => p.action === 'update').length,
    skip: plan.filter((p) => p.action === 'skip').length,
    conflict: plan.filter((p) => p.action === 'conflict').length,
    mediaCreate: newMedia.length,
    mediaKept: bundle.media.length - newMedia.length,
    removedInSource: report.removedInSource.length,
  }
  report.conflicts = plan
    .filter((p) => p.action === 'conflict')
    .map((p) => ({
      record: `${p.record.collection}/${p.record.slug}`,
      reason: p.reason,
      targetId: p.targetId,
    }))
  report.records = plan.map((p) => ({
    record: `${p.record.collection}/${p.record.slug}`,
    action: p.action,
    reason: p.reason,
    evidence: p.record.evidence.status,
  }))
  await mkdir(reportDir, { recursive: true })
  await writeFile(
    path.join(reportDir, `import-${apply ? 'apply' : 'plan'}.csv`),
    csv([
      ['collection', 'slug', 'action', 'reason', 'evidence'],
      ...plan.map((p) => [p.record.collection, p.record.slug, p.action, p.reason, p.record.evidence.status]),
    ]),
  )
  if (fatal.length || !apply) await finish(fatal.length ? 1 : 0)

  // 5. Media first: uploads go to storage and cannot join the database transaction, so each
  // upload records its own ledger row and a re-run continues where an interrupted run stopped.
  const date = new Date().toISOString().slice(0, 10)
  report.media = []
  for (const m of newMedia) {
    const filePath = m.original ? m.original.path : path.join(bundleDir, m.file)
    const sourceNote = [
      m.sourceNote,
      `Migrated from keliran.com media ${m.sourceId} (SHA256 ${m.sha256}) on ${date}; ${
        m.original
          ? `uploaded from approved original ${m.original.path}`
          : 're-encoded copy of the production file — check visually'
      }.`,
    ]
      .filter(Boolean)
      .join('\n')
    const created = await cms.create({
      collection: 'media',
      locale: 'en',
      filePath,
      data: { alt: m.alt.en || '', illustrative: m.illustrative, approved: m.approved, sourceNote },
      overrideAccess: true,
      context: { skipRevalidation: true },
    })
    const current = await cms.findByID({
      collection: 'media',
      id: created.id,
      locale: 'all',
      depth: 0,
      overrideAccess: true,
    })
    await cms.db.updateOne({
      collection: 'media',
      id: created.id,
      data: { ...current, alt: m.alt },
      req: await createLocalReq({}, cms),
    })
    const stored = process.env.R2_BUCKET
      ? Buffer.from(await (await fetch(created.url!, { signal: AbortSignal.timeout(30000) })).arrayBuffer())
      : await readFile(path.join('media', created.filename!))
    const storedSha = sha256(stored)
    if (m.original) assert.equal(storedSha, m.sha256, `Stored image differs from the source: ${m.file}`)
    await cms.create({
      collection: 'migration-records',
      overrideAccess: true,
      data: {
        sourceKey: m.sourceKey,
        sourceCollection: 'media',
        sourceId: String(m.sourceId),
        sourceSlug: m.original?.slug,
        targetCollection: 'media',
        targetId: String(created.id),
        sourceHash: m.sha256,
        importedHash: storedSha,
        runId,
        evidenceStatus: m.original ? 'approved-original' : 'reencoded-copy',
        evidence: {
          sourceSha256: m.sha256,
          storedSha256: storedSha,
          original: m.original,
          approved: m.approved,
        },
      },
    })
    mediaSha.set(created.id, m.sha256)
    mediaTarget.set(m.sourceId, created.id)
    report.media.push({
      source: m.sourceId,
      target: created.id,
      original: m.original?.path || null,
      identical: storedSha === m.sha256,
    })
  }

  // 6. Content, site settings and glossary in one transaction.
  const writes = plan.filter((p) => p.action === 'create' || p.action === 'update')
  const verified = await transaction(cms, `brushes-migration:${runId}`, async (req) => {
    const idFor = new Map<string, number>()
    for (const l of ledger)
      if (l.sourceCollection !== 'media') idFor.set(`${l.sourceCollection}:${l.sourceId}`, Number(l.targetId))
    const targetFor = (collection: string, id: number) => {
      if (collection === 'media') return mediaTarget.get(id)
      const mapped = idFor.get(`${collection}:${id}`)
      if (mapped) return mapped
      const record = recordBySource.get(`${collection}:${id}`)
      return record ? targetSlug.get(`${collection}/${record.slug}`) : undefined
    }
    const forWrite = (record: BundleRecord, doc: Record<string, any>) => {
      const { id: _id, ...data } = structuredClone(doc)
      for (const f of relationFields(cms, record.collection)) {
        const values = Array.isArray(data[f.name]) ? data[f.name] : data[f.name] == null ? [] : [data[f.name]]
        const mapped = values.map((id: number) => {
          const target = targetFor(f.relationTo, id)
          assert.ok(
            target,
            `Unresolved relation ${record.collection}/${record.slug}.${f.name} -> ${f.relationTo}:${id}`,
          )
          return target
        })
        data[f.name] = f.hasMany ? mapped : (mapped[0] ?? null)
      }
      return data
    }
    // Pass 1: create the new documents without relations, so every target ID is known.
    for (const step of writes.filter((p) => p.action === 'create')) {
      const { record } = step
      const base = structuredClone(record.published || record.draft)!
      delete base.id
      for (const f of relationFields(cms, record.collection)) base[f.name] = f.hasMany ? [] : null
      base._status = record.published ? 'published' : 'draft'
      const doc = await cms.db.create({ collection: record.collection, data: base, req })
      idFor.set(`${record.collection}:${record.sourceId}`, Number(doc.id))
      step.targetId = Number(doc.id)
    }
    // Pass 2: complete documents (adapter writes replace arrays and relations) and versions.
    for (const step of writes) {
      const { record } = step
      const id = step.targetId!
      const published = record.published ? forWrite(record, record.published) : null
      const draft = record.draft ? forWrite(record, record.draft) : null
      await cms.db.updateOne({ collection: record.collection, id, data: published || draft!, req })
      for (const [version, status] of [
        [published, 'published'],
        [draft, 'draft'],
      ] as const)
        if (version)
          await cms.db.createVersion({
            collectionSlug: record.collection,
            parent: id,
            versionData: { ...structuredClone(version), _status: status } as any,
            createdAt: version.createdAt,
            updatedAt: version.updatedAt,
            autosave: false,
            req,
            returning: false,
          })
    }
    // Read back and record what was written; an unchanged copy must hash like its source.
    targetSlug.clear()
    targetRef.clear()
    targetMain.clear()
    targetLatest.clear()
    await readTarget(req)
    let identical = 0
    for (const step of writes) {
      const { record } = step
      const importedHash = targetHash(record.collection, step.targetId!)!
      assert.equal(
        importedHash,
        record.sourceHash,
        `${record.collection}/${record.slug} was not copied faithfully; the transaction is rolled back`,
      )
      identical++
      const data = {
        sourceKey: record.sourceKey,
        sourceCollection: record.collection,
        sourceId: String(record.sourceId),
        sourceSlug: record.slug,
        targetCollection: record.collection,
        targetId: String(step.targetId),
        sourceHash: record.sourceHash,
        importedHash,
        runId,
        evidenceStatus: record.evidence.status,
        evidence: record.evidence,
      }
      const existing = byKey.get(record.sourceKey)
      if (existing)
        await cms.update({
          collection: 'migration-records',
          id: existing.id,
          data,
          overrideAccess: true,
          req,
        })
      else await cms.create({ collection: 'migration-records', data, overrideAccess: true, req })
    }
    // Company details are copied once, into an empty settings record only.
    const settings = bundle.globals['site-settings']
    if (settings && !byKey.has('global:site-settings')) {
      const current: any = await cms.findGlobal({
        slug: 'site-settings',
        depth: 0,
        overrideAccess: true,
        req,
      })
      const filled = Object.entries(current).some(
        ([k, v]) => !['id', 'globalType', 'createdAt', 'updatedAt'].includes(k) && v != null && v !== '',
      )
      if (filled) report.siteSettings = 'kept existing target values'
      else {
        const { id: _id, globalType: _g, createdAt: _c, updatedAt: _u, ...data } = settings
        await cms.updateGlobal({ slug: 'site-settings', data, overrideAccess: true, req })
        await cms.create({
          collection: 'migration-records',
          overrideAccess: true,
          req,
          data: {
            sourceKey: 'global:site-settings',
            sourceCollection: 'site-settings',
            sourceId: 'site-settings',
            targetCollection: 'site-settings',
            targetId: 'site-settings',
            sourceHash: snapshotHash(data, null),
            importedHash: snapshotHash(data, null),
            runId,
          },
        })
        report.siteSettings = 'copied'
      }
    }
    let glossary = 0
    for (const term of bundle.glossary) {
      const key = `glossary:${term.id}`
      if (byKey.has(key)) continue
      const exists = await cms.find({
        collection: 'glossary',
        where: { term: { equals: term.term } },
        limit: 1,
        overrideAccess: true,
        req,
      })
      if (exists.totalDocs) continue
      const { id: _id, createdAt: _c, updatedAt: _u, ...data } = term
      const created = await cms.create({
        collection: 'glossary',
        data: data as any,
        overrideAccess: true,
        req,
      })
      await cms.create({
        collection: 'migration-records',
        overrideAccess: true,
        req,
        data: {
          sourceKey: key,
          sourceCollection: 'glossary',
          sourceId: String(term.id),
          sourceSlug: term.term,
          targetCollection: 'glossary',
          targetId: String(created.id),
          sourceHash: snapshotHash(data, null),
          importedHash: snapshotHash(data, null),
          runId,
        },
      })
      glossary++
    }
    report.glossaryCreated = glossary
    return identical
  })
  report.verifiedIdentical = verified
  await finish(0)
} catch (error) {
  fatal.push(error instanceof Error ? error.message : String(error))
  await finish(1)
}
