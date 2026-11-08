import { describe, expect, it } from 'vitest'
import { isLocale, locales, localizedPath } from '../src/lib/locales'
import { getDictionary, englishDictionary, translations } from '../src/lib/i18n'
import { previewProducts } from '../src/lib/preview-data'
import { pageMetadata } from '../src/lib/metadata'
import { inquirySchema } from '../src/lib/inquiries'

describe('Traditional Chinese', () => {
  it('switches languages in both directions without losing the current product path', () => {
    expect(localizedPath('/en/products/custom-fkm-o-rings', 'zh-Hant')).toBe(
      '/zh-Hant/products/custom-fkm-o-rings',
    )
    expect(localizedPath('/zh-Hant/products/custom-fkm-o-rings', 'en')).toBe(
      '/en/products/custom-fkm-o-rings',
    )
    expect(localizedPath('/zh-Hant', 'fr')).toBe('/fr')
    expect(localizedPath('/zh-Hant/materials', 'zh-Hant')).toBe('/zh-Hant/materials')
    expect(isLocale('zh-Hant')).toBe(true)
    expect(isLocale('zh')).toBe(false)
  })
  it('has a complete dictionary and translated product content with unchanged shared specifications', () => {
    expect(Object.keys(translations['zh-Hant']).sort()).toEqual(Object.keys(englishDictionary).sort())
    expect(getDictionary('zh-Hant').products).toBe('產品')
    for (const locale of locales) {
      for (const [index, product] of previewProducts(locale).entries()) {
        for (const field of ['title', 'summary', 'description', 'category'] as const)
          expect(product[field]?.trim()).toBeTruthy()
        expect(product.materials).toEqual(previewProducts('en')[index].materials)
        expect(product.slug).toBe(previewProducts('en')[index].slug)
        expect(product.code).toBe(previewProducts('en')[index].code)
      }
    }
    expect(previewProducts('zh-Hant')[2].title).toBe('客製化 FKM O 型環')
  })
  it('includes the script-qualified locale in canonical and alternate URLs', () => {
    const metadata = pageMetadata('zh-Hant', '/materials', '材料', '材料資訊')
    expect(metadata.alternates?.canonical).toMatch(/\/zh-Hant\/materials$/)
    expect(metadata.alternates?.languages?.['zh-Hant']).toMatch(/\/zh-Hant\/materials$/)
    expect(metadata.alternates?.languages?.en).toMatch(/\/en\/materials$/)
  })
  it('accepts Traditional Chinese inquiries without sending any request', () => {
    expect(
      inquirySchema.safeParse({
        submissionId: '60797e11-4af1-4d25-9996-b6c15d22fe1d',
        name: '測試',
        email: 'test@example.com',
        message: '請提供 FKM O 型環的規格與報價。',
        consent: true,
        locale: 'zh-Hant',
        sourcePath: '/zh-Hant/contact',
      }).success,
    ).toBe(true)
  })
})
