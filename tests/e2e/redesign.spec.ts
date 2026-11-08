import { test, expect } from '@playwright/test'
import { approvedLink } from './whatsapp-numbers'
test('two product lines link to product details and prefilled RFQ', async ({ page }) => {
  await page.goto('/en')
  await page.locator('.line-card').nth(1).click()
  await expect(page).toHaveURL(/strip-brushes$/)
  await page.locator('.catalogue-grid .product-card').first().click()
  await expect(page.locator('h1')).toContainText('Metal-channel')
  await page.getByRole('link', { name: 'Request a quote for this product' }).click()
  await expect(page).toHaveURL(/rfq\?line=brushes/)
  await expect(page.getByRole('radio', { name: 'Industrial strip brushes' })).toBeChecked()
  await expect(page.getByLabel('Effective trim length (mm)')).toBeHidden()
  await page.getByText('Specification details (optional)', { exact: true }).click()
  await expect(page.getByLabel('Effective trim length (mm)')).toBeVisible()
  await expect(page.getByLabel('Minimum closed gap (mm)')).toHaveCount(0)
})
test('guide tables, supplier checklist and scenario disclosure are visible', async ({ page }) => {
  await page.goto('/en/guides/standards-and-validation')
  await expect(page.locator('table')).toBeVisible()
  await expect(page.locator('article')).toContainText('assembled enclosure')
  await page.goto('/en/cases/scenario-enclosure-door-leaks')
  await expect(page.locator('.resource-intro')).toContainText('Typical scenario')
  await expect(page.locator('article')).toContainText('not a reported customer project')
  await page.goto('/en/guides/supplier-qualification')
  await expect(page.locator('article')).toContainText('Contracting entity')
})
test('technical RFQ keeps brush fields in the submitted payload and accepts unknown values', async ({
  page,
}) => {
  let body: any
  await page.route('**/api/inquiry-session', (r) =>
    r.fulfill({ status: 200, contentType: 'application/json', body: '{"sessionToken":"test-session"}' }),
  )
  await page.route('**/api/inquiry-submit', (r) => {
    body = r.request().postDataJSON()
    return r.fulfill({ status: 202, contentType: 'application/json', body: '{"accepted":true}' })
  })
  await page.goto('/en/rfq?line=brushes&product=metal-channel-strip-brushes')
  await page.getByText('Specification details (optional)', { exact: true }).click()
  await page.getByLabel('Effective trim length (mm)').fill('22')
  await page.getByRole('textbox', { name: 'Your name *', exact: true }).fill('Preview buyer')
  await page.getByRole('textbox', { name: 'Email *', exact: true }).fill('buyer@example.com')
  await page
    .getByRole('textbox', { name: 'What do you need? *', exact: true })
    .fill('Please review a brush for our equipment opening.')
  await page.locator('input[name="consent"]').check()
  await page.getByRole('button', { name: 'Send inquiry' }).click()
  await expect(page.locator('.form-success')).toBeFocused()
  expect(body.line).toBe('brushes')
  expect(body.rfq.trimLength).toBe('22')
  expect(body.productSlug).toBe('metal-channel-strip-brushes')
})
test('owner-provided contacts are usable and unspecified social profiles remain hidden', async ({ page }) => {
  await page.goto('/en/contact')
  const contacts = page.locator('.contact-layout .contact-channels')
  await expect(contacts.locator('a[href="mailto:contact@keliran.com"]')).toBeVisible()
  for (const number of ['447536120830', '8617509072335'])
    await expect(contacts.locator(`a[href="tel:+${number}"]`)).toBeVisible()
  // WhatsApp Business runs on the +86 number only; the UK number stays a phone line.
  await expect(contacts.locator('a[href^="https://wa.me/8617509072335?"]')).toBeVisible()
  await expect(page.locator('a[href^="https://wa.me/447536120830"]')).toHaveCount(0)
  await expect(page.locator('a[href*="facebook.com"], a[href*="linkedin.com"]')).toHaveCount(0)
  const details = page.locator('.business-details')
  await expect(details.locator('h3').first()).toHaveText('Shanghai Keliran Technology Co., Ltd.')
  // The registered Chinese name stays visible, labelled, for verification.
  await expect(details.locator('.registered-name')).toContainText('上海柯立然科技有限公司')
  await expect(details).toContainText('No. 33 Shenhong Road, Minhang District, Shanghai')
  await expect(details).not.toContainText('闵行')
  await expect(details).toContainText('Keliran LTD')
  await expect(page.locator('.footer-bottom')).toContainText('Shanghai Keliran Technology Co., Ltd.')
  await expect(page.locator('.footer-bottom')).not.toContainText('Ltd..')
  for (const [locale, text, absent] of [
    ['zh-Hant', '上海市閔行區申虹路33號', 'No. 33 Shenhong Road'],
    ['ja', '上海市閔行区申虹路33号', 'No. 33 Shenhong Road'],
    ['de', 'England und Wales', '闵行'],
    ['fr', 'Royaume-Uni', '闵行'],
  ]) {
    await page.goto(`/${locale}/contact`)
    await expect(details).toContainText(text)
    await expect(details).not.toContainText(absent)
  }
  await page.goto('/zh-Hant/contact')
  await expect(details.locator('.registered-name')).toHaveCount(0)
  const header = page.locator('.site-header .header-cta-wa')
  await expect(header).toBeVisible()
  await expect(header).toHaveAttribute('href', approvedLink)
})
test('draft content and private files stay unavailable to anonymous visitors', async ({ browser }) => {
  const context = await browser.newContext()
  const api = context.request
  const products = await api.get('http://127.0.0.1:3000/api/products?draft=true')
  const result = await products.json()
  expect(result.docs.every((doc: { _status: string }) => doc._status === 'published')).toBe(true)
  const drafts = await api.get('http://127.0.0.1:3000/api/products?draft=true&where[_status][equals]=draft')
  expect((await drafts.json()).totalDocs).toBe(0)
  const file = await api.get('http://127.0.0.1:3000/api/inquiry-attachments/1/0')
  expect(file.status()).toBe(401)
  await context.close()
})
test('key pages fit desktop and mobile without horizontal overflow', async ({ page }) => {
  test.setTimeout(90000)
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 900 })
    for (const path of [
      '/en',
      '/en/sealing',
      '/en/strip-brushes',
      '/en/products',
      '/en/guides/standards-and-validation',
      '/en/rfq?line=brushes',
      '/de',
      '/ja',
      '/zh-Hant',
    ]) {
      await page.goto(path)
      await expect(page.locator('h1')).toBeVisible()
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        `${width} ${path}`,
      ).toBe(true)
    }
  }
})
