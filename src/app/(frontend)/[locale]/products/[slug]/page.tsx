import { materialName } from '@/lib/material-names'
import { InquiryNextSteps } from '@/components/InquiryNextSteps'
import { RichSections } from '@/components/RichSections'
import { StandardsNote, RelatedLinks } from '@/components/ResourceUI'
import { JsonLd } from '@/components/JsonLd'
import { ProcurementSupport, PreparationInputs, roleLabel } from '@/components/ProcurementSupport'
import { distinctSections } from '@/lib/summary'
import { materialBindings, existingRelationIds } from '@/lib/procurement-relations'
import { Breadcrumbs } from '@/components/ResourceUI'
import { productData, breadcrumbData } from '@/lib/jsonld'
import { materialSlug } from '@/lib/routes'
import { siteCopy } from '@/lib/site-copy'
import { ProductGallery } from '@/components/ProductGallery'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowUpRight } from 'lucide-react'
import { isLocale } from '@/lib/locales'
import { getDictionary } from '@/lib/i18n'
import { canPreview, getProducts } from '@/lib/content'
import { pageMetadata } from '@/lib/metadata'
import { previewMode } from '@/lib/env'
import { InquiryForm } from '@/components/InquiryForm'
import { ProductCard } from '@/components/ProductCard'
import { WhatsAppPanel } from '@/components/WhatsAppPanel'
import { whatsappContacts } from '@/lib/contact-channels'
import { fillCopy, interfaceCopy } from '@/lib/interface-copy'
import { getSiteSettings } from '@/lib/settings'
import { SupplierReview } from '@/components/SupplierReview'
import { ContinueChatNotice } from '@/components/ContinueChatNotice'
type Props = {
  params: Promise<{ locale: string; slug: string }>
  searchParams: Promise<{ preview?: string }>
}
export async function generateMetadata({ params, searchParams }: Props) {
  const { locale, slug } = await params
  if (!isLocale(locale)) return {}
  const requested = (await searchParams).preview === '1'
  const preview = await canPreview(requested)
  const p = (await getProducts(locale, preview)).find((p) => p.slug === slug)
  return p
    ? pageMetadata(locale, `/products/${slug}`, p.seoTitle || p.title, p.seoDescription || p.summary, preview)
    : { robots: { index: false, follow: false } }
}
export default async function Page({ params, searchParams }: Props) {
  const { locale, slug } = await params
  if (!isLocale(locale)) notFound()
  const t = getDictionary(locale)
  const preview = await canPreview((await searchParams).preview === '1')
  const products = await getProducts(locale, preview)
  const p = products.find((p) => p.slug === slug)
  if (!p) notFound()
  const u = interfaceCopy(locale)
  // The chat opens with this product's name and reference, so sales can match it to the same page.
  const whatsapp = whatsappContacts(
    await getSiteSettings(),
    fillCopy(u.whatsappProductMessage, { product: p.title, ref: p.code }),
  )
  const breadcrumbs = [
    {
      title: p.line === 'brushes' ? siteCopy(locale).brushes : siteCopy(locale).sealing,
      href: `/${locale}/${p.line === 'brushes' ? 'strip-brushes' : 'sealing'}`,
    },
    { title: p.title },
  ]
  const bindings = materialBindings(p)
  const sections = distinctSections(p.sections, p.description)
  return (
    <>
      {p.source === 'cms' && <JsonLd data={productData(p, locale)} />}
      <Breadcrumbs locale={locale} items={breadcrumbs} />
      <JsonLd data={breadcrumbData(locale, breadcrumbs)} />
      <section className="container product-detail-grid">
        <ProductGallery
          images={
            p.images?.length
              ? p.images
              : previewMode
                ? [{ url: '/images/sealing-hero.png', alt: t.renderNote, illustrative: true }]
                : []
          }
          caption={t.renderNote}
        />
        <div className="product-detail-copy">
          <p className="eyebrow">{u.productFamily}</p>
          <h1>{p.title}</h1>
          <p className="lead">{p.summary}</p>
          <div className="detail-meta">
            <span>
              {t.materialLabel}
              {bindings.length ? ` · ${roleLabel(bindings[0].role, locale)}` : ''}
            </span>
            <div className="material-tags">
              {p.materials.map((m) =>
                materialSlug(m) ? (
                  <Link
                    className="material-chip-link"
                    key={m}
                    href={`/${locale}/materials/${materialSlug(m)}`}
                  >
                    {materialName(m, locale)}
                  </Link>
                ) : (
                  <span key={m}>{materialName(m, locale)}</span>
                ),
              )}
            </div>
          </div>
          {/* A family reference names the product for quotations, chats and samples; it is not a stocked SKU. */}
          <dl className="product-facts">
            <div>
              <dt>{u.referenceLabel}</dt>
              <dd>{p.code}</dd>
            </div>
            <div>
              <dt>{u.statusLabel}</dt>
              <dd>{t.availability}</dd>
            </div>
          </dl>
          <p className="small-text">
            {u.familyNote} {t.availabilityBody}
          </p>
          <Link href={`/${locale}/rfq?line=${p.line || 'sealing'}&product=${p.slug}`} className="button">
            {t.quoteFor}
            <ArrowUpRight size={19} />
          </Link>
          <ContinueChatNotice locale={locale} href={whatsapp[0]?.href} />
        </div>
      </section>
      <section className="container section product-overview">
        <div>
          <p className="eyebrow">{t.overview}</p>
          <h2>{t.details}</h2>
        </div>
        <div>
          <p className="body-copy">{p.description}</p>
          {p.specs.length > 0 && (
            <table className="spec-table">
              <caption>{t.specifications}</caption>
              <tbody>
                {p.specs.map((s) => (
                  <tr key={s.label}>
                    <th scope="row">{s.label}</th>
                    <td>{s.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <RichSections sections={sections} />
          {p.line !== 'brushes' && !sections.some((s) => s.key === 'standards-note') && (
            <StandardsNote locale={locale} />
          )}
          <PreparationInputs id={`products/${p.slug}`} locale={locale} />
          {p.line === 'brushes' && (
            <p className="technical-note">
              {u.materialRoleNote}
              {p.slug === 'brush-holders' ? ` ${u.aluminiumReview}` : ''}
            </p>
          )}
          <ProcurementSupport
            id={`products/${p.slug}`}
            locale={locale}
            preview={preview}
            omit={existingRelationIds(p)}
          />
          <RelatedLinks locale={locale} doc={p} />
          <p className="technical-note">{t.technicalNote}</p>
        </div>
      </section>
      <SupplierReview locale={locale} />
      <section className="inquiry-section" id="inquiry">
        <div className="container inquiry-grid">
          <div>
            <p className="eyebrow">{p.code}</p>
            <h2>{t.quote}</h2>
            <p>{t.inquiryIntro}</p>
            <InquiryNextSteps locale={locale} />
            <WhatsAppPanel contacts={whatsapp} locale={locale} heading="h3" />
          </div>
          <InquiryForm
            locale={locale}
            productSlug={slug}
            productTitle={p.title}
            productCode={p.code}
            initialLine={p.line === 'brushes' ? 'brushes' : 'sealing'}
            whatsapp={whatsapp[0]?.number}
          />
        </div>
      </section>
      <section className="container section">
        <div className="section-heading">
          <h2>{t.related}</h2>
        </div>
        <div className="product-grid">
          {products
            .filter((x) => x.id !== p.id && x.line === p.line)
            .slice(0, 4)
            .map((x, i) => (
              <ProductCard product={x} locale={locale} index={i} key={x.id} />
            ))}
        </div>
      </section>
    </>
  )
}
