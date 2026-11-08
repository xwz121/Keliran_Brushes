import 'dotenv/config'
import { afterAll, beforeAll, describe, it, expect, vi } from 'vitest'
import { randomUUID } from 'node:crypto'
import type { Payload } from 'payload'
const fake = vi.hoisted(() => ({ calls: 0, fail: false }))
vi.mock('openai', () => ({
  default: class {
    responses = {
      parse: async (args: any) => {
        fake.calls++
        if (fake.fail) throw Error('Test provider unavailable')
        const data = JSON.parse(args.input)
        return {
          model: args.model,
          id: 'test-response',
          usage: { input_tokens: 10, output_tokens: 10 },
          output_parsed:
            args.text.format.name === 'translation'
              ? {
                  fields: Object.entries(data.source).map(([key, text]) => ({
                    key,
                    text: text ? `${data.targetLanguage}: ${text}` : '',
                  })),
                }
              : { passed: true, issues: [] },
        }
      },
    }
  },
}))
import { startTranslation, runTranslationStep, publishRun } from '../src/lib/ai/workflow'
import { issueSession } from '../src/lib/inquiry-session'
import { acceptInquiry } from '../src/lib/inquiries'
import { locales, localeNames } from '../src/lib/locales'

describe.runIf(process.env.RUN_INTEGRATION === 'true')(
  'real PostgreSQL / Payload integration (local fixtures only)',
  () => {
    let cms: Payload
    const documents: number[] = []
    const runs: number[] = []
    const inquiries: number[] = []
    const marker = `test-${randomUUID()}`
    beforeAll(async () => {
      if (!process.env.DATABASE_URL?.includes('127.0.0.1'))
        throw Error('Integration tests require the local database')
      if (process.env.DEPLOYMENT_ENV === 'production' || process.env.VERCEL_ENV === 'production')
        throw Error('Integration tests cannot run in a production environment')
      for (const key of [
        'RESEND_API_KEY',
        'EMAIL_FROM',
        'SALES_EMAIL',
        'TURNSTILE_SECRET_KEY',
        'NEXT_PUBLIC_TURNSTILE_SITE_KEY',
        'R2_BUCKET',
        'R2_ENDPOINT',
        'R2_ACCESS_KEY_ID',
        'R2_SECRET_ACCESS_KEY',
        'R2_PUBLIC_URL',
      ])
        vi.stubEnv(key, '')
      vi.stubEnv('OPENAI_API_KEY', 'test-only-no-network')
      const { getPayload } = await import('payload')
      const config = (await import('../src/payload.config')).default
      cms = await getPayload({ config })
    }, 60000)
    afterAll(async () => {
      if (cms) {
        const jobs = await cms.find({ collection: 'payload-jobs', limit: 1000 })
        for (const job of jobs.docs)
          if (runs.includes((job.input as any)?.runId))
            await cms.delete({ collection: 'payload-jobs', id: job.id })
        for (const id of runs) await cms.delete({ collection: 'translation-runs', id })
        for (const id of documents) await cms.delete({ collection: 'categories', id })
        for (const id of inquiries) await cms.delete({ collection: 'inquiries', id })
        await cms.destroy()
      }
      vi.unstubAllEnvs()
    }, 60000)
    async function source() {
      const d = await cms.create({
        collection: 'categories',
        locale: 'en',
        draft: true,
        data: {
          slug: `${marker}-${documents.length}`,
          title: 'FKM O-ring 25 mm',
          summary: 'A ring for a defined application.',
          description: 'Dimensions and compound must be confirmed.',
          factsConfirmed: true,
        },
      })
      documents.push(d.id)
      return d
    }
    async function runAll(id: number) {
      for (let step = 0; step < 15; step++) {
        const r = await cms.findByID({ collection: 'translation-runs', id })
        if (!['running', 'queued'].includes(r.status!)) return r
        for (const locale of locales) {
          const result = (r.results as any)[locale]
          if (!['passed', 'failed'].includes(result.stage))
            await runTranslationStep(cms, { runId: id, locale, stage: result.stage, round: result.round })
        }
      }
      throw Error('Pipeline did not finish')
    }
    it('hides drafts and internal records from anonymous reads', async () => {
      const d = await source()
      const result = await cms.find({
        collection: 'categories',
        where: { id: { equals: d.id } },
        overrideAccess: false,
      })
      expect(result.docs).toHaveLength(0)
      await expect(cms.find({ collection: 'inquiries', overrideAccess: false })).rejects.toThrow()
    }, 20000)
    it('deduplicates jobs, survives rollback, and publishes all locales together', async () => {
      const d = await source()
      const run = await startTranslation(cms, 'categories', d.id)
      runs.push(run.id)
      const same = await startTranslation(cms, 'categories', d.id)
      expect(same.id).toBe(run.id)
      expect((await runAll(run.id)).status).toBe('passed')
      const original = cms.update.bind(cms)
      const spy = vi.spyOn(cms, 'update').mockImplementation((async (args: any) => {
        if (args.collection === 'categories' && args.locale === 'it') throw Error('Test interruption')
        return original(args)
      }) as any)
      await expect(publishRun(cms, run.id)).rejects.toThrow('Test interruption')
      spy.mockRestore()
      expect(
        (await cms.find({ collection: 'categories', where: { id: { equals: d.id } }, overrideAccess: false }))
          .docs,
      ).toHaveLength(0)
      expect((await cms.findByID({ collection: 'translation-runs', id: run.id })).status).toBe('passed')
      await publishRun(cms, run.id)
      for (const locale of locales) {
        const read = await cms.findByID({ collection: 'categories', id: d.id, locale, overrideAccess: false })
        expect(read.title).toContain('FKM O-ring 25 mm')
        expect(read._status).toBe('published')
        if (locale !== 'en') expect(read.title).toBe(`${localeNames[locale]}: FKM O-ring 25 mm`)
      }
    }, 60000)
    it('rejects a release after the reviewed source changes', async () => {
      const d = await source()
      const run = await startTranslation(cms, 'categories', d.id)
      runs.push(run.id)
      await runAll(run.id)
      await cms.update({
        collection: 'categories',
        id: d.id,
        locale: 'en',
        draft: true,
        data: { summary: 'Changed after review', _status: 'draft' },
      })
      await expect(publishRun(cms, run.id)).rejects.toThrow('已改变')
    }, 60000)
    it('does not overwrite an edited source with a stale queued result', async () => {
      const d = await source()
      const run = await startTranslation(cms, 'categories', d.id)
      runs.push(run.id)
      await cms.update({
        collection: 'categories',
        id: d.id,
        locale: 'en',
        draft: true,
        data: { title: 'Changed source', _status: 'draft' },
      })
      await runTranslationStep(cms, { runId: run.id, locale: 'fr', stage: 'translate' })
      expect((await cms.findByID({ collection: 'translation-runs', id: run.id })).status).toBe('stale')
    }, 20000)
    it('marks a run failed when native job retries are exhausted', async () => {
      const d = await source()
      const run = await startTranslation(cms, 'categories', d.id)
      runs.push(run.id)
      const jobs = await cms.find({ collection: 'payload-jobs', limit: 1000 })
      const job = jobs.docs.find(
        (j) => (j.input as any)?.runId === run.id && (j.input as any)?.locale === 'fr',
      )!
      fake.fail = true
      try {
        for (let n = 0; n < 4; n++) {
          await cms.update({ collection: 'payload-jobs', id: job.id, data: { waitUntil: null } })
          await cms.jobs.runByID({ id: job.id, silent: true })
        }
        expect((await cms.findByID({ collection: 'payload-jobs', id: job.id })).hasError).toBe(true)
        expect((await cms.findByID({ collection: 'translation-runs', id: run.id })).status).toBe('failed')
      } finally {
        fake.fail = false
      }
    }, 30000)
    it('preserves images referenced by historical drafts and generates unique filenames', async () => {
      const media = await cms.create({
        collection: 'media',
        data: { alt: 'Test only' },
        file: {
          data: Buffer.from(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
            'base64',
          ),
          name: 'fixture.png',
          mimetype: 'image/png',
          size: 68,
        },
      })
      let product: number | undefined
      try {
        expect(media.filename).not.toBe('fixture.png')
        const p = await cms.create({
          collection: 'products',
          locale: 'en',
          draft: true,
          data: {
            slug: `${marker}-media`,
            code: `${marker}-code`,
            title: 'Image reference fixture',
            images: [media.id],
          },
        })
        product = p.id
        await expect(cms.delete({ collection: 'media', id: media.id })).rejects.toThrow('引用')
        await cms.update({
          collection: 'products',
          id: p.id,
          draft: true,
          data: { images: [], _status: 'draft' },
        })
        await expect(cms.delete({ collection: 'media', id: media.id })).rejects.toThrow('引用')
      } finally {
        if (product) await cms.delete({ collection: 'products', id: product })
        await cms.delete({ collection: 'media', id: media.id })
      }
    }, 30000)
    it('stores structured brush requirements and flags a safety review', async () => {
      const submissionId = randomUUID(),
        ip = '127.0.0.9'
      const data = {
        submissionId,
        sessionToken: issueSession(submissionId, ip),
        name: 'RFQ test',
        email: `rfq-${marker}@example.com`,
        message: 'Brush assembly for review only.',
        consent: true,
        locale: 'en',
        sourcePath: '/en/rfq',
        line: 'brushes',
        safetyCritical: 'yes',
        rfq: {
          line: 'brushes',
          trimLength: '22',
          filamentMaterial: 'PA612',
          quantity: '100 pieces',
          tolerance: 'please advise',
          targetDelivery: 'November',
          requestType: 'sample',
          targetPrice: 'EUR 3 per piece',
        },
        attribution: {
          landingPath: '/en/strip-brushes',
          source: 'linkedin',
          medium: 'outreach',
          campaign: 'de-brushes-01',
        },
      }
      await acceptInquiry(cms, data, ip)
      const saved = await cms.find({
        collection: 'inquiries',
        where: { submissionId: { equals: submissionId } },
      })
      inquiries.push(saved.docs[0].id)
      expect(saved.docs[0].status).toBe('review')
      expect(saved.docs[0].attribution).toMatchObject({
        landingPath: '/en/strip-brushes',
        source: 'linkedin',
        campaign: 'de-brushes-01',
      })
      expect(saved.docs[0].rfq).toMatchObject({
        line: 'brushes',
        trimLength: '22',
        filamentMaterial: 'PA612',
        targetDelivery: 'November',
        targetPrice: 'EUR 3 per piece',
        requestType: 'sample',
        tolerance: 'please advise',
      })
      expect(saved.docs[0].notificationStatus).toBe('not-configured')
      await expect(acceptInquiry(cms, { ...data, submissionId: randomUUID() }, ip)).rejects.toThrow('session')
    }, 20000)
    it('files a general quick RFQ under brushes and refuses sealing enquiries as line-moved', async () => {
      const submissionId = randomUUID(),
        ip = '127.0.0.10'
      const data = {
        submissionId,
        sessionToken: issueSession(submissionId, ip),
        name: 'Quick RFQ test',
        email: `quick-${marker}@example.com`,
        message: 'Brushes for a machine guard, details to follow.',
        consent: true,
        locale: 'en',
        sourcePath: '/en/rfq',
        line: 'both',
        rfq: { line: 'both', quantity: '100 sets', dimensions: '' },
      }
      // Sealing belongs to keliran.com: refused before any catalogue lookup, with a machine-readable code.
      for (const sealing of [
        { ...data, line: 'sealing' },
        { ...data, rfq: { ...data.rfq, line: 'sealing' } },
        { ...data, line: 'sealing', productSlug: 'sponge-rubber-seals' },
      ])
        await expect(acceptInquiry(cms, sealing, ip)).rejects.toMatchObject({
          status: 409,
          code: 'line-moved',
        })
      expect(
        (await cms.find({ collection: 'inquiries', where: { submissionId: { equals: submissionId } } }))
          .totalDocs,
      ).toBe(0)
      // An older general form sends "both"; it is stored as a brushes enquiry with the common fields.
      await acceptInquiry(cms, data, ip)
      const saved = await cms.find({
        collection: 'inquiries',
        where: { submissionId: { equals: submissionId } },
      })
      inquiries.push(saved.docs[0].id)
      expect(saved.docs[0].line).toBe('brushes')
      expect(saved.docs[0].rfq).toMatchObject({ line: 'brushes', quantity: '100 sets' })
    }, 20000)
    it('persists published topic context and independent holder fields, and rejects unknown identities', async () => {
      const topic = await source()
      await cms.update({
        collection: 'categories',
        id: topic.id,
        context: { releaseApproved: true },
        data: { _status: 'published' },
      })
      const submissionId = randomUUID(),
        ip = '127.0.0.11'
      const data = {
        submissionId,
        sessionToken: issueSession(submissionId, ip),
        name: 'Context test',
        email: `context-${marker}@example.com`,
        message: 'Local specification context test; do not send email.',
        consent: true,
        locale: 'en',
        sourcePath: '/en/rfq',
        line: 'brushes',
        rfq: {
          line: 'brushes',
          context: { kind: 'categories', slug: topic.slug },
          holderShape: 'H profile',
          holderMaterial: 'Please advise',
          channelMaterial: 'Steel',
          backingHeight: '5',
        },
      }
      await acceptInquiry(cms, data, ip)
      const saved = await cms.find({
        collection: 'inquiries',
        where: { submissionId: { equals: submissionId } },
      })
      inquiries.push(saved.docs[0].id)
      expect(saved.docs[0].rfq).toMatchObject(data.rfq)
      await expect(acceptInquiry(cms, { ...data, productSlug: 'not-a-real-family' }, ip)).rejects.toThrow(
        'Product line mismatch',
      )
      await expect(
        acceptInquiry(
          cms,
          { ...data, rfq: { ...data.rfq, context: { kind: 'categories', slug: 'unknown-topic' } } },
          ip,
        ),
      ).rejects.toThrow('Unknown enquiry context')
      const draft = await source()
      await expect(
        acceptInquiry(
          cms,
          { ...data, rfq: { ...data.rfq, context: { kind: 'categories', slug: draft.slug } } },
          ip,
        ),
      ).rejects.toThrow('Unknown enquiry context')
    }, 20000)
    it('persists a duplicate inquiry exactly once and exposes no false email success', async () => {
      const submissionId = randomUUID()
      const data = {
        submissionId,
        name: 'Integration test',
        email: `${marker}@example.com`,
        message: 'Test inquiry: no external email should be sent.',
        consent: true,
        locale: 'en',
        sourcePath: '/en/contact',
      }
      await Promise.all([acceptInquiry(cms, data, '127.0.0.2'), acceptInquiry(cms, data, '127.0.0.2')])
      const saved = await cms.find({
        collection: 'inquiries',
        where: { submissionId: { equals: submissionId } },
      })
      inquiries.push(...saved.docs.map((d) => d.id))
      expect(saved.totalDocs).toBe(1)
      expect(saved.docs[0].notificationStatus).toBe('not-configured')
      await expect(
        acceptInquiry(cms, { ...data, message: 'A changed duplicate message.' }, '127.0.0.2'),
      ).rejects.toThrow('already used')
    }, 20000)
  },
)
