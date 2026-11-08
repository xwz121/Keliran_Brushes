import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'
const payload = await getPayload({ config })
await payload.jobs.run({ limit: 2 })
await payload.destroy()

process.exit(0)
