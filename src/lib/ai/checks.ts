import { createHash } from 'node:crypto'
export const pipelineVersion = 'keliran-translation-v4'
export type Texts = Record<string, string>
export type Term = {
  term: string
  translations?: Record<string, string | null>
  protected?: boolean | null
  note?: string | null
}
function ordered(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(ordered)
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => [k, ordered(v)]),
    )
  return value
}
export const hash = (value: unknown) =>
  createHash('sha256')
    .update(JSON.stringify(ordered(value)))
    .digest('hex')
export function cleanDocument(doc: Record<string, any>) {
  const { createdAt, updatedAt, _status, ...rest } = doc
  return rest
}
export function englishTexts(doc: Record<string, any>): Texts {
  const out: Texts = {}
  for (const field of ['title', 'summary', 'description', 'seoTitle', 'seoDescription'])
    out[field] = doc[field]?.en || ''
  for (const [i, s] of (doc.sections || []).entries())
    for (const f of ['heading', 'text']) out[`sections.${i}.${f}`] = s[f]?.en || ''
  for (const [i, s] of (doc.specifications || []).entries())
    out[`specifications.${i}.label`] = s.label?.en || ''
  return out
}
export function localizedData(doc: Record<string, any>, texts: Texts) {
  const out: Record<string, any> = {}
  for (const f of ['title', 'summary', 'description', 'seoTitle', 'seoDescription']) out[f] = texts[f] || ''
  if (doc.sections)
    out.sections = doc.sections.map((s: any, i: number) => ({
      id: s.id,
      key: s.key,
      heading: texts[`sections.${i}.heading`] || '',
      text: texts[`sections.${i}.text`] || '',
    }))
  if (doc.specifications)
    out.specifications = doc.specifications.map((s: any, i: number) => ({
      id: s.id,
      key: s.key,
      value: s.value,
      unit: s.unit,
      label: texts[`specifications.${i}.label`] || '',
    }))
  return out
}
const numbers = (s: string) =>
  s
    .match(/[-+−]?\d+(?:[.,]\d+)*(?:\s*[%°])?/g)
    ?.map((n) => n.replaceAll('−', '-').replaceAll(',', '.').replaceAll(' ', ''))
    .sort() || []
const units = (s: string) =>
  s
    .match(
      /\b(?:mm|cm|MPa|kPa|psi|bar|NBR|EPDM|FKM|PTFE|VMQ|CR|PA6|PA66|PA612|PBT|PP|PEEK|IEC\s*\d+|UL\s*\d+|NEMA\s*\d+|ASTM\s*D\d+|ISO\s*\d+|DIN\s*\d+)\b|°[CF]/g,
    )
    ?.sort() || []
// Latin codes must not match inside unrelated words (PP in "supply", CR in "drawing").
export function containsTerm(text: string, term: string) {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`(?<![A-Za-z0-9])${escaped}(?![A-Za-z0-9])`, 'iu').test(text)
}
export function deterministicChecks(
  source: Texts,
  target: Texts,
  locale: string,
  glossary: Term[],
): string[] {
  const issues: string[] = []
  if (hash(Object.keys(source).sort()) !== hash(Object.keys(target).sort())) issues.push('Field set changed.')
  for (const [k, s] of Object.entries(source)) {
    const t = target[k] ?? ''
    if (s.trim() && !t.trim()) issues.push(`${k}: empty translation`)
    if (!s.trim() && t.trim()) issues.push(`${k}: invented text in empty field`)
    if ((s.match(/\|/g) || []).length !== (t.match(/\|/g) || []).length)
      issues.push(`${k}: table structure differs`)
    if ((s.match(/^- /gm) || []).length !== (t.match(/^- /gm) || []).length)
      issues.push(`${k}: list structure differs`)
    if (hash(numbers(s)) !== hash(numbers(t))) issues.push(`${k}: numbers differ`)
    if (hash(units(s)) !== hash(units(t))) issues.push(`${k}: units or material codes differ`)
    for (const term of glossary) {
      if (containsTerm(s, term.term)) {
        const expected = term.protected ? term.term : term.translations?.[locale]
        if (expected && !containsTerm(t, expected)) issues.push(`${k}: required terminology ${expected}`)
      }
    }
  }
  return issues
}
