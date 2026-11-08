import { test, expect } from '@playwright/test'
import { interfaceCopy } from '../../src/lib/interface-copy'
import { locales } from '../../src/lib/locales'

test('resource summary appears once and measurement downloads stay localized', async ({ page }) => {
  for (const locale of ['en', 'de', 'ja', 'zh-Hant']) {
    await page.goto(`/${locale}/guides/measure-strip-brush`)
    const summary = (await page.locator('.resource-summary').innerText()).trim()
    expect(await page.locator('article').innerText()).not.toContain(summary)
    const links = await page
      .locator('.article-aside nav a')
      .evaluateAll((nodes) => nodes.map((n) => n.getAttribute('href')))
    for (const link of links) await expect(page.locator(link!)).toHaveCount(1)
    await expect(page.locator('.guide-download a')).toHaveAttribute(
      'href',
      `/downloads/${locale}/strip-brush-rfq-checklist.txt`,
    )
    await expect(page.locator('main a[href$="/products/metal-channel-strip-brushes"]')).not.toHaveCount(0)
  }
})

test('material to product links have real targets and product breadcrumbs describe the same hierarchy', async ({
  page,
}) => {
  await page.goto('/en/materials/pbt')
  const links = await page
    .locator('#specification-path a')
    .evaluateAll((nodes) => nodes.map((n) => n.getAttribute('href')))
  expect(links.length).toBeGreaterThan(0)
  for (const link of links) expect((await page.request.get(link!)).status(), link!).toBe(200)
  await page.locator('#specification-path a[href$="/products/metal-channel-strip-brushes"]').click()
  await expect(page).toHaveURL(/\/products\/metal-channel-strip-brushes$/)
  const nodes = await page
    .locator('script[type="application/ld+json"]')
    .evaluateAll((els) => els.map((e) => JSON.parse(e.textContent || '{}')))
  const breadcrumb = nodes.find((n) => n['@type'] === 'BreadcrumbList')
  expect(breadcrumb.itemListElement).toHaveLength(3)
  expect(breadcrumb.itemListElement[1].item).toContain('/en/strip-brushes')
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
  await expect(page.getByRole('radio')).toHaveCount(0)
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
  expect(body.line).toBe('brushes')
  expect(body.rfq).toMatchObject({
    line: 'brushes',
    context: { kind: 'materials', slug: 'pbt' },
    holderMaterial: 'Please advise',
    channelMaterial: 'Steel, grade to confirm',
  })
  await page.goto('/en/rfq?context=materials%2Fpbt&email=discard-me')
  await page.locator('.language-switch summary').click()
  const translated = page.locator('.language-options a[lang="de"]')
  await expect(translated).toHaveAttribute('href', '/de/rfq?context=materials%2Fpbt')
  await translated.click()
  await expect(page.locator('.form-context')).toContainText('PBT')
  // A stale line parameter cannot relabel the enquiry; the real product still names it.
  await page.goto('/en/rfq?line=sealing&product=brush-holders&context=inquiries/private')
  await expect(page.locator('.form-product')).toContainText('BR04-CUSTOM')
  await expect(page.locator('.form-context')).toHaveCount(0)
  await page.goto('/en/rfq?product=not-a-real-product&context=materials/not-a-real-material')
  await expect(page.locator('.form-product, .form-context')).toHaveCount(0)
})

test('category guides keep their paths; sealing pages and shared-text canonicals point to keliran.com', async ({
  page,
}) => {
  await page.goto('/en/strip-brushes/metal-channel-strip-brushes')
  await expect(page.locator('h1')).toContainText('Selection guide')
  for (const path of ['/en/sealing', '/en/sealing/sponge-rubber-seals', '/en/products/sponge-rubber-seals'])
    expect((await page.request.get(path)).status(), path).toBe(404)
  await page.goto('/en/guides/rfq-checklist')
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://keliran.com/en/guides/rfq-checklist',
  )
  await page.goto('/en/guides/measure-strip-brush')
  await expect(page.locator('link[rel="canonical"]')).not.toHaveAttribute('href', /^https:\/\/keliran\.com\//)
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
      for (const path of ['', '/materials/pbt', '/products/brush-holders', '/rfq?context=materials%2Fpbt']) {
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
        if (!path) await expect(page.locator('h1')).toHaveText(interfaceCopy(locale).brushesTitle)
      }
    }
  }
  await page.goto('/en/rfq')
  await page.locator('input[name="name"]').focus()
  await expect(page.locator('input[name="name"]')).toBeFocused()
})
