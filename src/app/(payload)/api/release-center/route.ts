import { getCMS } from '@/lib/payload'
import { serviceStatus } from '@/lib/env'
import { errorResponse, HttpError, readJSON, requireSameOrigin } from '@/lib/http'
import { contentSlugs } from '@/collections'
import { publishRun, startTranslation } from '@/lib/ai/workflow'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
async function authorized(request: Request) {
  const cms = await getCMS()
  const { user } = await cms.auth({ headers: request.headers })
  if (!user) throw new HttpError(401, '请先登录。')
  return cms
}
export async function GET(request: Request) {
  try {
    const cms = await authorized(request)
    const [runs, ...contents] = await Promise.all([
      cms.find({ collection: 'translation-runs', sort: '-createdAt', limit: 30 }),
      ...contentSlugs.map((collection) =>
        cms
          .find({ collection, locale: 'en', draft: true, depth: 0, limit: 200, sort: 'title' })
          .then((r) => ({
            collection,
            docs: r.docs.map((d) => ({
              id: d.id,
              title: d.title || d.slug,
              status: d._status,
              factsConfirmed: d.factsConfirmed,
            })),
          })),
      ),
    ])
    return Response.json(
      { services: serviceStatus(), runs: runs.docs, contents },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    return errorResponse(error)
  }
}
export async function POST(request: Request) {
  try {
    requireSameOrigin(request)
    const cms = await authorized(request)
    const body = await readJSON(request, 2000)
    if (!Number.isInteger(body.id) || body.id < 1) throw new HttpError(400, '请选择内容。')
    if (body.action === 'start') return Response.json(await startTranslation(cms, body.collection, body.id))
    if (body.action === 'publish') return Response.json(await publishRun(cms, body.id))
    throw new HttpError(400, '无效操作。')
  } catch (error) {
    if (error instanceof HttpError) return errorResponse(error)
    return Response.json({ error: error instanceof Error ? error.message : '操作失败。' }, { status: 409 })
  }
}
