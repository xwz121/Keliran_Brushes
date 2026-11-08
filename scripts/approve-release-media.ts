import 'dotenv/config'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { getPayload } from 'payload'
import { locales } from '../src/lib/locales'
import { transaction } from '../src/lib/transactions'

// Approval applies only to the owner's explicitly approved current illustrations.
// Production media registration/import is a separate, backed-up release operation.
const target = new URL(process.env.DATABASE_URL!)
assert.ok(['localhost', '127.0.0.1'].includes(target.hostname))
assert.equal(target.pathname, '/keliran_redesign')
Object.assign(process.env, { NODE_ENV: 'production' })
const approvals = JSON.parse(await readFile('content/release-20260924/media.json', 'utf8'))
for (const item of approvals)
  assert.equal(
    createHash('sha256')
      .update(await readFile(item.sourcePath))
      .digest('hex'),
    item.sha256,
    `Approved source image changed: ${item.slug}`,
  )
const config = (await import('../src/payload.config')).default
const cms = await getPayload({ config })
try {
  const media = (await cms.find({ collection: 'media', locale: 'all', pagination: false, depth: 0 })).docs
  await mkdir('.local/release', { recursive: true, mode: 0o700 })
  const backup = `.local/release/media-before-${Date.now()}.json`
  await writeFile(backup, JSON.stringify(media), { mode: 0o600 })
  const result = await transaction(cms, '20260924-owner-media-approval', async (req) => {
    const approved = []
    for (const item of approvals) {
      const token = item.slug === 'components-hero' ? '/ components-hero.' : `/ ${item.slug} /`
      const candidates = media.filter((m) => m.sourceNote?.includes(token))
      assert.equal(candidates.length, 1, `Ambiguous or missing media: ${item.slug}`)
      const existing = candidates[0]
      for (const locale of locales) {
        assert.ok(item.alt[locale]?.trim(), `Missing ${locale} alt for ${item.slug}`)
        await cms.update({
          collection: 'media',
          id: existing.id,
          locale,
          req,
          data: {
            alt: item.alt[locale],
            approved: true,
            illustrative: true,
            sourceNote: `${existing.sourceNote?.split('\nOwner approval:')[0]}\nOwner approval: ${item.approval}`,
          },
        })
      }
      const saved = await cms.findByID({ collection: 'media', id: existing.id, locale: 'all', req })
      assert.equal(saved.approved, true)
      for (const locale of locales) assert.equal((saved.alt as any)[locale], item.alt[locale])
      approved.push({ slug: item.slug, id: existing.id })
    }
    return approved
  })
  await writeFile(
    '.local/release/media-approval-result.json',
    JSON.stringify({ completedAt: new Date().toISOString(), backup, approved: result, locales }, null, 2),
  )
  console.log(
    JSON.stringify({ approved: result.length, locales: locales.length, environment: 'isolated-local' }),
  )
} finally {
  await cms.destroy()
}
process.exit(0)
