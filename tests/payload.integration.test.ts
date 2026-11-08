import 'dotenv/config'
import { afterAll, beforeAll, describe, it, expect, vi } from 'vitest'
import { randomUUID } from 'node:crypto'
import type { Payload } from 'payload'
import { issueSession } from '../src/lib/inquiry-session'
import { acceptInquiry } from '../src/lib/inquiries'
import { sendInquiryAutoReply } from '../src/lib/inquiry-auto-reply'
import { locales, localeNames } from '../src/lib/locales'

describe.runIf(process.env.RUN_INTEGRATION === 'true')(
  'real PostgreSQL / Payload integration (local fixtures only)',
  () => {
    let cms: Payload
    const documents: number[] = []
    const inquiries: number[] = []
    const marker = `test-${randomUUID()}`
    beforeAll(async () => {
      if (!process.env.DATABASE_URL?.includes('127.0.0.1'))
        throw Error('Integration tests require the local database')
      if (process.env.DEPLOYMENT_ENV === 'production' || process.env.VERCEL_ENV === 'production')
        throw Error('Integration tests cannot run in a production environment')
      for (const key of [
        'POSTMARK_SERVER_TOKEN',
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
      const { getPayload } = await import('payload')
      const config = (await import('../src/payload.config')).default
      cms = await getPayload({ config })
    }, 60000)
    afterAll(async () => {
      if (cms) {
        const jobs = await cms.find({ collection: 'payload-jobs', limit: 1000 })
        for (const job of jobs.docs)
          if (inquiries.includes((job.input as any)?.inquiryId))
            await cms.delete({ collection: 'payload-jobs', id: job.id })
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
    async function translate(
      id: number,
      title = (l: string) => `${localeNames[l as never]}: FKM O-ring 25 mm`,
    ) {
      for (const locale of locales.filter((l) => l !== 'en'))
        await cms.update({
          collection: 'categories',
          id,
          locale,
          draft: true,
          data: {
            title: title(locale),
            summary: `${locale}: a ring for a defined application.`,
            description: `${locale}: dimensions and compound must be confirmed.`,
            _status: 'draft',
          },
        })
    }
    it('refuses to publish incomplete or inconsistent translations, then publishes all locales together', async () => {
      const d = await source()
      const publish = () =>
        cms.update({ collection: 'categories', id: d.id, locale: 'en', data: { _status: 'published' } })
      await expect(publish()).rejects.toThrow('发布前检查未通过')
      await translate(d.id, (l) =>
        l === 'fr' ? 'Joint FKM 26 mm' : `${localeNames[l as never]}: FKM O-ring 25 mm`,
      )
      await expect(publish()).rejects.toThrow('fr: title: numbers differ')
      await translate(d.id)
      await cms.update({ collection: 'categories', id: d.id, draft: true, data: { factsConfirmed: false } })
      await expect(publish()).rejects.toThrow('产品事实与素材已确认')
      await cms.update({ collection: 'categories', id: d.id, draft: true, data: { factsConfirmed: true } })
      await publish()
      for (const locale of locales) {
        const read = await cms.findByID({ collection: 'categories', id: d.id, locale, overrideAccess: false })
        expect(read._status).toBe('published')
        expect(read.title).toBe(
          locale === 'en' ? 'FKM O-ring 25 mm' : `${localeNames[locale]}: FKM O-ring 25 mm`,
        )
      }
    }, 60000)
    it('keeps the values of the locale saved together with the publish', async () => {
      const d = await source()
      await translate(d.id)
      // The publish checks read every locale; the French values sent in this save must survive.
      await cms.update({
        collection: 'categories',
        id: d.id,
        locale: 'fr',
        data: { title: 'Français : joint FKM 25 mm', _status: 'published' },
      })
      const fr = await cms.findByID({
        collection: 'categories',
        id: d.id,
        locale: 'fr',
        overrideAccess: false,
      })
      const en = await cms.findByID({
        collection: 'categories',
        id: d.id,
        locale: 'en',
        overrideAccess: false,
      })
      expect(fr.title).toBe('Français : joint FKM 25 mm')
      expect(en.title).toBe('FKM O-ring 25 mm')
    }, 60000)
    it('caps visitor acknowledgements per address and sends each at most once', async () => {
      vi.stubEnv('POSTMARK_SERVER_TOKEN', 'POSTMARK_API_TEST')
      vi.stubEnv('EMAIL_FROM', 'Keliran <test@example.com>')
      vi.stubEnv('SALES_EMAIL', 'sales@example.com')
      const fetch = vi
        .spyOn(globalThis, 'fetch')
        .mockResolvedValue(Response.json({ ErrorCode: 0, Message: 'OK', MessageID: 'test-message' }))
      try {
        const email = `cap-${marker}@example.com`
        const statuses: string[] = []
        for (let n = 0; n < 4; n++) {
          const submissionId = randomUUID()
          const { jobIds } = await acceptInquiry(
            cms,
            {
              submissionId,
              name: 'Cap test',
              email,
              message: 'Acknowledgement cap test; no email leaves this machine.',
              consent: true,
              locale: 'de',
              sourcePath: '/de/contact',
            },
            '127.0.0.20',
          )
          const saved = (
            await cms.find({ collection: 'inquiries', where: { submissionId: { equals: submissionId } } })
          ).docs[0]
          inquiries.push(saved.id)
          statuses.push(saved.autoReplyStatus!)
          expect(jobIds).toHaveLength(saved.autoReplyStatus === 'pending' ? 2 : 1)
        }
        expect(statuses).toEqual(['pending', 'pending', 'pending', 'skipped'])
        const first = inquiries[inquiries.length - 4]
        await sendInquiryAutoReply(cms, first)
        await sendInquiryAutoReply(cms, first)
        expect(fetch).toHaveBeenCalledTimes(1)
        const body = JSON.parse(String(fetch.mock.calls[0][1]?.body))
        expect(body).toMatchObject({ To: email, ReplyTo: 'sales@example.com', Tag: 'inquiry-auto-reply' })
        expect(body.TextBody).not.toContain('Cap test')
        expect(body.TextBody).not.toContain('Acknowledgement cap test')
        const sent = await cms.findByID({ collection: 'inquiries', id: first })
        expect(sent).toMatchObject({ autoReplyStatus: 'sent', autoReplyMessageId: 'test-message' })
        // A timeout may hide an accepted message: recorded as unknown and never retried.
        fetch.mockRejectedValueOnce(new Error('The operation was aborted due to timeout'))
        const second = inquiries[inquiries.length - 3]
        await sendInquiryAutoReply(cms, second)
        expect((await cms.findByID({ collection: 'inquiries', id: second })).autoReplyStatus).toBe('unknown')
        await sendInquiryAutoReply(cms, second)
        expect(fetch).toHaveBeenCalledTimes(2)
      } finally {
        fetch.mockRestore()
        for (const key of ['POSTMARK_SERVER_TOKEN', 'EMAIL_FROM', 'SALES_EMAIL']) vi.stubEnv(key, '')
      }
    }, 60000)
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
      expect(saved.docs[0].autoReplyStatus).toBe('not-configured')
      await expect(
        acceptInquiry(cms, { ...data, message: 'A changed duplicate message.' }, '127.0.0.2'),
      ).rejects.toThrow('already used')
    }, 20000)
  },
)
