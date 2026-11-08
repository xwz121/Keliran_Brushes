import { countryCode, localizedAddress, localizedEntityName } from './business-i18n'
import { phoneNumbers } from './contact-channels'
import { getDictionary } from './i18n'
import { siteURL } from './env'
import type { Locale } from './locales'
export function safeJSON(value: unknown) {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}
export function breadcrumbData(locale: Locale, items: { title: string; href?: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [{ title: getDictionary(locale).home, href: `/${locale}` }, ...items].map((x, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: x.title,
      ...(x.href ? { item: `${siteURL}${x.href}` } : {}),
    })),
  }
}
export function faqData(docs: any[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: docs.map((d) => ({
      '@type': 'Question',
      name: d.title,
      acceptedAnswer: { '@type': 'Answer', text: d.description || d.summary },
    })),
  }
}
export function productData(p: any, locale: Locale) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${siteURL}/${locale}/products/${p.slug}#family`,
    name: p.title,
    description: p.summary,
    // A product-family reference, not a stock-keeping unit: no SKU, offer, price or stock is implied.
    productID: p.code,
    ...(p.category ? { category: p.category } : {}),
    url: `${siteURL}/${locale}/products/${p.slug}`,
    brand: { '@type': 'Brand', name: 'Keliran' },
    ...(p.image ? { image: new URL(p.image, siteURL).href } : {}),
  }
}
export function organizationData(s: any, locale: Locale = 'en') {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${siteURL}/#organization`,
    name: localizedEntityName(s.legalEntity, locale) || 'Keliran',
    ...(s.legalEntity ? { legalName: s.legalEntity } : {}),
    url: siteURL,
    logo: `${siteURL}/brand/1.2x/keliran-light.svg`,
    ...(s.publicEmail ? { email: s.publicEmail } : {}),
    ...(phoneNumbers(s).length ? { telephone: phoneNumbers(s) } : {}),
    ...(s.addressLines
      ? {
          address: {
            '@type': 'PostalAddress',
            streetAddress: localizedAddress(s.addressLines, locale),
            addressCountry: countryCode(s.addressCountry) || s.addressCountry || undefined,
          },
        }
      : {}),
    sameAs: [s.facebookUrl, s.linkedinUrl].filter(Boolean),
  }
}
