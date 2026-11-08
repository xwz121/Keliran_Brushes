import { mkdir, writeFile } from 'node:fs/promises'
import { interfaceCopy } from '../src/lib/interface-copy'
import { locales } from '../src/lib/locales'
const common = [
  'application',
  'drawingRevision',
  'environment',
  'tempMin',
  'tempMax',
  'quantity',
  'annualEstimate',
  'sampleQty',
  'destination',
  'safetyQuestion',
] as const
const sealing = [
  'profileType',
  'gapMin',
  'gapMax',
  'panelThickness',
  'material',
  'hardnessOrDensity',
  'mounting',
  'jointMethod',
  'targetRating',
] as const
const brushes = [
  'channelShape',
  'channelMaterial',
  'backingWidth',
  'backingHeight',
  'overallHeight',
  'trimLength',
  'length',
  'filamentMaterial',
  'filamentDiameter',
  'density',
  'forming',
  'holderNeeded',
  'holderShape',
  'holderMaterial',
  'contactConditions',
] as const
for (const locale of locales) {
  const u = interfaceCopy(locale)
  await mkdir(`public/downloads/${locale}`, { recursive: true })
  await writeFile(
    `public/downloads/${locale}/supplier-review-record.txt`,
    [
      'KELIRAN',
      u.supplierReviewTitle,
      u.blankRecordTitle,
      '2026-09-26',
      '',
      u.blankRecordBody,
      '',
      ...(
        [
          'companyRecordTitle',
          'application',
          'drawingRevision',
          'material',
          'sampleApproval',
          'criticalInspection',
          'packingRecord',
          'changeRecord',
        ] as const
      ).map((key) => `${u[key]}: ____________________`),
      '',
      `https://keliran.com/${locale}/guides/supplier-qualification`,
      '',
    ].join('\n'),
  )
  for (const line of ['sealing', 'strip-brush'] as const) {
    const text = [
      'KELIRAN',
      line === 'sealing' ? u.sealingTitle : u.brushesTitle,
      u.rfqTitle,
      '',
      u.checklistNote,
      '',
      ...[...common, ...(line === 'sealing' ? sealing : brushes)].map(
        (key) => `${u[key]}: ____________________`,
      ),
      '',
      ...(line === 'sealing' ? [u.ratingNote] : []),
      u.safetyNote,
      '',
      'contact@keliran.com',
      '+8617509072335',
      '+447536120830',
      '',
    ].join('\n')
    await writeFile(`public/downloads/${locale}/${line}-rfq-checklist.txt`, text)
  }
}
console.log('Generated 16 localised RFQ checklists and 8 blank supplier-review records.')
