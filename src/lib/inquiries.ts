import { attributionSchema } from './inquiry-attribution'
import { attachmentSchema, verifyObject } from './inquiry-files'
import { issueSession, verifySession } from './inquiry-session'
import { brushRfq, rfqSchema } from './rfq-schema'
import { createHmac } from 'node:crypto'
import { z } from 'zod'
import { Resend } from 'resend'
import type { Payload, PayloadRequest } from 'payload'
import { locales } from './locales'
import { transaction } from './transactions'
import { HttpError } from './http'
import { isProductionDeployment, serviceStatus, siteURL } from './env'
import { otherLine, otherSiteURL, siteLine } from './site'

const plain = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .refine((s) => !/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(s), 'Control characters are not allowed')
export const inquirySchema = z.object({
  submissionId: z.uuid(),
  sessionToken: z.string().max(2048).optional(),
  line: z.enum(['sealing', 'brushes', 'both']).optional().default('both'),
  safetyCritical: z.enum(['no', 'yes', 'unsure']).optional().default('unsure'),
  rfq: rfqSchema.optional(),
  attribution: attributionSchema.optional().catch(undefined),
  attachments: z.array(attachmentSchema).max(5).default([]),
  name: plain(120).min(1),
  email: z.email().max(254),
  company: plain(160).optional().default(''),
  country: plain(100).optional().default(''),
  message: plain(5000).min(10),
  consent: z.literal(true),
  locale: z.enum(locales),
  productSlug: z
    .string()
    .regex(/^[a-z0-9-]{1,120}$/)
    .optional(),
  sourcePath: z
    .string()
    .regex(/^\/[a-zA-Z0-9/\-]*$/)
    .max(250),
  website: z.string().max(200).optional().default(''),
  turnstileToken: z.string().max(2048).optional().default(''),
})
export async function limit(payload: Payload, req: PayloadRequest, key: string, max: number) {
  const found = await payload.find({
    collection: 'rate-limits',
    where: { key: { equals: key } },
    limit: 1,
    req,
  })
  const current = found.docs[0]
  if (current && (current.count || 0) >= max) throw new HttpError(429, 'Please try again later.')
  if (current)
    await payload.update({
      collection: 'rate-limits',
      id: current.id,
      data: { count: (current.count || 0) + 1 },
      req,
    })
  else
    await payload.create({
      collection: 'rate-limits',
      data: { key, count: 1, expiresAt: new Date(Date.now() + 86400000).toISOString() },
      req,
    })
}
export async function startInquirySession(payload: Payload, submissionId: string, token: string, ip: string) {
  if (!z.uuid().safeParse(submissionId).success || typeof token !== 'string' || token.length > 2048)
    throw new HttpError(400, 'Invalid session request.')
  const hmac = (s: string) => createHmac('sha256', process.env.PAYLOAD_SECRET!).update(s).digest('hex')
  // The attempt limit is committed before verification; failed challenges cannot reset it.
  await transaction(payload, `inquiry-ip:${hmac(ip)}`, async (req) => {
    await limit(payload, req, `attempt:${hmac(ip)}:${Math.floor(Date.now() / 3600000)}`, 30)
  })
  if (serviceStatus().turnstile) {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: new URLSearchParams({
        secret: process.env.TURNSTILE_SECRET_KEY!,
        response: token,
        remoteip: ip,
        idempotency_key: submissionId,
      }),
      signal: AbortSignal.timeout(10000),
    })
    const verification = await response.json()
    if (!response.ok || !verification.success || verification.hostname !== new URL(siteURL).hostname)
      throw new HttpError(400, 'Please complete the verification again.')
  } else if (isProductionDeployment) throw new HttpError(503, 'Contact verification is not configured.')
  return { sessionToken: issueSession(submissionId, ip) }
}
export async function acceptInquiry(payload: Payload, raw: unknown, ip: string) {
  const parsed = inquirySchema.safeParse(raw)
  if (!parsed.success) throw new HttpError(400, 'Please check the form fields.')
  const data = parsed.data
  if (data.website) throw new HttpError(400, 'Submission rejected.')
  // The other product line has its own site and back office. Answer before any catalogue
  // lookup, because its products are not visible here and would look like a bad request.
  if (data.line === otherLine || data.rfq?.line === otherLine)
    throw new HttpError(409, `Please send this enquiry through ${otherSiteURL}.`, 'line-moved')
  // Every enquiry received here belongs to this site's line. Older forms sent "both" (or no
  // line) for general requests; they keep the common fields and are filed under this line.
  data.line = siteLine
  if (data.rfq) data.rfq = brushRfq.parse({ ...data.rfq, line: siteLine })
  // Only published content can provide an enquiry identity. Never trust a URL slug as catalogue data.
  if (data.productSlug) {
    const product = (
      await payload.find({
        collection: 'products',
        locale: data.locale,
        fallbackLocale: false,
        where: { and: [{ slug: { equals: data.productSlug } }, { _status: { equals: 'published' } }] },
        overrideAccess: false,
        limit: 1,
        depth: 0,
      })
    ).docs[0]
    // Access control already hides the other line, so a missing product is a mismatch.
    if (!product?.title) throw new HttpError(400, 'Product line mismatch.')
  }
  if (data.rfq?.context) {
    const { kind, slug } = data.rfq.context
    const doc = (
      await payload.find({
        collection: kind,
        locale: data.locale,
        fallbackLocale: false,
        where: { and: [{ slug: { equals: slug } }, { _status: { equals: 'published' } }] },
        overrideAccess: false,
        limit: 1,
        depth: 0,
      })
    ).docs[0]
    if (!doc?.title) throw new HttpError(400, 'Unknown enquiry context.')
  }
  const hmac = (s: string) => createHmac('sha256', process.env.PAYLOAD_SECRET!).update(s).digest('hex')
  if (data.sessionToken) verifySession(data.sessionToken, data.submissionId, ip)
  else {
    if (data.attachments.length) throw new HttpError(401, 'Start a verified session before uploading.')
    await startInquirySession(payload, data.submissionId, data.turnstileToken, ip)
  }
  if (new Set(data.attachments.map((a) => a.key)).size !== data.attachments.length)
    throw new HttpError(400, 'Duplicate attachment.')
  if (data.rfq && data.rfq.line !== data.line) throw new HttpError(400, 'Product line mismatch.')
  return transaction(payload, `inquiry:${data.submissionId}`, async (req) => {
    const existing = await payload.find({
      collection: 'inquiries',
      where: { submissionId: { equals: data.submissionId } },
      limit: 1,
      req,
    })
    if (existing.docs[0]) {
      const prior = existing.docs[0]
      if (prior.email !== data.email || prior.message !== data.message)
        throw new HttpError(409, 'Submission ID already used.')
      return { accepted: true }
    }
    const { lock } = await import('./transactions')
    await lock(req, `inquiry-email:${hmac(data.email.toLowerCase())}`)
    await limit(
      payload,
      req,
      `email:${hmac(data.email.toLowerCase())}:${Math.floor(Date.now() / 3600000)}`,
      5,
    )
    for (const file of data.attachments) await verifyObject(data.submissionId, file)
    const { turnstileToken, website, sessionToken, ...record } = data
    const inquiry = await payload.create({
      collection: 'inquiries',
      data: {
        ...record,
        status: data.safetyCritical === 'yes' ? 'review' : 'new',
        notificationStatus: serviceStatus().email ? 'pending' : 'not-configured',
        retentionUntil: new Date(Date.now() + 365 * 86400000).toISOString(),
      },
      req,
    })
    if (serviceStatus().email)
      await payload.jobs.queue({ task: 'inquiry-email', input: { inquiryId: inquiry.id }, req })
    return { accepted: true }
  })
}
export async function sendInquiryEmail(payload: Payload, id: number) {
  const inquiry = await payload.findByID({ collection: 'inquiries', id })
  if (inquiry.notificationStatus === 'sent') return
  if (!serviceStatus().email) {
    await payload.update({ collection: 'inquiries', id, data: { notificationStatus: 'not-configured' } })
    return
  }
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const result = await resend.emails.send(
      {
        from: process.env.EMAIL_FROM!,
        to: process.env.SALES_EMAIL!,
        replyTo: inquiry.email!,
        subject: `${inquiry.safetyCritical === 'yes' ? '[SAFETY-FLAG] ' : ''}[${new URL(siteURL).host}] [${inquiry.line || 'General'}] Website inquiry — ${inquiry.productSlug || 'Component request'}`,
        text: [
          `Name: ${inquiry.name}`,
          `Company: ${inquiry.company}`,
          `Email: ${inquiry.email}`,
          `Country: ${inquiry.country}`,
          `Language: ${inquiry.locale}`,
          `Attribution (visitor supplied): ${JSON.stringify(inquiry.attribution || {})}`,
          `Product: ${inquiry.productSlug || '—'}`,
          '',
          inquiry.message,
          `Safety-related: ${inquiry.safetyCritical || 'unsure'}`,
          `Technical requirements: ${JSON.stringify(inquiry.rfq || {})}`,
          `Attachments (staff access only): ${(inquiry.attachments || []).map((a) => a.name).join(', ') || 'None'}`,
          `\nManage: ${siteURL}/admin/collections/inquiries/${id}`,
        ].join('\n'),
      },
      { idempotencyKey: `keliran-inquiry-${inquiry.submissionId}` },
    )
    if (result.error) throw Error(`Email provider: ${result.error.name}`)
    await payload.update({
      collection: 'inquiries',
      id,
      data: { notificationStatus: 'sent', notificationError: null },
    })
  } catch (error) {
    await payload.update({
      collection: 'inquiries',
      id,
      data: {
        notificationStatus: 'failed',
        notificationError: error instanceof Error ? error.message.slice(0, 200) : 'Email failed',
      },
    })
    throw error
  }
}
