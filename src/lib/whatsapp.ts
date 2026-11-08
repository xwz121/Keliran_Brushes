export function normalizeWhatsAppNumber(value: string) {
  const n = value.replace(/[\s()+-]/g, '')
  return /^[1-9]\d{6,14}$/.test(n) ? n : null
}
export function buildWhatsAppURL(number: string, message: string) {
  const n = normalizeWhatsAppNumber(number)
  // Truncate by code point so a surrogate pair is never split before encoding.
  const text = Array.from(message).slice(0, 500).join('')
  return n ? `https://wa.me/${n}?text=${encodeURIComponent(text)}` : null
}
// Readable grouping for the two published number formats; other numbers stay ungrouped.
const groups: [prefix: string, length: number, parts: number[]][] = [
  ['86', 13, [2, 3, 4, 4]],
  ['44', 12, [2, 4, 6]],
]
export function formatWhatsAppNumber(value: string) {
  const n = normalizeWhatsAppNumber(value)
  if (!n) return value
  const parts = groups.find(([prefix, length]) => n.startsWith(prefix) && n.length === length)?.[2]
  if (!parts) return `+${n}`
  let i = 0
  return `+${parts.map((size) => n.slice(i, (i += size))).join(' ')}`
}
