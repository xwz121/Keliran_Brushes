import { getCMS } from '@/lib/payload'
import { signDownload } from '@/lib/inquiry-files'
import { errorResponse, HttpError } from '@/lib/http'
export async function GET(request: Request, { params }: { params: Promise<{ id: string; index: string }> }) {
  try {
    const cms = await getCMS()
    const { user } = await cms.auth({ headers: request.headers })
    if (!user) throw new HttpError(401, 'Sign in to download attachments.')
    const { id, index } = await params
    if (!/^\d+$/.test(id) || !/^\d+$/.test(index)) throw new HttpError(404, 'File not found.')
    const doc = await cms.findByID({ collection: 'inquiries', id: Number(id), overrideAccess: false, user })
    const file = doc.attachments?.[Number(index)]
    if (!file || file.deletedAt || !doc.retentionUntil || new Date(doc.retentionUntil).getTime() < Date.now())
      throw new HttpError(404, 'File not found or expired.')
    return new Response(null, {
      status: 302,
      headers: { Location: await signDownload(file.key, file.name), 'Cache-Control': 'private, no-store' },
    })
  } catch (e) {
    return errorResponse(e)
  }
}
