import { test, expect } from '@playwright/test'
import { locales } from '../../src/lib/locales'
import { interfaceCopy } from '../../src/lib/interface-copy'
import { getDictionary } from '../../src/lib/i18n'
import { numberOf, primaryNumber } from './whatsapp-numbers'
for (const locale of locales)
  test(`${locale}: localised RFQ, contact links, checklist and error state`, async ({ page }) => {
    const copy = interfaceCopy(locale)
    await page.goto(`/${locale}/rfq?line=brushes`)
    await expect(page.locator('h1')).toHaveText(copy.offerTitle)
    await expect(page.getByLabel(copy.trimLength, { exact: true })).toBeHidden()
    await page.getByText(copy.moreTechnical, { exact: true }).click()
    await expect(page.getByLabel(copy.trimLength, { exact: true })).toBeVisible()
    await expect(page.getByLabel(copy.filamentDiameter, { exact: true })).toBeVisible()
    if (locale !== 'en') await expect(page.locator('.rfq-form')).not.toContainText('Your component')
    const whatsapp = page.locator('.rfq-side .wa-panel .wa-button')
    await expect(whatsapp).toBeVisible()
    const primary = numberOf(await whatsapp.getAttribute('href'))
    expect(primary).toBe(primaryNumber)
    expect(await whatsapp.getAttribute('href')).toBe(
      `https://wa.me/${primary}?text=${encodeURIComponent(copy.whatsappMessage)}`,
    )
    // WhatsApp Business is registered only on the +86 number: no second WhatsApp link.
    await expect(page.locator('.rfq-side .wa-secondary')).toHaveCount(0)
    const checklist = await page.request.get(`/downloads/${locale}/strip-brush-rfq-checklist.txt`)
    expect(checklist.ok()).toBe(true)
    expect(await checklist.text()).toContain(copy.trimLength)
    await page.goto(`/${locale}/products/missing-release-test`)
    await expect(page.locator('h1')).toHaveText(copy.notFound)
  })
test('long translated RFQ labels fit a mobile screen', async ({ page }) => {
  test.setTimeout(60000)
  await page.setViewportSize({ width: 390, height: 844 })
  for (const locale of ['de', 'fr', 'ja', 'ko', 'zh-Hant'] as const) {
    await page.goto(`/${locale}/rfq?line=brushes`)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), locale).toBe(true)
    await page.getByText(interfaceCopy(locale).moreTechnical, { exact: true }).click()
    await expect(page.getByLabel(interfaceCopy(locale).trimLength, { exact: true })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), locale).toBe(true)
  }
})

test('network failures keep inquiry errors in the selected language and allow retry', async ({ page }) => {
  const copy = getDictionary('fr')
  await page.route('**/api/inquiry-submit', (route) => route.abort('failed'))
  await page.goto('/fr/contact')
  await page.locator('input[name="name"]').fill('Form check')
  await page.locator('input[name="email"]').fill('form-check@example.com')
  await page.locator('textarea[name="message"]').fill('Please review the component drawing.')
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: copy.submit }).click()
  await expect(page.locator('.inquiry-form').getByRole('alert')).toHaveText(copy.formError)
  await expect(page.getByRole('button', { name: copy.submit })).toBeEnabled()
})
