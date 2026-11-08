import 'dotenv/config'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { mkdir, readFile, writeFile, chmod } from 'node:fs/promises'

process.umask(0o077)
const url = new URL(process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL)
assert.equal(url.hostname, 'pgm-bp1ta2k1908e7u5ljo.pg.rds.aliyuncs.com')
assert.equal(url.pathname, '/keliran_CMS')
const bin = process.env.PG_CLIENT_BIN || '/opt/homebrew/opt/libpq/bin'
const version = spawnSync(`${bin}/pg_dump`, ['--version'], { encoding: 'utf8' })
assert.match(version.stdout, /\b(?:18|19)\./, 'PostgreSQL 18 or newer backup client required')
await mkdir('.local/release', { recursive: true, mode: 0o700 })
await chmod('.local/release', 0o700)
const file = `.local/release/production-before-${new Date().toISOString().replaceAll(/[:.]/g, '-')}.dump`
const result = spawnSync(`${bin}/pg_dump`, ['--format=custom', '--no-owner', '--no-acl', '--file', file], {
  encoding: 'utf8',
  timeout: 180000,
  env: {
    ...process.env,
    PGHOST: url.hostname,
    PGPORT: url.port || '5432',
    PGDATABASE: url.pathname.slice(1),
    PGUSER: decodeURIComponent(url.username),
    PGPASSWORD: decodeURIComponent(url.password),
    PGCONNECT_TIMEOUT: '15',
    PGSSLMODE: url.searchParams.get('sslmode') || 'prefer',
  },
})
if (result.status !== 0) {
  console.error(
    result.error?.message || result.stderr.replaceAll(decodeURIComponent(url.password), '[redacted]'),
  )
  process.exit(1)
}
await chmod(file, 0o600)
const bytes = await readFile(file)
assert.equal(bytes.subarray(0, 5).toString(), 'PGDMP')
assert.ok(bytes.length > 10000)
const listed = spawnSync(`${bin}/pg_restore`, ['--list', file], { encoding: 'utf8' })
assert.equal(listed.status, 0, 'Backup archive cannot be read')
assert.match(listed.stdout, /TABLE DATA public users/)
const proof = {
  completedAt: new Date().toISOString(),
  file,
  bytes: bytes.length,
  sha256: createHash('sha256').update(bytes).digest('hex'),
  archiveReadable: true,
  database: 'keliran_CMS',
  client: version.stdout.trim(),
}
await writeFile(`${file}.json`, JSON.stringify(proof, null, 2), { mode: 0o600 })
console.log(JSON.stringify(proof, null, 2))
