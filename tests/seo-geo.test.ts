import { describe, expect, it } from 'vitest'
import { distinctSections } from '../src/lib/summary'
import { sitemapRecords } from '../src/lib/sitemap-records'
import { materialBindings, procurementRelations } from '../src/lib/procurement-relations'
import { materialName } from '../src/lib/material-names'
import { parseContentContext, contextRfqHref } from '../src/lib/content-context'
import { rfqSchema } from '../src/lib/rfq-schema'
import { locales } from '../src/lib/locales'
describe('procurement content and public discovery', () => {
  it('removes exact repeated prose in English and German, retaining distinct follow-up blocks and original data', () => {
    for (const summary of ['Measure the interface first.', 'Zuerst die Schnittstelle messen.']) {
      const sections = [
        { key: 'first', heading: 'Heading', text: `${summary}\n\nKeep this extra evidence.` },
        { key: 'next', text: 'A separate requirement.' },
      ]
      expect(distinctSections(sections, summary)).toEqual([
        { ...sections[0], text: 'Keep this extra evidence.' },
        sections[1],
      ])
      expect(sections[0].text).toContain(summary)
      expect(
        distinctSections([{ key: 'distinct', text: `${summary} More information.` }], summary),
      ).toHaveLength(1)
    }
  })
  it('does not leave empty navigation anchors or duplicate warnings; retains list items', () => {
    expect(
      distinctSections(
        [
          { key: 'intro', text: '- Drawing\n- Units' },
          { key: 'warning', text: 'Confirm the grade.' },
          { key: 'duplicate', text: 'Confirm the grade.' },
        ],
        '- Drawing\n- Units',
      ),
    ).toEqual([{ key: 'warning', text: 'Confirm the grade.' }])
    expect(
      distinctSections([{ key: 'list', text: '- Drawing\n- Units\n- Revision' }], '- Drawing\n- Units')[0]
        .text,
    ).toContain('Revision')
  })
  it('never announces drafts, redirects, duplicate routes or nonexistent language translations in the sitemap', () => {
    const doc = {
      slug: 'epdm',
      _status: 'published',
      title: { en: 'EPDM', de: 'EPDM', fr: '' },
      updatedAt: '2026-09-24T00:00:00.000Z',
    }
    const rows = sitemapRecords('https://keliran.com', [
      { collection: 'materials', docs: [doc, doc, { ...doc, slug: 'draft', _status: 'draft' }] },
      { collection: 'applications', docs: [{ ...doc, slug: 'industrial-equipment' }] },
    ])
    const details = rows.filter((r) => r.url.includes('/materials/'))
    expect(details).toHaveLength(2)
    expect(details[0].alternates?.languages).toEqual({
      en: 'https://keliran.com/en/materials/epdm',
      de: 'https://keliran.com/de/materials/epdm',
      'x-default': 'https://keliran.com/en/materials/epdm',
    })
    expect(details[0].lastModified).toBe(doc.updatedAt)
    expect(rows.some((r) => /draft|industrial-equipment|\?/.test(r.url))).toBe(false)
  })
  it('preserves all existing eight language routes when translations exist and omits fabricated dates', () => {
    const rows = sitemapRecords('https://keliran.com', [
      {
        collection: 'products',
        docs: [
          {
            slug: 'brush-holders',
            _status: 'published',
            title: Object.fromEntries(locales.map((l) => [l, 'Holder'])),
          },
        ],
      },
    ])
    expect(rows.filter((r) => r.url.endsWith('/brush-holders'))).toHaveLength(8)
    expect(rows.every((r) => !r.lastModified)).toBe(true)
  })
  it('separates SS304 filament and holder roles without manufacturing an aluminium supply relationship', () => {
    expect(
      materialBindings({ slug: 'formed-strip-brushes', line: 'brushes', materials: ['SS304'] })[0],
    ).toMatchObject({ role: 'filament', status: 'needs-review' })
    expect(
      materialBindings({ slug: 'brush-holders', line: 'brushes', materials: ['SS304', 'SS316'] }).map(
        (x) => x.role,
      ),
    ).toEqual(['mounting-holder', 'mounting-holder'])
    expect(procurementRelations['materials/aluminium'].some((r) => r.kind === 'products')).toBe(false)
    expect(procurementRelations['materials/epdm']).toContainEqual({
      kind: 'products',
      slug: 'sponge-rubber-seals',
    })
  })
  it('localizes material display without changing technical codes', () => {
    expect(materialName('EPDM sponge', 'de')).toBe('EPDM-Moosgummi')
    for (const locale of locales) expect(materialName('SS304', locale)).toBe('SS304')
  })
  it('accepts only known kinds and plain slugs in enquiry context', () => {
    for (const value of [
      'https://example.com',
      'materials/epdm/secret',
      'inquiries/1',
      'guides/../../secret',
      ['guides/x'],
      'materials/a?email=private',
    ])
      expect(parseContentContext(value)).toBeUndefined()
    const context = parseContentContext('materials/pbt')!
    expect(contextRfqHref('de', context, 'brushes')).toBe('/de/rfq?line=brushes&context=materials%2Fpbt')
    expect(
      rfqSchema.parse({
        line: 'brushes',
        context,
        holderShape: 'H',
        holderMaterial: 'SS304',
        channelMaterial: 'steel',
        backingHeight: '5',
      }),
    ).toMatchObject({
      context,
      holderShape: 'H',
      holderMaterial: 'SS304',
      channelMaterial: 'steel',
      backingHeight: '5',
    })
  })
})
