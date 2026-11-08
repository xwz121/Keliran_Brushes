import { mkdir, writeFile } from 'node:fs/promises'
import { interfaceCopy } from '../src/lib/interface-copy'
import { locales } from '../src/lib/locales'
import { productionSiteURL } from '../src/lib/site'
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
      `${productionSiteURL}/${locale}/guides/supplier-qualification`,
      '',
    ].join('\n'),
  )
  {
    const text = [
      'KELIRAN',
      u.brushesTitle,
      u.rfqTitle,
      '',
      u.checklistNote,
      '',
      ...[...common, ...brushes].map((key) => `${u[key]}: ____________________`),
      '',
      u.safetyNote,
      '',
      'contact@keliran.com',
      '+8617509072335',
      '+447536120830',
      '',
    ].join('\n')
    await writeFile(`public/downloads/${locale}/strip-brush-rfq-checklist.txt`, text)
  }
}
console.log('Generated 8 localised strip-brush RFQ checklists and 8 blank supplier-review records.')
