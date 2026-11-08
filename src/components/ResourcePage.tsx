import { sprintProducts } from '@/lib/sprint-products'
import { interfaceCopy } from '@/lib/interface-copy'
import { BusinessDetails } from './BusinessDetails'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowUpRight, Download } from 'lucide-react'
import { canPreview, getCollection, getBySlug, getProducts, getPage } from '@/lib/content'
import { isLocale, type Locale } from '@/lib/locales'
import { siteCopy } from '@/lib/site-copy'
import { getDictionary } from '@/lib/i18n'
import { pageMetadata } from '@/lib/metadata'
import { distinctSections } from '@/lib/summary'
import { ProcurementSupport, PreparationInputs, GuideDownload } from './ProcurementSupport'
import { contextRfqHref } from '@/lib/content-context'
import { existingRelationIds } from '@/lib/procurement-relations'
import { routeFor } from '@/lib/routes'
import { getSiteSettings } from '@/lib/settings'
import { primaryWhatsApp } from '@/lib/contact-channels'
import { RichSections, MarkdownLite } from './RichSections'
import { Breadcrumbs, ResourceCard, RelatedLinks, FaqList } from './ResourceUI'
import { siteLine } from '@/lib/site'
import { Catalogue } from './Catalogue'
import { QuoteBanner } from './QuoteBanner'
import { InquiryForm } from './InquiryForm'
import { ContactChannels } from './ContactChannels'
import { PaymentCheck, SupplierRecord } from './SupplierReview'
import { JsonLd } from './JsonLd'
import { breadcrumbData, faqData } from '@/lib/jsonld'
export type ResourceProps = {
  params: Promise<{ locale: string; slug?: string; category?: string }>
  searchParams: Promise<{ preview?: string; line?: string; product?: string; context?: string }>
}
const listingMap = {
  solutions: 'solutions',
  cases: 'cases',
  guides: 'guides',
  applications: 'applications',
  materials: 'materials',
  faq: 'faqs',
} as const
function label(route: string, locale: Locale) {
  const c = siteCopy(locale),
    u = interfaceCopy(locale),
    t = getDictionary(locale)
  return (
    {
      'strip-brushes': c.brushes,
      solutions: c.solutions,
      cases: c.cases,
      guides: c.guides,
      applications: t.applications,
      materials: t.materials,
      faq: c.faq,
      about: t.about,
      contact: t.contact,
      privacy: t.privacy,
      legal: interfaceCopy(locale).legal,
    }[route] || route
  )
}
function intros(locale: Locale): Record<string, string> {
  const u = interfaceCopy(locale)
  return {
    'strip-brushes': u.introBrushes,
    solutions: u.introSolutions,
    cases: u.introCases,
    guides: u.introGuides,
    applications: u.introApplications,
    materials: u.introMaterials,
    faq: u.introFaq,
  }
}
export async function resourceMetadata(route: string, props: ResourceProps) {
  const { locale, slug, category } = await props.params
  if (!isLocale(locale)) return {}
  const preview = await canPreview((await props.searchParams).preview === '1')
  const collection = route === 'strip-brushes' ? 'categories' : listingMap[route as keyof typeof listingMap]
  const detail = slug || category
  const doc =
    detail && collection
      ? await getBySlug(locale, collection, detail, preview)
      : !collection
        ? await getPage(locale, route, preview)
        : null
  return pageMetadata(
    locale,
    `/${route}${detail ? `/${detail}` : ''}`,
    doc && collection === 'categories' && 'code' in doc && !doc.code?.startsWith('PR')
      ? `${doc.title} — ${interfaceCopy(locale).selectionTitle}`
      : doc?.seoTitle || doc?.title || label(route, locale),
    doc?.seoDescription || doc?.summary || intros(locale)[route] || '',
    preview,
  )
}
export async function ResourcePage({ route, params, searchParams }: ResourceProps & { route: string }) {
  const { locale, slug, category } = await params
  if (!isLocale(locale)) notFound()
  const preview = await canPreview((await searchParams).preview === '1'),
    c = siteCopy(locale),
    u = interfaceCopy(locale),
    t = getDictionary(locale),
    title = label(route, locale)
  const collection = listingMap[route as keyof typeof listingMap]
  const line = siteLine
  if (route === 'strip-brushes') {
    const [categories, products, guides] = await Promise.all([
      getCollection(locale, 'categories', preview),
      getProducts(locale, preview),
      getCollection(locale, 'guides', preview),
    ])
    const doc = category ? categories.find((d) => d.slug === category) : null
    if (category && (!doc || ('line' in doc && doc.line !== line))) notFound()
    const processing = Boolean(doc && 'code' in doc && doc.code?.startsWith('PR'))
    const filtered = products.filter(
      (p) =>
        p.line === line &&
        (category
          ? p.categorySlug === category || processing
          : (sprintProducts as readonly string[]).includes(p.slug)),
    )
    const families = categories.filter((d: any) => d.line === line && d.title)
    const lineProducts = products.filter((p) => p.line === line).length
    const measureGuide = guides.find((d) => d.slug === 'measure-strip-brush' && d.title)
    return (
      <>
        <Breadcrumbs
          locale={locale}
          items={[
            { title, href: category ? `/${locale}/${route}` : undefined },
            ...(doc ? [{ title: doc.title || doc.slug }] : []),
          ]}
        />
        <section className="container line-intro">
          <div>
            <p className="eyebrow enter">{u.brushTags}</p>
            <h1>{doc ? `${doc.title}${processing ? '' : ` — ${u.selectionTitle}`}` : u.brushesTitle}</h1>
            <p className="enter" style={{ '--i': 1 } as React.CSSProperties}>
              {doc?.summary || intros(locale)[route]}
            </p>
            <p className="line-offer enter" style={{ '--i': 2 } as React.CSSProperties}>
              {u.offerBody}
            </p>
            <Link
              href={contextRfqHref(locale, doc ? { kind: 'categories', slug: doc.slug } : undefined)}
              className="button enter"
              style={{ '--i': 2 } as React.CSSProperties}
            >
              {u.drawingCta}
              <ArrowUpRight size={20} />
            </Link>
          </div>
          <figure>
            <Image
              src="/images/keliran-v2/strip-brushes.webp"
              alt={t.renderNote}
              width={1536}
              height={1024}
              priority
              sizes="(max-width:800px) 100vw, 50vw"
            />
            <figcaption>{t.renderNote}</figcaption>
          </figure>
        </section>
        <section className={`container section${!category ? ' sprint-catalogue' : ''}`}>
          {!category && (
            <div className="section-heading">
              <div>
                <h2>{u.entryTitle}</h2>
                <p>{u.entryBody}</p>
              </div>
              {lineProducts > filtered.length && (
                <Link className="text-link" href={`/${locale}/products`}>
                  {t.allProducts} →
                </Link>
              )}
            </div>
          )}
          {!category && families.length > filtered.length && (
            <nav className="category-chips line-families" aria-label={t.categoryLabel}>
              <span className="eyebrow">{t.categoryLabel}</span>
              {families.map((d) => (
                <Link key={d.id} href={routeFor('categories', d, locale)}>
                  {d.title}
                </Link>
              ))}
            </nav>
          )}
          {category && (
            <nav className="category-chips" aria-label={t.categoryLabel}>
              <Link className={!category ? 'selected' : ''} href={`/${locale}/${route}`}>
                {c.all}
              </Link>
              {families.map((d) => (
                <Link
                  className={d.slug === category ? 'selected' : ''}
                  key={d.id}
                  href={routeFor('categories', d, locale)}
                >
                  {d.title}
                </Link>
              ))}
            </nav>
          )}
          {doc && (
            <div className="guide-body">
              <RichSections sections={distinctSections(doc.sections, doc.summary)} />
            </div>
          )}
          <Catalogue products={filtered} locale={locale} />
          {doc && <ProcurementSupport id={`categories/${doc.slug}`} locale={locale} preview={preview} />}
          <div className="download-bar line-requirements" data-motion="reveal">
            <div>
              <h2>{c.requirements}</h2>
              <p>{u.downloadIntro}</p>
            </div>
            {measureGuide && (
              <Link href={routeFor('guides', measureGuide, locale)}>
                <ArrowUpRight size={18} />
                {measureGuide.title}
              </Link>
            )}
            <a href={`/downloads/${locale}/strip-brush-rfq-checklist.txt`} download>
              <Download size={18} />
              {c.downloads}
            </a>
          </div>
        </section>
        <QuoteBanner locale={locale} />
      </>
    )
  }
  if (collection) {
    const docs = await getCollection(locale, collection, preview)
    if (slug) {
      const doc: any = docs.find((d) => d.slug === slug)
      if (!doc) notFound()
      // The supplier-qualification guide is where purchasing and finance look for the company record.
      const supplierGuide = collection === 'guides' && slug === 'supplier-qualification'
      const context = collection === 'faqs' ? undefined : { kind: collection, slug }
      const sections = distinctSections(doc.sections, doc.summary)
      const settings = supplierGuide ? await getSiteSettings() : null
      const items = [{ title, href: `/${locale}/${route}` }, { title: doc.title }]
      return (
        <>
          <Breadcrumbs locale={locale} items={items} />
          <JsonLd data={breadcrumbData(locale, items)} />
          <section className="container page-intro resource-intro">
            <p className="eyebrow">{doc.scenarioType === 'typical' ? c.typical : title}</p>
            <h1>{doc.title}</h1>
            <div className="resource-summary">
              <MarkdownLite text={doc.summary || ''} />
            </div>
          </section>
          <div className="container article-layout">
            <article className="guide-body">
              <RichSections sections={sections} />
              <PreparationInputs id={`${collection}/${slug}`} locale={locale} />
              {collection === 'materials' && ['aluminium', 'ss304', 'ss316'].includes(slug) && (
                <p className="technical-note">
                  {u.materialRoleNote}
                  {slug === 'aluminium' ? ` ${u.aluminiumReview}` : ''}
                </p>
              )}
              {collection === 'guides' && <GuideDownload locale={locale} slug={slug} />}
              {supplierGuide && (
                <div className="download-bar guide-download">
                  <div>
                    <h2>{u.blankRecordTitle}</h2>
                    <p>{u.blankRecordBody}</p>
                  </div>
                  <a href={`/downloads/${locale}/supplier-review-record.txt`} download>
                    {c.supplier} — {c.downloads}
                  </a>
                </div>
              )}
              <ProcurementSupport
                id={`${collection}/${slug}`}
                locale={locale}
                preview={preview}
                omit={existingRelationIds(doc)}
              />
              {!doc.sections?.length && <p>{doc.description}</p>}
            </article>
            <aside className="article-aside">
              <span className="eyebrow">{u.onPage}</span>
              <nav>
                {sections.map((s: any) => (
                  <a key={s.key} href={`#${s.key}`}>
                    {s.heading}
                  </a>
                ))}
              </nav>
              {settings && <SupplierRecord settings={settings} locale={locale} />}
              <div>
                <h3>{u.clearEnquiry}</h3>
                <p>{u.sendDrawing}</p>
                <Link className="button" href={contextRfqHref(locale, context)}>
                  {c.start}
                  <ArrowUpRight size={18} />
                </Link>
              </div>
            </aside>
          </div>
          <section className="container section">
            <RelatedLinks locale={locale} doc={doc} />
          </section>
          <QuoteBanner context={context} locale={locale} />
        </>
      )
    }
    return (
      <>
        <section className="container page-intro">
          <p className="eyebrow">KELIRAN / {title}</p>
          <h1>{title}</h1>
          <p>{intros(locale)[route]}</p>
        </section>
        <section className="container section resource-list">
          {route === 'guides' && (
            <div className="download-bar">
              <div>
                <h2>{c.downloads}</h2>
                <p>{u.downloadIntro}</p>
              </div>
              <a href={`/downloads/${locale}/strip-brush-rfq-checklist.txt`} download>
                <Download size={18} />
                {c.brushes}
              </a>
            </div>
          )}
          {route === 'faq' ? (
            <>
              <FaqList docs={docs} />
              <JsonLd data={faqData(docs)} />
            </>
          ) : (
            <div className="resource-grid" data-motion="stagger">
              {docs.map((d) => (
                <ResourceCard key={d.id} doc={d} collection={collection} locale={locale} />
              ))}
            </div>
          )}
          {!docs.length && <p>{t.noContent}</p>}
        </section>
        <QuoteBanner locale={locale} />
      </>
    )
  }
  const page = await getPage(locale, route, preview)
  if (!page) notFound()
  const settings = await getSiteSettings()
  return (
    <>
      <section className="container page-intro">
        <p className="eyebrow">KELIRAN / {title}</p>
        <h1>{page.title}</h1>
        <p>{page.summary}</p>
      </section>
      {route === 'contact' ? (
        <section className="container contact-layout section">
          <div>
            <h2>{t.quote}</h2>
            <p>{t.inquiryIntro}</p>
            <ContactChannels settings={settings} locale={locale} />
            <BusinessDetails settings={settings} locale={locale} />
            <div className="contact-note">
              <p>{u.drawingQuestion}</p>
              <Link className="text-link" href={`/${locale}/rfq`}>
                {u.technicalRfq}
                <ArrowUpRight size={18} />
              </Link>
            </div>
          </div>
          <InquiryForm locale={locale} whatsapp={primaryWhatsApp(settings, u.whatsappMessage)?.number} />
        </section>
      ) : (
        <section className="container section article-layout">
          <article className="guide-body">
            <RichSections sections={distinctSections(page.sections, page.summary)} />
          </article>
          <aside className="article-aside">
            {route === 'about' ? (
              <>
                <p className="eyebrow">{u.onboarding}</p>
                <h3>{u.bringChecklist}</h3>
                <p>{u.alignSupply}</p>
                <Link className="button" href={`/${locale}/guides/supplier-qualification`}>
                  {c.supplier}
                  <ArrowUpRight size={18} />
                </Link>
              </>
            ) : (
              <>
                <BusinessDetails settings={settings} locale={locale} />
                <ContactChannels settings={settings} locale={locale} />
                {route === 'legal' && <PaymentCheck locale={locale} />}
              </>
            )}
          </aside>
        </section>
      )}
      {route === 'about' && <QuoteBanner locale={locale} />}
    </>
  )
}
