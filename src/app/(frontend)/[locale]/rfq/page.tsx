import { InquiryNextSteps } from '@/components/InquiryNextSteps'
import { fillCopy, interfaceCopy } from '@/lib/interface-copy'
import { ContinueChatNotice } from '@/components/ContinueChatNotice'
import { EmailText } from '@/components/EmailText'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { isLocale } from '@/lib/locales'
import { pageMetadata } from '@/lib/metadata'
import { uploadConfigured } from '@/lib/inquiry-files'
import { InquiryForm } from '@/components/InquiryForm'
import { siteCopy } from '@/lib/site-copy'
import type { ResourceProps } from '@/components/ResourcePage'
import { WhatsAppPanel } from '@/components/WhatsAppPanel'
import { whatsappContacts } from '@/lib/contact-channels'
import { getSiteSettings } from '@/lib/settings'
import { canPreview, getProducts, getBySlug } from '@/lib/content'
import { parseContentContext } from '@/lib/content-context'
export async function generateMetadata({ params }: ResourceProps) {
  const { locale } = await params
  return isLocale(locale)
    ? pageMetadata(locale, '/rfq', interfaceCopy(locale).rfqTitle, interfaceCopy(locale).rfqDescription)
    : {}
}
export default async function Page({ params, searchParams }: ResourceProps) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const q = await searchParams
  const requestedContext = parseContentContext(q.context)
  const contextDoc = requestedContext
    ? await getBySlug(locale, requestedContext.kind, requestedContext.slug)
    : null
  const contentContext = contextDoc?.title ? requestedContext : undefined
  const product = q.product && /^[a-z0-9-]{1,120}$/.test(q.product) ? q.product : undefined
  const c = siteCopy(locale),
    u = interfaceCopy(locale)
  const [settings, products] = await Promise.all([
    getSiteSettings(),
    product ? getProducts(locale, await canPreview(false)) : [],
  ])
  const selected = products.find((p) => p.slug === product)
  const whatsapp = whatsappContacts(
    settings,
    selected
      ? fillCopy(u.whatsappProductMessage, { product: selected.title, ref: selected.code })
      : u.whatsappMessage,
  )
  return (
    <>
      <section className="container page-intro rfq-intro">
        <p className="eyebrow">KELIRAN / {u.rfqTitle}</p>
        <h1>{u.offerTitle}</h1>
        <p>{u.offerBody}</p>
      </section>
      <div className="container rfq-layout">
        <div className="rfq-side">
          <ContinueChatNotice locale={locale} href={whatsapp[0]?.href} />
          <WhatsAppPanel contacts={whatsapp} locale={locale} />
          <aside className="rfq-aside">
            <h2>{u.rfqAsideTitle}</h2>
            <p>{u.rfqAsideIntro}</p>
            <ul>
              {[u.rfqNeed1, u.rfqNeed2, u.rfqNeed3, u.rfqNeed4].map((text) => (
                <li key={text}>{text}</li>
              ))}
            </ul>
            <p>{u.rfqTiming}</p>
            <p className="nda-note">
              <EmailText text={u.ndaNote} />
            </p>
            <InquiryNextSteps locale={locale} />
            <Link className="download-link" href={`/${locale}/guides/rfq-checklist`}>
              {c.requirements} →
            </Link>
            <p className="form-hint" style={{ marginTop: 24 }}>
              {u.onboardingFirst}{' '}
              <Link className="download-link" href={`/${locale}/guides/supplier-qualification`}>
                {c.supplier}
              </Link>
            </p>
          </aside>
        </div>
        <InquiryForm
          key={`${selected?.slug || 'custom'}:${contentContext?.slug || ''}`}
          locale={locale}
          technical
          productSlug={selected?.slug}
          contentContext={contentContext}
          contextTitle={contextDoc?.title || undefined}
          productTitle={selected?.title}
          productCode={selected?.code}
          uploadsEnabled={uploadConfigured()}
          whatsapp={whatsapp[0]?.number}
        />
      </div>
    </>
  )
}
