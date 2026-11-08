import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { locales } from '../src/lib/locales'
import { interfaceCopy } from '../src/lib/interface-copy'
const url = new URL(process.env.DATABASE_URL!)
if (!['127.0.0.1', 'localhost'].includes(url.hostname) || url.pathname !== '/keliran_redesign')
  throw Error('Local review database required.')
const cms = await getPayload({ config })
try {
  const media = await cms.find({ collection: 'media', limit: 100, depth: 0 })
  const keys = {
    'components-hero': 'heroAlt',
    'sealing-profiles': 'sealingAlt',
    'strip-brushes': 'brushAlt',
    'gaskets-orings': 'gasketAlt',
    'moulded-parts': 'mouldedAlt',
  } as const
  let count = 0
  for (const [name, key] of Object.entries(keys)) {
    const item = media.docs.find((m) => m.sourceNote?.startsWith(`Keliran redesign 2026-09-23 / ${name}.`))
    if (!item) throw Error(`Missing generated illustration: ${name}`)
    for (const locale of locales)
      await cms.update({
        collection: 'media',
        id: item.id,
        locale,
        data: { alt: interfaceCopy(locale)[key], approved: true },
      })
    count++
  }
  console.log(
    `Prepared ${count} owned illustrative assets with eight-language alt text. No content was published.`,
  )
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Local preparation failed')
  process.exitCode = 1
} finally {
  await cms.destroy()
  process.exit(process.exitCode || 0)
}
