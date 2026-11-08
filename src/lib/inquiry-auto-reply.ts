import type { Payload } from 'payload'
import { serviceStatus, siteURL } from './env'
import { fillCopy, interfaceCopy } from './interface-copy'
import { asLocale } from './locales'
import { sendPostmark, type PostmarkResult } from './postmark'
import { siteLineCopyKey, siteName } from './site'
import { transaction } from './transactions'

export const autoReplyStatuses = [
  'pending',
  'sending',
  'sent',
  'failed',
  'skipped',
  'unknown',
  'not-configured',
] as const
export type AutoReplyStatus = (typeof autoReplyStatuses)[number]
// Acknowledgements per recipient address per UTC day. Limits use of the form to send mail to others.
export const autoReplyDailyCap = 3

type AutoReplyProduct = { title?: string | null; code?: string | null } | null | undefined
// The visitor's acknowledgement contains only what the site controls: the validated reference,
// published catalogue data and fixed copy. Visitor-written text (name, message, company, file
// names) is never echoed, so the form cannot be used to deliver someone else's content.
export function buildAutoReply(input: {
  locale?: string | null
  reference: string
  product?: AutoReplyProduct
}) {
  const t = interfaceCopy(asLocale(input.locale || 'en'))
  const product = [input.product?.code, input.product?.title].filter(Boolean).join(' · ')
  const text = [
    t.autoReplyGreeting,
    '',
    fillCopy(t.autoReplyIntro, { site: siteName }),
    '',
    `${t.inquiryReference}: ${input.reference}`,
    ...(product ? [`${t.productReference}: ${product}`] : []),
    `${t.autoReplyLine}: ${t[siteLineCopyKey]}`,
    '',
    t.autoReplyFollowUp,
    '',
    t.autoReplyAutomatic,
    '',
    '—',
    siteName,
    siteURL,
  ].join('\n')
  return { subject: fillCopy(t.autoReplySubject, { ref: input.reference }), text }
}

async function publishedProduct(payload: Payload, slug: string, locale: string): Promise<AutoReplyProduct> {
  try {
    const found = await payload.find({
      collection: 'products',
      where: { slug: { equals: slug } },
      locale: asLocale(locale),
      fallbackLocale: false,
      depth: 0,
      limit: 1,
      overrideAccess: false,
    })
    const product = found.docs[0] as { title?: string | null; code?: string | null } | undefined
    return product ? { title: product.title, code: product.code } : null
  } catch {
    // The acknowledgement is still useful without the product line.
    return null
  }
}

const settled: Record<PostmarkResult['outcome'], AutoReplyStatus> = {
  sent: 'sent',
  permanent: 'failed',
  // Not accepted by Postmark, so the job may try again without risking a duplicate.
  retryable: 'pending',
  // Postmark may have accepted it. Check the Postmark activity log instead of sending again.
  unknown: 'unknown',
}

export async function sendInquiryAutoReply(payload: Payload, id: number) {
  // Claim the send in its own committed transaction, so only one runner can call Postmark.
  const inquiry = await transaction(payload, `inquiry-auto-reply:${id}`, async (req) => {
    const current = await payload.findByID({ collection: 'inquiries', id, depth: 0, req })
    // 'sending' means another runner holds the claim; every other state is final or skipped.
    if (current.autoReplyStatus !== 'pending') return null
    if (!serviceStatus().email || !current.email) {
      await payload.update({ collection: 'inquiries', id, data: { autoReplyStatus: 'not-configured' }, req })
      return null
    }
    await payload.update({ collection: 'inquiries', id, data: { autoReplyStatus: 'sending' }, req })
    return current
  })
  if (!inquiry) return
  let result: PostmarkResult
  try {
    const product = inquiry.productSlug
      ? await publishedProduct(payload, inquiry.productSlug, inquiry.locale || 'en')
      : null
    const content = buildAutoReply({ locale: inquiry.locale, reference: inquiry.submissionId, product })
    result = await sendPostmark({
      from: process.env.EMAIL_FROM!,
      to: inquiry.email!,
      replyTo: process.env.SALES_EMAIL,
      subject: content.subject,
      textBody: content.text,
      tag: 'inquiry-auto-reply',
      metadata: { inquiryId: String(id), site: new URL(siteURL).host },
      headers: [{ Name: 'Auto-Submitted', Value: 'auto-replied' }],
    })
  } catch (error) {
    result = { outcome: 'unknown', error: (error as Error).message.slice(0, 200) }
  }
  await transaction(payload, `inquiry-auto-reply:${id}`, async (req) => {
    await payload.update({
      collection: 'inquiries',
      where: { and: [{ id: { equals: id } }, { autoReplyStatus: { in: ['sending', 'unknown'] } }] },
      data:
        result.outcome === 'sent'
          ? { autoReplyStatus: 'sent', autoReplyMessageId: result.messageId, autoReplyError: null }
          : { autoReplyStatus: settled[result.outcome], autoReplyError: result.error },
      req,
    })
  })
  if (result.outcome === 'retryable') throw new Error(result.error)
}

// After the last retry a temporarily rejected acknowledgement is recorded as failed.
export async function failPendingAutoReply(payload: Payload, id: number) {
  await payload.update({
    collection: 'inquiries',
    where: { and: [{ id: { equals: id } }, { autoReplyStatus: { equals: 'pending' } }] },
    data: { autoReplyStatus: 'failed' },
  })
}

// Run from the cron. Payload never releases a job whose function was stopped mid-run.
export async function recoverInquiryEmailJobs(payload: Payload, now = Date.now()) {
  // A claim older than 15 minutes cannot still be sending: record the outcome as unknown.
  await payload.update({
    collection: 'inquiries',
    where: {
      and: [
        { autoReplyStatus: { equals: 'sending' } },
        { updatedAt: { less_than: new Date(now - 15 * 60000).toISOString() } },
      ],
    },
    data: {
      autoReplyStatus: 'unknown',
      autoReplyError: 'Send interrupted; check the Postmark activity log.',
    },
  })
  // Release email jobs stuck in processing for 10 minutes. The handlers above make a re-run safe:
  // the sales notification may repeat, the acknowledgement does not.
  await payload.update({
    collection: 'payload-jobs',
    where: {
      and: [
        { processing: { equals: true } },
        { taskSlug: { in: ['inquiry-email', 'inquiry-auto-reply'] } },
        { updatedAt: { less_than: new Date(now - 10 * 60000).toISOString() } },
      ],
    },
    data: { processing: false },
  })
}

// Run the jobs queued by one enquiry right after the response. The cron remains the fallback.
// jobs.run (unlike runByID) skips jobs that another runner already took or finished.
export async function runInquiryJobs(payload: Payload, jobIds: (number | string)[]) {
  if (!jobIds.length) return
  try {
    await payload.jobs.run({ where: { id: { in: jobIds } }, limit: jobIds.length })
  } catch (error) {
    payload.logger.error({ err: error, msg: 'Immediate enquiry email run failed; the cron will retry.' })
  }
}
