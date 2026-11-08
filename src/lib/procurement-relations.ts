// Versioned navigation relationships, not engineering approval or a stock/supply declaration.
// Evidence and review boundaries: reports/keliran-content-evidence-gaps.md (written before the split).
import { materialSlug } from './routes'
export type MaterialRole = 'filament' | 'backing-channel' | 'mounting-holder'
export type MaterialBinding = {
  materialId: string
  label: string
  role: MaterialRole
  status: 'needs-review'
}
export function materialBindings(p: { slug: string; line?: string; materials: string[] }): MaterialBinding[] {
  // Every product on this site is a strip brush or a holder for one.
  const role: MaterialRole = p.slug === 'brush-holders' ? 'mounting-holder' : 'filament'
  return p.materials.flatMap((label) => {
    const materialId = materialSlug(label)
    return materialId ? [{ materialId, label, role, status: 'needs-review' as const }] : []
  })
}
export type RelationKind = 'products' | 'materials' | 'applications' | 'solutions' | 'guides' | 'cases'
export type Relation = { kind: RelationKind; slug: string }
export function existingRelationIds(doc: {
  relatedProducts?: any[]
  relatedGuides?: any[]
  relatedSolutions?: any[]
}) {
  return (['Products', 'Guides', 'Solutions'] as const).flatMap((kind) =>
    (doc[`related${kind}`] || [])
      .filter((item) => item && typeof item === 'object' && item.slug && item.title)
      .map((item) => `${kind.toLowerCase()}/${item.slug}`),
  )
}
const r = (kind: RelationKind, ...slugs: string[]): Relation[] => slugs.map((slug) => ({ kind, slug }))
const brushProducts = r('products', 'metal-channel-strip-brushes', 'formed-strip-brushes', 'brush-holders')
const brushTools = r('guides', 'measure-strip-brush', 'brush-material-selection')
export const procurementRelations: Record<string, Relation[]> = {
  'materials/pbt': [
    ...r('products', 'metal-channel-strip-brushes', 'formed-strip-brushes', 'custom-equipment-brushes'),
    ...brushTools,
  ],
  'materials/ss304': [...r('products', 'formed-strip-brushes', 'brush-holders'), ...brushTools],
  'materials/ss316': [...r('products', 'brush-holders'), ...brushTools],
  'materials/aluminium': [...brushTools, ...r('solutions', 'holder-fit')],
  'guides/measure-strip-brush': [
    ...brushProducts,
    ...r('materials', 'pbt', 'ss304'),
    ...r('solutions', 'holder-fit'),
  ],
  'products/metal-channel-strip-brushes': [
    ...brushTools,
    ...r('materials', 'pbt'),
    ...r('products', 'brush-holders'),
    ...r('solutions', 'dust-at-equipment-openings'),
  ],
  'products/brush-holders': [
    ...brushTools,
    ...r('materials', 'ss304', 'ss316'),
    ...r('products', 'metal-channel-strip-brushes'),
    ...r('solutions', 'holder-fit'),
  ],
}

// These are information requests, not recommended operating values.
export const procurementInputs: Record<string, string[]> = {
  'products/metal-channel-strip-brushes': [
    'filamentMaterial',
    'filamentDiameter',
    'trimLength',
    'backingWidth',
    'backingHeight',
    'channelMaterial',
    'contactConditions',
  ],
  'products/brush-holders': [
    'holderShape',
    'holderMaterial',
    'dimensions',
    'holderNeeded',
    'tolerance',
    'drawingRevision',
  ],
  'materials/pbt': ['contactConditions', 'filamentDiameter', 'trimLength', 'density', 'environment'],
  'materials/ss304': [
    'filamentDiameter',
    'channelMaterial',
    'holderMaterial',
    'contactConditions',
    'environment',
  ],
  'materials/ss316': ['holderShape', 'holderMaterial', 'environment', 'drawingRevision'],
}
