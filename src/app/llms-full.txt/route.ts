import { noIndexSite } from '@/lib/env'
import { buildLlmsFullTxt } from '@/lib/llms'
import { llmsHeaders, llmsInput } from '@/lib/llms-data'
export const dynamic = 'force-dynamic'
export async function GET() {
  if (noIndexSite) return new Response('Not found', { status: 404 })
  // The full text repeats the pages; keep it out of search results, which should show the pages.
  return new Response(buildLlmsFullTxt(await llmsInput()), {
    headers: { ...llmsHeaders, 'X-Robots-Tag': 'noindex' },
  })
}
