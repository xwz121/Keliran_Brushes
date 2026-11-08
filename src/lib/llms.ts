// /llms.txt and /llms-full.txt, following the llmstxt.org proposal: an H1 name, a blockquote
// summary, plain detail paragraphs, then H2 link lists ("- [Title](url): note") with secondary
// links under "Optional". Built from published CMS content so the files never drift from the site.
// Statements stay within what the site itself claims: no stock, certification or price claims.
import { plainSummary } from './summary'
import { routeFor } from './routes'
import { siteName, otherSiteURL, categoryRoute } from './site'

export type LlmsDoc = {
  slug: string
  title?: string | null
  summary?: string | null
  description?: string | null
  code?: string | null
  line?: string | null
  materials?: string[] | null
  scenarioType?: string | null
  updatedAt?: string | null
  sections?: { key?: string | null; heading?: string | null; text?: string | null }[] | null
  specifications?:
    { label?: string | null; key?: string | null; value?: string | null; unit?: string | null }[] | null
}
export type LlmsInput = {
  origin: string
  generatedAt: string
  settings: Record<string, any>
  docs: Partial<Record<string, LlmsDoc[]>>
  sharedCanonical: ReadonlySet<string>
}

const summary =
  'Keliran sources industrial strip brushes and matched holders to customer drawings and application requirements, coordinating specialist production partners and agreed quality checks. This site covers strip brushes only; Keliran sealing components are on keliran.com.'

const oneLine = (text?: string | null, max = 220) => {
  const plain = plainSummary(text || '')
    // Link notes are plain text: drop Markdown emphasis, code marks and inline link targets.
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\*\*|__|`/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return plain.length > max ? `${plain.slice(0, max - 1).replace(/\s+\S*$/, '')}…` : plain
}
const path = (collection: string, doc: LlmsDoc) => routeFor(collection, doc, 'en').slice('/en'.length)
const isShared = (input: LlmsInput, collection: string, doc: LlmsDoc) =>
  input.sharedCanonical.has(path(collection, doc))
const own = (input: LlmsInput, collection: string) =>
  (input.docs[collection] || []).filter((d) => d.title && !isShared(input, collection, d))
const link = (title: string, url: string, note?: string) =>
  `- [${title.replace(/[[\]]/g, '')}](${url})${note ? `: ${note}` : ''}`

function details(input: LlmsInput) {
  const s = input.settings || {}
  const company = s.legalEntity
    ? `${s.legalEntity}${s.registrationJurisdiction ? `, registered in ${s.registrationJurisdiction}` : ''}${
        s.registrationNo ? ` (company number ${s.registrationNo})` : ''
      }, operates this site.`
    : 'Keliran operates this site.'
  return [
    `${company} Keliran is a sourcing and quality-management trading business, not a manufacturer.`,
    'Products are product families quoted to specification. Reference numbers such as BR01-CUSTOM identify a family in enquiries, chats and samples; they are not stock-keeping units. Material grade, dimensions, tooling, minimum quantity, lead time and price are confirmed per enquiry after technical review and sample approval. Nothing here states stock, certification or guaranteed performance. Product images are illustrations unless stated otherwise.',
    'Every page exists in English, French, German, Spanish, Italian, Japanese, Korean and Traditional Chinese: replace /en/ in a link with /fr/, /de/, /es/, /it/, /ja/, /ko/ or /zh-Hant/. Links below are the English versions.',
    `Quotations: send a drawing, sample photo or dimensions through the RFQ form${
      s.publicEmail ? ` or by email to ${s.publicEmail}` : ''
    }. Full English text of the pages listed here: ${input.origin}/llms-full.txt.`,
  ]
}

export function buildLlmsTxt(input: LlmsInput) {
  const o = input.origin
  const page = (slug: string) => (input.docs.pages || []).find((p) => p.slug === slug)
  const sections: [string, string[]][] = [
    [
      'Products',
      own(input, 'products').map((d) =>
        link(
          `${d.title}${d.code ? ` (${d.code})` : ''}`,
          `${o}${routeFor('products', d)}`,
          oneLine(d.summary),
        ),
      ),
    ],
    [
      'Strip brush selection guides',
      [
        link(
          'Strip brush overview',
          `${o}/en/${categoryRoute}`,
          'Entry products, families and what to send for a quotation.',
        ),
        ...own(input, 'categories').map((d) =>
          link(`${d.title} — selection guide`, `${o}${routeFor('categories', d)}`, oneLine(d.summary)),
        ),
      ],
    ],
    [
      'Buying and technical guides',
      own(input, 'guides').map((d) => link(d.title!, `${o}${routeFor('guides', d)}`, oneLine(d.summary))),
    ],
    [
      'Materials',
      own(input, 'materials').map((d) =>
        link(d.title!, `${o}${routeFor('materials', d)}`, oneLine(d.summary)),
      ),
    ],
    [
      'Applications and problem solving',
      [
        ...own(input, 'applications').map((d) =>
          link(d.title!, `${o}${routeFor('applications', d)}`, oneLine(d.summary)),
        ),
        ...own(input, 'solutions').map((d) =>
          link(d.title!, `${o}${routeFor('solutions', d)}`, oneLine(d.summary)),
        ),
      ],
    ],
    [
      'Company and enquiries',
      [
        link('Request a quotation', `${o}/en/rfq`, 'Drawing-led RFQ form; technical fields are optional.'),
        ...(['about', 'legal', 'contact'] as const).flatMap((slug) => {
          const p = page(slug)
          return p?.title ? [link(p.title, `${o}/en/${slug}`, oneLine(p.summary))] : []
        }),
        link(
          'Strip brush RFQ checklist',
          `${o}/downloads/en/strip-brush-rfq-checklist.txt`,
          'Plain-text list of details to prepare.',
        ),
      ],
    ],
    [
      'Optional',
      [
        link(
          'Frequently asked questions',
          `${o}/en/faq`,
          'Short answers on enquiries, materials and supply.',
        ),
        ...own(input, 'cases').map((d) =>
          link(
            d.title!,
            `${o}${routeFor('cases', d)}`,
            `${d.scenarioType === 'typical' ? 'Typical scenario, not a customer project. ' : ''}${oneLine(d.summary, 160)}`,
          ),
        ),
        ...Object.entries(input.docs).flatMap(([collection, docs]) =>
          (docs || [])
            .filter((d) => d.title && isShared(input, collection, d))
            .map((d) =>
              link(
                d.title!,
                `${otherSiteURL}/en${path(collection, d)}`,
                `Shared procurement guidance, canonical on keliran.com. ${oneLine(d.summary, 140)}`,
              ),
            ),
        ),
        link(
          'Keliran sealing components',
          `${otherSiteURL}/en`,
          'Sister site of the same company for enclosure and equipment sealing.',
        ),
        link('Sitemap', `${o}/sitemap.xml`, 'All indexable pages in eight languages.'),
      ],
    ],
  ]
  return [
    `# ${siteName}`,
    '',
    `> ${summary}`,
    '',
    ...details(input).flatMap((p) => [p, '']),
    ...sections
      .filter(([, items]) => items.length)
      .flatMap(([heading, items]) => [`## ${heading}`, '', ...items, '']),
  ].join('\n')
}

const fullCollections: [string, string][] = [
  ['products', 'Product'],
  ['categories', 'Selection guide'],
  ['guides', 'Guide'],
  ['materials', 'Material'],
  ['applications', 'Application'],
  ['solutions', 'Problem solving'],
  ['cases', 'Typical scenario'],
  ['faqs', 'FAQ'],
]
export function buildLlmsFullTxt(input: LlmsInput) {
  const o = input.origin
  const out = [
    `# ${siteName} — full English content`,
    '',
    `> ${summary}`,
    '',
    `Generated from the published website content on ${input.generatedAt.slice(0, 10)}. Each page starts with its title, canonical URL and last update; the index is ${o}/llms.txt.`,
    '',
    ...details(input)
      .slice(0, 2)
      .flatMap((p) => [p, '']),
  ]
  for (const [collection, kind] of fullCollections)
    for (const d of own(input, collection)) {
      out.push('---', '', `## ${kind}: ${d.title}${d.code ? ` (${d.code})` : ''}`, '')
      out.push(`URL: ${o}${routeFor(collection, d)}`)
      if (d.updatedAt) out.push(`Last updated: ${d.updatedAt.slice(0, 10)}`)
      if (d.code) out.push(`Reference: ${d.code} (product family reference, not a stock-keeping unit)`)
      if (d.materials?.length) out.push(`Material options for review: ${d.materials.join(', ')}`)
      out.push('')
      if (d.summary) out.push(d.summary.trim(), '')
      const specs = (d.specifications || []).filter((s) => s.value)
      if (specs.length)
        out.push(
          '| Parameter | Value |',
          '| --- | --- |',
          ...specs.map((s) => `| ${s.label || s.key} | ${s.value}${s.unit ? ` ${s.unit}` : ''} |`),
          '',
        )
      for (const s of d.sections || [])
        if (s.text?.trim()) out.push(...(s.heading ? [`### ${s.heading}`, ''] : []), s.text.trim(), '')
      if (!d.sections?.length && d.description && d.description !== d.summary)
        out.push(d.description.trim(), '')
    }
  return out.join('\n')
}
