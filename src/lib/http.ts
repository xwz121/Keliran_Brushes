import { siteURL, isProductionDeployment } from './env'
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}
export function requireSameOrigin(request: Request) {
  const allowed = [new URL(siteURL).origin]
  if (!isProductionDeployment) allowed.push('http://localhost:3000', 'http://127.0.0.1:3000')
  if (!allowed.includes(request.headers.get('origin') || '')) throw new HttpError(403, 'Origin rejected')
}
export async function readJSON(request: Request, max = 20000) {
  if (!request.headers.get('content-type')?.includes('application/json'))
    throw new HttpError(415, 'JSON required')
  if (Number(request.headers.get('content-length') || 0) > max) throw new HttpError(413, 'Request too large')
  const reader = request.body?.getReader()
  if (!reader) throw new HttpError(400, 'Empty body')
  let size = 0
  const chunks: Uint8Array[] = []
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    size += value.length
    if (size > max) {
      await reader.cancel()
      throw new HttpError(413, 'Request too large')
    }
    chunks.push(value)
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    throw new HttpError(400, 'Invalid JSON')
  }
}
export const errorResponse = (error: unknown) =>
  Response.json(
    { error: error instanceof HttpError ? error.message : 'Unable to complete request.' },
    { status: error instanceof HttpError ? error.status : 500 },
  )
