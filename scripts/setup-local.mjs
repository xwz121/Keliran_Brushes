import { randomBytes } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
if (existsSync('.env')) {
  console.log('.env already exists; preserved.')
  process.exit(0)
}
let env = readFileSync('.env.example', 'utf8')
env = env.replace(/^PAYLOAD_SECRET=$/m, `PAYLOAD_SECRET=${randomBytes(32).toString('hex')}`)
env = env.replace(/^CRON_SECRET=$/m, `CRON_SECRET=${randomBytes(32).toString('hex')}`)
writeFileSync('.env', env, { mode: 0o600 })
console.log('Created local .env with random application secrets. No external API keys configured.')
