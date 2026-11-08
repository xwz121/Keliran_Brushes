import { drafts, type Draft } from './catalogue'
import './resources'
import { otherLine } from '../../src/lib/site'
import productImages from './product-images.json'

// The seed source came from keliran.com, where it describes both product lines. This site seeds
// only strip-brush and shared documents, and drops links to documents it does not seed. The seed
// only fills empty local databases; production content arrives through scripts/migration.
const kept = drafts.filter((d) => d.data.line !== otherLine)
const keys = new Set(kept.map((d) => `${d.collection}/${d.slug}`))
const images = new Set(['components-hero', 'strip-brushes', ...productImages.map((x) => x.slug)])
const links = [
  ['productSlugs', 'products'],
  ['guideSlugs', 'guides'],
  ['solutionSlugs', 'solutions'],
] as const
export const siteDrafts: Draft[] = kept.map((d) => {
  const data = { ...d.data }
  for (const [field, collection] of links)
    if (data[field]) data[field] = data[field].filter((slug: string) => keys.has(`${collection}/${slug}`))
  if (data.categorySlug && !keys.has(`categories/${data.categorySlug}`)) delete data.categorySlug
  if (data.imageKey && !images.has(data.imageKey)) delete data.imageKey
  return { ...d, data }
})
