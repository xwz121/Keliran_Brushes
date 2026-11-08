import { timingSafeEqual } from 'node:crypto'
import { sweepInquiryFiles } from '@/lib/inquiry-files'
import { getCMS } from '@/lib/payload'
import { recoverInquiryEmailJobs } from '@/lib/inquiry-auto-reply'
export const runtime = 'nodejs'
export const maxDuration = 240
export const dynamic = 'force-dynamic'
export async function GET(request: Request) {
  const expected = Buffer.from(`Bearer ${process.env.CRON_SECRET || ''}`)
  const actual = Buffer.from(request.headers.get('authorization') || '')
  if (!process.env.CRON_SECRET || expected.length !== actual.length || !timingSafeEqual(expected, actual))
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const cms = await getCMS()
  await recoverInquiryEmailJobs(cms)
  await cms.jobs.run({ limit: 10 })
  await sweepInquiryFiles(cms)
  await cms.delete({
    collection: 'rate-limits',
    where: { expiresAt: { less_than: new Date().toISOString() } },
  })
  return Response.json({ processed: true })
}
