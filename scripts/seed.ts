import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { drafts } from './seed/catalogue'
import './seed/resources'
import type { ContentSlug } from '../src/collections'
import { registerProductImages } from './seed/product-media'
const cms = await getPayload({ config })
const ids = new Map<string, number>()
const media = new Map<string, number>()
const created = new Set<string>()
try {
  for (const [slug, id] of await registerProductImages(cms)) media.set(slug, id)
  for (const name of [
    'components-hero',
    'sealing-profiles',
    'strip-brushes',
    'gaskets-orings',
    'moulded-parts',
  ]) {
    const sourceNote = `Keliran redesign 2026-09-23 / ${name}. Built-in imagegen conceptual product-family rendering; prompt record in docs/assets-v2.md.`
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
        filePath: `public/images/keliran-v2/${name}.webp`,
        data: {
          alt:
            name === 'components-hero'
              ? 'Rubber sealing profiles and industrial strip brushes'
              : name === 'strip-brushes'
                ? 'Straight and formed strip brushes with mounting holder'
                : name === 'gaskets-orings'
                  ? 'Flat gaskets, washers and O-rings'
                  : name === 'moulded-parts'
                    ? 'Moulded rubber caps, plug, sleeve and grommet'
                    : 'Rubber sealing profile family',
          sourceNote,
          illustrative: true,
          approved: false,
        },
      }))
    media.set(name, doc.id)
  }
  for (const { collection, slug, data } of drafts) {
    const c = collection as ContentSlug
    const found = await cms.find({
      collection: c,
      where: { slug: { equals: slug } },
      draft: true,
      locale: 'en',
      limit: 1,
    })
    if (found.docs[0] && !process.argv.includes('--refresh-drafts')) {
      ids.set(`${c}/${slug}`, found.docs[0].id)
      continue
    }
    const { imageKey, categorySlug, productSlugs, guideSlugs, solutionSlugs, ...fields } = data
    if (imageKey)
      fields[c === 'pages' ? 'heroImage' : c === 'products' ? 'images' : 'image'] =
        c === 'products' ? [media.get(imageKey)] : media.get(imageKey)
    if (categorySlug) fields.category = ids.get(`categories/${categorySlug}`)
    const args = {
      collection: c,
      locale: 'en' as const,
      draft: true,
      context: { skipRevalidation: true },
      data: { ...fields, slug, _status: 'draft', factsConfirmed: false } as any,
    }
    const doc = found.docs[0] ? await cms.update({ ...args, id: found.docs[0].id }) : await cms.create(args)
    ids.set(`${c}/${slug}`, doc.id)
    created.add(`${c}/${slug}`)
  }
  for (const { collection, slug, data } of drafts) {
    if (!created.has(`${collection}/${slug}`)) continue
    const links: Record<string, number[]> = {}
    for (const [from, to, coll] of [
      ['productSlugs', 'relatedProducts', 'products'],
      ['guideSlugs', 'relatedGuides', 'guides'],
      ['solutionSlugs', 'relatedSolutions', 'solutions'],
    ]) {
      if (data[from]) links[to] = data[from].map((s: string) => ids.get(`${coll}/${s}`)).filter(Boolean)
    }
    if (Object.keys(links).length)
      await cms.update({
        collection: collection as ContentSlug,
        id: ids.get(`${collection}/${slug}`)!,
        draft: true,
        locale: 'en',
        context: { skipRevalidation: true },
        data: links,
      })
  }
  for (const term of [
    'Keliran',
    'EPDM',
    'NBR',
    'FKM',
    'VMQ',
    'CR',
    'PA6',
    'PA66',
    'PA612',
    'PBT',
    'PP',
    'PEEK',
    'SS304',
    'SS316',
    'IP',
    'NEMA',
    'REACH',
    'RoHS',
  ]) {
    if (!(await cms.find({ collection: 'glossary', where: { term: { equals: term } }, limit: 1 })).totalDocs)
      await cms.create({ collection: 'glossary', data: { term, protected: true } })
  }
  console.log(
    `Prepared ${drafts.length} English drafts and ${media.size} illustrations. No facts confirmed; no publication or translation requested.`,
  )
} finally {
  await cms.destroy()
}
process.exit(0)
