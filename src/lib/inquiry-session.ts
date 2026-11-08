import { createHmac, timingSafeEqual } from 'node:crypto'
import { z } from 'zod'
import { HttpError } from './http'
const schema = z.object({ id: z.uuid(), expires: z.number().int(), ip: z.string() })
const mac = (s: string) => createHmac('sha256', process.env.PAYLOAD_SECRET!).update(s).digest('base64url')
export function issueSession(id: string, ip: string, now = Date.now()) {
  const body = Buffer.from(JSON.stringify({ id, ip: mac(ip), expires: now + 45 * 60 * 1000 })).toString(
    'base64url',
  )
  return `${body}.${mac(body)}`
}
export function verifySession(token: string, id: string, ip?: string, now = Date.now()) {
  try {
    const [body, sig, ...rest] = token.split('.')
    if (!body || !sig || rest.length) throw Error()
    const actual = Buffer.from(sig),
      expected = Buffer.from(mac(body))
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw Error()
    const data = schema.parse(JSON.parse(Buffer.from(body, 'base64url').toString()))
    if (data.id !== id || data.expires < now || (ip && data.ip !== mac(ip))) throw Error()
    return data
  } catch {
    throw new HttpError(401, 'Your enquiry session has expired. Please retry the verification.')
  }
}
export function requestIP(request: Request) {
  return process.env.VERCEL
    ? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    : '127.0.0.1'
}
