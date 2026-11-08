import 'dotenv/config'
import { randomBytes } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { getPayload } from 'payload'
import config from '../src/payload.config'
if (
  new URL(process.env.DATABASE_URL!).hostname !== '127.0.0.1' ||
  !process.env.DATABASE_URL!.endsWith('/keliran_redesign')
)
  throw Error('Local redesign database only.')
const cms = await getPayload({ config })
const file = '.local/redesign-admin.json'
const credentials = existsSync(file)
  ? JSON.parse(readFileSync(file, 'utf8'))
  : { email: 'review@keliran.local', password: randomBytes(24).toString('hex') }
if (
  !(await cms.find({ collection: 'users', where: { email: { equals: credentials.email } }, limit: 1 }))
    .totalDocs
)
  await cms.create({
    collection: 'users',
    data: { ...credentials, name: 'Local website review', role: 'admin' },
  })
mkdirSync('.local', { recursive: true })
writeFileSync(file, JSON.stringify(credentials), { mode: 0o600 })
console.log('Local review administrator ready. Credentials stored only in .local/redesign-admin.json.')
await cms.destroy()
process.exit(0)
