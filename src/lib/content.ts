import { mediaURL } from './media-url'
import { unstable_cache } from 'next/cache'
import { cookies, headers } from 'next/headers'
import { getCMS } from './payload'
import { locales, type Locale } from './locales'
import type { ContentSlug } from '@/collections'
import { previewCookie, siteLine, siteLineWhere } from './site'
import type { Product } from './preview-data'
const contentCacheVersion = `brushes-20261108-split:${locales.join(',')}`
export async function canPreview(requested: boolean) {
  if (!requested && (await cookies()).get(previewCookie)?.value !== '1') return false
  const cms = await getCMS()
  return Boolean((await cms.auth({ headers: await headers() })).user)
}
export async function getCollection(locale: Locale, collection: ContentSlug, preview = false) {
  const read = async () => {
    const cms = await getCMS()
    const user = preview ? (await cms.auth({ headers: await headers() })).user : undefined
    return (
      await cms.find({
        collection,
        locale,
        fallbackLocale: preview ? 'en' : false,
        draft: preview,
        overrideAccess: false,
        user,
        // Signed-in previews bypass the anonymous access rule; keep them on this site's line too.
        ...(collection === 'pages' ? {} : { where: siteLineWhere }),
        limit: 250,
        depth: 1,
        sort: 'sortOrder',
      })
    ).docs
  }
  return preview
    ? read()
    : unstable_cache(read, [contentCacheVersion, collection, locale], {
        tags: ['site-content'],
        revalidate: 3600,
      })()
}
export async function getBySlug(locale: Locale, collection: ContentSlug, slug: string, preview = false) {
  return (await getCollection(locale, collection, preview)).find((d) => d.slug === slug) || null
}
export const getPage = (locale: Locale, slug: string, preview = false) =>
  getBySlug(locale, 'pages', slug, preview)
export const getResources = (locale: Locale, collection: 'materials' | 'applications', preview = false) =>
  getCollection(locale, collection, preview)
export async function getProducts(locale: Locale, preview = false): Promise<Product[]> {
  return (await getCollection(locale, 'products', preview)).map((d: any) => ({
    id: d.id,
    slug: d.slug,
    code: d.code,
    title: d.title || '',
    summary: d.summary || '',
    description: d.description || '',
    line: d.line || siteLine,
    materials: d.materials || [],
    category: typeof d.category === 'object' ? d.category?.title || '' : '',
    categorySlug: d.category?.slug,
    image: mediaURL(d.images?.[0]?.sizes?.detail?.url || d.images?.[0]?.url),
    imageAlt: d.images?.[0]?.alt,
    illustrative: d.images?.[0]?.illustrative,
    images: (d.images || [])
      .filter((m: any) => m?.url)
      .map((m: any) => ({
        url: mediaURL(m.sizes?.detail?.url || m.url)!,
        alt: m.alt || '',
        illustrative: Boolean(m.illustrative),
      })),
    specs: (d.specifications || []).map((s: any) => ({
      label: s.label || s.key,
      value: `${s.value}${s.unit ? ` ${s.unit}` : ''}`,
    })),
    sections: d.sections || [],
    relatedGuides: d.relatedGuides || [],
    relatedSolutions: d.relatedSolutions || [],
    source: 'cms',
    seoTitle: d.seoTitle,
    seoDescription: d.seoDescription,
  }))
}
