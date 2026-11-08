import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync } from 'node:fs'
import path from 'node:path'
const bin = process.env.PG_BIN || '/opt/homebrew/opt/postgresql@14/bin'
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
    '-p 55439 -h 127.0.0.1 -k /tmp',
    'start',
  ])
}
const present = execFileSync(
  path.join(bin, 'psql'),
  [
    '-h',
    '127.0.0.1',
    '-p',
    '55439',
    '-U',
    'keliran',
    '-d',
    'postgres',
    '-Atc',
    "SELECT 1 FROM pg_database WHERE datname = 'keliran_sealing'",
  ],
  { encoding: 'utf8' },
).trim()
if (!present) run('createdb', ['-h', '127.0.0.1', '-p', '55439', '-U', 'keliran', 'keliran_sealing'])
else console.log('Existing local database preserved.')
