import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
const origin = process.env.VERIFY_ORIGIN || 'http://127.0.0.1:3000'
assert.ok(['127.0.0.1', 'localhost'].includes(new URL(origin).hostname))
const state = JSON.parse(readFileSync('.local/review-state.json', 'utf8'))
const headers = { Cookie: state.cookies.map((c) => `${c.name}=${c.value}`).join('; '), Origin: origin }
let checked = 0
const routes = new Set([
  '',
  '/sealing',
  '/strip-brushes',
  '/products',
  '/materials',
  '/applications',
  '/about',
  '/contact',
  '/privacy',
  '/legal',
  '/solutions',
  '/cases',
  '/guides',
  '/faq',
  '/rfq',
])
const mediaURLs = new Set()
for (const collection of [
  'products',
  'categories',
  'materials',
  'applications',
  'pages',
  'solutions',
  'cases',
  'guides',
  'faqs',
]) {
  const response = await fetch(`${origin}/api/${collection}?draft=true&locale=en&depth=1&limit=250`, {
    headers,
  })
  assert.equal(response.status, 200, collection)
  const result = await response.json()
  assert.ok(result.totalDocs > 0 && !result.hasNextPage, `Complete local fixture required: ${collection}`)
  for (const doc of result.docs) {
    routes.add(
      collection === 'pages'
        ? doc.slug === 'home'
          ? ''
          : `/${doc.slug}`
        : collection === 'categories'
          ? `/${doc.line === 'brushes' ? 'strip-brushes' : 'sealing'}/${doc.slug}`
          : `/${collection === 'faqs' ? 'faq' : collection}/${doc.slug}`,
    )
    for (const media of [doc.heroImage, doc.image, ...(doc.images || [])]) {
      if (!media || typeof media !== 'object') continue
      if (media.url) mediaURLs.add(media.url)
      for (const size of Object.values(media.sizes || {})) if (size?.url) mediaURLs.add(size.url)
    }
  }
}
for (const locale of ['en', 'fr', 'de', 'es', 'it', 'ja', 'ko', 'zh-Hant'])
  for (const path of routes) {
    const response = await fetch(`${origin}/${locale}${path}`, { headers })
    assert.equal(response.status, 200, `${locale}${path}`)
    const html = await response.text()
    assert.ok(html.includes(`lang="${locale}"`))
    assert.ok(html.includes('noindex'))
    assert.ok(html.includes('rel="canonical"'))
    assert.ok(html.includes('application/ld+json'))
    assert.ok(html.includes('og:image'))
    checked++
  }
for (const source of mediaURLs) {
  const url = new URL(source, origin)
  assert.equal(url.origin, new URL(origin).origin, 'Verification only checks isolated local media')
  assert.equal((await fetch(url)).status, 200, url.pathname)
}
for (const path of [
  '/api/release-center',
  '/api/jobs/run',
  '/api/inquiries',
  '/api/translation-runs',
  '/api/inquiry-attachments/1/0',
])
  assert.ok([401, 403].includes((await fetch(origin + path)).status), path)
// Anonymous draft queries may list published products, but never a document in any other state.
const anonymous = await (await fetch(`${origin}/api/products?draft=true&locale=all&depth=0&limit=250`)).json()
assert.ok(!anonymous.hasNextPage && anonymous.docs.length === anonymous.totalDocs, 'Check every product')
const exposed = anonymous.docs.filter((doc) => doc._status !== 'published')
assert.deepEqual(
  exposed.map((doc) => doc.slug ?? doc.id),
  [],
  'Anonymous draft query exposed unpublished products',
)
const drafts = await (
  await fetch(`${origin}/api/products?draft=true&locale=all&depth=0&where[_status][equals]=draft`)
).json()
assert.equal(drafts.totalDocs, 0, 'Anonymous draft filter returned draft products')
for (const path of ['/zh', '/en/products/not-a-real-product', '/en/guides/not-a-real-guide'])
  assert.equal((await fetch(origin + path, { headers })).status, 404, path)
const post = (body, site = origin) =>
  fetch(`${origin}/api/inquiry-submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: site },
    body: JSON.stringify(body),
  })
assert.equal((await post({}, 'https://invalid.example')).status, 403)
assert.equal((await post({})).status, 400)
assert.equal((await post({ message: 'a'.repeat(22000) })).status, 413)
const home = await (await fetch(`${origin}/en`, { headers })).text()
const og = home.match(/property="og:image" content="([^"]+)"/)?.[1]
assert.ok(og)
assert.equal((await fetch(og)).status, 200, 'Open Graph image URL must resolve')
assert.match(await (await fetch(`${origin}/robots.txt`)).text(), /Disallow: \/\s/)
assert.ok(!(await (await fetch(`${origin}/sitemap.xml`)).text()).includes('<loc>'))
assert.equal((await fetch(`${origin}/llms.txt`)).status, 404)
console.log(
  `Verified ${checked} authenticated draft routes, ${mediaURLs.size} media URLs, metadata, OG image, robots/sitemap, private APIs, unpublished isolation and invalid requests.`,
)
