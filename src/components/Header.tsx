'use client'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { localizedInquiryPath } from '@/lib/content-context'
import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, Globe2, Menu, X } from 'lucide-react'
import { siteCopy } from '@/lib/site-copy'
import { BrandLogo } from './BrandLogo'
import { WhatsAppIcon } from './WhatsAppButton'
import { locales, localeNames, type Locale } from '@/lib/locales'
import { getDictionary } from '@/lib/i18n'
export function Header({
  locale,
  whatsapp,
}: {
  locale: Locale
  whatsapp?: { href: string; label: string } | null
}) {
  const languageRef = useRef<HTMLDetailsElement>(null)
  const [open, setOpen] = useState(false)
  const [condensed, setCondensed] = useState(false)
  const path = usePathname()
  const search = useSearchParams()
  const t = getDictionary(locale)
  useEffect(() => {
    setOpen(false)
    if (languageRef.current) languageRef.current.open = false
  }, [path])
  useEffect(() => {
    const onScroll = () => setCondensed(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  const c = siteCopy(locale)
  // Carry the product line into the quote form when the visitor is already inside one line.
  const quoteLine = path.includes('/strip-brushes') ? 'brushes' : path.includes('/sealing') ? 'sealing' : ''
  const quoteHref = `/${locale}/rfq${quoteLine ? `?line=${quoteLine}` : ''}`
  const nav = [
    ['sealing', c.sealing],
    ['strip-brushes', c.brushes],
    ['solutions', c.solutions],
    ['guides', c.guides],
    ['about', t.about],
  ]
  return (
    <header className="site-header" data-condensed={condensed || undefined}>
      <div className="container header-inner">
        <Link href={`/${locale}`} aria-label="Keliran — Home">
          <BrandLogo />
        </Link>
        <nav className="desktop-nav" aria-label={t.menu}>
          {nav.map(([href, label]) => (
            <Link
              key={href}
              className={path.includes(`/${href}`) ? 'active' : ''}
              href={`/${locale}/${href}`}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          <details className="language-switch" ref={languageRef}>
            <summary aria-label={t.language}>
              <Globe2 size={16} />
              <span>{locale === 'zh-Hant' ? '繁中' : locale.toUpperCase()}</span>
            </summary>
            <div className="language-options">
              {locales.map((l) => (
                <a
                  lang={l}
                  href={localizedInquiryPath(path, l, search)}
                  key={l}
                  aria-current={l === locale ? 'true' : undefined}
                >
                  {localeNames[l]}
                </a>
              ))}
            </div>
          </details>
          {/* One split call to action: chat now on WhatsApp, or open the quotation form. */}
          <div className="header-cta">
            {whatsapp && (
              <a
                className="header-cta-wa"
                href={whatsapp.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={whatsapp.label}
              >
                <WhatsAppIcon size={20} />
                <span className="header-cta-wa-label">WhatsApp</span>
              </a>
            )}
            <Link className="button header-quote" href={quoteHref}>
              {t.quote}
              <ArrowUpRight size={18} />
            </Link>
          </div>
          <button
            type="button"
            className="menu-toggle"
            onClick={() => setOpen(!open)}
            aria-label={open ? t.close : t.menu}
            aria-expanded={open}
            aria-controls="mobile-nav"
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="mobile-nav" id="mobile-nav">
          {[
            ...nav,
            ['materials', t.materials],
            ['applications', t.applications],
            ['cases', c.cases],
            ['faq', c.faq],
            ['contact', t.contact],
          ].map(([href, label]) => (
            <Link key={href} href={`/${locale}/${href}`} onClick={() => setOpen(false)}>
              {label}
              <ArrowUpRight size={18} />
            </Link>
          ))}
          <Link href={quoteHref} onClick={() => setOpen(false)}>
            {t.quote}
            <ArrowUpRight size={18} />
          </Link>
          {whatsapp && (
            <a href={whatsapp.href} target="_blank" rel="noopener noreferrer" aria-label={whatsapp.label}>
              WhatsApp
              <ArrowUpRight size={18} />
            </a>
          )}
        </nav>
      )}
    </header>
  )
}
