import { request } from '@playwright/test'
import { readFileSync } from 'node:fs'
export default async function setup() {
  const credentials = JSON.parse(readFileSync('.local/redesign-admin.json', 'utf8'))
  const api = await request.newContext({
    baseURL: 'http://127.0.0.1:3200',
    extraHTTPHeaders: { Origin: 'http://127.0.0.1:3200' },
  })
  const r = await api.post('/api/users/login', { data: credentials })
  if (!r.ok()) throw Error(`Local review login failed: ${r.status()}`)
  const preview = await api.get('/api/preview?path=/en', { maxRedirects: 0 })
  if (preview.status() !== 307 || preview.headers().location !== 'http://127.0.0.1:3200/en')
    throw Error(`Local preview setup failed: ${preview.status()}`)
  await api.storageState({ path: '.local/review-state.json' })
  await api.dispose()
}
