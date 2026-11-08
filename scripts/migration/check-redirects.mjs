// Request every keliran.com URL in reports/brushes-redirect-map.csv against running sites and
// check: one permanent redirect to the brushes URL, query preserved, no loop, target answers 200.
// Usage: node scripts/migration/check-redirects.mjs --main=http://127.0.0.1:3000 --brushes=http://127.0.0.1:3200
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
const arg = (n, d) => process.argv.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3) || d
const main = arg('main', 'http://127.0.0.1:3000')
const brushes = arg('brushes', 'http://127.0.0.1:3200')
const file = arg('map', 'reports/brushes-redirect-map.csv')
const [header, ...lines] = readFileSync(file, 'utf8').trim().split('\n')
const cols = header.split(',')
const parse = (line) => {
  const out = []
  let cur = '',
    quoted = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (quoted && c === '"' && line[i + 1] === '"') ((cur += '"'), i++)
    else if (c === '"') quoted = !quoted
    else if (c === ',' && !quoted) (out.push(cur), (cur = ''))
    else cur += c
  }
  return [...out, cur]
}
const rows = lines.map((l) => Object.fromEntries(parse(l).map((v, i) => [cols[i], v])))
const local = (url) =>
  url.replace('https://brushes.keliran.com', brushes).replace('https://keliran.com', main)
const results = []
for (const row of rows) {
  const old = new URL(local(row.old_url))
  old.searchParams.set('utm_source', 'redirect-check')
  const expected = new URL(local(row.new_url))
  expected.searchParams.set('utm_source', 'redirect-check')
  const problems = []
  const first = await fetch(old, { redirect: 'manual' })
  const location = first.headers.get('location')
  if (first.status !== 308) problems.push(`status ${first.status}`)
  const target = location ? new URL(location, old) : null
  if (!target || target.origin + target.pathname !== expected.origin + expected.pathname)
    problems.push(`location ${location}`)
  for (const [k, v] of expected.searchParams)
    if (target?.searchParams.get(k) !== v) problems.push(`query ${k} not preserved`)
  if (target) {
    let url = target,
      hops = 0,
      response
    const seen = new Set([old.href])
    while (hops < 4) {
      if (seen.has(url.href)) {
        problems.push('redirect loop')
        break
      }
      seen.add(url.href)
      response = await fetch(url, { redirect: 'manual' })
      if (![301, 302, 307, 308].includes(response.status)) break
      url = new URL(response.headers.get('location'), url)
      hops++
    }
    if (response?.status !== 200) problems.push(`target status ${response?.status} at ${url.pathname}`)
    if (hops) problems.push(`target redirects ${hops} more time(s)`)
  }
  results.push({ old: row.old_url, new: row.new_url, ok: !problems.length, problems })
}
const failed = results.filter((r) => !r.ok)
const out = arg('out', '.local/redirect-check.json')
mkdirSync(path.dirname(out), { recursive: true })
writeFileSync(out, JSON.stringify({ main, brushes, checked: results.length, failed }, null, 2))
console.log(
  JSON.stringify({ checked: results.length, failed: failed.length, sample: failed.slice(0, 10) }, null, 2),
)
process.exit(failed.length ? 1 : 0)
