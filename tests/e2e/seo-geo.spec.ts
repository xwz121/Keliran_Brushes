import { test, expect } from '@playwright/test'
import { interfaceCopy } from '../../src/lib/interface-copy'
import { locales } from '../../src/lib/locales'

test('resource summary appears once and measurement downloads stay localized', async ({ page }) => {
  for (const locale of ['en', 'de', 'ja', 'zh-Hant']) {
    await page.goto(`/${locale}/guides/measure-door-seal`)
    const summary = (await page.locator('.resource-summary').innerText()).trim()
    expect(await page.locator('article').innerText()).not.toContain(summary)
    const links = await page
      .locator('.article-aside nav a')
      .evaluateAll((nodes) => nodes.map((n) => n.getAttribute('href')))
    for (const link of links) await expect(page.locator(link!)).toHaveCount(1)
    await expect(page.locator('.guide-download a')).toHaveAttribute(
      'href',
      `/downloads/${locale}/sealing-rfq-checklist.txt`,
    )
    await expect(page.locator('main a[href$="/products/sponge-rubber-seals"]')).toHaveCount(1)
  }
})

test('material to product links have real targets and product breadcrumbs describe the same hierarchy', async ({
  page,
}) => {
  await page.goto('/en/materials/epdm')
  const links = await page
    .locator('#specification-path a')
    .evaluateAll((nodes) => nodes.map((n) => n.getAttribute('href')))
  for (const link of links) expect((await page.request.get(link!)).status(), link!).toBe(200)
  await page.locator('#specification-path a[href$="/products/sponge-rubber-seals"]').click()
  await expect(page).toHaveURL(/\/products\/sponge-rubber-seals$/)
  await expect(page.locator('h1')).toHaveText('Sponge rubber seals')
  const nodes = await page
    .locator('script[type="application/ld+json"]')
    .evaluateAll((els) => els.map((e) => JSON.parse(e.textContent || '{}')))
  const breadcrumb = nodes.find((n) => n['@type'] === 'BreadcrumbList')
  expect(breadcrumb.itemListElement).toHaveLength(3)
  expect(breadcrumb.itemListElement[1].item).toContain('/en/sealing')
  expect(breadcrumb.itemListElement[2].name).toBe(await page.locator('h1').innerText())
  await expect(page.locator('.product-overview .standards-note')).toHaveCount(0)
})

test('material roles distinguish wire and holders, with no confirmed aluminium offer', async ({ page }) => {
  await page.goto('/en/materials/ss304')
  await expect(page.locator('#specification-path')).toContainText('Filament')
  await expect(page.locator('#specification-path')).toContainText('Mounting holder')
  await page.goto('/en/products/brush-holders')
  await expect(page.locator('.detail-meta')).toContainText('Mounting holder')
  await expect(page.locator('.product-overview')).toContainText(interfaceCopy('en').aluminiumReview)
})

test('RFQ carries only verified content and correct product line; separate holder fields reach the request', async ({
  page,
}) => {
  let body: any
  await page.route('**/api/inquiry-session', (r) => r.fulfill({ json: { sessionToken: 'test-session' } }))
  await page.route('**/api/inquiry-submit', (r) => {
    body = r.request().postDataJSON()
    return r.fulfill({ status: 202, json: { accepted: true } })
  })
  await page.goto('/en/materials/pbt')
  await page.locator('.article-aside .button').click()
  await expect(page.locator('.form-context')).toContainText('PBT')
  await expect(page.getByRole('radio', { name: 'Industrial strip brushes', exact: true })).toBeChecked()
  await page.locator('.rfq-form details').first().locator('summary').click()
  await page.locator('input[name="rfq.holderShape"]').fill('H section; drawing to follow')
  await page.locator('input[name="rfq.holderMaterial"]').fill('Please advise')
  await page.locator('input[name="rfq.channelMaterial"]').fill('Steel, grade to confirm')
  await page.locator('input[name="name"]').fill('Local test')
  await page.locator('input[name="email"]').fill('seo-test@example.com')
  await page.locator('textarea[name="message"]').fill('Please review the component drawing for our machine.')
  await page.locator('input[name="consent"]').check()
  await page.locator('button[type="submit"]').click()
  await expect(page.locator('.form-success')).toBeVisible()
  expect(body.rfq).toMatchObject({
    context: { kind: 'materials', slug: 'pbt' },
    holderMaterial: 'Please advise',
    channelMaterial: 'Steel, grade to confirm',
  })
  await page.goto('/en/rfq?line=brushes&context=materials%2Fpbt&email=discard-me')
  await page.locator('.language-switch summary').click()
  const translated = page.locator('.language-options a[lang="de"]')
  await expect(translated).toHaveAttribute('href', '/de/rfq?line=brushes&context=materials%2Fpbt')
  await translated.click()
  await expect(page.locator('.form-context')).toContainText('PBT')
  await page.goto('/en/rfq?line=sealing&product=brush-holders&context=inquiries/private')
  await expect(page.getByRole('radio', { name: 'Industrial strip brushes', exact: true })).toBeChecked()
  await expect(page.locator('.form-context')).toHaveCount(0)
  await page.goto('/en/rfq?product=not-a-real-product&context=materials/not-a-real-material')
  await expect(page.locator('.form-product, .form-context')).toHaveCount(0)
})

test('category and scenario have independent procurement tasks; old family references remain', async ({
  page,
}) => {
  await page.goto('/en/sealing/sponge-rubber-seals')
  await expect(page.locator('h1')).toContainText('Selection guide')
  await expect(page.locator('#specification-path a[href$="/products/solid-rubber-profiles"]')).toHaveCount(1)
  await page.goto('/en/cases/scenario-enclosure-door-leaks')
  await expect(page.locator('.procurement-inputs')).toContainText('Blank investigation record')
  await expect(page.locator('#approach, #deliverables')).toHaveCount(0)
  await expect(page.locator('main a[href$="/solutions/enclosure-door-leaks"]')).toHaveCount(1)
  await page.goto('/en/products/custom-molded-rubber-parts')
  await expect(page.locator('.product-facts')).toContainText('RUB-001')
})

test('all localized supplier records are blank templates, not inspection results', async ({ request }) => {
  for (const locale of locales) {
    const response = await request.get(`/downloads/${locale}/supplier-review-record.txt`)
    expect(response.status()).toBe(200)
    expect(await response.text()).toContain(interfaceCopy(locale).blankRecordBody)
    const brush = await request.get(`/downloads/${locale}/strip-brush-rfq-checklist.txt`)
    expect(await brush.text()).toContain(interfaceCopy(locale).holderMaterial)
  }
})

test('core pages fit mobile and desktop, preserving keyboard-accessible enquiry controls', async ({
  page,
}) => {
  for (const width of [390, 1280]) {
    await page.setViewportSize({ width, height: 844 })
    for (const locale of ['en', 'de', 'ja', 'zh-Hant'] as const) {
      for (const path of ['', '/materials/epdm', '/products/brush-holders', '/rfq?context=materials%2Fpbt']) {
        await page.goto(`/${locale}${path}`)
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
          `${locale}${path} ${width}`,
        ).toBe(true)
        if (locale === 'en' || locale === 'de')
          await page.screenshot({
            path: `.local/seo-geo-ui/${locale}-${width}-${path.startsWith('/products') ? 'holder' : path.startsWith('/materials') ? 'material' : path.startsWith('/rfq') ? 'rfq' : 'home'}.png`,
            fullPage: true,
          })
        if (!path) await expect(page.locator('h1')).toHaveText(interfaceCopy(locale).productIdentity)
      }
    }
  }
  await page.goto('/en/rfq')
  await page.locator('input[name="name"]').focus()
  await expect(page.locator('input[name="name"]')).toBeFocused()
})
