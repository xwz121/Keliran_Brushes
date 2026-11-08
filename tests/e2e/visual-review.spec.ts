import { test, expect, type Locator } from '@playwright/test'
// WCAG relative-luminance contrast between two computed rgb()/rgba() colours (alpha must be 1).
const contrast = (a: string, b: string) => {
  const lum = (c: string) => {
    const [r, g, bl, alpha = 1] = c.match(/[\d.]+/g)!.map(Number)
    expect(alpha, c).toBe(1)
    const ch = (v: number) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
    return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(bl)
  }
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m)
  return (x + 0.05) / (y + 0.05)
}
const colours = (el: Locator) =>
  el.evaluate((node) => {
    const s = getComputedStyle(node)
    return { color: s.color, background: s.backgroundColor }
  })
for (const width of [1280, 390])
  test(`labels on product photos sit on a solid light chip at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 })
    await page.goto('/en')
    const labels = page.locator('.hero-image-label > span, .line-card-image > span')
    await expect(labels).toHaveCount(4)
    for (const label of await labels.all()) {
      const { color, background } = await colours(label)
      expect(contrast(color, background), await label.innerText()).toBeGreaterThanOrEqual(4.5)
      const box = (await label.boundingBox())!
      const image = (await label.locator('xpath=..').boundingBox())!
      expect(box.x + box.width).toBeLessThanOrEqual(image.x + image.width)
    }
  })
test('links on the navy partner section use the light link gold', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/en')
  const link = page.locator('.partner-section .text-link.inverse')
  const { color } = await colours(link)
  const { background } = await colours(page.locator('.partner-section'))
  expect(color).toBe('rgb(224, 182, 69)')
  expect(contrast(color, background)).toBeGreaterThanOrEqual(4.5)
  await link.hover()
  expect(contrast((await colours(link)).color, background)).toBeGreaterThanOrEqual(4.5)
})
test('phone assurance and capability rows stack in reading order', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  for (const locale of ['en', 'de', 'ja', 'zh-Hant']) {
    await page.goto(`/${locale}`)
    for (const selector of ['.hero-assurance > span', '.capability-rail .container > span']) {
      const boxes = await page.locator(selector).evaluateAll((els) =>
        els.map((el) => {
          const r = el.getBoundingClientRect()
          return { x: Math.round(r.left), top: r.top, bottom: r.bottom }
        }),
      )
      expect(boxes.length, `${locale} ${selector}`).toBeGreaterThanOrEqual(3)
      expect(new Set(boxes.map((b) => b.x)).size, `${locale} ${selector}`).toBe(1)
      for (let i = 1; i < boxes.length; i++)
        expect(boxes[i].top, `${locale} ${selector}`).toBeGreaterThanOrEqual(boxes[i - 1].bottom)
    }
  }
})
test('guide card summaries never show flattened Markdown list dashes', async ({ page }) => {
  for (const locale of ['en', 'ja']) {
    await page.goto(`/${locale}/products/solid-rubber-profiles`)
    const card = page.locator('.related-block .resource-card[href$="/guides/rfq-checklist"] > p')
    await expect(card).toHaveCount(1)
    const text = await card.innerText()
    expect(text, locale).not.toMatch(/(^|\s)-\s/)
    expect(text, locale).toContain(' · ')
    await page.goto(`/${locale}/guides/rfq-checklist`)
    expect(await page.locator('meta[name="description"]').getAttribute('content'), locale).not.toMatch(
      /(^|\s)-\s/,
    )
    expect(await page.locator('.resource-summary').innerText(), locale).not.toMatch(/(^|\s)-\s/)
    await expect(page.locator('.resource-summary ul li').first()).toBeVisible()
  }
})
