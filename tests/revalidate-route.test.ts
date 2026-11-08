import { afterEach, describe, it, expect, vi } from 'vitest'
const revalidateTag = vi.hoisted(() => vi.fn())
vi.mock('next/cache', () => ({ revalidateTag }))
import { POST } from '../src/app/(payload)/api/revalidate/route'

const call = (authorization?: string) =>
  POST(
    new Request('http://127.0.0.1/api/revalidate', {
      method: 'POST',
      headers: authorization ? { authorization } : {},
    }),
  )
afterEach(() => {
  vi.unstubAllEnvs()
  revalidateTag.mockClear()
})
describe('content cache refresh for command-line publishing', () => {
  it('rejects missing or wrong tokens and an unset secret', async () => {
    vi.stubEnv('CRON_SECRET', 'secret-value')
    expect((await call()).status).toBe(401)
    expect((await call('Bearer wrong-value')).status).toBe(401)
    vi.stubEnv('CRON_SECRET', '')
    expect((await call('Bearer ')).status).toBe(401)
    expect(revalidateTag).not.toHaveBeenCalled()
  })
  it('refreshes the shared content tag with the cron secret', async () => {
    vi.stubEnv('CRON_SECRET', 'secret-value')
    expect((await call('Bearer secret-value')).status).toBe(200)
    expect(revalidateTag).toHaveBeenCalledWith('site-content', { expire: 0 })
  })
})
