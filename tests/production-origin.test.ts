import { afterEach, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

it('uses the brushes domain in production even when a copied deployment variable remains', async () => {
  vi.stubEnv('VERCEL_ENV', 'production')
  vi.stubEnv('NEXT_PUBLIC_SERVER_URL', 'https://keliran.com')
  vi.stubEnv('CONTENT_PREVIEW_MODE', 'true')
  const env = await import('../src/lib/env')
  expect(env.siteURL).toBe('https://brushes.keliran.com')
  expect(env.allowedOrigins).toEqual(['https://brushes.keliran.com'])
  expect(env.noIndexSite).toBe(false)
  expect(env.previewMode).toBe(false)
})

it('preserves the configured origin and indexing protection for isolated review', async () => {
  vi.stubEnv('VERCEL_ENV', 'development')
  vi.stubEnv('DEPLOYMENT_ENV', 'development')
  vi.stubEnv('NEXT_PUBLIC_SERVER_URL', 'http://127.0.0.1:3200/')
  const env = await import('../src/lib/env')
  expect(env.siteURL).toBe('http://127.0.0.1:3200')
  expect(env.allowedOrigins).toEqual(['http://127.0.0.1:3200', 'http://localhost:3200'])
  expect(env.noIndexSite).toBe(true)
})

it('uses the stable branch URL for preview deployments without a configured origin', async () => {
  vi.stubEnv('VERCEL_ENV', 'preview')
  vi.stubEnv('DEPLOYMENT_ENV', '')
  vi.stubEnv('NEXT_PUBLIC_SERVER_URL', '')
  vi.stubEnv('VERCEL_BRANCH_URL', 'keliran-brushes-git-main-xwz121.vercel.app')
  const env = await import('../src/lib/env')
  expect(env.siteURL).toBe('https://keliran-brushes-git-main-xwz121.vercel.app')
  expect(env.allowedOrigins).toEqual(['https://keliran-brushes-git-main-xwz121.vercel.app'])
  expect(env.noIndexSite).toBe(true)
})
