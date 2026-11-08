import { contextRfqHref, type ContentContext } from '@/lib/content-context'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { interfaceCopy } from '@/lib/interface-copy'
import type { Locale } from '@/lib/locales'
export function QuoteBanner({
  locale,
  line,
  context,
}: {
  locale: Locale
  context?: ContentContext
  line?: 'sealing' | 'brushes'
}) {
  const u = interfaceCopy(locale)
  return (
    <section className="quote-banner">
      <div className="container quote-banner-inner" data-motion="reveal">
        <h2>{u.offerTitle}</h2>
        <div>
          <p>{u.offerBody}</p>
          <Link className="button" href={contextRfqHref(locale, context, line)}>
            {u.drawingCta}
            <ArrowUpRight size={20} />
          </Link>
        </div>
      </div>
    </section>
  )
}
