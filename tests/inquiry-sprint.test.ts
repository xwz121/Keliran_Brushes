import { describe, expect, it, vi, afterEach } from 'vitest'
import { randomUUID } from 'node:crypto'
import { attributionFromURL } from '../src/lib/inquiry-attribution'
import { inquirySchema } from '../src/lib/inquiries'
import { rfqSchema } from '../src/lib/rfq-schema'

afterEach(() => vi.unstubAllGlobals())
describe('inquiry campaign attribution', () => {
  it('only retains campaign labels, landing path and external hostname', () => {
    expect(
      attributionFromURL(
        'https://keliran.com/en/sealing?utm_source=linkedin&utm_campaign=de-sealing-01&email=private%40example.com',
        'https://example.com/private?token=secret',
      ),
    ).toEqual({
      landingPath: '/en/sealing',
      referrerHost: 'example.com',
      source: 'linkedin',
      medium: '',
      campaign: 'de-sealing-01',
      content: '',
      term: '',
    })
    expect(
      attributionFromURL('https://keliran.com/en/rfq?utm_source=%3Cscript%3E', 'https://keliran.com/en'),
    ).toMatchObject({ source: '', referrerHost: '' })
  })
  it('keeps the tagged landing across navigation and reload, then replaces it for a new campaign', async () => {
    vi.resetModules()
    const store = new Map<string, string>()
    const browser = {
      location: { href: 'https://keliran.com/en/sealing?utm_source=email&utm_campaign=de-seals' },
      sessionStorage: {
        getItem: (k: string) => store.get(k) || null,
        setItem: (k: string, v: string) => store.set(k, v),
      },
    }
    vi.stubGlobal('window', browser)
    vi.stubGlobal('document', { referrer: '' })
    let { captureInquiryAttribution: capture } = await import('../src/lib/inquiry-attribution')
    capture()
    browser.location.href = 'https://keliran.com/en/rfq'
    vi.resetModules()
    capture = (await import('../src/lib/inquiry-attribution')).captureInquiryAttribution
    expect(capture()).toMatchObject({ landingPath: '/en/sealing', source: 'email', campaign: 'de-seals' })
    browser.location.href = 'https://keliran.com/en/strip-brushes?utm_source=google&utm_campaign=it-brushes'
    expect(capture()).toMatchObject({
      landingPath: '/en/strip-brushes',
      source: 'google',
      campaign: 'it-brushes',
    })
  })
  it('falls back to in-memory attribution when session storage is blocked', async () => {
    vi.resetModules()
    const browser = {
      location: { href: 'https://keliran.com/en/sealing?utm_source=email' },
      sessionStorage: {
        getItem: () => {
          throw Error('blocked')
        },
        setItem: () => {
          throw Error('blocked')
        },
      },
    }
    vi.stubGlobal('window', browser)
    vi.stubGlobal('document', { referrer: '' })
    const { captureInquiryAttribution: capture } = await import('../src/lib/inquiry-attribution')
    capture()
    browser.location.href = 'https://keliran.com/en/rfq'
    expect(capture()).toMatchObject({ landingPath: '/en/sealing', source: 'email' })
  })
  it('discards expired attribution and never blocks a valid inquiry with malformed attribution', async () => {
    vi.resetModules()
    vi.stubGlobal('window', {
      location: { href: 'https://keliran.com/en/rfq' },
      sessionStorage: {
        getItem: () =>
          JSON.stringify({
            capturedAt: Date.now() - 25 * 3600000,
            data: { landingPath: '/en/sealing', source: 'old' },
          }),
        setItem: () => {},
      },
    })
    vi.stubGlobal('document', { referrer: '' })
    const { captureInquiryAttribution: capture } = await import('../src/lib/inquiry-attribution')
    expect(capture()).toMatchObject({ landingPath: '/en/rfq', source: '' })
    const parsed = inquirySchema.parse({
      submissionId: randomUUID(),
      name: 'Buyer',
      email: 'buyer@example.com',
      message: 'Please review our part.',
      consent: true,
      locale: 'en',
      sourcePath: '/en/rfq',
      attribution: { landingPath: 'https://bad.test/private' },
    })
    expect(parsed.attribution).toBeUndefined()
  })
})
it('keeps commercial and tolerance details without requiring unknown specifications', () => {
  const parsed = rfqSchema.parse({
    line: 'sealing',
    dimensions: '20 × 10 mm',
    tolerance: 'please advise',
    targetDelivery: 'November, to confirm',
    targetPrice: 'EUR 2 per metre',
    incoterm: 'please advise',
    requestType: 'sample',
  })
  expect(parsed).toMatchObject({
    dimensions: '20 × 10 mm',
    tolerance: 'please advise',
    requestType: 'sample',
    quantity: '',
  })
})
it('accepts an unclassified quick RFQ but keeps line-specific fields out of it', () => {
  const parsed = rfqSchema.parse({ line: 'both', quantity: '100 sets', material: 'EPDM', trimLength: '22' })
  expect(parsed).toMatchObject({ line: 'both', quantity: '100 sets', requestType: 'quotation' })
  expect(parsed).not.toHaveProperty('material')
  expect(parsed).not.toHaveProperty('trimLength')
  expect(rfqSchema.safeParse({ line: 'other' }).success).toBe(false)
  const inquiry = inquirySchema.safeParse({
    submissionId: randomUUID(),
    name: 'Quick buyer',
    email: 'quick@example.com',
    message: 'Seals and brushes for a machine guard.',
    consent: true,
    locale: 'en',
    sourcePath: '/en/rfq',
    line: 'both',
    rfq: { line: 'both', quantity: '100 sets' },
  })
  expect(inquiry.success).toBe(true)
})
