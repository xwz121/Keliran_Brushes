import { notFound } from 'next/navigation'
import { isLocale } from '@/lib/locales'
import { getDictionary } from '@/lib/i18n'
import { canPreview, getProducts } from '@/lib/content'
import { pageMetadata } from '@/lib/metadata'
import { Catalogue } from '@/components/Catalogue'
import { QuoteBanner } from '@/components/QuoteBanner'
type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ preview?: string; line?: string }>
}
export async function generateMetadata({ params, searchParams }: Props) {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const t = getDictionary(locale)
  return pageMetadata(
    locale,
    '/products',
    t.products,
    t.catalogueIntro,
    await canPreview((await searchParams).preview === '1'),
  )
}
export default async function Page({ params, searchParams }: Props) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const t = getDictionary(locale)
  const q = await searchParams
  const preview = await canPreview(q.preview === '1')
  const products = await getProducts(locale, preview)
  const line = q.line === 'sealing' || q.line === 'brushes' ? q.line : ''
  return (
    <>
      <section className="container page-intro">
        <p className="eyebrow">Keliran / {t.products}</p>
        <h1>{t.products}</h1>
        <p>{t.catalogueIntro}</p>
      </section>
      <section className="container section catalogue-section">
        <Catalogue key={line || 'all'} products={products} locale={locale} defaultLine={line} />
      </section>
      <QuoteBanner locale={locale} />
    </>
  )
}
