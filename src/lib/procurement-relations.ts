// Versioned navigation relationships, not engineering approval or a stock/supply declaration.
// Evidence and review boundaries: reports/keliran-content-evidence-gaps.md.
import { materialSlug } from './routes'
export type MaterialRole = 'seal-body' | 'filament' | 'backing-channel' | 'mounting-holder'
export type MaterialBinding = {
  materialId: string
  label: string
  role: MaterialRole
  status: 'needs-review'
}
export function materialBindings(p: { slug: string; line?: string; materials: string[] }): MaterialBinding[] {
  const role: MaterialRole =
    p.slug === 'brush-holders' ? 'mounting-holder' : p.line === 'brushes' ? 'filament' : 'seal-body'
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
const sealProducts = r('products', 'solid-rubber-profiles', 'sponge-rubber-seals', 'edge-trim-bulb-seals')
const sealTools = r('guides', 'measure-door-seal', 'sealing-material-selection', 'standards-and-validation')
const brushProducts = r('products', 'metal-channel-strip-brushes', 'formed-strip-brushes', 'brush-holders')
const brushTools = r('guides', 'measure-strip-brush', 'brush-material-selection')
export const procurementRelations: Record<string, Relation[]> = {
  'materials/epdm': [...sealProducts, ...sealTools, ...r('solutions', 'enclosure-door-leaks')],
  'materials/foam': [...r('products', 'sponge-rubber-seals', 'silicone-profiles'), ...sealTools],
  'materials/pbt': [
    ...r('products', 'metal-channel-strip-brushes', 'formed-strip-brushes', 'custom-equipment-brushes'),
    ...brushTools,
  ],
  'materials/ss304': [...r('products', 'formed-strip-brushes', 'brush-holders'), ...brushTools],
  'materials/ss316': [...r('products', 'brush-holders'), ...brushTools],
  'materials/aluminium': [...brushTools, ...r('solutions', 'holder-fit')],
  'applications/electrical-enclosures': [
    ...sealProducts,
    ...sealTools,
    ...r('solutions', 'enclosure-door-leaks'),
  ],
  'solutions/enclosure-door-leaks': [
    ...sealProducts,
    ...r('guides', 'measure-door-seal'),
    ...r('applications', 'electrical-enclosures'),
    ...r('cases', 'scenario-enclosure-door-leaks'),
  ],
  'cases/scenario-enclosure-door-leaks': [
    ...r('solutions', 'enclosure-door-leaks'),
    ...r('guides', 'measure-door-seal'),
    ...r('applications', 'electrical-enclosures'),
  ],
  'guides/measure-door-seal': [
    ...sealProducts,
    ...r('materials', 'epdm', 'foam'),
    ...r('solutions', 'enclosure-door-leaks'),
  ],
  'guides/measure-strip-brush': [
    ...brushProducts,
    ...r('materials', 'pbt', 'ss304'),
    ...r('solutions', 'holder-fit'),
  ],
  'products/solid-rubber-profiles': [
    ...sealTools,
    ...r('materials', 'epdm'),
    ...r('applications', 'electrical-enclosures'),
    ...r('solutions', 'enclosure-door-leaks'),
  ],
  'products/sponge-rubber-seals': [
    ...sealTools,
    ...r('materials', 'epdm', 'foam'),
    ...r('applications', 'electrical-enclosures'),
    ...r('solutions', 'enclosure-door-leaks'),
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
  'categories/solid-rubber-profiles': [...sealProducts, ...sealTools],
  'categories/sponge-rubber-seals': [...sealProducts, ...sealTools],
}

// These are information requests, not recommended operating values.
export const procurementInputs: Record<string, string[]> = {
  'products/solid-rubber-profiles': [
    'dimensions',
    'profileType',
    'material',
    'hardnessOrDensity',
    'mounting',
    'tolerance',
    'drawingRevision',
  ],
  'products/sponge-rubber-seals': [
    'dimensions',
    'gapMin',
    'gapMax',
    'material',
    'hardnessOrDensity',
    'jointMethod',
    'environment',
  ],
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
  'materials/epdm': ['environment', 'tempMin', 'tempMax', 'material', 'profileType', 'hardnessOrDensity'],
  'materials/pbt': ['contactConditions', 'filamentDiameter', 'trimLength', 'density', 'environment'],
  'materials/ss304': [
    'filamentDiameter',
    'channelMaterial',
    'holderMaterial',
    'contactConditions',
    'environment',
  ],
  'materials/ss316': ['holderShape', 'holderMaterial', 'environment', 'drawingRevision'],
  'applications/electrical-enclosures': [
    'gapMin',
    'gapMax',
    'panelThickness',
    'mounting',
    'jointMethod',
    'environment',
    'targetRating',
  ],
  'solutions/enclosure-door-leaks': [
    'gapMin',
    'gapMax',
    'jointMethod',
    'mounting',
    'environment',
    'drawingRevision',
  ],
  'cases/scenario-enclosure-door-leaks': [
    'application',
    'gapMin',
    'gapMax',
    'jointMethod',
    'environment',
    'drawingRevision',
  ],
}
