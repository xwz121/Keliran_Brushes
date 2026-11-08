import assert from 'node:assert/strict'
import { getPayload } from 'payload'
import { sql } from '@payloadcms/db-postgres'
import { transaction } from '../src/lib/transactions'
import { legacyContent } from '../src/lib/legacy-content'
import { releaseHash } from './lib/vercel-release'

export async function retireLegacyContent() {
  const cms = await getPayload({ config: (await import('../src/payload.config')).default })
  try {
    await transaction(cms, '20260924-retire-legacy-content', async (req) => {
      const retired: string[] = []
      for (const [collection, slug] of legacyContent) {
        const { docs } = await cms.find({
          collection,
          where: { slug: { equals: slug } },
          locale: 'en',
          depth: 0,
          pagination: false,
          overrideAccess: true,
          req,
        })
        assert.ok(docs.length <= 1, `Ambiguous legacy entry ${collection}/${slug}`)
        if (!docs.length) continue
        if (collection === 'categories') {
          const linked = await cms.count({
            collection: 'products',
            where: { category: { equals: docs[0].id } },
            overrideAccess: true,
            req,
          })
          assert.equal(linked.totalDocs, 0, `Category still referenced: ${slug}`)
        }
        if (docs[0]._status === 'published')
          await cms.update({
            collection,
            id: docs[0].id,
            data: { _status: 'draft' },
            draft: false,
            locale: 'en',
            overrideAccess: true,
            req,
          })
        const saved = await cms.findByID({
          collection,
          id: docs[0].id,
          locale: 'en',
          depth: 0,
          draft: false,
          overrideAccess: true,
          req,
        })
        assert.equal(saved._status, 'draft')
        retired.push(`${collection}/${slug}`)
      }
      const id = await req.transactionID
      assert.ok(id !== undefined && id !== null)
      const session = cms.db.sessions?.[id]
      assert.ok(session)
      await (session.db as { execute: (q: ReturnType<typeof sql>) => Promise<unknown> }).execute(sql`
        UPDATE public._keliran_release_20260924_state
        SET result = result || ${JSON.stringify({ legacyRetiredAt: new Date().toISOString(), retired })}::jsonb
        WHERE manifest_hash = ${releaseHash} AND completed_at IS NOT NULL
      `)
      console.log(JSON.stringify({ release: 'superseded-entries-retired', retainedAsDraft: retired.length }))
    })
  } finally {
    await cms.destroy()
  }
}
