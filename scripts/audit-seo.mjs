// Read-only public HTTP audit. Does not load .env, authenticate, or submit enquiries.
import { mkdir, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
const origin = process.argv[2] || 'https://keliran.com'
const phase = process.argv[3] || 'before'
if (!['before', 'after', 'local'].includes(phase)) throw Error('Unknown audit phase')
const folder = `.local/seo-geo-${phase}`
await mkdir(folder, { recursive: true })
await mkdir('reports', { recursive: true })
const strip = (s = '') =>
  s
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
const attr = (tag, name) => tag.match(new RegExp(`\\b${name}="([^"]*)"`, 'i'))?.[1] || ''
const read = async (path) => {
  const r = await fetch(new URL(path, origin), { signal: AbortSignal.timeout(45000) })
  return { status: r.status, url: r.url, headers: Object.fromEntries(r.headers), body: await r.text() }
}
const sitemap = await read('/sitemap.xml')
await writeFile(`${folder}/sitemap.xml`, sitemap.body)
const urls = [
  ...new Set([...sitemap.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname)),
]
if (!urls.length) throw Error('Empty sitemap: audit cannot report success')
const rows = []
let cursor = 0
await Promise.all(
  Array.from({ length: 6 }, async () => {
    while (cursor < urls.length) {
      const route = urls[cursor++]
      try {
        const r = await read(route)
        const html = r.body
        const links = [...html.matchAll(/<link\b[^>]*>/g)].map((m) => m[0])
        const metas = [...html.matchAll(/<meta\b[^>]*>/g)].map((m) => m[0])
        const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)?.[1] || ''
        const article = main.match(/<article\b[^>]*>([\s\S]*?)<\/article>/)?.[1] || ''
        const contextual = [
          ...(article || main.replace(/<nav\b[^>]*>[\s\S]*?<\/nav>/g, '')).matchAll(
            /<a\b[^>]*href="([^"]+)"/g,
          ),
        ]
          .map((m) => m[1].replace(/&amp;/g, '&'))
          .filter((x) => x.startsWith('/'))
        const schema = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(
          (m) => JSON.parse(m[1]),
        )
        const types = schema.flatMap((x) => (x['@graph'] || [x]).map((n) => n['@type']))
        const parts = route.split('/').filter(Boolean)
        rows.push({
          route,
          locale: parts[0],
          page_type: parts[1] || 'home',
          content_id: parts.slice(1).join('/'),
          primary_intent:
            parts[1] === 'products'
              ? 'commercial-family'
              : parts[1] === 'rfq'
                ? 'enquiry'
                : 'procurement-navigation',
          status_or_fetch_error: r.status,
          final_url: r.url,
          canonical: attr(links.find((l) => attr(l, 'rel') === 'canonical') || '', 'href'),
          robots_meta: attr(metas.find((m) => attr(m, 'name') === 'robots') || '', 'content'),
          x_robots_tag: r.headers['x-robots-tag'] || '',
          hreflang_targets: links
            .filter((l) => attr(l, 'hreflang'))
            .map((l) => `${attr(l, 'hreflang')}:${attr(l, 'href')}`),
          schema_types: types,
          h1: strip(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/)?.[1]),
          main_body_duplicate_group: article
            ? createHash('sha256').update(strip(article)).digest('hex').slice(0, 16)
            : 'not-compared',
          contextual_outbound_links: [...new Set(contextual)],
          contextual_inbound_links: [],
          proposed_action: 'retain-and-improve',
          approval_required: false,
        })
        await writeFile(
          `${folder}/${route.slice(1).replaceAll('/', '__')}.json`,
          JSON.stringify(
            {
              status: r.status,
              final_url: r.url,
              schema,
              headers: {
                'content-type': r.headers['content-type'],
                'x-robots-tag': r.headers['x-robots-tag'],
              },
            },
            null,
            2,
          ),
        )
        if (
          parts[0] === 'en' ||
          ['/de/guides/measure-door-seal', '/ja/products/brush-holders'].includes(route)
        )
          await writeFile(`${folder}/${route.slice(1).replaceAll('/', '__')}.html`, html)
      } catch (e) {
        rows.push({
          route,
          status_or_fetch_error: String(e),
          proposed_action: 'investigate',
          approval_required: false,
        })
      }
      if (rows.length % 100 === 0) console.log(`Audited ${rows.length}/${urls.length}`)
    }
  }),
)
rows.sort((a, b) => a.route.localeCompare(b.route))
for (const row of rows)
  row.contextual_inbound_links = rows
    .filter((r) => r.contextual_outbound_links?.some((x) => x.split(/[?#]/)[0] === row.route))
    .map((r) => r.route)
const fields = [
  'route',
  'locale',
  'page_type',
  'content_id',
  'primary_intent',
  'status_or_fetch_error',
  'final_url',
  'canonical',
  'robots_meta',
  'x_robots_tag',
  'hreflang_targets',
  'schema_types',
  'h1',
  'main_body_duplicate_group',
  'contextual_inbound_links',
  'contextual_outbound_links',
  'proposed_action',
  'approval_required',
]
const cell = (x) => `"${(Array.isArray(x) ? x.join(' | ') : String(x ?? '')).replaceAll('"', '""')}"`
await writeFile(
  `reports/keliran-route-inventory-${phase}.csv`,
  [fields.join(','), ...rows.map((r) => fields.map((k) => cell(r[k])).join(','))].join('\n'),
)
const summary = {
  at: new Date().toISOString(),
  origin,
  phase,
  sitemapStatus: sitemap.status,
  urls: urls.length,
  fetched: rows.filter((r) => r.status_or_fetch_error === 200).length,
  errors: rows
    .filter((r) => r.status_or_fetch_error !== 200)
    .map((r) => ({ route: r.route, error: r.status_or_fetch_error })),
  wrongCanonical: rows
    .filter((r) => r.canonical && r.canonical !== new URL(r.route, origin).href)
    .map((r) => r.route),
  noindex: rows.filter((r) => /noindex/i.test(`${r.robots_meta} ${r.x_robots_tag}`)).map((r) => r.route),
  missingH1: rows.filter((r) => !r.h1).map((r) => r.route),
  renderedBrowser: 'not-tested-by-this-script',
  rawEvidence: folder,
}
await writeFile(`reports/keliran-http-${phase}.json`, JSON.stringify(summary, null, 2) + '\n')
console.log(JSON.stringify(summary, null, 2))
if (
  summary.errors.length ||
  summary.wrongCanonical.length ||
  summary.missingH1.length ||
  (phase !== 'local' && summary.noindex.length)
)
  process.exitCode = 1
