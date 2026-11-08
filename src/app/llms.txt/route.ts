import { noIndexSite, siteURL } from '@/lib/env'
import { getCMS } from '@/lib/payload'
import { routeFor } from '@/lib/routes'
export const dynamic = 'force-dynamic'
export async function GET() {
  if (noIndexSite) return new Response('Not found', { status: 404 })
  const cms = await getCMS()
  const docs = await cms.find({ collection: 'guides', locale: 'en', overrideAccess: false, limit: 100 })
  return new Response(
    `# Keliran\n\nIndustrial sealing and strip brushes. Keliran coordinates specification review, specialist production partners and agreed quality checks for drawing-based supply.\n\n## Product lines\n- [Sealing](${siteURL}/en/sealing)\n- [Strip brushes](${siteURL}/en/strip-brushes)\n\n## Technical resources\n${docs.docs.map((d) => `- [${d.title}](${siteURL}${routeFor('guides', d)})`).join('\n')}\n\n## Company\n- [Company & legal information](${siteURL}/en/legal)\n- [How Keliran works](${siteURL}/en/about)\n\n## Contact\n- [Request a quotation](${siteURL}/en/rfq)\n- [Frequently asked questions](${siteURL}/en/faq)\n\nAn IP or NEMA enclosure rating must be validated on your assembled enclosure.\n`,
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  )
}
