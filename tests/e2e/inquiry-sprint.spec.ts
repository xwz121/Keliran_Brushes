import { test, expect, type Page } from '@playwright/test'
import { approvedLink } from './whatsapp-numbers'

async function fillContact(page: Page) {
  await page.locator('input[name="name"]').fill('Sprint test buyer')
  await page.locator('input[name="email"]').fill('sprint@example.com')
  // On the technical RFQ, company and country sit in an optional collapsed group.
  const company = page.locator('input[name="company"]')
  if (!(await company.isVisible()))
    await page.getByText('Company, delivery & samples (optional)', { exact: true }).click()
  await company.fill('Test equipment company')
  await page.locator('input[name="country"]').fill('Germany')
  await page
    .locator('textarea[name="message"]')
    .fill('Please review the drawing for our equipment component.')
  await page.locator('input[name="consent"]').check()
}
async function mockSubmit(page: Page, save: (body: any) => void) {
  await page.route('**/api/inquiry-session', (r) => r.fulfill({ json: { sessionToken: 'test-session' } }))
  await page.route('**/api/inquiry-submit', (r) => {
    save(r.request().postDataJSON())
    return r.fulfill({ status: 202, json: { accepted: true } })
  })
}
test('home leads to drawing review and the brush hub shows four entry products', async ({ page }) => {
  await page.goto('/en')
  await expect(page.locator('h1')).toHaveText('Industrial strip brushes')
  await expect(page.locator('.hero-buttons .button')).toHaveAttribute('href', '/en/rfq')
  await expect(page.locator('.hero-buttons .button')).toHaveText('Send drawing / dimensions')
  await expect(page.locator('.hero-line-links a')).toHaveAttribute('href', '/en/strip-brushes')
  await expect(page.locator('#product-lines .product-card')).toHaveCount(4)
  await expect(page.locator('a[href="/en/sealing"]')).toHaveCount(0)
  await page.goto('/en/strip-brushes')
  await expect(page.locator('.catalogue-grid .product-card')).toHaveCount(4)
  // Four entry products need no search box or filters.
  await expect(page.locator('.catalogue-filters')).toHaveCount(0)
  await expect(page.locator('.quote-banner a')).toHaveAttribute('href', '/en/rfq')
  await expect(page.locator('.header-quote')).toHaveAttribute('href', '/en/rfq')
  await expect(page.locator('.line-requirements a[download]')).toHaveAttribute(
    'href',
    '/downloads/en/strip-brush-rfq-checklist.txt',
  )
  await expect(page.locator('.line-requirements a:not([download])')).toHaveAttribute(
    'href',
    '/en/guides/measure-strip-brush',
  )
  // One family per entry product: no extra family chips or "view all" link.
  await expect(page.getByRole('link', { name: 'View all products' })).toHaveCount(0)
  await expect(page.locator('.line-families')).toHaveCount(0)
  // The sealing catalogue is not part of this site.
  expect((await page.request.get('/en/sealing')).status()).toBe(404)
})
test('the catalogue lists only strip brushes, without product-line tabs', async ({ page }) => {
  const html = await (await page.request.get('/en/products')).text()
  expect(html.match(/class="product-card"/g)?.length).toBe(4)
  await page.goto('/en/products')
  await expect(page.locator('.line-tabs')).toHaveCount(0)
  await expect(page.locator('.catalogue-grid .product-card')).toHaveCount(4)
  await expect(page.locator('.catalogue-grid')).not.toContainText(/RUB-|SE0\d/)
})
test('campaign context survives catalogue navigation and short inquiry keeps brush line', async ({
  page,
}) => {
  let body: any
  await mockSubmit(page, (value) => (body = value))
  await page.goto(
    '/en/strip-brushes?utm_source=linkedin&utm_medium=outreach&utm_campaign=de-brushes-01&email=ignored',
  )
  await page.locator('.catalogue-grid .product-card').first().click()
  await fillContact(page)
  await page.getByRole('button', { name: 'Send inquiry' }).click()
  await expect(page.locator('.form-success')).toBeFocused()
  expect(body.line).toBe('brushes')
  expect(body.productSlug).toBe('metal-channel-strip-brushes')
  expect(body.attribution).toMatchObject({
    landingPath: '/en/strip-brushes',
    source: 'linkedin',
    medium: 'outreach',
    campaign: 'de-brushes-01',
  })
  expect(JSON.stringify(body.attribution)).not.toContain('ignored')
  await expect(page.locator('.inquiry-reference')).toContainText(body.submissionId)
  const mail = await page.locator('.form-success a[href^="mailto:"]').getAttribute('href')
  expect(decodeURIComponent(mail!)).toContain(body.submissionId)
  const whatsapp = await page.locator('.form-success a.wa-button').getAttribute('href')
  expect(whatsapp).toMatch(approvedLink)
  expect(decodeURIComponent(whatsapp!)).toContain(body.submissionId)
})
test('technical enquiry keeps the product reference and new details', async ({ page }) => {
  let body: any
  await mockSubmit(page, (value) => (body = value))
  await page.goto('/en/rfq?product=metal-channel-strip-brushes')
  await expect(page.locator('.rfq-form .form-product')).toContainText('Product reference')
  await expect(page.locator('.rfq-form .form-product')).toContainText('BR01-CUSTOM')
  // There is no product-line choice on a single-line site.
  await expect(page.getByRole('radio')).toHaveCount(0)
  await page.getByText('Specification details (optional)', { exact: true }).click()
  await page.locator('input[name="rfq.dimensions"]').fill('1000 mm long')
  await page.locator('input[name="rfq.trimLength"]').fill('25 mm')
  await page.getByText('Company, delivery & samples (optional)', { exact: true }).click()
  await page.locator('select[name="rfq.requestType"]').selectOption('sample')
  await page.locator('input[name="rfq.targetDelivery"]').fill('November')
  await fillContact(page)
  await page.getByRole('button', { name: 'Send inquiry' }).click()
  await expect(page.locator('.form-success')).toBeVisible()
  expect(body.line).toBe('brushes')
  expect(body.productSlug).toBe('metal-channel-strip-brushes')
  expect(body.rfq).toMatchObject({
    line: 'brushes',
    requestType: 'sample',
    dimensions: '1000 mm long',
    trimLength: '25 mm',
    targetDelivery: 'November',
  })
})
test('unknown specifications can be sent and drawing email is visible without configured uploads', async ({
  page,
}) => {
  let body: any
  await mockSubmit(page, (value) => (body = value))
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/en/rfq')
  await page.getByText('Drawings, photos & safety (optional)', { exact: true }).click()
  await expect(page.locator('.upload-box a[href^="mailto:"]')).toBeVisible()
  await expect(page.locator('.upload-box a[href^="mailto:"]')).toHaveAttribute(
    'href',
    /^mailto:contact@keliran.com/,
  )
  await expect(page.locator('.upload-box a.wa-button')).toHaveAttribute('href', approvedLink)
  await fillContact(page)
  await page.getByRole('button', { name: 'Send inquiry' }).click()
  await expect(page.locator('.form-success')).toBeVisible()
  expect(body.rfq.dimensions).toBe('')
  expect(body.attachments).toEqual([])
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await expect(page.locator('.inquiry-reference')).toBeVisible()
  await page.screenshot({ path: 'test-results/polish-success-mobile.png', fullPage: true })
})
test('quick RFQ sends brush fields and records a safety flag', async ({ page }) => {
  let body: any
  await mockSubmit(page, (value) => (body = value))
  await page.goto('/en/rfq')
  await page.locator('textarea[name="message"]').fill('Need strip brushes for a new machine guard.')
  await page.locator('input[name="rfq.quantity"]').fill('40 pieces')
  await page.getByText('Specification details (optional)', { exact: true }).click()
  await expect(page.locator('input[name="rfq.filamentMaterial"]')).toBeVisible()
  await expect(page.locator('input[name="rfq.gapMin"], input[name="rfq.profileType"]')).toHaveCount(0)
  await page.locator('input[name="rfq.dimensions"]').fill('1000 mm long')
  await page.getByText('Drawings, photos & safety (optional)', { exact: true }).click()
  await page.locator('.rfq-optional select').last().selectOption('yes')
  await expect(page.locator('.safety-note')).toBeVisible()
  await fillContact(page)
  await page.getByRole('button', { name: 'Send inquiry' }).click()
  await expect(page.locator('.form-success')).toBeVisible()
  expect(body.line).toBe('brushes')
  expect(body.rfq).toMatchObject({ line: 'brushes', quantity: '40 pieces', dimensions: '1000 mm long' })
  expect(body.safetyCritical).toBe('yes')
})
test('a sealing enquiry refused as line-moved points to keliran.com without resubmitting', async ({
  page,
}) => {
  let calls = 0
  await page.route('**/api/inquiry-session', (r) => r.fulfill({ json: { sessionToken: 'test-session' } }))
  await page.route('**/api/inquiry-submit', (r) => {
    calls++
    return r.fulfill({ status: 409, json: { error: 'moved', code: 'line-moved' } })
  })
  await page.goto('/en/rfq')
  await fillContact(page)
  await page.getByRole('button', { name: 'Send inquiry' }).click()
  await expect(page.locator('.form-error')).toContainText('Sealing component enquiries')
  await expect(page.locator('.form-error a')).toHaveAttribute('href', 'https://keliran.com/en/rfq')
  expect(calls).toBe(1)
})
for (const size of [
  { width: 1280, height: 800 },
  { width: 390, height: 844 },
])
  test(`quick RFQ submit position at ${size.width}px is recorded`, async ({ page }) => {
    await page.setViewportSize(size)
    await page.goto('/en/rfq')
    await page.evaluate(() => document.fonts.ready)
    const y = await page
      .locator('.rfq-form button[type="submit"]')
      .evaluate((el) => Math.round(el.getBoundingClientRect().top + scrollY))
    test.info().annotations.push({ type: 'submit-y', description: `${size.width}px: ${y}` })
    // Baseline before this change: about 2,336px desktop and 3,012px on a 375-390px phone.
    expect(y).toBeLessThan(size.width > 800 ? 1600 : 2200)
  })
