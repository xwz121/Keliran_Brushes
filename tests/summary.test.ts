import { describe, it, expect } from 'vitest'
import { plainSummary } from '../src/lib/summary'
import { pageMetadata } from '../src/lib/metadata'
describe('card and meta summaries', () => {
  it('turns a Markdown list summary into one readable line', () => {
    expect(
      plainSummary(
        '- Drawing number, revision and units\n- Material grade or request for material advice\n- Critical dimensions and tolerances',
      ),
    ).toBe(
      'Drawing number, revision and units · Material grade or request for material advice · Critical dimensions and tolerances',
    )
    expect(plainSummary('- 図面番号、改訂および単位\n- 重要寸法および公差')).toBe(
      '図面番号、改訂および単位 · 重要寸法および公差',
    )
    expect(plainSummary('Include:\n- Drawing\n- Quantity\nThen send it.')).toBe(
      'Include: Drawing · Quantity Then send it.',
    )
  })
  it('leaves ordinary summaries, ranges and negative values unchanged', () => {
    const text = 'Rated -40 to 120 °C.\nUse a 5 - 10 mm gap only after review.'
    expect(plainSummary(text)).toBe(text)
    expect(plainSummary('')).toBe('')
    expect(plainSummary(undefined)).toBe('')
  })
  it('never publishes list dashes in meta descriptions', () => {
    const meta = pageMetadata(
      'en',
      '/guides/rfq-checklist',
      'Checklist',
      '- Drawing number\n- Material grade',
    )
    expect(meta.description).toBe('Drawing number · Material grade')
    expect(meta.openGraph?.description).toBe('Drawing number · Material grade')
  })
})
