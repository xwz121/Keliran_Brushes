import { expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ find: vi.fn() }))
vi.mock('next/headers', () => ({ headers: vi.fn(), cookies: async () => ({ get: () => undefined }) }))
vi.mock('../src/lib/payload', () => ({ getCMS: async () => ({ find: mocks.find }) }))
vi.mock('next/cache', () => ({
  // Simulate empty English results retained by Vercel from the original import.
  unstable_cache:
    (read: (...args: any[]) => unknown, keys: string[]) =>
    async (...args: any[]) => {
      if (keys[0] === 'page') return null
      if (keys[0] === 'products' || keys[0] === 'resources') return []
      return read(...args)
    },
}))
import { getPage, getProducts, getResources } from '../src/lib/content'

it('reads newly published English content instead of the pre-import empty cache', async () => {
  mocks.find.mockResolvedValueOnce({ docs: [{ slug: 'home', title: 'Published home' }] })
  expect((await getPage('en', 'home'))?.title).toBe('Published home')
  mocks.find.mockResolvedValueOnce({ docs: [{ id: 1, slug: 'o-ring', code: 'RUB-001', title: 'O-ring' }] })
  expect((await getProducts('en'))[0].title).toBe('O-ring')
  mocks.find.mockResolvedValueOnce({ docs: [{ code: 'FKM', title: 'FKM' }] })
  expect(await getResources('en', 'materials')).toEqual([{ code: 'FKM', title: 'FKM' }])
  expect(mocks.find).toHaveBeenCalledTimes(3)
})
