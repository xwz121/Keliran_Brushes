import { interfaceCopy } from '@/lib/interface-copy'
import { headers } from 'next/headers'
import type { Metadata } from 'next'
import { asLocale } from '@/lib/locales'
import { getDictionary } from '@/lib/i18n'
import { noIndexSite, siteURL } from '@/lib/env'
import { getSiteSettings } from '@/lib/settings'
import { canPreview } from '@/lib/content'
import { WhatsAppFloat } from '@/components/ContactChannels'
import { primaryWhatsApp } from '@/lib/contact-channels'
import { JsonLd } from '@/components/JsonLd'
import { organizationData } from '@/lib/jsonld'
import { InquiryAttribution } from '@/components/InquiryAttribution'
import { MotionProvider } from '@/components/MotionProvider'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import './site.css'
import '@/styles/redesign.css'
import '@/styles/motion.css'
export const metadata: Metadata = {
  metadataBase: new URL(siteURL),
  title: { default: 'Keliran — Industrial sealing & strip brushes', template: '%s | Keliran' },
  description: 'Industrial sealing and strip brushes, sourced and quality-managed to your specification.',
  robots: noIndexSite ? { index: false, follow: false } : { index: true, follow: true },
}
export default async function Layout({ children }: { children: React.ReactNode }) {
  const requestHeaders = await headers()
  const locale = asLocale(requestHeaders.get('x-site-locale') || 'en')
  const path = requestHeaders.get('x-site-path') || `/${locale}`
  const t = getDictionary(locale),
    u = interfaceCopy(locale)
  const [settings, preview] = await Promise.all([getSiteSettings(), canPreview(false)])
  const whatsapp = primaryWhatsApp(settings, u.whatsappMessage)
  return (
    <html lang={locale}>
      <body>
        <JsonLd data={organizationData(settings, locale)} />
        <a className="skip-link" href="#main">
          {t.overview}
        </a>
        {preview && (
          <div className="preview-strip">
            {u.previewNotice} <a href={`/api/preview?disable=1&path=/${locale}`}>{u.exitPreview}</a>
          </div>
        )}
        <InquiryAttribution />
        <MotionProvider />
        <Header
          locale={locale}
          whatsapp={whatsapp && { href: whatsapp.href, label: `${u.whatsappLabel} (${u.whatsappOpens})` }}
        />
        <main id="main">{children}</main>
        {/* Printed or saved-as-PDF pages are forwarded inside buying teams; keep the source address on paper. */}
        <p className="container print-source">
          {u.printedFrom}: {siteURL}
          {path}
        </p>
        <Footer locale={locale} settings={settings} />
        <WhatsAppFloat settings={settings} locale={locale} />
      </body>
    </html>
  )
}
