import { test, expect, type Page } from '@playwright/test'
test.use({ reducedMotion: 'no-preference' })
const pending = (page: Page) => page.locator('.km-anim').count()
async function scrollThrough(page: Page) {
  await page.waitForSelector('html[data-motion-ready]', { state: 'attached' })
  const height = await page.evaluate(() => document.body.scrollHeight)
  for (let y = 0; y <= height; y += 350) {
    await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), y)
    await page.waitForTimeout(60)
  }
  await expect.poll(() => pending(page), { timeout: 8000 }).toBe(0)
}
async function hiddenMotionElements(page: Page) {
  return page.evaluate(
    () =>
      [...document.querySelectorAll('[data-motion], [data-motion] > *, [data-motion-clip]')].filter(
        (el) => parseFloat(getComputedStyle(el).opacity) < 1 || (el as HTMLElement).style.transform,
      ).length,
  )
}
for (const size of [
  { width: 1280, height: 800 },
  { width: 390, height: 844 },
])
  for (const path of ['/en', '/en/sealing', '/en/guides'])
    test(`${path} at ${size.width}px reveals every section once and leaves nothing hidden`, async ({
      page,
    }) => {
      await page.setViewportSize(size)
      await page.goto(path)
      await page.waitForSelector('html[data-motion-ready]', { state: 'attached' })
      expect(await pending(page)).toBeGreaterThan(0)
      await scrollThrough(page)
      expect(await hiddenMotionElements(page)).toBe(0)
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    })
test('a jump past unrevealed sections shows them immediately', async ({ page }) => {
  await page.goto('/en')
  await page.waitForSelector('html[data-motion-ready]', { state: 'attached' })
  await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }))
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          [...document.querySelectorAll('.km-anim')].filter((el) => el.getBoundingClientRect().bottom < 0)
            .length,
      ),
    )
    .toBe(0)
})
test('keyboard focus inside a waiting section reveals it', async ({ page }) => {
  await page.goto('/en')
  await page.waitForSelector('html[data-motion-ready]', { state: 'attached' })
  const link = page.locator('.solutions-featured a').first()
  await link.focus()
  await expect(link).toHaveCSS('opacity', '1')
  await expect(page.locator('.solutions-featured > *').first()).toHaveCSS('opacity', '1')
})
test('headline keeps readable text, and forms and WhatsApp are never animated', async ({ page }) => {
  await page.goto('/en')
  await expect(page.locator('h1')).toHaveText('Industrial sealing components & strip brushes')
  await expect(page.locator('.hero-tagline')).toContainText('A clearer')
  await page.goto('/en/rfq')
  await expect(page.locator('.rfq-form [data-motion], .wa-panel[data-motion]')).toHaveCount(0)
  await expect(page.locator('.rfq-form')).toHaveCSS('opacity', '1')
  await expect(page.locator('.wa-panel')).toHaveCSS('opacity', '1')
})
test('scroll reveals cause no layout shift', async ({ page }) => {
  await page.addInitScript(() => {
    ;(window as any).__cls = 0
    new PerformanceObserver((list) => {
      for (const e of list.getEntries() as any[]) if (!e.hadRecentInput) (window as any).__cls += e.value
    }).observe({ type: 'layout-shift', buffered: true })
  })
  await page.goto('/en')
  await scrollThrough(page)
  expect(await page.evaluate(() => (window as any).__cls)).toBeLessThan(0.05)
})
test('reduced motion loads no engine and hides nothing', async ({ browser }) => {
  const context = await browser.newContext({
    reducedMotion: 'reduce',
    storageState: '.local/review-state.json',
  })
  const page = await context.newPage()
  await page.goto('http://127.0.0.1:3200/en')
  await page.waitForTimeout(800)
  await expect(page.locator('html')).not.toHaveAttribute('data-motion-ready')
  expect(await pending(page)).toBe(0)
  await context.close()
})
test('without JavaScript all content is visible', async ({ browser }) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    reducedMotion: 'no-preference',
    storageState: '.local/review-state.json',
  })
  const page = await context.newPage()
  await page.goto('http://127.0.0.1:3200/en')
  await page.waitForTimeout(1200)
  expect(await hiddenMotionElements(page)).toBe(0)
  expect(
    await page.evaluate(
      () =>
        [...document.querySelectorAll('.enter')].filter((el) => getComputedStyle(el).opacity !== '1').length,
    ),
  ).toBe(0)
  await context.close()
})
