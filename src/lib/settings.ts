import { unstable_cache } from 'next/cache'
import { getCMS } from './payload'
export const getSiteSettings = unstable_cache(
  async () => {
    const cms = await getCMS()
    const s = await cms.findGlobal({ slug: 'site-settings', overrideAccess: false, depth: 0 })
    return s
  },
  ['site-settings-20260924-release'],
  { tags: ['site-settings'], revalidate: 3600 },
)
