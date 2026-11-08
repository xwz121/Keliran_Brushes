import { createHash } from 'node:crypto'
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
// Localized text fields shared by every content collection (see contentFields in collections).
export const localizedTextFields = ['title', 'summary', 'description', 'seoTitle', 'seoDescription'] as const
export const localizedRowFields = { sections: ['heading', 'text'], specifications: ['label'] } as const
// Texts of one locale from a document read with locale: 'all'.
export function textsFor(doc: Record<string, any>, locale: string): Texts {
  const out: Texts = {}
  for (const field of localizedTextFields) out[field] = doc[field]?.[locale] || ''
  for (const [i, s] of (doc.sections || []).entries())
    for (const f of ['heading', 'text']) out[`sections.${i}.${f}`] = s[f]?.[locale] || ''
  for (const [i, s] of (doc.specifications || []).entries())
    out[`specifications.${i}.label`] = s.label?.[locale] || ''
  return out
}
export const englishTexts = (doc: Record<string, any>): Texts => textsFor(doc, 'en')
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

// A save carries one locale's values (or, for a publish-only save, none). Lay them over the stored
// draft read with locale: 'all' so the release check sees every locale as it will be published.
// Array rows are matched by id; a new row has no stored translations, so it fails the check.
export function overlayLocale(
  stored: Record<string, any>,
  data: Record<string, any>,
  locale: string,
): Record<string, any> {
  const merge = (previous: unknown, value: unknown) =>
    locale === 'all'
      ? { ...(previous as object), ...(value as object) }
      : { ...((previous as object) || {}), [locale]: value }
  const out: Record<string, any> = { ...stored }
  for (const [key, value] of Object.entries(data)) {
    if ((localizedTextFields as readonly string[]).includes(key)) out[key] = merge(stored[key], value)
    else if (key in localizedRowFields && Array.isArray(value)) {
      const fields = localizedRowFields[key as keyof typeof localizedRowFields] as readonly string[]
      const previous: Record<string, any>[] = Array.isArray(stored[key]) ? stored[key] : []
      out[key] = value.map((row: Record<string, any>) => {
        const before = (row?.id && previous.find((p) => p.id === row.id)) || {}
        const next: Record<string, any> = { ...before, ...row }
        for (const f of fields) next[f] = merge(before[f], row?.[f])
        return next
      })
    } else out[key] = value
  }
  return out
}
// Media referenced by a content document (ids at depth 0, objects when populated).
export function mediaIdsOf(doc: Record<string, any>): number[] {
  const refs = [...(Array.isArray(doc.images) ? doc.images : []), doc.heroImage, doc.image]
  const ids = refs
    .map((r) => (r && typeof r === 'object' ? r.id : r))
    .filter((id): id is number => typeof id === 'number')
  return [...new Set(ids)].sort((a, b) => a - b)
}
export type ReleaseMedia = { id: number; approved?: boolean | null; alt?: Record<string, unknown> | null }
// Publishing rules that replaced the former AI release centre. Every locale is published together,
// so each one must be complete and agree with English on numbers, units, structure and terminology.
export function releaseIssues(input: {
  collection: string
  document: Record<string, any>
  media: ReleaseMedia[]
  glossary: Term[]
  locales: readonly string[]
}): string[] {
  const { collection, document, media, glossary, locales } = input
  const issues: string[] = []
  if (!document.factsConfirmed) issues.push('请先勾选「产品事实与素材已确认」。')
  const ids = mediaIdsOf(document)
  if ((collection === 'products' || document.slug === 'home') && !ids.length)
    issues.push('正式产品与首页需要获准使用的图片。')
  for (const id of ids) {
    const m = media.find((item) => item.id === id)
    if (!m?.approved) issues.push(`图片 ${id} 尚未获准正式发布。`)
    for (const l of locales) if (!m?.alt?.[l]) issues.push(`图片 ${id} 缺少 ${l} 替代文本。`)
  }
  const english = textsFor(document, 'en')
  if (!english.title?.trim()) issues.push('en: title 不能为空。')
  for (const locale of locales)
    if (locale !== 'en')
      for (const issue of deterministicChecks(english, textsFor(document, locale), locale, glossary))
        issues.push(`${locale}: ${issue}`)
  return issues
}
