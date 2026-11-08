import 'dotenv/config'
import { readFile } from 'node:fs/promises'
import { getPayload } from 'payload'
import config from '../src/payload.config'
const url = new URL(process.env.DATABASE_URL!)
if (!['127.0.0.1', 'localhost'].includes(url.hostname) || url.pathname !== '/keliran_brushes')
  throw Error('This script only updates the isolated local review database.')
const cms = await getPayload({ config })
try {
  const data = JSON.parse(await readFile('content/business-profile.json', 'utf8'))
  await cms.updateGlobal({ slug: 'site-settings', data, overrideAccess: true })
  console.log(
    'Applied owner-provided public business profile to local review database. Existing registration/tax fields preserved.',
  )
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Local profile update failed')
  process.exitCode = 1
} finally {
  await cms.destroy()
  process.exit(process.exitCode || 0)
}
