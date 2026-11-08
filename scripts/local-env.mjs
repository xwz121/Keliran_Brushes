import { spawn } from 'node:child_process'
import { randomBytes } from 'node:crypto'
// Deliberately override every external service before dotenv loads the saved production settings.
const env = {
  ...process.env,
  DATABASE_URL: 'postgresql://keliran@127.0.0.1:55440/keliran_brushes',
  DATABASE_URL_UNPOOLED: 'postgresql://keliran@127.0.0.1:55440/keliran_brushes',
  NEXT_PUBLIC_SERVER_URL: 'http://127.0.0.1:3200',
  PAYLOAD_SECRET: 'local-brushes-only-not-for-deployment-2026',
  CRON_SECRET: randomBytes(32).toString('hex'),
  CONTENT_PREVIEW_MODE: 'false',
  DEPLOYMENT_ENV: 'development',
  VERCEL_ENV: 'development',
}
for (const key of [
  'R2_BUCKET',
  'R2_PRIVATE_BUCKET',
  'R2_ENDPOINT',
  'R2_PUBLIC_URL',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'POSTMARK_SERVER_TOKEN',
  'EMAIL_FROM',
  'SALES_EMAIL',
  'TURNSTILE_SECRET_KEY',
  'NEXT_PUBLIC_TURNSTILE_SITE_KEY',
])
  env[key] = ''
const [command, ...args] = process.argv.slice(2)
if (!command) throw new Error('Usage: node scripts/local-env.mjs <command> [args]')
const child = spawn(command, args, { env, stdio: 'inherit' })
child.on('exit', (code) => process.exit(code ?? 1))
