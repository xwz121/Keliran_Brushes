import { noIndexSite } from '@/lib/env'
import { buildLlmsTxt } from '@/lib/llms'
import { llmsHeaders, llmsInput } from '@/lib/llms-data'
export const dynamic = 'force-dynamic'
// Production only, like robots.txt: preview deployments are not advertised to crawlers.
export async function GET() {
  if (noIndexSite) return new Response('Not found', { status: 404 })
  return new Response(buildLlmsTxt(await llmsInput()), { headers: llmsHeaders })
}
