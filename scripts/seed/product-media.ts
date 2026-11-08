import type { Payload } from 'payload'
import assets from './product-images.json'

export { assets as productImageAssets }

/** One owned image per product/service; never fall back to a family image. */
export async function registerProductImages(cms: Payload) {
  const media = new Map<string, number>()
  for (const asset of assets) {
    const sourceNote = `Keliran unique catalogue image / ${asset.slug} / v1. Built-in imagegen; prompt: scripts/seed/product-images.json.`
    const found = await cms.find({
      collection: 'media',
      where: { sourceNote: { equals: sourceNote } },
      limit: 1,
    })
    const doc =
      found.docs[0] ||
      (await cms.create({
        collection: 'media',
        locale: 'en',
        filePath: `public/images/products/${asset.slug}.webp`,
        data: { alt: asset.title, sourceNote, illustrative: true, approved: false },
      }))
    media.set(asset.slug, doc.id)
  }
  return media
}
