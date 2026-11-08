import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import { siteURL } from './src/lib/env'
import { legacyContent } from './src/lib/legacy-content'

const config: NextConfig = {
  poweredByHeader: false,
  devIndicators: false,
  images: {
    remotePatterns: process.env.R2_PUBLIC_URL
      ? [{ protocol: 'https', hostname: new URL(process.env.R2_PUBLIC_URL).hostname }]
      : [],
  },
  async redirects() {
    const destination = siteURL
    const contentRedirects = legacyContent
      .filter(([collection]) => collection !== 'pages')
      .map(([collection, slug, target]) => ({
        source: `/:locale(en|fr|de|es|it|ja|ko|zh-Hant)/${collection === 'categories' ? 'sealing' : collection}/${slug}`,
        destination: `/:locale${target}`,
        permanent: true,
      }))
    if (!destination || !destination.startsWith('https://')) return contentRedirects
    return [
      ...(process.env.LEGACY_HOSTS || 'sealing.keliran.com,www.keliran.com')
        .split(',')
        .map((x) => x.trim())
        .filter((host) => host && host !== new URL(destination).hostname)
        .map((host) => ({
          source: '/:path*',
          has: [{ type: 'host' as const, value: host }],
          destination: `${destination.replace(/\/$/, '')}/:path*`,
          permanent: true,
        })),
      ...contentRedirects,
    ]
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
    ]
  },
}
export default withPayload(config)
