import { describe, it, expect } from 'vitest'
import { deterministicChecks, englishTexts, hash, localizedData } from '../src/lib/ai/checks'
import { englishDictionary, translations } from '../src/lib/i18n'
import { inquirySchema } from '../src/lib/inquiries'
describe('publication checks', () => {
  it('detects changed dimensions, material codes and extra claims in blank fields', () => {
    const source = { title: 'FKM O-ring 25 mm', description: '' }
    expect(
      deterministicChecks(source, { title: 'EPDM O-ring 30 mm', description: 'Certified' }, 'fr', []),
    ).toHaveLength(3)
  })
  it('preserves field keys and required terms', () => {
    expect(
      deterministicChecks({ title: 'O-ring' }, { headline: 'Joint' }, 'fr', [
        { term: 'O-ring', translations: { fr: 'joint torique' } },
      ]),
    ).toEqual(
      expect.arrayContaining([
        'Field set changed.',
        'title: empty translation',
        'title: required terminology joint torique',
      ]),
    )
  })
  it('accepts decimal localization while preserving units', () => {
    expect(deterministicChecks({ title: 'FKM 2.5 mm' }, { title: 'FKM 2,5 mm' }, 'fr', [])).toEqual([])
  })
  it('matches material codes as terms, not fragments of unrelated English words', () => {
    const terms = [
      { term: 'PP', protected: true },
      { term: 'CR', protected: true },
    ]
    expect(
      deterministicChecks(
        { title: 'Approved supply and description' },
        { title: 'Freigegebene Lieferung und Beschreibung' },
        'de',
        terms,
      ),
    ).toEqual([])
    expect(deterministicChecks({ title: 'PP and CR' }, { title: 'Materialien' }, 'de', terms)).toContain(
      'title: required terminology PP',
    )
    expect(
      deterministicChecks({ title: 'PA6 filament' }, { title: 'PA6刷絲' }, 'zh-Hant', [
        { term: 'PA6', protected: true },
      ]),
    ).toEqual([])
  })
  it('hashes shared facts and editorial state consistently', () => {
    expect(hash({ a: 1, b: 2 })).toBe(hash({ b: 2, a: 1 }))
    expect(hash({ material: 'FKM' })).not.toBe(hash({ material: 'EPDM' }))
  })
  it('rejects missing temperature signs', () =>
    expect(deterministicChecks({ title: '-20 °C' }, { title: '20 °C' }, 'de', [])).toContain(
      'title: numbers differ',
    ))
  it('round-trips localized fields and keeps shared parameters', () => {
    const doc = {
      title: { en: 'Ring' },
      sections: [{ id: 'a', key: 'intro', heading: { en: 'Fit' }, text: { en: '25 mm' } }],
      specifications: [{ id: 'b', key: 'size', value: '25', unit: 'mm', label: { en: 'Diameter' } }],
    }
    const texts = englishTexts(doc)
    const data = localizedData(doc, { ...texts, title: 'Joint' })
    expect(data.title).toBe('Joint')
    expect(data.specifications[0]).toEqual({
      id: 'b',
      key: 'size',
      value: '25',
      unit: 'mm',
      label: 'Diameter',
    })
  })
})
describe('all supported interface languages', () => {
  for (const [locale, dict] of Object.entries(translations))
    it(`${locale} has every UI string`, () => {
      expect(Object.keys(dict).sort()).toEqual(Object.keys(englishDictionary).sort())
    })
})
describe('inquiry validation', () => {
  const valid = {
    submissionId: '60797e11-4af1-4d25-9996-b6c15d22fe1d',
    name: 'Test buyer',
    email: 'buyer@example.com',
    message: 'Please quote a sealing part.',
    consent: true,
    locale: 'en',
    sourcePath: '/en/contact',
  }
  it('accepts a normal text-only inquiry', () => expect(inquirySchema.safeParse(valid).success).toBe(true))
  it.each([
    { consent: false },
    { email: 'a\r\nbcc:bad@example.com' },
    { message: 'short' },
    { locale: 'zh' },
    { sourcePath: 'https://evil.example' },
  ])('rejects invalid input %j', (change) =>
    expect(inquirySchema.safeParse({ ...valid, ...change }).success).toBe(false),
  )
})
