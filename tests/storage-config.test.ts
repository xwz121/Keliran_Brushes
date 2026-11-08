import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe('media schema across deployment environments', () => {
  it.each([false, true])('retains the R2 prefix field with storage enabled=%s', async (enabled) => {
    vi.stubEnv('PAYLOAD_SECRET', 'test-only-config-validation-no-network')
    vi.stubEnv('DATABASE_URL', 'postgresql://test@127.0.0.1:55440/test')
    vi.stubEnv('DEPLOYMENT_ENV', 'development')
    vi.stubEnv('VERCEL_ENV', 'preview')
    for (const [key, value] of Object.entries({
      R2_BUCKET: 'test-bucket',
      R2_ACCESS_KEY_ID: 'test-only',
      R2_SECRET_ACCESS_KEY: 'test-only',
      R2_ENDPOINT: 'https://example.r2.cloudflarestorage.com',
      R2_PUBLIC_URL: 'https://images.example.com',
    }))
      vi.stubEnv(key, enabled ? value : '')

    // Building the config must include the same database field even on a
    // developer machine with no R2 credentials. No Payload instance is started.
    const config = await (await import('../src/payload.config')).default
    const media = config.collections.find((collection) => collection.slug === 'media')
    expect(media?.fields.find((field) => 'name' in field && field.name === 'prefix')).toMatchObject({
      type: 'text',
      defaultValue: 'brushes',
    })
  })
})
