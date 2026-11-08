import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { locales } from '../src/lib/locales'
import { interfaceDictionaries } from '../src/lib/interface-copy'
import { deterministicChecks } from '../src/lib/ai/checks'
import {
  phoneNumbers,
  primaryWhatsApp,
  whatsappBusinessNumber,
  whatsappContacts,
} from '../src/lib/contact-channels'
import profile from '../content/business-profile.json'
describe('complete public interface localisation', () => {
  for (const locale of locales)
    it(`${locale} preserves fields, dimensions, materials and contact addresses`, () => {
      const dict = interfaceDictionaries[locale]
      expect(Object.keys(dict).sort()).toEqual(Object.keys(interfaceDictionaries.en).sort())
      expect(Object.values(dict).every((text) => text.trim())).toBe(true)
      expect(deterministicChecks(interfaceDictionaries.en, dict, locale, [])).toEqual([])
      expect(dict.filesEmail).toContain('contact@keliran.com')
      const checklist = readFileSync(`public/downloads/${locale}/strip-brush-rfq-checklist.txt`, 'utf8')
      expect(checklist).toContain(dict.drawingRevision)
      expect(checklist).toContain(dict.trimLength)
      expect(checklist).toContain('contact@keliran.com')
      expect(existsSync(`public/downloads/${locale}/sealing-rfq-checklist.txt`)).toBe(false)
      expect(readFileSync(`public/downloads/${locale}/supplier-review-record.txt`, 'utf8')).toContain(
        `https://brushes.keliran.com/${locale}/guides/supplier-qualification`,
      )
    })
})
it('exposes both approved telephone and WhatsApp numbers without external calls', () => {
  expect(phoneNumbers(profile)).toEqual(['+447536120830', '+8617509072335'])
  // The WhatsApp Business number is the only WhatsApp contact whenever the CMS lists it.
  const china = {
    number: '+8617509072335',
    display: '+86 175 0907 2335',
    href: 'https://wa.me/8617509072335?text=Hello',
  }
  const swapped = {
    ...profile,
    whatsappNumber: profile.whatsappNumberSecondary,
    whatsappNumberSecondary: profile.whatsappNumber,
  }
  expect(whatsappContacts(profile, 'Hello')).toEqual([china])
  expect(whatsappContacts(swapped, 'Hello')).toEqual([china])
  expect(primaryWhatsApp(profile, 'Hello')?.number).toBe(`+${whatsappBusinessNumber}`)
  // Without the business number, the CMS numbers are used in CMS order.
  expect(
    whatsappContacts(
      { whatsappEnabled: true, whatsappNumber: '447536120830', whatsappNumberSecondary: '33612345678' },
      'Hi',
    ).map((c) => c.number),
  ).toEqual(['+447536120830', '+33612345678'])
  expect(primaryWhatsApp({ whatsappEnabled: false, whatsappNumber: '8617509072335' }, 'Hello')).toBeNull()
  expect(whatsappContacts({ whatsappEnabled: false, whatsappNumber: '447536120830' }, 'Hello')).toEqual([])
  expect(whatsappContacts({}, 'Hello')).toEqual([])
})
it('keeps exactly one enquiry reference placeholder in every WhatsApp follow-up message', () => {
  for (const locale of locales)
    expect(interfaceDictionaries[locale].whatsappSubmittedMessage.split('{ref}')).toHaveLength(2)
})
