import { z } from 'zod'

const label = z
  .string()
  .trim()
  .max(120)
  .regex(/^[\p{L}\p{N} _.,:+/()\-]*$/u)
export const attributionSchema = z.object({
  landingPath: z
    .string()
    .max(250)
    .regex(/^\/[a-zA-Z0-9/\-]*$/),
  referrerHost: z
    .string()
    .max(253)
    .regex(/^[a-zA-Z0-9.-]*$/)
    .default(''),
  source: label.default(''),
  medium: label.default(''),
  campaign: label.default(''),
  content: label.default(''),
  term: label.default(''),
})
export type InquiryAttribution = z.infer<typeof attributionSchema>

const fields = ['source', 'medium', 'campaign', 'content', 'term'] as const
// Only named campaign labels and a path/hostname are retained, never full query strings or referrer URLs.
export function attributionFromURL(href: string, referrer = ''): InquiryAttribution | undefined {
  try {
    const url = new URL(href)
    let referrerHost = ''
    try {
      const previous = new URL(referrer)
      if (['https:', 'http:'].includes(previous.protocol) && previous.origin !== url.origin)
        referrerHost = previous.hostname
    } catch {
      /* No usable external referrer. */
    }
    const tags = Object.fromEntries(
      fields.map((key) => {
        const result = label.safeParse(url.searchParams.get(`utm_${key}`) || '')
        return [key, result.success ? result.data : '']
      }),
    )
    const result = attributionSchema.safeParse({ landingPath: url.pathname, referrerHost, ...tags })
    return result.success ? result.data : undefined
  } catch {
    return undefined
  }
}

const storageKey = 'keliran-inquiry-attribution-v1'
const maxAge = 24 * 60 * 60 * 1000
let memory: { capturedAt: number; data: InquiryAttribution } | undefined
export function captureInquiryAttribution(): InquiryAttribution | undefined {
  if (typeof window === 'undefined') return undefined
  const current = attributionFromURL(window.location.href, document.referrer)
  if (!current) return undefined
  const now = Date.now()
  let saved = memory
  try {
    const raw = JSON.parse(window.sessionStorage.getItem(storageKey) || 'null')
    const parsed = attributionSchema.safeParse(raw?.data)
    if (parsed.success && Number.isFinite(raw.capturedAt))
      saved = { capturedAt: raw.capturedAt, data: parsed.data }
  } catch {
    /* Storage can be disabled; an inquiry must still work. */
  }
  if (saved && (now - saved.capturedAt > maxAge || saved.capturedAt > now)) saved = undefined
  const tagged = fields.some((key) => Boolean(current[key]))
  // A fresh tagged visit replaces the earlier source; internal navigation keeps the landing context.
  const data = tagged || !saved ? current : saved.data
  memory = { capturedAt: tagged || !saved ? now : saved.capturedAt, data }
  try {
    window.sessionStorage.setItem(storageKey, JSON.stringify(memory))
  } catch {
    /* Best effort. */
  }
  return data
}

// Links that sales share inside a WhatsApp chat are tagged utm_source=whatsapp (see the channel link table).
export function isWhatsAppVisit(source: string | undefined) {
  return source?.trim().toLowerCase() === 'whatsapp'
}
