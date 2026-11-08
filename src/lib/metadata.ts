import type { Metadata } from 'next'
import { locales, type Locale } from './locales'
import { noIndexSite, siteURL } from './env'
import { plainSummary } from './summary'
export function pageMetadata(
  locale: Locale,
  path: string,
  title: string,
  description: string,
  preview = false,
): Metadata {
  description = plainSummary(description)
  return {
    title: title.replace(/\n/g, ' '),
    description,
    openGraph: {
      title: title.replace(/\n/g, ' '),
      description,
      url: `${siteURL}/${locale}${path}`,
      siteName: 'Keliran',
      type: 'website',
      images: [{ url: `${siteURL}/og`, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: title.replace(/\n/g, ' '),
      description,
      images: [`${siteURL}/og`],
    },
    alternates: {
      canonical: `${siteURL}/${locale}${path}`,
      languages: Object.fromEntries([
        ...locales.map((l) => [l, `${siteURL}/${l}${path}`]),
        ['x-default', `${siteURL}/en${path}`],
      ]),
    },
    robots: noIndexSite || preview ? { index: false, follow: false } : undefined,
  }
}
