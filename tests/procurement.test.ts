import { describe, it, expect } from 'vitest'
import profile from '../content/business-profile.json'
import { locales } from '../src/lib/locales'
import { fillCopy, interfaceDictionaries } from '../src/lib/interface-copy'
import { registeredEntityLines } from '../src/lib/company'
import { isWhatsAppVisit } from '../src/lib/inquiry-attribution'
import { productData } from '../src/lib/jsonld'
describe('statutory company line', () => {
  it('lists each registered entity with number, place of registration and registered office', () => {
    expect(registeredEntityLines(profile, 'en')).toEqual([
      'Keliran LTD · Registration: 15698503 · England and Wales · Registered office: 483 Green Lanes, London, England, N13 4BS',
    ])
    expect(registeredEntityLines(profile, 'de')).toEqual([
      'Keliran LTD · Registernummer: 15698503 · England und Wales · Eingetragener Sitz: 483 Green Lanes, London, England, N13 4BS',
    ])
    for (const locale of locales) {
      const [line] = registeredEntityLines(profile, locale)
      expect(line, locale).toContain('Keliran LTD')
      expect(line, locale).toContain('15698503')
      expect(line, locale).toContain('N13 4BS')
    }
  })
  it('leaves out entities without a registration number', () => {
    expect(registeredEntityLines({ legalEntity: 'Example Ltd', addressLines: '1 Road' }, 'en')).toEqual([])
    expect(registeredEntityLines({}, 'en')).toEqual([])
  })
})
describe('product reference in chats and structured data', () => {
  it('fills the product name and reference into the WhatsApp message in every language', () => {
    for (const locale of locales) {
      const template = interfaceDictionaries[locale].whatsappProductMessage
      expect(template.split('{product}'), locale).toHaveLength(2)
      expect(template.split('{ref}'), locale).toHaveLength(2)
      const text = fillCopy(template, { product: 'Sponge rubber seals', ref: 'SE02-CUSTOM' })
      expect(text, locale).toContain('SE02-CUSTOM')
      expect(text, locale).not.toMatch(/\{\w+\}/)
    }
    expect(fillCopy('{a} and {unknown}', { a: 'x' })).toBe('x and {unknown}')
  })
  it('describes a product family without SKU, offer, price or stock claims', () => {
    const data: Record<string, unknown> = productData(
      {
        title: 'Sponge rubber seals',
        summary: 'Compressible profiles',
        code: 'SE02-CUSTOM',
        slug: 'sponge-rubber-seals',
        category: 'Sponge seals',
      },
      'en',
    )
    expect(data.productID).toBe('SE02-CUSTOM')
    expect(data.category).toBe('Sponge seals')
    for (const key of ['sku', 'offers', 'aggregateRating', 'review']) expect(data).not.toHaveProperty(key)
  })
})
describe('procurement copy', () => {
  it('keeps the enquiry address in the confidentiality note of every language', () => {
    for (const locale of locales)
      expect(interfaceDictionaries[locale].ndaNote, locale).toContain('contact@keliran.com')
  })
  it('recognises links shared from a WhatsApp chat by their source label only', () => {
    expect(isWhatsAppVisit('whatsapp')).toBe(true)
    expect(isWhatsAppVisit(' WhatsApp ')).toBe(true)
    expect(isWhatsAppVisit('facebook')).toBe(false)
    expect(isWhatsAppVisit('')).toBe(false)
    expect(isWhatsAppVisit(undefined)).toBe(false)
  })
})
