'use client'
import { interfaceCopy, type InterfaceCopy } from '@/lib/interface-copy'
import type { Locale } from '@/lib/locales'
export type RfqLine = 'sealing' | 'brushes' | 'both'
const sealing = [
  'material',
  'profileType',
  'gapMin',
  'gapMax',
  'panelThickness',
  'hardnessOrDensity',
  'mounting',
  'jointMethod',
  'targetRating',
] as const
const brushes = [
  'filamentMaterial',
  'channelShape',
  'channelMaterial',
  'backingWidth',
  'backingHeight',
  'overallHeight',
  'trimLength',
  'length',
  'filamentDiameter',
  'density',
  'forming',
  'holderNeeded',
  'holderShape',
  'holderMaterial',
  'contactConditions',
] as const
export function RfqField({ name, locale }: { name: keyof InterfaceCopy; locale: Locale }) {
  const u = interfaceCopy(locale)
  return (
    <label>
      {u[name]}
      <input
        name={`rfq.${name}`}
        maxLength={500}
        placeholder={u[`${name}Hint` as keyof InterfaceCopy] || undefined}
      />
    </label>
  )
}
// Optional group A. Fields are keyed by name, so switching line keeps shared values and clears line-specific ones.
export function SpecificationFields({ line, locale }: { line: RfqLine; locale: Locale }) {
  const own = line === 'sealing' ? sealing : line === 'brushes' ? brushes : []
  return (
    <div className="technical-fields-grid">
      {['dimensions', ...own, 'drawingRevision', 'tolerance', 'environment', 'tempMin', 'tempMax'].map(
        (name) => (
          <RfqField key={name} name={name as keyof InterfaceCopy} locale={locale} />
        ),
      )}
    </div>
  )
}
// Optional group B: the commercial part of the RFQ; company and country are rendered by the form itself.
export function CommercialFields({ locale }: { locale: Locale }) {
  const u = interfaceCopy(locale)
  return (
    <>
      <label>
        {u.requestType}
        <select name="rfq.requestType" defaultValue="quotation">
          <option value="quotation">{u.requestQuote}</option>
          <option value="manufacturability">{u.requestReview}</option>
          <option value="sample">{u.requestSample}</option>
        </select>
      </label>
      <div className="technical-fields-grid">
        {(
          ['annualEstimate', 'destination', 'targetDelivery', 'targetPrice', 'incoterm', 'sampleQty'] as const
        ).map((name) => (
          <RfqField key={name} name={name} locale={locale} />
        ))}
      </div>
    </>
  )
}
