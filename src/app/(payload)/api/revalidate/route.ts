import { timingSafeEqual } from 'node:crypto'
import { revalidateTag } from 'next/cache'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
// Content written from the command line (pnpm content:publish) has no Next cache to clear; the
// script calls this route so the deployment serves the new content at once.
function authorized(request: Request) {
  const expected = Buffer.from(`Bearer ${process.env.CRON_SECRET || ''}`)
  const actual = Buffer.from(request.headers.get('authorization') || '')
  return (
    Boolean(process.env.CRON_SECRET) && expected.length === actual.length && timingSafeEqual(expected, actual)
  )
}
export async function POST(request: Request) {
  if (!authorized(request)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  revalidateTag('site-content', { expire: 0 })
  return Response.json({ revalidated: true })
}
