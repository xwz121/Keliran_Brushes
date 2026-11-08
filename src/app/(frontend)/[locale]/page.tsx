import { interfaceCopy } from '@/lib/interface-copy'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight, ArrowRight, ScanLine, ClipboardCheck, FileCheck2, PackageCheck } from 'lucide-react'
import { notFound } from 'next/navigation'
import { isLocale } from '@/lib/locales'
import { getDictionary } from '@/lib/i18n'
import { siteCopy } from '@/lib/site-copy'
import { canPreview, getPage, getCollection, getProducts } from '@/lib/content'
import { sprintProducts } from '@/lib/sprint-products'
import { pageMetadata } from '@/lib/metadata'
import { ResourceCard } from '@/components/ResourceUI'
import { ProductCard } from '@/components/ProductCard'
import { QuoteBanner } from '@/components/QuoteBanner'
type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ preview?: string }> }
export async function generateMetadata({ params, searchParams }: Props) {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const preview = await canPreview((await searchParams).preview === '1')
  const p = await getPage(locale, 'home', preview)
  // Brand and site-name searches should see the products first. The shared home record's SEO title
  // names both Keliran product lines, so this site always leads with strip brushes.
  const u = interfaceCopy(locale)
  return pageMetadata(locale, '', u.brushesTitle, u.introBrushes, preview || !p)
}
export default async function Page({ params, searchParams }: Props) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const preview = await canPreview((await searchParams).preview === '1')
  const [page, solutions, guides, products] = await Promise.all([
    getPage(locale, 'home', preview),
    getCollection(locale, 'solutions', preview),
    getCollection(locale, 'guides', preview),
    getProducts(locale, preview),
  ])
  const entries = sprintProducts.flatMap((slug) => products.filter((p) => p.slug === slug))
  if (!page) notFound()
  const u = interfaceCopy(locale)
  const t = getDictionary(locale),
    c = siteCopy(locale)
  const s = Object.fromEntries((page.sections || []).map((x) => [x.key, x]))
  return (
    <>
      <section className="home-hero">
        <div className="container hero-topline enter">
          <span>
            <i />
            {s['hero-kicker']?.heading}
          </span>
          <span>{c.brushes}</span>
        </div>
        <div className="container home-hero-grid">
          <div className="home-hero-copy">
            {/* Name the products before the brand line, so a first-time visitor knows what is supplied. */}
            <p className="eyebrow enter">{u.brushTags}</p>
            <h1 className="business-heading">{u.brushesTitle}</h1>
            <p className="hero-tagline">{page.title?.replaceAll('\n', ' ')}</p>
            <p className="hero-description">{u.introBrushes}</p>
            <div className="hero-buttons enter" style={{ '--i': 2 } as React.CSSProperties}>
              <Link href={`/${locale}/rfq`} className="button">
                {u.drawingCta}
                <ArrowUpRight size={20} />
              </Link>
              <span className="hero-line-links">
                <Link href={`/${locale}/strip-brushes`} className="text-link">
                  {c.explore}
                  <ArrowRight size={18} />
                </Link>
              </span>
            </div>
            <div className="hero-assurance enter" style={{ '--i': 3 } as React.CSSProperties}>
              <span>01 / {s.assurance1?.heading}</span>
              <span>02 / {s.assurance2?.heading}</span>
              <span>03 / {s.assurance3?.heading}</span>
            </div>
          </div>
          {/* The shared CMS hero shows both product lines; this site uses its approved brush illustration. */}
          <figure className="home-hero-image">
            <Image
              src="/images/keliran-v2/strip-brushes.webp"
              width={1536}
              height={1024}
              alt={u.brushAlt}
              priority
              sizes="(max-width:800px) 100vw, 58vw"
            />
            <div className="hero-image-label">
              <span>{s['image-label']?.heading}</span>
              <span>{c.brushes}</span>
            </div>
            <figcaption>{t.renderNote}</figcaption>
          </figure>
        </div>
      </section>
      <div className="capability-rail enter" style={{ '--i': 3 } as React.CSSProperties}>
        <div className="container">
          <span>{s.audience?.heading}</span>
          <span>{s.assurance1?.text}</span>
          <span>{s.assurance2?.text}</span>
          <span>{s.assurance3?.text}</span>
        </div>
      </div>
      <section className="section container" id="product-lines">
        <div className="section-heading" data-motion="reveal">
          <div>
            <p className="eyebrow">01 / {c.brushes}</p>
            <h2>{s.brushes?.heading || u.brushesTitle}</h2>
          </div>
          <div>
            <p>{s.brushes?.text || u.entryBody}</p>
            <Link href={`/${locale}/strip-brushes`} className="text-link">
              {c.explore}
              <ArrowUpRight size={18} />
            </Link>
          </div>
        </div>
        <div className="product-grid catalogue-grid" data-motion="stagger">
          {entries.map((p, i) => (
            <ProductCard product={p} index={i} locale={locale} key={p.id} />
          ))}
        </div>
      </section>
      <section className="partner-section">
        <div className="container partner-grid">
          <div data-motion="reveal">
            <p className="eyebrow">02 / {s['partner-label']?.heading}</p>
            <h2>{s.about?.heading}</h2>
            <p>{s.about?.text}</p>
            <Link href={`/${locale}/about`} className="text-link inverse">
              {t.about}
              <ArrowUpRight size={18} />
            </Link>
          </div>
          <div className="partner-proof" data-motion="draw">
            <p className="eyebrow">{s['partner-label']?.text}</p>
            {[1, 2, 3, 4]
              .map((n) => [s[`proof${n}`]?.heading, s[`proof${n}`]?.text])
              .map(([a, b], i) => (
                <div key={a}>
                  <span>0{i + 1}</span>
                  <div>
                    <h3>{a}</h3>
                    <p>{b}</p>
                  </div>
                  <ArrowUpRight size={19} />
                </div>
              ))}
          </div>
        </div>
      </section>
      <section className="section container">
        <div className="section-heading" data-motion="reveal">
          <div>
            <p className="eyebrow">03 / {s['solutions-label']?.heading}</p>
            <h2>{s.solutions?.heading}</h2>
          </div>
          <div>
            <p>{s.solutions?.text}</p>
            <Link href={`/${locale}/solutions`} className="text-link">
              {c.solutions}
              <ArrowUpRight size={18} />
            </Link>
          </div>
        </div>
        <div className="resource-grid solutions-featured" data-motion="stagger">
          {['dust-at-equipment-openings', 'filament-shedding', 'brush-wear', 'holder-fit']
            .map((slug) => solutions.find((d) => d.slug === slug))
            .filter(Boolean)
            .map((d) => (
              <ResourceCard key={d!.id} doc={d!} collection="solutions" locale={locale} />
            ))}
        </div>
      </section>
      <section className="workflow-section">
        <div className="container">
          <div className="section-heading" data-motion="reveal">
            <div>
              <p className="eyebrow">04 / {c.process}</p>
              <h2>{s.process?.heading}</h2>
            </div>
            <p>{s.process?.text}</p>
          </div>
          <div className="workflow-grid" data-motion="draw">
            {[ScanLine, ClipboardCheck, FileCheck2, PackageCheck].map((Icon, i) => (
              <article key={i}>
                <div>
                  <span>0{i + 1}</span>
                  <Icon size={25} strokeWidth={1.3} />
                </div>
                <h3>{s[`step${i + 1}`]?.heading}</h3>
                <p>{s[`step${i + 1}`]?.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="section container">
        <div className="qualification-panel" data-motion="stagger">
          <div>
            <p className="eyebrow">{s['qualification-label']?.heading}</p>
            <h2>{s.qualification?.heading}</h2>
            <p>{s.qualification?.text}</p>
            <Link href={`/${locale}/guides/supplier-qualification`} className="button">
              {c.supplier}
              <ArrowUpRight size={20} />
            </Link>
          </div>
          <div className="document-stack">
            <span className="document-tab">{s['qualification-label']?.text}</span>
            <h3>{s['qualification-card']?.heading}</h3>
            {[1, 2, 3, 4]
              .map((n) => s[`qual${n}`]?.heading)
              .map((x, i) => (
                <p key={x}>
                  <span>0{i + 1}</span>
                  {x}
                  <span className="check-square">✓</span>
                </p>
              ))}
          </div>
        </div>
      </section>
      <section className="section container guides-home">
        <div className="section-heading" data-motion="reveal">
          <div>
            <p className="eyebrow">05 / {s.guides?.text}</p>
            <h2>{s.guides?.heading}</h2>
          </div>
          <Link href={`/${locale}/guides`} className="text-link">
            {c.guides}
            <ArrowUpRight size={18} />
          </Link>
        </div>
        <div className="resource-grid" data-motion="stagger">
          {guides
            .filter((d) =>
              ['measure-strip-brush', 'brush-material-selection', 'rfq-checklist'].includes(d.slug),
            )
            .map((d) => (
              <ResourceCard key={d.id} doc={d} collection="guides" locale={locale} />
            ))}
        </div>
      </section>
      <QuoteBanner locale={locale} />
    </>
  )
}
