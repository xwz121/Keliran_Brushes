import { getDictionary } from '../../src/lib/i18n'
import { locales, type Locale } from '../../src/lib/locales'
import { materialCodes, previewProducts } from '../../src/lib/preview-data'
import type { ContentSlug } from '../../src/collections'

export type Text = {
  title: string
  summary: string
  description: string
  seoTitle: string
  seoDescription: string
  sections?: { key: string; heading: string; text: string; id?: string }[]
}
export type Entry = {
  collection: ContentSlug
  slug: string
  shared: Record<string, unknown>
  translations: Record<Locale, Text>
}
const localized = (fn: (locale: Locale) => Text) =>
  Object.fromEntries(locales.map((locale) => [locale, fn(locale)])) as Record<Locale, Text>
const text = (title: string, summary: string, description = summary): Text => ({
  title,
  summary,
  description,
  seoTitle: title,
  seoDescription: summary,
})
export const entries: Entry[] = []
for (const [index, product] of previewProducts('en').entries()) {
  const translations = localized((locale) => {
    const p = previewProducts(locale)[index]
    return text(p.title, p.summary, p.description)
  })
  entries.push({ collection: 'categories', slug: product.slug, shared: { sortOrder: index }, translations })
}
for (const [index, code] of materialCodes.entries()) {
  entries.push({
    collection: 'materials',
    slug: code.toLowerCase(),
    shared: { code, sortOrder: index },
    translations: localized((locale) => text(code, getDictionary(locale).technicalNote)),
  })
}
for (const [index, slug] of [
  'industrial-equipment',
  'enclosures-protection',
  'maintenance-assembly',
].entries()) {
  entries.push({
    collection: 'applications',
    slug,
    shared: { sortOrder: index },
    translations: localized((locale) => {
      const t = getDictionary(locale)
      return text([t.app1, t.app2, t.app3][index], [t.app1Body, t.app2Body, t.app3Body][index])
    }),
  })
}
for (const [index, p] of previewProducts('en').entries()) {
  entries.push({
    collection: 'products',
    slug: p.slug,
    shared: { code: p.code, materials: p.materials, sortOrder: index },
    translations: localized((locale) => {
      const product = previewProducts(locale)[index]
      return text(product.title, product.summary, product.description)
    }),
  })
}
for (const slug of ['home', 'materials', 'applications', 'about', 'contact', 'privacy']) {
  entries.push({
    collection: 'pages',
    slug,
    shared: {},
    translations: localized((locale) => {
      const t = getDictionary(locale)
      if (slug === 'home')
        return {
          ...text(t.heroTitle, t.heroBody),
          sections: [
            { key: 'products', heading: t.productTitle, text: t.productBody },
            { key: 'materials', heading: t.materialTitle, text: t.materialBody },
            { key: 'process', heading: t.processTitle, text: '' },
            { key: 'step1', heading: t.step1, text: t.step1Body },
            { key: 'step2', heading: t.step2, text: t.step2Body },
            { key: 'step3', heading: t.step3, text: t.step3Body },
          ],
        }
      if (slug === 'materials') return text(t.materialsTitle, t.materialsIntro, t.technicalNote)
      if (slug === 'applications') return text(t.applicationsTitle, t.applicationsBody)
      if (slug === 'about') return text(t.aboutTitle, t.aboutBody, t.aboutDetail)
      if (slug === 'contact') return text(t.contactTitle, t.inquiryIntro)
      return text(t.privacy, '', t.privacyConsent)
    }),
  })
}
