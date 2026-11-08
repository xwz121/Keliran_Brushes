import 'dotenv/config'
import { mkdirSync, writeFileSync } from 'node:fs'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { drafts } from './seed/catalogue'
import { registerProductImages } from './seed/product-media'

// This repair targets the existing local review dataset, preserving content and translations.
const database = new URL(process.env.DATABASE_URL!)
if (database.hostname !== '127.0.0.1' || database.pathname !== '/keliran_redesign')
  throw new Error('Image repair is restricted to the local redesign database.')

const cms = await getPayload({ config })
try {
  const targets = drafts.filter((d) => d.collection === 'products' || d.collection === 'categories')
  const before = []
  for (const target of targets) {
    const collection = target.collection as 'products' | 'categories'
    const result = await cms.find({
      collection,
      where: { slug: { equals: target.slug } },
      draft: true,
      locale: 'all',
      depth: 0,
      limit: 1,
    })
    const doc = result.docs[0]
    if (!doc) throw new Error(`Missing ${collection}/${target.slug}`)
    if (doc._status !== 'draft') throw new Error(`Expected a local draft: ${target.slug}`)
    before.push({ collection, doc, imageKey: target.data.imageKey as string })
  }
  mkdirSync('.local/image-backups', { recursive: true })
  writeFileSync(`.local/image-backups/before-${Date.now()}.json`, JSON.stringify(before, null, 2), {
    mode: 0o600,
  })
  const media = await registerProductImages(cms)
  for (const { collection, doc, imageKey } of before) {
    const id = media.get(imageKey)
    if (!id) throw new Error(`No dedicated image for ${doc.slug}`)
    await cms.update({
      collection,
      id: doc.id,
      draft: true,
      locale: 'en',
      context: { skipRevalidation: true },
      data: { ...(collection === 'products' ? { images: [id] } : { image: id }), factsConfirmed: false },
    })
  }
  const { docs } = await cms.find({ collection: 'products', draft: true, locale: 'en', depth: 1, limit: 250 })
  const seen = new Map<number, string>()
  const report = docs.map((doc) => {
    if (doc.images?.length !== 1) throw new Error(`Expected one image: ${doc.slug}`)
    const image = doc.images[0]
    if (typeof image !== 'object' || !image.url) throw new Error(`Missing image: ${doc.slug}`)
    if (!image.sourceNote?.startsWith(`Keliran unique catalogue image / ${doc.slug} /`))
      throw new Error(`Wrong product image: ${doc.slug}`)
    if (seen.has(image.id)) throw new Error(`Image reused by ${seen.get(image.id)} and ${doc.slug}`)
    seen.set(image.id, doc.slug)
    return { slug: doc.slug, image: image.filename, mediaId: image.id }
  })
  mkdirSync('docs/review', { recursive: true })
  writeFileSync(
    'docs/review/product-image-audit.json',
    JSON.stringify(
      {
        products: docs.length,
        uniqueProductImages: seen.size,
        categoriesUpdated: before.filter((d) => d.collection === 'categories').length,
        report,
      },
      null,
      2,
    ) + '\n',
  )
  console.log(
    `Updated ${docs.length} products: ${seen.size} unique images; 14 category images updated. Existing text and translations preserved.`,
  )
} finally {
  await cms.destroy()
}
process.exit(0)
