import type { MetadataRoute } from 'next'
import { siteURL, noIndexSite } from '@/lib/env'
export default function robots(): MetadataRoute.Robots {
  return {
    rules: noIndexSite
      ? { userAgent: '*', disallow: '/' }
      : { userAgent: '*', allow: '/', disallow: ['/admin/', '/api/', '/*?preview='] },
    sitemap: `${siteURL}/sitemap.xml`,
  }
}
