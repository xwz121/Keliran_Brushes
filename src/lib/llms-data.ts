// Published English content and company details for /llms.txt and /llms-full.txt.
import { getCollection } from './content'
import { getSiteSettings } from './settings'
import { siteURL } from './env'
import { sharedCanonicalPaths } from './shared-canonical'
import type { LlmsDoc, LlmsInput } from './llms'

const collections = [
  'products',
  'categories',
  'guides',
  'materials',
  'applications',
  'solutions',
  'cases',
  'faqs',
  'pages',
] as const
export async function llmsInput(): Promise<LlmsInput> {
  // getCollection applies the anonymous access rule: published documents of this site's line only.
  const docs = Object.fromEntries(
    await Promise.all(
      collections.map(async (c) => [c, (await getCollection('en', c)) as unknown as LlmsDoc[]] as const),
    ),
  )
  return {
    origin: siteURL,
    generatedAt: new Date().toISOString(),
    settings: (await getSiteSettings()) as Record<string, any>,
    docs,
    sharedCanonical: sharedCanonicalPaths,
  }
}
export const llmsHeaders = {
  'Content-Type': 'text/plain; charset=utf-8',
  'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
}
