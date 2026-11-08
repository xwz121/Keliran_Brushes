import { describe, it, expect, vi } from 'vitest'
import { normalizeWhatsAppNumber, buildWhatsAppURL, formatWhatsAppNumber } from '../src/lib/whatsapp'
import { issueSession, verifySession } from '../src/lib/inquiry-session'
import { validateFile, validSignature, ownsKey } from '../src/lib/inquiry-files'
import { rfqSchema } from '../src/lib/rfq-schema'
import { safeJSON, productData } from '../src/lib/jsonld'
import { routeFor } from '../src/lib/routes'
import { siteDrafts as drafts } from '../scripts/seed/site-drafts'
import { randomUUID } from 'node:crypto'
describe('enquiry sessions and private files', () => {
  it('binds sessions to the submission, source address and expiry', () => {
    vi.stubEnv('PAYLOAD_SECRET', 'test-secret-only')
    const id = randomUUID()
    const token = issueSession(id, '127.0.0.1', 1000)
    expect(verifySession(token, id, '127.0.0.1', 2000).id).toBe(id)
    expect(() => verifySession(token + 'x', id, '127.0.0.1', 2000)).toThrow()
    expect(() => verifySession(token, randomUUID(), '127.0.0.1', 2000)).toThrow()
    expect(() => verifySession(token, id, 'other', 2000)).toThrow()
    expect(() => verifySession(token, id, '127.0.0.1', 3000000)).toThrow()
  })
  it('rejects dangerous names, oversized files and unknown extensions', () => {
    expect(() => validateFile({ name: '../part.pdf', size: 100 })).toThrow()
    expect(() => validateFile({ name: 'part.exe', size: 100 })).toThrow()
    expect(() => validateFile({ name: 'part.pdf', size: 11 * 1024 * 1024 })).toThrow()
    expect(validateFile({ name: 'part.PDF', size: 100 }).size).toBe(100)
  })
  it('checks file bytes, not only filename extensions', () => {
    expect(validSignature('pdf', Buffer.from('%PDF-1.7\n'))).toBe(true)
    expect(validSignature('pdf', Buffer.from('<html>fake</html>'))).toBe(false)
    expect(validSignature('step', Buffer.from('ISO-10303-21;'))).toBe(true)
    expect(validSignature('dxf', Buffer.from('0\nSECTION\n2\nHEADER\n'))).toBe(true)
    expect(validSignature('dxf', Buffer.from('ordinary text'))).toBe(false)
    expect(validSignature('png', Buffer.from('not a png'))).toBe(false)
  })
  it('rejects another enquiry’s object and malformed technical data', () => {
    const id = randomUUID(),
      key = `brushes/inquiries/${id}/${randomUUID()}.pdf`
    expect(ownsKey(key, id)).toBe(true)
    expect(ownsKey(key, randomUUID())).toBe(false)
    // keliran.com's attachments share the private bucket under `inquiries/`; never claim them.
    expect(ownsKey(`inquiries/${id}/${randomUUID()}.pdf`, id)).toBe(false)
    expect(rfqSchema.safeParse({ line: 'brushes', filamentDiameter: '0.25' }).success).toBe(true)
    expect(rfqSchema.safeParse({ line: 'other' }).success).toBe(false)
  })
})
it('normalises usable WhatsApp links and hides invalid numbers', () => {
  expect(normalizeWhatsAppNumber('+44 (20) 1234-5678')).toBe('442012345678')
  expect(buildWhatsAppURL('', 'Hi')).toBeNull()
  expect(buildWhatsAppURL('442012345678', 'Part & drawing')).toContain('Part%20%26%20drawing')
  // A 500-character cut must not split an emoji into a lone surrogate (encodeURIComponent would throw).
  expect(buildWhatsAppURL('442012345678', `${'a'.repeat(499)}🙂b`)).toMatch(/a%F0%9F%99%82$/)
  expect(formatWhatsAppNumber('8617509072335')).toBe('+86 175 0907 2335')
  expect(formatWhatsAppNumber('+44 7536 120830')).toBe('+44 7536 120830')
  expect(formatWhatsAppNumber('33612345678')).toBe('+33612345678')
})
it('uses explicit collection routes and escapes structured data', () => {
  expect(routeFor('categories', { slug: 'metal-channel-strip-brushes', line: 'brushes' }, 'de')).toBe(
    '/de/strip-brushes/metal-channel-strip-brushes',
  )
  expect(routeFor('guides', { slug: 'rfq-checklist' })).toBe('/en/guides/rfq-checklist')
  expect(safeJSON({ text: '</script><script>' })).not.toContain('<')
  expect(productData({ title: 'Part', summary: 'Test', code: 'X', slug: 'part' }, 'en')).not.toHaveProperty(
    'offers',
  )
})
it('has complete draft relationships and substantive procurement resources', () => {
  expect(drafts.length).toBeGreaterThan(50)
  const keys = new Set(drafts.map((d) => `${d.collection}/${d.slug}`))
  expect(keys.size).toBe(drafts.length)
  for (const d of drafts) {
    for (const [field, collection] of [
      ['productSlugs', 'products'],
      ['guideSlugs', 'guides'],
      ['solutionSlugs', 'solutions'],
    ])
      for (const slug of d.data[field] || [])
        expect(keys.has(`${collection}/${slug}`), `${d.slug} -> ${slug}`).toBe(true)
  }
  expect(drafts.filter((d) => d.collection === 'cases').every((d) => d.data.scenarioType === 'typical')).toBe(
    true,
  )
  expect(drafts.filter((d) => d.collection === 'guides')).toHaveLength(6)
  // The seed for this site carries no sealing documents; shared documents stay.
  expect(drafts.some((d) => d.data.line === 'sealing')).toBe(false)
  expect(drafts.filter((d) => d.collection === 'products').map((d) => d.data.code)).toEqual([
    'BR01-CUSTOM',
    'BR03-CUSTOM',
    'BR04-CUSTOM',
    'BR05-CUSTOM',
  ])
})
