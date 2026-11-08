import { interfaceCopy } from '@/lib/interface-copy'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { BrandLogo } from './BrandLogo'
import { ContactChannels } from './ContactChannels'
import { getDictionary } from '@/lib/i18n'
import { siteCopy } from '@/lib/site-copy'
import { localizedEntityName } from '@/lib/business-i18n'
import { registeredEntityLines } from '@/lib/company'
import type { Locale } from '@/lib/locales'
import type { SiteSetting } from '@/payload-types'
export function Footer({ locale, settings }: { locale: Locale; settings: Partial<SiteSetting> }) {
  const t = getDictionary(locale),
    c = siteCopy(locale)
  const entity = localizedEntityName(settings.legalEntity, locale) || 'Keliran'
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <BrandLogo surface="dark" footer />
          <p>{interfaceCopy(locale).footerLine}</p>
          <ContactChannels settings={settings} locale={locale} />
        </div>
        <div>
          <h3>{t.footerProducts}</h3>
          {[
            ['sealing', c.sealing],
            ['strip-brushes', c.brushes],
            ['products', c.all],
            ['materials', t.materials],
          ].map(([url, title]) => (
            <Link key={url} href={`/${locale}/${url}`}>
              {title}
            </Link>
          ))}
        </div>
        <div>
          <h3>{c.guides}</h3>
          {[
            ['solutions', c.solutions],
            ['applications', t.applications],
            ['cases', c.cases],
            ['guides', c.guides],
            ['faq', c.faq],
          ].map(([url, title]) => (
            <Link key={url} href={`/${locale}/${url}`}>
              {title}
            </Link>
          ))}
        </div>
        <div className="footer-contact">
          <h3>{t.footerCompany}</h3>
          <Link href={`/${locale}/about`}>{t.about}</Link>
          <Link href={`/${locale}/guides/supplier-qualification`}>{c.supplier}</Link>
          <Link href={`/${locale}/contact`}>{t.contact}</Link>
          <Link className="text-link inverse" href={`/${locale}/rfq`}>
            {t.quote}
            <ArrowUpRight size={18} />
          </Link>
        </div>
      </div>
      <div className="container footer-bottom">
        {/* Copyright and the statutory company details are separate statements; both stay visible. */}
        <p className="footer-legal">
          <span>
            © {new Date().getFullYear()} {entity}
            {entity.endsWith('.') || locale === 'ja' || locale === 'zh-Hant' ? ' ' : '. '}
            {t.rights}
          </span>
          {registeredEntityLines(settings, locale).map((line) => (
            <span key={line}>{line}</span>
          ))}
        </p>
        <div>
          <Link href={`/${locale}/privacy`}>{t.privacy}</Link>
          <Link href={`/${locale}/legal`}>{interfaceCopy(locale).legal}</Link>
        </div>
      </div>
    </footer>
  )
}
