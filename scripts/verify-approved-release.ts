import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { approvedRelease } from './lib/approved-release'
import { locales } from '../src/lib/locales'
import { routeFor } from '../src/lib/routes'
import { legacyContent } from '../src/lib/legacy-content'

const origin = (process.env.VERIFY_ORIGIN || 'http://127.0.0.1:3000').replace(/\/$/, '')
assert.ok(['http://127.0.0.1:3000', 'https://keliran.com'].includes(origin), 'Unexpected destination')
const production = origin === 'https://keliran.com'
const { manifest, manifestHash } = await approvedRelease()
const collections = [...new Set(manifest.entries.map((e) => e.collection))]
const mediaURLs = new Set<string>()
const assetURLs = new Set<string>()
const startedAt = new Date().toISOString()
const networkRetries: { path: string; code: string }[] = []
let documents = 0,
  pages = 0
const read = async (path: string) => {
  for (let attempt = 0; ; attempt++) {
    let response: Response
    try {
      const fetched = await fetch(new URL(path, origin), { signal: AbortSignal.timeout(45000) })
      response = new Response(await fetched.arrayBuffer(), {
        status: fetched.status,
        headers: fetched.headers,
      })
    } catch (error) {
      const code =
        (error as { cause?: { code?: string }; name?: string }).cause?.code || (error as Error).name
      if (attempt >= 2 || !['UND_ERR_SOCKET', 'ECONNRESET', 'ETIMEDOUT', 'TimeoutError'].includes(code))
        throw new Error(`GET ${path} failed: ${code}`, { cause: error })
      networkRetries.push({ path, code })
      console.log(`Retrying read-only request ${path}: ${code}`)
      continue
    }
    assert.equal(response.status, 200, path)
    return response
  }
}
for (const locale of locales) {
  for (const collection of collections) {
    const result = await (
      await read(`/api/${collection}?locale=${locale}&fallback-locale=none&depth=1&limit=300`)
    ).json()
    assert.equal(result.hasNextPage, false)
    if (production)
      for (const [legacyCollection, slug] of legacyContent)
        if (collection === legacyCollection)
          assert.ok(
            !result.docs.some((d: any) => d.slug === slug),
            `Superseded entry remains public: ${slug}`,
          )
    for (const entry of manifest.entries.filter((e) => e.collection === collection)) {
      const matches = result.docs.filter((d: any) => d.slug === entry.slug)
      assert.equal(matches.length, 1, `${locale}/${collection}/${entry.slug}`)
      const doc = matches[0],
        expected = entry.translations[locale] as Record<string, any>
      assert.equal(doc._status, 'published')
      assert.equal(doc.factsConfirmed, true)
      for (const field of ['title', 'summary', 'description', 'seoTitle', 'seoDescription'])
        assert.equal(doc[field] || '', expected[field])
      assert.equal(doc.sections.length, expected.sections.length)
      for (const [i, section] of expected.sections.entries())
        for (const field of ['key', 'heading', 'text'])
          assert.equal(doc.sections[i][field] || '', section[field])
      if (expected.specifications) {
        assert.equal(doc.specifications.length, expected.specifications.length)
        for (const [i, spec] of expected.specifications.entries())
          for (const field of ['key', 'label', 'value', 'unit'])
            assert.equal(doc.specifications[i][field] || '', spec[field] || '')
      }
      if (entry.shared.categorySlug) assert.equal(doc.category?.slug, entry.shared.categorySlug)
      for (const [from, to] of [
        ['productSlugs', 'relatedProducts'],
        ['guideSlugs', 'relatedGuides'],
        ['solutionSlugs', 'relatedSolutions'],
      ])
        if (entry.shared[from])
          assert.deepEqual(
            doc[to].map((related: any) => related.slug),
            entry.shared[from],
          )
      for (const media of [doc.heroImage, doc.image, ...(doc.images || [])])
        if (media && typeof media === 'object') {
          assert.ok(media.alt?.trim())
          assert.equal(media.illustrative, true)
          assert.equal(media.sourceNote, undefined, 'Private approval notes must not be public')
          assert.equal(media.approved, undefined, 'Internal approval field must not be public')
          const asset = manifest.media.find((item: { slug: string }) => item.slug === entry.shared.imageKey)
          if (asset) assert.equal(media.alt, asset.alt[locale])
          for (const url of [media.url, media.sizes?.card?.url, media.sizes?.detail?.url])
            if (url) mediaURLs.add(url)
        }
      documents++
    }
  }
  console.log(`Verified content ${locale}: ${manifest.entries.length} documents`)
}
const settings = await (await read('/api/globals/site-settings')).json()
for (const [field, value] of Object.entries(manifest.businessProfile))
  assert.equal(settings[field] ?? '', value ?? '', `Company setting: ${field}`)
assert.equal(settings.internalNotes, undefined)
const work = locales.flatMap((locale) => {
  const paths = new Set(
    manifest.entries.map((entry) =>
      routeFor(entry.collection as any, { slug: entry.slug, line: entry.shared.line }, locale),
    ),
  )
  for (const suffix of [
    '',
    '/sealing',
    '/strip-brushes',
    '/products',
    '/materials',
    '/applications',
    '/solutions',
    '/cases',
    '/guides',
    '/faq',
    '/rfq',
  ])
    paths.add(`/${locale}${suffix}`)
  return [...paths].map((path) => ({ path, locale }))
})
const expectedPaths = work.map(({ path }) => path)
await Promise.all(
  Array.from({ length: 4 }, async () => {
    while (work.length) {
      const { path, locale } = work.shift()!
      const response = await read(path)
      assert.equal(response.headers.get('x-content-type-options'), 'nosniff', path)
      assert.equal(response.headers.get('x-frame-options'), 'SAMEORIGIN', path)
      const html = await response.text()
      assert.ok(html.includes(`lang="${locale}"`), `${path}: document language`)
      assert.ok(html.includes('<h1'), `${path}: heading missing`)
      assert.ok(html.includes(`rel="canonical" href="${origin}${path}"`), `${path}: canonical`)
      if (production) assert.ok(!/<meta[^>]+name="robots"[^>]+noindex/.test(html), `${path}: noindex`)
      else assert.ok(html.includes('noindex'), `${path}: local indexing protection`)
      assert.ok(html.includes('application/ld+json') && html.includes('og:image'), `${path}: SEO metadata`)
      for (const match of html.matchAll(
        /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g,
      ))
        assert.ok(JSON.parse(match[1]), `${path}: valid structured data`)
      for (const other of [...locales, 'x-default'])
        assert.ok(new RegExp(`href[lL]ang="${other}"`).test(html), `${path}: language alternate ${other}`)
      if (/\/(legal|contact|privacy)$/.test(path))
        for (const value of ['Keliran LTD', '15698503', 'England and Wales', '483 Green Lanes'])
          assert.ok(html.includes(value), `${path}: company disclosure ${value}`)
      for (const match of html.matchAll(/<(?:script|img)\b[^>]*\bsrc="([^"]+)"/g)) {
        if (match[1].startsWith('data:')) continue
        const url = new URL(match[1].replaceAll('&amp;', '&'), origin)
        if (url.origin === origin) assetURLs.add(url.href)
      }
      for (const match of html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"/g))
        assetURLs.add(new URL(match[1].replaceAll('&amp;', '&'), origin).href)
      pages++
      if (pages % 128 === 0) console.log(`Verified pages: ${pages}/${expectedPaths.length}`)
    }
  }),
)
for (const url of mediaURLs) assert.ok((await read(url)).headers.get('content-type')?.startsWith('image/'))
for (const url of assetURLs) {
  const response = await read(url)
  assert.ok((await response.arrayBuffer()).byteLength > 0, url)
}
for (const locale of locales)
  for (const line of ['sealing', 'strip-brush'])
    assert.ok(
      (await (await read(`/downloads/${locale}/${line}-rfq-checklist.txt`)).text()).trim().length > 100,
    )
for (const path of [
  '/api/release-center',
  '/api/jobs/run',
  '/api/inquiries',
  '/api/translation-runs',
  '/api/inquiry-attachments/1/0',
]) {
  const response = await fetch(origin + path, { signal: AbortSignal.timeout(30000) })
  assert.ok([401, 403].includes(response.status), `${path}: anonymous access must be denied`)
}
for (const collection of collections) {
  const draft = await (await read(`/api/${collection}?draft=true&where[_status][equals]=draft`)).json()
  assert.equal(draft.totalDocs, 0, `Draft isolation: ${collection}`)
}
for (const path of ['/zh', '/en/products/not-a-real-product', '/en/guides/not-a-real-guide'])
  assert.equal((await fetch(origin + path, { signal: AbortSignal.timeout(45000) })).status, 404, path)
assert.ok((await read('/og')).headers.get('content-type')?.startsWith('image/'))
// Deliberately invalid inputs are rejected before creating inquiries or sending mail.
const invalidRequest = (
  path: string,
  body: string,
  requestOrigin = origin,
  contentType = 'application/json',
) =>
  fetch(origin + path, {
    method: 'POST',
    headers: { Origin: requestOrigin, 'Content-Type': contentType },
    body,
    signal: AbortSignal.timeout(45000),
  })
assert.equal((await invalidRequest('/api/inquiry-submit', '{}', 'https://invalid.example')).status, 403)
assert.equal((await invalidRequest('/api/inquiry-submit', '{}')).status, 400)
assert.equal((await invalidRequest('/api/inquiry-submit', '{}', origin, 'text/plain')).status, 415)
assert.equal(
  (await invalidRequest('/api/inquiry-submit', JSON.stringify({ message: 'a'.repeat(22000) }))).status,
  413,
)
assert.equal((await invalidRequest('/api/inquiry-session', '{}')).status, 400)
const privateUpload = await invalidRequest('/api/inquiry-upload/sign', '{}')
assert.ok([400, 503].includes(privateUpload.status), 'Unsigned uploads must never receive an upload URL')
console.log('Verified private APIs, drafts, company profile, downloads and invalid submissions')
if (production) {
  for (const locale of locales)
    for (const [collection, slug, target] of legacyContent) {
      if (collection === 'pages') continue
      const oldPath = `/${locale}/${collection === 'categories' ? 'sealing' : collection}/${slug}`
      const response: Response = await fetch(origin + oldPath, { redirect: 'manual' })
      assert.equal(response.status, 308, oldPath)
      assert.equal(new URL(response.headers.get('location')!, origin).href, `${origin}/${locale}${target}`)
    }
  assert.equal((await fetch(`${origin}/api/_keliran_release_20260924_rows`)).status, 404)
  const robots = await (await read('/robots.txt')).text()
  assert.ok(robots.includes('Sitemap: https://keliran.com/sitemap.xml'))
  const sitemap = await (await read('/sitemap.xml')).text()
  assert.ok(sitemap.includes('https://keliran.com/en'))
  assert.ok(!sitemap.includes('sealing.keliran.com'))
  const sitemapURLs = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]))
  for (const path of expectedPaths)
    assert.ok(sitemapURLs.has(origin + path), `Missing sitemap route: ${path}`)
  const www = await fetch('https://www.keliran.com/en', { redirect: 'manual' })
  assert.equal(www.status, 308)
  assert.equal(www.headers.get('location'), 'https://keliran.com/en')
}
const result = {
  startedAt,
  verifiedAt: new Date().toISOString(),
  origin,
  manifestHash,
  anonymous: true,
  documents,
  pages,
  images: mediaURLs.size,
  frontendAssets: assetURLs.size,
  downloads: locales.length * 2,
  companyProfile: true,
  draftIsolation: collections.length,
  structuredDataAndLanguageAlternates: true,
  invalidRequestsRejected: 6,
  privateUploadConfigured: privateUpload.status !== 503,
  legacyRedirects: production ? 64 : 0,
  externalMessagesSent: false,
  networkRetries,
}
await mkdir('.local/release', { recursive: true, mode: 0o700 })
await writeFile(
  `.local/release/${production ? 'production' : 'local'}-http-verification.json`,
  JSON.stringify(result, null, 2),
  { mode: 0o600 },
)
console.log(JSON.stringify(result, null, 2))
