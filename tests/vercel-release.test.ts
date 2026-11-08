import { expect, it } from 'vitest'
import { cloudDatabase, databaseFingerprint, releaseHash } from '../scripts/lib/vercel-release'

const production = {
  VERCEL: '1',
  VERCEL_ENV: 'production',
  VERCEL_GIT_COMMIT_REF: 'main',
  VERCEL_GIT_REPO_SLUG: 'Keliran_Sealing',
  VERCEL_GIT_REPO_OWNER: 'xwz121',
  DATABASE_URL: 'postgresql://app:example@cloud.example/site',
  DATABASE_URL_UNPOOLED: 'postgresql://outdated:example@old.example/wrong',
}
it('uses the same Vercel connection as the website, ignoring a stale unpooled setting', () => {
  expect(cloudDatabase(production, releaseHash)).toBe(production.DATABASE_URL)
})
it.each([
  { VERCEL: '0' },
  { VERCEL_ENV: 'preview' },
  { VERCEL_GIT_COMMIT_REF: 'feature' },
  { VERCEL_GIT_REPO_OWNER: 'someone-else' },
  { VERCEL_GIT_REPO_SLUG: 'another-site' },
  { DATABASE_URL: 'postgresql://app@127.0.0.1/site' },
  { DATABASE_URL: '' },
])('refuses unintended deployment context %j', (override) => {
  expect(() => cloudDatabase({ ...production, ...override }, releaseHash)).toThrow()
})
it('refuses changed release content and does not include passwords in identity', () => {
  expect(() => cloudDatabase(production, 'changed')).toThrow()
  expect(databaseFingerprint(production.DATABASE_URL)).toBe(
    databaseFingerprint(production.DATABASE_URL.replace(':example@', ':rotated@')),
  )
})
