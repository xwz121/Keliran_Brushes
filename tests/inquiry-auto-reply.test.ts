import { describe, it, expect } from 'vitest'
import { buildAutoReply } from '../src/lib/inquiry-auto-reply'
import { interfaceDictionaries } from '../src/lib/interface-copy'
import { locales } from '../src/lib/locales'

const keys = [
  'autoReplySubject',
  'autoReplyGreeting',
  'autoReplyIntro',
  'autoReplyLine',
  'autoReplyFollowUp',
  'autoReplyAutomatic',
] as const
const placeholders = (s: string) => (s.match(/\{\w+\}/g) || []).sort()
const reference = '60797e11-4af1-4d25-9996-b6c15d22fe1d'

describe('visitor acknowledgement email', () => {
  it('contains only the reference, published product data and fixed copy', () => {
    const { subject, text } = buildAutoReply({
      locale: 'en',
      reference,
      product: { title: 'Metal channel strip brushes', code: 'BR01-CUSTOM' },
    })
    expect(subject).toBe(`Enquiry received: ${reference}`)
    expect(text).toContain(`Inquiry reference: ${reference}`)
    expect(text).toContain('Product reference: BR01-CUSTOM · Metal channel strip brushes')
    expect(text).toContain('Product line: Industrial strip brushes')
    expect(text).toContain('reply to this email')
    expect(text).not.toMatch(/\{\w+\}/)
  })
  it('omits the product when the catalogue has none and falls back to English', () => {
    const { text } = buildAutoReply({ locale: 'xx', reference, product: null })
    expect(text).not.toContain('Product reference')
    expect(text).toContain('Hello,')
  })
  for (const locale of locales)
    it(`${locale} is complete, keeps the placeholders and promises no reply time`, () => {
      const dict = interfaceDictionaries[locale]
      for (const key of keys) {
        expect(dict[key].trim()).not.toBe('')
        expect(placeholders(dict[key])).toEqual(placeholders(interfaceDictionaries.en[key]))
        // No digits: the acknowledgement must not commit to a response time.
        expect(dict[key]).not.toMatch(/[0-9０-９]/)
      }
      const { subject, text } = buildAutoReply({ locale, reference })
      expect(subject).toContain(reference)
      expect(text).toContain(dict.autoReplyAutomatic)
      expect(text).not.toMatch(/\{\w+\}/)
    })
})
