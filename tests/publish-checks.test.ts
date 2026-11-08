import { describe, it, expect } from 'vitest'
import { mediaIdsOf, overlayLocale, releaseIssues, textsFor } from '../src/lib/content-checks'
import { locales } from '../src/lib/locales'

const all = (en: string, other = (l: string) => `${l}: ${en}`) =>
  Object.fromEntries(locales.map((l) => [l, l === 'en' ? en : other(l)]))
const complete = () => ({
  slug: 'door-seal',
  factsConfirmed: true,
  title: all('FKM O-ring 25 mm'),
  summary: all('A ring for a defined application.'),
  sections: [{ id: 's1', key: 'fit', heading: all('Fit'), text: all('Gap 4 mm') }],
})
const media = (id: number, approved = true, missing?: string) => ({
  id,
  approved,
  alt: Object.fromEntries(locales.filter((l) => l !== missing).map((l) => [l, `alt ${l}`])),
})
const check = (document: Record<string, any>, collection = 'categories', items = [media(1)]) =>
  releaseIssues({ collection, document, media: items, glossary: [], locales })

describe('release checks that replaced the AI release centre', () => {
  it('passes a complete, consistent document', () => expect(check(complete())).toEqual([]))
  it('rejects empty translations, changed numbers and unconfirmed facts', () => {
    const doc = complete()
    doc.title.ja = ''
    doc.sections[0].text.de = 'Spalt 5 mm'
    expect(check({ ...doc, factsConfirmed: false })).toEqual(
      expect.arrayContaining([
        '请先勾选「产品事实与素材已确认」。',
        'ja: title: empty translation',
        'de: sections.0.text: numbers differ',
      ]),
    )
  })
  it('requires approved images with alt text in every locale', () => {
    expect(check(complete(), 'products', [])).toContain('正式产品与首页需要获准使用的图片。')
    const product = { ...complete(), images: [2, { id: 1 }] }
    expect(check(product, 'products', [media(1), media(2, false, 'ja')])).toEqual([
      '图片 2 尚未获准正式发布。',
      '图片 2 缺少 ja 替代文本。',
    ])
    expect(mediaIdsOf({ images: [3, { id: 1 }], heroImage: 1, image: null })).toEqual([1, 3])
  })
  it('enforces protected and translated glossary terms', () => {
    const doc = complete()
    doc.summary.fr = 'Un joint pour une application définie.'
    const issues = releaseIssues({
      collection: 'categories',
      document: doc,
      media: [],
      glossary: [{ term: 'ring', translations: { fr: 'anneau' } }],
      locales: ['en', 'fr'],
    })
    expect(issues).toContain('fr: summary: required terminology anneau')
  })
})
describe('overlaying the saved locale on the stored draft', () => {
  it('replaces only the saving locale and matches rows by id', () => {
    const stored = complete()
    const merged = overlayLocale(
      stored,
      {
        title: 'Joint FKM 25 mm',
        factsConfirmed: false,
        sections: [
          { id: 's1', key: 'fit', heading: 'Montage', text: 'Jeu 4 mm' },
          { key: 'new', heading: 'Neu' },
        ],
      },
      'fr',
    )
    expect(merged.title.fr).toBe('Joint FKM 25 mm')
    expect(merged.title.en).toBe('FKM O-ring 25 mm')
    expect(merged.factsConfirmed).toBe(false)
    expect(textsFor(merged, 'fr')['sections.0.text']).toBe('Jeu 4 mm')
    expect(textsFor(merged, 'de')['sections.0.text']).toBe('de: Gap 4 mm')
    // A row added in this save has no stored translations, so the other locales are empty.
    expect(textsFor(merged, 'de')['sections.1.heading']).toBe('')
    expect(stored.title.fr).toBe('fr: FKM O-ring 25 mm')
  })
  it('keeps the stored draft for a publish-only save and accepts locale "all"', () => {
    const stored = complete()
    expect(overlayLocale(stored, { _status: 'published' }, 'en').title).toEqual(stored.title)
    expect(overlayLocale(stored, { title: { it: 'Anello' } }, 'all').title.it).toBe('Anello')
  })
})
