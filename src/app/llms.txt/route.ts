import { noIndexSite, siteURL } from '@/lib/env'
import { getCMS } from '@/lib/payload'
import { routeFor } from '@/lib/routes'
import { otherSiteURL } from '@/lib/site'
export const dynamic = 'force-dynamic'
export async function GET() {
  if (noIndexSite) return new Response('Not found', { status: 404 })
  const cms = await getCMS()
  const docs = await cms.find({ collection: 'guides', locale: 'en', overrideAccess: false, limit: 100 })
  return new Response(
    `# Keliran Strip Brushes\n\nIndustrial strip brushes and holders. Keliran coordinates specification review, specialist production partners and agreed quality checks for drawing-based supply.\n\n## Products\n- [Strip brushes](${siteURL}/en/strip-brushes)\n- [All products](${siteURL}/en/products)\n\n## Technical resources\n${docs.docs.map((d) => `- [${d.title}](${siteURL}${routeFor('guides', d)})`).join('\n')}\n\n## Company\n- [Company & legal information](${siteURL}/en/legal)\n- [How Keliran works](${siteURL}/en/about)\n\n## Contact\n- [Request a quotation](${siteURL}/en/rfq)\n- [Frequently asked questions](${siteURL}/en/faq)\n\n## Related\n- [Industrial sealing components from the same company](${otherSiteURL}/en)\n`,
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  )
}
