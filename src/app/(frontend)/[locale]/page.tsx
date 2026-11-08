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
import { mediaURL } from '@/lib/media-url'
import { ResourceCard } from '@/components/ResourceUI'
import { QuoteBanner } from '@/components/QuoteBanner'
type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ preview?: string }> }
export async function generateMetadata({ params, searchParams }: Props) {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const preview = await canPreview((await searchParams).preview === '1')
  const p = await getPage(locale, 'home', preview)
  // Brand and site-name searches should see the products first; an SEO title that editors set apart
  // from the display headline still wins.
  const title = p?.seoTitle && p.seoTitle !== p.title ? p.seoTitle : interfaceCopy(locale).productIdentity
  return pageMetadata(locale, '', title, p?.summary || interfaceCopy(locale).heroBody, preview || !p)
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
  const entryTitles = (line: keyof typeof sprintProducts) =>
    sprintProducts[line].map((slug) => products.find((p) => p.slug === slug)?.title).filter(Boolean)
  if (!page) notFound()
  const u = interfaceCopy(locale)
  const t = getDictionary(locale),
    c = siteCopy(locale)
  const s = Object.fromEntries((page.sections || []).map((x) => [x.key, x]))
  const hero: any = 'heroImage' in page ? page.heroImage : null
  const heroURL = mediaURL(hero?.sizes?.detail?.url || hero?.url)
  return (
    <>
      <section className="home-hero">
        <div className="container hero-topline enter">
          <span>
            <i />
            {s['hero-kicker']?.heading}
          </span>
          <span>{s['hero-kicker']?.text || `${c.sealing} / ${c.brushes}`}</span>
        </div>
        <div className="container home-hero-grid">
          <div className="home-hero-copy">
            {/* Name the products before the brand line, so a first-time visitor knows what is supplied. */}
            <p className="eyebrow enter">{u.productIdentity}</p>
            <h1 className="business-heading">{u.productIdentity}</h1>
            <p className="hero-tagline">{page.title?.replaceAll('\n', ' ')}</p>
            <p className="hero-description">{u.heroBody}</p>
            <div className="hero-buttons enter" style={{ '--i': 2 } as React.CSSProperties}>
              <Link href={`/${locale}/rfq`} className="button">
                {u.drawingCta}
                <ArrowUpRight size={20} />
              </Link>
              <span className="hero-line-links">
                <Link href={`/${locale}/sealing`} className="text-link">
                  {c.sealing}
                  <ArrowRight size={18} />
                </Link>
                <Link href={`/${locale}/strip-brushes`} className="text-link">
                  {c.brushes}
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
          <figure className="home-hero-image">
            {heroURL && (
              <Image
                src={heroURL}
                width={1536}
                height={1024}
                alt={hero.alt || t.renderNote}
                priority
                sizes="(max-width:800px) 100vw, 58vw"
              />
            )}
            <div className="hero-image-label">
              <span>{s['image-label']?.heading}</span>
              <span>01—02</span>
            </div>
            {hero?.illustrative && <figcaption>{t.renderNote}</figcaption>}
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
            <p className="eyebrow">01 / {c.lineLabel}</p>
            <h2>{s.lines?.heading}</h2>
          </div>
          <p>{s.lines?.text}</p>
        </div>
        <div className="line-cards" data-motion="stagger">
          {[
            {
              slug: 'sealing',
              title: s.sealing?.heading,
              desc: s.sealing?.text,
              img: 'sealing-profiles',
              label: c.sealing,
              tags: interfaceCopy(locale).sealingTags,
              num: '01',
              entries: entryTitles('sealing'),
            },
            {
              slug: 'strip-brushes',
              title: s.brushes?.heading,
              desc: s.brushes?.text,
              img: 'strip-brushes',
              label: c.brushes,
              tags: interfaceCopy(locale).brushTags,
              num: '02',
              entries: entryTitles('brushes'),
            },
          ].map((line) => (
            <Link key={line.slug} href={`/${locale}/${line.slug}`} className="line-card">
              <div className="line-card-image" data-motion-clip>
                <Image
                  src={`/images/keliran-v2/${line.img}.webp`}
                  width={1536}
                  height={1024}
                  alt={`${line.label} — ${t.renderNote}`}
                  sizes="(max-width:800px) 100vw, 50vw"
                />
                <span>
                  {line.num} / {line.label}
                </span>
              </div>
              <div className="line-card-copy">
                <p className="eyebrow">{line.tags}</p>
                <h3>
                  {line.title}
                  <ArrowUpRight size={28} />
                </h3>
                <p>{line.desc}</p>
                {line.entries.length > 0 && (
                  <ul className="line-card-products">
                    {line.entries.map((title) => (
                      <li key={title}>{title}</li>
                    ))}
                  </ul>
                )}
                <span className="text-link">
                  {c.explore}
                  <ArrowRight size={18} />
                </span>
              </div>
            </Link>
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
          {['enclosure-door-leaks', 'adhesive-lifting', 'dust-at-equipment-openings', 'filament-shedding']
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
              ['measure-door-seal', 'measure-strip-brush', 'standards-and-validation'].includes(d.slug),
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
