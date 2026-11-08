import { test, expect, type Page } from '@playwright/test'
import { approvedLink, numberOf, primaryNumber } from './whatsapp-numbers'
const noOverflow = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)
test('desktop RFQ shows a one-click WhatsApp panel above the fold and keeps it in view', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/en/rfq')
  await page.evaluate(() => document.fonts.ready)
  const button = page.locator('.rfq-side .wa-panel .wa-button')
  await expect(button).toHaveAttribute('href', approvedLink)
  // Header, panel and every other entry point use the same primary number.
  const primary = numberOf(await button.getAttribute('href'))
  expect(primary).toBe(primaryNumber)
  expect(numberOf(await page.locator('.site-header .header-cta-wa').getAttribute('href'))).toBe(primary)
  expect((await button.boundingBox())!.y + (await button.boundingBox())!.height).toBeLessThan(800)
  await expect(page.locator('.site-header .header-cta-wa')).toBeVisible()
  await expect(page.locator('.wa-button--float')).toBeHidden()
  await page.locator('.rfq-form button[type="submit"]').scrollIntoViewIfNeeded()
  const box = (await page.locator('.rfq-side .wa-panel').boundingBox())!
  expect(box.y).toBeGreaterThanOrEqual(0)
  expect(box.y + box.height).toBeLessThanOrEqual(800)
})
for (const width of [1201, 1056, 801])
  test(`header WhatsApp button fits long languages at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 })
    for (const locale of ['de', 'fr', 'es', 'it']) {
      await page.goto(`/${locale}/rfq`)
      await expect(page.locator('.site-header .header-cta-wa')).toBeVisible()
      expect(await noOverflow(page), locale).toBe(true)
      expect(
        await page.locator('.header-inner').evaluate((el) => el.scrollWidth <= el.clientWidth),
        locale,
      ).toBe(true)
    }
  })
test('mobile RFQ puts WhatsApp before the form and the float gets out of the way', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/en/rfq')
  const panel = (await page.locator('.wa-panel').boundingBox())!
  const form = (await page.locator('.rfq-form').boundingBox())!
  expect(panel.y).toBeLessThan(form.y)
  await expect(page.locator('.site-header .header-cta-wa')).toBeHidden()
  // Pages that already show WhatsApp inline (RFQ, product, contact) do not add the floating button.
  const float = page.locator('.wa-button--float')
  await expect(float).toBeHidden()
  expect(await noOverflow(page)).toBe(true)
  await page.goto('/en/contact')
  await expect(float).toBeHidden()
  await page.goto('/en')
  await expect(float).toBeVisible()
  await expect(float).toHaveAttribute('href', approvedLink)
  const primary = numberOf(await float.getAttribute('href'))
  expect(primary).toBe(primaryNumber)
  await page.getByRole('button', { name: 'Open navigation' }).click()
  await expect(float).toBeHidden()
  await expect(page.locator(`.mobile-nav a[href^="https://wa.me/${primary}"]`)).toBeVisible()
  expect(await noOverflow(page)).toBe(true)
})
test('product enquiry column offers the same WhatsApp panel', async ({ page }) => {
  await page.goto('/en/products/metal-channel-strip-brushes')
  const button = page.locator('.inquiry-section .wa-panel .wa-button')
  await expect(button).toHaveAttribute('href', approvedLink)
  expect(numberOf(await button.getAttribute('href'))).toBe(primaryNumber)
  await expect(page.locator('.inquiry-section .wa-panel .wa-secondary')).toHaveCount(0)
})
