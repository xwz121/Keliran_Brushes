import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'
const email = process.env.BOOTSTRAP_ADMIN_EMAIL
const password = process.env.BOOTSTRAP_ADMIN_PASSWORD
if (!email || !password || password.length < 16)
  throw Error(
    'Set BOOTSTRAP_ADMIN_EMAIL and a BOOTSTRAP_ADMIN_PASSWORD of at least 16 characters in your private environment.',
  )
const cms = await getPayload({ config })
if ((await cms.count({ collection: 'users' })).totalDocs)
  throw Error('An administrator already exists. Existing accounts were preserved.')
await cms.create({
  collection: 'users',
  data: { email, password, role: 'admin', name: 'Keliran administrator' },
})
console.log(
  'First administrator created. Credentials are not printed. Remove the bootstrap environment variables.',
)
await cms.destroy()
process.exit(0)
