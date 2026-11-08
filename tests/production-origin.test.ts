import { afterEach, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

it('uses the launched domain in production even when the old deployment variable remains', async () => {
  vi.stubEnv('VERCEL_ENV', 'production')
  vi.stubEnv('NEXT_PUBLIC_SERVER_URL', 'https://sealing.keliran.com')
  vi.stubEnv('CONTENT_PREVIEW_MODE', 'true')
  const env = await import('../src/lib/env')
  expect(env.siteURL).toBe('https://keliran.com')
  expect(env.noIndexSite).toBe(false)
  expect(env.previewMode).toBe(false)
})

it('preserves the configured origin and indexing protection for isolated review', async () => {
  vi.stubEnv('VERCEL_ENV', 'development')
  vi.stubEnv('DEPLOYMENT_ENV', 'development')
  vi.stubEnv('NEXT_PUBLIC_SERVER_URL', 'http://127.0.0.1:3000/')
  const env = await import('../src/lib/env')
  expect(env.siteURL).toBe('http://127.0.0.1:3000')
  expect(env.noIndexSite).toBe(true)
})
