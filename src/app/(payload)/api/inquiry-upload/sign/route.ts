import { z } from 'zod'
import { getCMS } from '@/lib/payload'
import { limit } from '@/lib/inquiries'
import { transaction } from '@/lib/transactions'
import { verifySession, requestIP } from '@/lib/inquiry-session'
import { fileSchema, signUpload, uploadConfigured } from '@/lib/inquiry-files'
import { errorResponse, readJSON, requireSameOrigin, HttpError } from '@/lib/http'
const schema = z.object({
  submissionId: z.uuid(),
  sessionToken: z.string().max(2048),
  files: z.array(fileSchema).min(1).max(5),
})
export async function POST(request: Request) {
  try {
    requireSameOrigin(request)
    if (!uploadConfigured()) throw new HttpError(503, 'Drawing uploads are not available.')
    const b = schema.safeParse(await readJSON(request, 8000))
    if (!b.success) throw new HttpError(400, 'Invalid files.')
    verifySession(b.data.sessionToken, b.data.submissionId, requestIP(request))
    const cms = await getCMS()
    await transaction(cms, `upload:${b.data.submissionId}`, async (req) => {
      for (const f of b.data.files) await limit(cms, req, `upload:${b.data.submissionId}`, 5)
    })
    return Response.json(
      { files: await Promise.all(b.data.files.map((f) => signUpload(b.data.submissionId, f))) },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (e) {
    return errorResponse(e)
  }
}
