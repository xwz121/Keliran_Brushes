import type { PayloadEmailAdapter } from 'payload'

// Transactional email through the Postmark API (https://postmarkapp.com/developer/api/email-api).
// Postmark has no idempotency key, so callers decide from the outcome whether a retry is safe.
export const postmarkEndpoint = 'https://api.postmarkapp.com/email'
// Postmark's test token validates requests without delivering them. Never valid in Production.
export const postmarkTestToken = 'POSTMARK_API_TEST'

export type PostmarkMessage = {
  from: string
  to: string
  subject: string
  textBody: string
  htmlBody?: string
  replyTo?: string
  tag: string
  metadata?: Record<string, string>
  headers?: { Name: string; Value: string }[]
}
export type PostmarkResult =
  // Accepted by Postmark. Accepted is not delivered: delivery shows in the Postmark activity log.
  | { outcome: 'sent'; messageId: string }
  // Rejected and will be rejected again (invalid request, inactive recipient, account not approved).
  | { outcome: 'permanent'; error: string }
  // Not accepted (rate limit, Postmark outage); sending again cannot duplicate the message.
  | { outcome: 'retryable'; error: string }
  // The request may or may not have been accepted (network failure, timeout, unreadable success).
  | { outcome: 'unknown'; error: string }

const short = (s: string) => s.slice(0, 200)
export const postmarkConfigured = () => Boolean(process.env.POSTMARK_SERVER_TOKEN && process.env.EMAIL_FROM)

export async function sendPostmark(
  message: PostmarkMessage,
  options: { token?: string; stream?: string; timeoutMs?: number; fetch?: typeof fetch } = {},
): Promise<PostmarkResult> {
  const token = options.token ?? process.env.POSTMARK_SERVER_TOKEN
  if (!token) return { outcome: 'permanent', error: 'Postmark is not configured.' }
  const body = {
    From: message.from,
    To: message.to,
    Subject: message.subject,
    TextBody: message.textBody,
    ...(message.htmlBody ? { HtmlBody: message.htmlBody } : {}),
    ...(message.replyTo ? { ReplyTo: message.replyTo } : {}),
    Tag: message.tag,
    ...(message.metadata ? { Metadata: message.metadata } : {}),
    ...(message.headers?.length ? { Headers: message.headers } : {}),
    MessageStream: options.stream ?? (process.env.POSTMARK_MESSAGE_STREAM || 'outbound'),
    TrackOpens: false,
    TrackLinks: 'None',
  }
  let response: Response
  try {
    response = await (options.fetch ?? fetch)(postmarkEndpoint, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Postmark-Server-Token': token,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(options.timeoutMs ?? 10000),
    })
  } catch (error) {
    return { outcome: 'unknown', error: short(`Postmark request failed: ${(error as Error).message}`) }
  }
  // Postmark documents 429 (rate limit), 500 (message usually lost) and 503 (planned outage).
  if ([429, 500, 503].includes(response.status))
    return { outcome: 'retryable', error: `Postmark HTTP ${response.status}` }
  // Other server errors (for example a gateway timeout) may hide an accepted message.
  if (response.status >= 500) return { outcome: 'unknown', error: `Postmark HTTP ${response.status}` }
  let result: { ErrorCode?: number; Message?: string; MessageID?: string }
  try {
    result = await response.json()
  } catch {
    return response.ok
      ? { outcome: 'unknown', error: `Postmark HTTP ${response.status}: unreadable response` }
      : { outcome: 'permanent', error: `Postmark HTTP ${response.status}: unreadable response` }
  }
  if (response.ok && result.ErrorCode === 0 && result.MessageID)
    return { outcome: 'sent', messageId: result.MessageID }
  if (response.ok && result.ErrorCode === 0)
    return { outcome: 'unknown', error: 'Postmark accepted the request without a MessageID.' }
  // 10 token, 300 invalid request, 406 inactive recipient, 412 account pending approval,
  // 413 account not approved, 422 invalid server: retrying cannot change the answer.
  return {
    outcome: 'permanent',
    error: short(`Postmark ${response.status}/${result.ErrorCode ?? '?'}: ${result.Message || 'rejected'}`),
  }
}

type AddressLike = string | { name?: string; address?: string } | undefined | null
function address(value: AddressLike): string {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (!value.address) return ''
  return value.name ? `"${value.name.replaceAll('"', '')}" <${value.address}>` : value.address
}
const addresses = (value: AddressLike | AddressLike[]) =>
  (Array.isArray(value) ? value : [value]).map(address).filter(Boolean).join(', ')
const text = (value: unknown) => (typeof value === 'string' ? value : value ? String(value) : '')

// Payload's own email (admin password reset) through the same client.
export const postmarkEmailAdapter =
  ({
    defaultFromAddress,
    defaultFromName,
  }: {
    defaultFromAddress: string
    defaultFromName: string
  }): PayloadEmailAdapter =>
  () => ({
    name: 'postmark',
    defaultFromAddress,
    defaultFromName,
    sendEmail: async (message) => {
      const result = await sendPostmark({
        from:
          address(message.from as AddressLike) ||
          address({ name: defaultFromName, address: defaultFromAddress }),
        to: addresses(message.to as AddressLike | AddressLike[]),
        subject: text(message.subject),
        textBody: text(message.text) || text(message.html).replace(/<[^>]+>/g, ' '),
        htmlBody: text(message.html) || undefined,
        replyTo: addresses(message.replyTo as AddressLike | AddressLike[]) || undefined,
        tag: 'admin',
      })
      if (result.outcome !== 'sent') throw new Error(result.error)
      return result
    },
  })
