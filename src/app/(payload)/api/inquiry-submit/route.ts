import { after } from 'next/server'
import { getCMS } from '@/lib/payload'
import { acceptInquiry } from '@/lib/inquiries'
import { runInquiryJobs } from '@/lib/inquiry-auto-reply'
import { errorResponse, readJSON, requireSameOrigin } from '@/lib/http'
export const runtime = 'nodejs'
// Leaves time for the acknowledgement and notification to run after the response.
export const maxDuration = 60
export async function POST(request: Request) {
  try {
    requireSameOrigin(request)
    const raw = await readJSON(request)
    const ip = process.env.VERCEL
      ? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
      : '127.0.0.1'
    const cms = await getCMS()
    const { jobIds, ...result } = await acceptInquiry(cms, raw, ip)
    // Send right away instead of waiting for the next cron tick; the cron remains the fallback.
    if (jobIds.length) after(() => runInquiryJobs(cms, jobIds))
    return Response.json(result, { status: 202 })
  } catch (error) {
    return errorResponse(error)
  }
}
