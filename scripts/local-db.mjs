import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync } from 'node:fs'
import path from 'node:path'
// PostgreSQL binaries: PG_BIN, else Homebrew 14, else Postgres.app.
const bin =
  process.env.PG_BIN ||
  ['/opt/homebrew/opt/postgresql@14/bin', '/Applications/Postgres.app/Contents/Versions/latest/bin'].find(
    (dir) => existsSync(path.join(dir, 'pg_ctl')),
  )
if (!bin) throw new Error('PostgreSQL not found. Install Postgres.app or set PG_BIN.')
// Differs from the sealing site's local cluster so both projects can run side by side.
const port = '55440'
const database = 'keliran_brushes'
const data = path.resolve('.local/postgres')
const run = (name, args) => execFileSync(path.join(bin, name), args, { stdio: 'inherit' })
if (process.argv[2] === 'stop') {
  run('pg_ctl', ['-D', data, 'stop', '-m', 'fast'])
  process.exit(0)
}
mkdirSync(data, { recursive: true })
if (!existsSync(path.join(data, 'PG_VERSION')))
  run('initdb', ['-D', data, '-A', 'trust', '-U', 'keliran', '--encoding=UTF8', '--locale=C'])
try {
  run('pg_ctl', ['-D', data, 'status'])
} catch {
  run('pg_ctl', [
    '-D',
    data,
    '-l',
    path.resolve('.local/postgres.log'),
    '-o',
    `-p ${port} -h 127.0.0.1 -k /tmp`,
    'start',
  ])
}
const present = execFileSync(
  path.join(bin, 'psql'),
  [
    '-h',
    '127.0.0.1',
    '-p',
    port,
    '-U',
    'keliran',
    '-d',
    'postgres',
    '-Atc',
    `SELECT 1 FROM pg_database WHERE datname = '${database}'`,
  ],
  { encoding: 'utf8' },
).trim()
if (!present) run('createdb', ['-h', '127.0.0.1', '-p', port, '-U', 'keliran', database])
else console.log('Existing local database preserved.')
