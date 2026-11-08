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
test('home leads to drawing review and each product line has four entry products', async ({ page }) => {
  await page.goto('/en')
  await expect(page.locator('.hero-buttons .button')).toHaveAttribute('href', '/en/rfq')
  await expect(page.locator('.hero-buttons .button')).toHaveText('Send drawing / dimensions')
  await expect(page.locator('.hero-line-links a')).toHaveCount(2)
  await expect(page.locator('.line-card-products li')).toHaveCount(8)
  for (const route of ['sealing', 'strip-brushes']) {
    await page.goto(`/en/${route}`)
    await expect(page.locator('.catalogue-grid .product-card')).toHaveCount(4)
    // Four entry products need no search box or filters.
    await expect(page.locator('.catalogue-filters')).toHaveCount(0)
    const line = route === 'sealing' ? 'sealing' : 'brushes'
    await expect(page.locator('.quote-banner a')).toHaveAttribute('href', `/en/rfq?line=${line}`)
    await expect(page.locator('.header-quote')).toHaveAttribute('href', `/en/rfq?line=${line}`)
    await expect(page.locator('.line-requirements a[download]')).toHaveAttribute(
      'href',
      `/downloads/en/${line === 'sealing' ? 'sealing' : 'strip-brush'}-rfq-checklist.txt`,
    )
    await expect(page.locator('.line-requirements a:not([download])')).toHaveAttribute(
      'href',
      `/en/guides/${line === 'sealing' ? 'measure-door-seal' : 'measure-strip-brush'}`,
    )
  }
  // Sealing has more families than entry products; brushes has one family per entry product.
  await page.goto('/en/sealing')
  await expect(page.getByRole('link', { name: 'View all products' })).toHaveAttribute(
    'href',
    '/en/products?line=sealing',
  )
  expect(await page.locator('.line-families a').count()).toBeGreaterThan(4)
  await page.goto('/en/strip-brushes')
  await expect(page.getByRole('link', { name: 'View all products' })).toHaveCount(0)
  await expect(page.locator('.line-families')).toHaveCount(0)
  await page.goto('/en/sealing/cut-to-length')
  await expect(page.getByRole('searchbox')).toBeVisible()
})
test('filtered catalogue links render the chosen line on the server', async ({ page }) => {
  const html = await (await page.request.get('/en/products?line=brushes')).text()
  expect(html.match(/class="product-card"/g)?.length).toBe(4)
  await page.goto('/en/products?line=brushes')
  await expect(page.locator('.catalogue-grid .product-card')).toHaveCount(4)
  await page.getByRole('button', { name: 'Reset filters' }).click()
  await expect(page.locator('.catalogue-grid .product-card')).toHaveCount(16)
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
test('technical enquiry preserves new details and clears a mismatched product when switching lines', async ({
  page,
}) => {
  let body: any
  await mockSubmit(page, (value) => (body = value))
  await page.goto('/en/rfq?line=brushes&product=metal-channel-strip-brushes')
  await expect(page.locator('.rfq-line .form-hint')).toContainText('Product reference')
  await expect(page.locator('.rfq-form')).not.toContainText('metal-channel-strip-brushes')
  await page.getByRole('radio', { name: 'Sealing & rubber components' }).check()
  await expect(page.locator('.rfq-line .form-hint')).toHaveCount(0)
  await page.getByText('Specification details (optional)', { exact: true }).click()
  await page.locator('input[name="rfq.dimensions"]').fill('20 × 10 mm')
  await page.locator('input[name="rfq.tolerance"]').fill('please advise')
  await page.getByText('Company, delivery & samples (optional)', { exact: true }).click()
  await page.locator('select[name="rfq.requestType"]').selectOption('sample')
  await page.locator('input[name="rfq.targetDelivery"]').fill('November')
  await page.locator('input[name="rfq.targetPrice"]').fill('EUR 2 per metre')
  await fillContact(page)
  await page.getByRole('button', { name: 'Send inquiry' }).click()
  await expect(page.locator('.form-success')).toBeVisible()
  expect(body.productSlug).toBeUndefined()
  expect(body.rfq).toMatchObject({
    line: 'sealing',
    requestType: 'sample',
    dimensions: '20 × 10 mm',
    tolerance: 'please advise',
    targetDelivery: 'November',
    targetPrice: 'EUR 2 per metre',
  })
})
test('unknown specifications can be sent and drawing email is visible without configured uploads', async ({
  page,
}) => {
  let body: any
  await mockSubmit(page, (value) => (body = value))
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/en/rfq?line=sealing')
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
  await page.screenshot({ path: 'docs/review/polish-success-mobile.png', fullPage: true })
})
test('quick RFQ defaults to an unclassified line and sends only the common fields', async ({ page }) => {
  let body: any
  await mockSubmit(page, (value) => (body = value))
  await page.goto('/en/rfq')
  await expect(page.getByRole('radio', { name: 'Not sure yet / both' })).toBeChecked()
  await expect(page.locator('input[name="rfq.material"], input[name="rfq.filamentMaterial"]')).toHaveCount(0)
  await page.locator('textarea[name="message"]').fill('Need seals and brushes for a new machine guard.')
  await page.locator('input[name="rfq.quantity"]').fill('100 sets')
  await page.locator('input[name="name"]').fill('Quick buyer')
  await page.locator('input[name="email"]').fill('quick@example.com')
  await page.locator('input[name="consent"]').check()
  await page.getByRole('button', { name: 'Send inquiry' }).click()
  await expect(page.locator('.form-success')).toBeFocused()
  expect(body.line).toBe('both')
  expect(body.rfq).toMatchObject({ line: 'both', quantity: '100 sets' })
  expect(body.rfq).not.toHaveProperty('material')
  expect(body.safetyCritical).toBe('unsure')
})
test('switching product line keeps shared answers and records a safety flag', async ({ page }) => {
  let body: any
  await mockSubmit(page, (value) => (body = value))
  await page.goto('/en/rfq')
  await page.locator('input[name="rfq.quantity"]').fill('40 pieces')
  await page.getByText('Specification details (optional)', { exact: true }).click()
  await page.locator('input[name="rfq.dimensions"]').fill('1000 mm long')
  await page.getByRole('radio', { name: 'Industrial strip brushes' }).check()
  await expect(page.locator('input[name="rfq.quantity"]')).toHaveValue('40 pieces')
  await expect(page.locator('input[name="rfq.dimensions"]')).toHaveValue('1000 mm long')
  await expect(page.locator('input[name="rfq.filamentMaterial"]')).toHaveValue('')
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
