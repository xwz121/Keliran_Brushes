import { getCMS } from '@/lib/payload'
import { acceptInquiry } from '@/lib/inquiries'
import { errorResponse, readJSON, requireSameOrigin } from '@/lib/http'
export const runtime = 'nodejs'
export async function POST(request: Request) {
  try {
    requireSameOrigin(request)
    const raw = await readJSON(request)
    const ip = process.env.VERCEL
      ? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
      : '127.0.0.1'
    return Response.json(await acceptInquiry(await getCMS(), raw, ip), { status: 202 })
  } catch (error) {
    return errorResponse(error)
  }
}
