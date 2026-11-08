import 'dotenv/config'
import { spawnSync } from 'node:child_process'
const result = spawnSync(
  process.execPath,
  ['node_modules/payload/bin.js', 'migrate', ...process.argv.slice(2)],
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'production',
      DATABASE_URL: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL,
    },
  },
)
process.exit(result.status ?? 1)
