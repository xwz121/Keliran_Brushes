import { z } from 'zod'
import { getCMS } from '@/lib/payload'
import { startInquirySession } from '@/lib/inquiries'
import { requestIP } from '@/lib/inquiry-session'
import { errorResponse, readJSON, requireSameOrigin, HttpError } from '@/lib/http'
export async function POST(request: Request) {
  try {
    requireSameOrigin(request)
    const parsed = z
      .object({ submissionId: z.uuid(), turnstileToken: z.string().max(2048).default('') })
      .safeParse(await readJSON(request, 4000))
    if (!parsed.success) throw new HttpError(400, 'Invalid session request.')
    const b = parsed.data
    return Response.json(
      await startInquirySession(await getCMS(), b.submissionId, b.turnstileToken || '', requestIP(request)),
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (e) {
    return errorResponse(e)
  }
}
