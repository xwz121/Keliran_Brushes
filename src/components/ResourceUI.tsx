import { interfaceCopy } from '@/lib/interface-copy'
import Link from 'next/link'
import { ArrowUpRight, ArrowRight } from 'lucide-react'
import type { Locale } from '@/lib/locales'
import { routeFor } from '@/lib/routes'
import { siteCopy } from '@/lib/site-copy'
import { getDictionary } from '@/lib/i18n'
import { plainSummary } from '@/lib/summary'
export function Breadcrumbs({
  locale,
  items,
}: {
  locale: Locale
  items: { title: string; href?: string }[]
}) {
  return (
    <nav className="container breadcrumb" aria-label={interfaceCopy(locale).breadcrumb}>
      <Link href={`/${locale}`}>{getDictionary(locale).home}</Link>
      {items.map((x, i) => (
        <span className="crumb" key={i}>
          <span aria-hidden="true">/</span>
          {x.href ? <Link href={x.href}>{x.title}</Link> : <span aria-current="page">{x.title}</span>}
        </span>
      ))}
    </nav>
  )
}
export function ResourceCard({ doc, collection, locale }: { doc: any; collection: string; locale: Locale }) {
  const c = siteCopy(locale)
  return (
    <Link className="resource-card" href={routeFor(collection, doc, locale)}>
      <div className="resource-kicker">
        <span>
          {doc.scenarioType === 'typical'
            ? c.typical
            : doc.code || (doc.line === 'brushes' ? c.brushes : 'KELIRAN')}
        </span>
        <ArrowUpRight size={20} />
      </div>
      <h3>{doc.title}</h3>
      <p>{plainSummary(doc.summary)}</p>
      <span className="resource-action">
        {collection === 'guides' ? c.readGuide : getDictionary(locale).learn}
        <ArrowRight size={17} />
      </span>
    </Link>
  )
}
export function RelatedLinks({ locale, doc }: { locale: Locale; doc: any }) {
  return (
    <>
      {[
        ['relatedProducts', 'products'],
        ['relatedGuides', 'guides'],
        ['relatedSolutions', 'solutions'],
      ].map(([key, collection]) =>
        doc[key]?.filter((x: any) => typeof x === 'object' && x?.title).length ? (
          <section className="related-block" key={key}>
            <h2>
              {collection === 'products'
                ? getDictionary(locale).related
                : siteCopy(locale)[collection as 'guides' | 'solutions']}
            </h2>
            <div className="resource-grid">
              {doc[key]
                .filter((x: any) => typeof x === 'object' && x?.title)
                .map((x: any) => (
                  <ResourceCard key={x.id} doc={x} collection={collection} locale={locale} />
                ))}
            </div>
          </section>
        ) : null,
      )}
    </>
  )
}
export function FaqList({ docs }: { docs: any[] }) {
  return (
    <div className="faq-list">
      {docs.map((d) => (
        <details key={d.id}>
          <summary>
            {d.title}
            <span aria-hidden="true">+</span>
          </summary>
          <p>{d.description || d.summary}</p>
        </details>
      ))}
    </div>
  )
}
