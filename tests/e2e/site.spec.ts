import { test, expect } from '@playwright/test'
import { locales } from '../../src/lib/locales'

test('language switching updates the document and shared layout as well as product content', async ({
  page,
}) => {
  await page.goto('/zh-Hant/products/brush-holders')
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-Hant')
  await page.locator('.language-switch summary').click()
  await page.locator('.language-options a[lang="en"]').click()
  await expect(page).toHaveURL(/\/en\/products\/brush-holders$/)
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(page.locator('.language-switch summary')).toHaveAttribute('aria-label', 'Language')
  await expect(page.locator('footer')).toContainText('Industrial strip brushes. Sourced with care.')
  // The same company's sealing site is one footer link away.
  await expect(page.locator('footer a[href="https://keliran.com/en"]')).toBeVisible()
})

test('all mobile homepages have complete layout and correct language', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  for (const locale of locales) {
    await page.goto(`/${locale}`)
    await expect(page.locator('html')).toHaveAttribute('lang', locale)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await expect(page.locator('header img')).toHaveAttribute('src', /keliran-light\.svg/)
    await expect(page.locator('footer img')).toHaveAttribute('src', /keliran-dark\.svg/)
  }
})

test('the short brush catalogue is shown in full without search controls', async ({ page }) => {
  await page.goto('/en/products')
  await expect(page.getByRole('searchbox')).toHaveCount(0)
  await expect(page.locator('.catalogue-grid .product-card')).toHaveCount(4)
  await expect(page.locator('.catalogue-grid')).toContainText('BR04-CUSTOM')
})

test('mobile navigation closes after choosing a page', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/en')
  await page.getByRole('button', { name: 'Open navigation' }).click()
  await page.locator('#mobile-nav').getByRole('link', { name: 'Materials' }).click()
  await expect(page).toHaveURL(/\/en\/materials$/)
  await expect(page.getByRole('button', { name: 'Open navigation' })).toBeVisible()
})

test('inquiry success receives focus; UI-only response stub sends no email', async ({ page }) => {
  await page.route('**/api/inquiry-submit', (route) =>
    route.fulfill({ status: 202, contentType: 'application/json', body: '{"accepted":true}' }),
  )
  await page.goto('/en/contact')
  await page.getByRole('textbox', { name: 'Your name *', exact: true }).fill('UI test')
  await page.getByRole('textbox', { name: 'Email *', exact: true }).fill('ui-test@example.com')
  await page
    .getByRole('textbox', { name: 'Your requirements *', exact: true })
    .fill('This is a client-only form state test.')
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Send inquiry' }).click()
  await expect(page.locator('.form-success')).toBeFocused()
})
