import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'
const payload = await getPayload({ config })
let stopping = false
process.on('SIGINT', () => {
  stopping = true
})
process.on('SIGTERM', () => {
  stopping = true
})
console.log('Local Payload job worker started. Press Ctrl+C to stop.')
while (!stopping) {
  try {
    await payload.jobs.run({ limit: 2 })
  } catch {
    console.error('Queue iteration failed; inspect Payload logs.')
  }
  if (!stopping) await new Promise((r) => setTimeout(r, 5000))
}
await payload.destroy()
process.exit(0)
