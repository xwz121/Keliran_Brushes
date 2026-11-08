const bullet = /^[-*•]\s+/
// Guide summaries are seeded from the first section, which can be a Markdown list. In a <p> or a meta
// description its line breaks collapse into "- a - b", so list items become "a · b" and other lines join with a space.
export function plainSummary(text: string | null | undefined): string {
  if (!text || !/(^|\n)\s*[-*•]\s/.test(text)) return text || ''
  let out = '',
    previousItem = false
  for (const raw of text.split('\n')) {
    const line = raw.trim()
    if (!line) continue
    const item = bullet.test(line)
    out += (out ? (item && previousItem ? ' · ' : ' ') : '') + line.replace(bullet, '')
    previousItem = item
  }
  return out
}

type Section = { key: string; heading?: string | null; text?: string | null }
const comparable = (text: string) => plainSummary(text).replace(/\s+/g, ' ').trim()
// Remove only whole duplicate blocks. Never trim matching prefixes or discard a distinct paragraph.
// The same result feeds article rendering and its table of contents.
export function distinctSections(sections: Section[] | null | undefined, summary?: string | null) {
  const seen = new Set(summary?.trim() ? [comparable(summary)] : [])
  return (sections || []).flatMap((section) => {
    const blocks = (section.text || '').split(/\n\s*\n/).filter((block) => {
      const key = comparable(block)
      if (!key || seen.has(key)) return false
      seen.add(key)
      return true
    })
    return blocks.length ? [{ ...section, text: blocks.join('\n\n') }] : []
  })
}
