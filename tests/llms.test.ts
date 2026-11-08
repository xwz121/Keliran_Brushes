import { describe, expect, it } from 'vitest'
import { buildLlmsFullTxt, buildLlmsTxt, type LlmsInput } from '../src/lib/llms'
import { sharedCanonicalPaths } from '../src/lib/shared-canonical'

const input: LlmsInput = {
  origin: 'https://brushes.keliran.com',
  generatedAt: '2026-11-08T12:00:00.000Z',
  settings: {
    legalEntity: 'Keliran LTD',
    registrationJurisdiction: 'England and Wales',
    registrationNo: '15698503',
    publicEmail: 'contact@keliran.com',
  },
  sharedCanonical: sharedCanonicalPaths,
  docs: {
    products: [
      {
        slug: 'metal-channel-strip-brushes',
        title: 'Metal-channel strip brushes',
        code: 'BR01-CUSTOM',
        summary: '**Straight** brushes in a metal channel.',
        materials: ['PA6', 'PBT'],
        updatedAt: '2026-09-24T00:00:00.000Z',
        sections: [{ key: 'rfq-inputs', heading: 'What to send', text: '- Trim length\n- Filament' }],
        specifications: [{ key: 'trim', label: 'Trim length', value: '25', unit: 'mm' }],
      },
    ],
    categories: [{ slug: 'brush-holders', title: 'Brush holders', line: 'brushes', summary: 'Holders.' }],
    guides: [
      { slug: 'measure-strip-brush', title: 'How to measure a strip brush', summary: 'Five dimensions.' },
      { slug: 'rfq-checklist', title: 'RFQ checklist', summary: 'Shared with keliran.com.' },
    ],
    materials: [{ slug: 'pbt', title: 'PBT', summary: 'Filament option.' }],
    faqs: [{ slug: 'question-19', title: 'Can you match a sample?', summary: 'Yes, after review.' }],
    cases: [
      { slug: 'scenario-holder-fit', title: 'Holder fit', scenarioType: 'typical', summary: 'Example.' },
    ],
    pages: [{ slug: 'about', title: 'About Keliran', summary: 'How we work.' }],
  },
}

describe('llms.txt', () => {
  const text = buildLlmsTxt(input)
  const lines = text.split('\n')
  it('follows the llmstxt.org layout: H1, blockquote, details, H2 link lists, Optional last', () => {
    expect(lines[0]).toBe('# Keliran Strip Brushes')
    expect(lines[2]).toMatch(/^> .*strip brushes/)
    const h2 = lines.filter((l) => l.startsWith('## ')).map((l) => l.slice(3))
    expect(h2[0]).toBe('Products')
    expect(h2.at(-1)).toBe('Optional')
    expect(lines.filter((l) => l.startsWith('# '))).toHaveLength(1)
    // Every list item is "- [Title](absolute URL)" with an optional ": note".
    for (const item of lines.filter((l) => l.startsWith('- ')))
      expect(item).toMatch(/^- \[[^\]]+\]\(https:\/\/[^)\s]+\)(: .+)?$/)
  })
  it('names products with their family reference and states the supply boundaries', () => {
    expect(text).toContain(
      '- [Metal-channel strip brushes (BR01-CUSTOM)](https://brushes.keliran.com/en/products/metal-channel-strip-brushes): Straight brushes in a metal channel.',
    )
    expect(text).toContain('Keliran LTD, registered in England and Wales (company number 15698503)')
    expect(text).toContain('not a manufacturer')
    expect(text).toContain('not stock-keeping units')
  })
  it('links shared documents only to their keliran.com canonical, under Optional', () => {
    const optional = text.slice(text.indexOf('## Optional'))
    expect(text.slice(0, text.indexOf('## Optional'))).not.toContain('/guides/rfq-checklist')
    expect(optional).toContain('(https://keliran.com/en/guides/rfq-checklist)')
    expect(text).not.toContain('https://brushes.keliran.com/en/guides/rfq-checklist')
    expect(text).not.toMatch(/\/sealing\//)
  })
  it('stays a short curated index', () => {
    expect(lines.filter((l) => l.startsWith('- ')).length).toBeLessThanOrEqual(60)
    expect(text.length).toBeLessThan(20000)
  })
})
describe('llms-full.txt', () => {
  const full = buildLlmsFullTxt(input)
  it('concatenates own pages with title, URL, update date and Markdown body', () => {
    expect(full.split('\n')[0]).toBe('# Keliran Strip Brushes — full English content')
    expect(full).toContain('## Product: Metal-channel strip brushes (BR01-CUSTOM)')
    expect(full).toContain('URL: https://brushes.keliran.com/en/products/metal-channel-strip-brushes')
    expect(full).toContain('Last updated: 2026-09-24')
    expect(full).toContain('| Trim length | 25 mm |')
    expect(full).toContain('### What to send\n\n- Trim length\n- Filament')
    expect(full).toContain('## FAQ: Can you match a sample?')
    expect(full).not.toContain('RFQ checklist')
  })
})
