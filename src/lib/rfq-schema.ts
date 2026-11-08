import { z } from 'zod'
import { contextKinds } from './content-context'
const contentContextSchema = z.object({
  kind: z.enum(contextKinds),
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(120),
})
const text = z.string().trim().max(500).default('')
const common = {
  context: contentContextSchema.optional(),
  productType: text,
  dimensions: text,
  tolerance: text,
  targetDelivery: text,
  targetPrice: text,
  incoterm: text,
  requestType: z.enum(['quotation', 'manufacturability', 'sample']).default('quotation'),
  application: text,
  quantity: text,
  annualEstimate: text,
  destination: text,
  tempMin: text,
  tempMax: text,
  environment: text,
  drawingRevision: text,
  sampleQty: text,
}
export const sealingRfq = z.object({
  ...common,
  line: z.literal('sealing'),
  profileType: text,
  gapMin: text,
  gapMax: text,
  panelThickness: text,
  material: text,
  hardnessOrDensity: text,
  targetRating: text,
  mounting: text,
  jointMethod: text,
})
export const brushRfq = z.object({
  ...common,
  line: z.literal('brushes'),
  channelShape: text,
  channelMaterial: text,
  holderShape: text,
  holderMaterial: text,
  backingHeight: text,
  backingWidth: text,
  overallHeight: text,
  trimLength: text,
  length: text,
  filamentMaterial: text,
  filamentDiameter: text,
  density: text,
  forming: text,
  holderNeeded: text,
  contactConditions: text,
})
// A buyer who is not sure yet (or needs both lines) still sends the common specification fields.
export const generalRfq = z.object({ ...common, line: z.literal('both') })
export const rfqSchema = z.discriminatedUnion('line', [sealingRfq, brushRfq, generalRfq])
