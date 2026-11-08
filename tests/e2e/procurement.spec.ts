import { test, expect, type Page } from '@playwright/test'
import { locales } from '../../src/lib/locales'
import { interfaceCopy } from '../../src/lib/interface-copy'
import { getDictionary } from '../../src/lib/i18n'
import { numberOf, primaryNumber } from './whatsapp-numbers'
const noOverflow = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)
const productLd = (page: Page) =>
  page
    .locator('script[type="application/ld+json"]')
    .evaluateAll((els) =>
      els.map((el) => JSON.parse(el.textContent || '{}')).find((d) => d['@type'] === 'Product'),
    )

test('home names both product lines before the brand line and in the page title', async ({ page }) => {
  for (const locale of ['en', 'de', 'ja', 'zh-Hant'] as const) {
    const copy = interfaceCopy(locale)
    await page.goto(`/${locale}`)
    await expect(page.locator('.home-hero-copy > .eyebrow')).toHaveText(copy.productIdentity)
    await expect(page).toHaveTitle(`${copy.productIdentity} | Keliran`)
  }
})

test('product page states the family reference, supply status and supplier-review links', async ({
  page,
}) => {
  const copy = interfaceCopy('en')
  await page.goto('/en/products/sponge-rubber-seals')
  const facts = page.locator('.product-facts')
  await expect(facts.locator('dt')).toHaveText([copy.referenceLabel, copy.statusLabel])
  await expect(facts.locator('dd')).toHaveText(['SE02-CUSTOM', getDictionary('en').availability])
  await expect(page.locator('.product-detail-copy')).toContainText(copy.familyNote)
  // Structured data describes the family; no SKU or offer is invented for a quoted-to-specification part.
  const ld = await productLd(page)
  expect(ld.productID).toBe('SE02-CUSTOM')
  expect(ld).not.toHaveProperty('sku')
  expect(ld).not.toHaveProperty('offers')
  const review = page.locator('.supplier-review')
  await expect(review.locator('h2')).toHaveText(copy.supplierReviewTitle)
  const links = await review.locator('nav a').evaluateAll((els) => els.map((a) => a.getAttribute('href')))
  expect(links).toEqual(['/en/legal', '/en/guides/supplier-qualification', '/en/about'])
  for (const href of links) expect((await page.request.get(href!)).status(), href!).toBe(200)
  // The enquiry form and the chat both carry the same product reference.
  await expect(page.locator('.inquiry-form .form-product')).toHaveText(
    `${copy.productReference}: ${await page.locator('h1').innerText()} · SE02-CUSTOM`,
  )
  const chat = await page.locator('.inquiry-section .wa-panel .wa-button').getAttribute('href')
  expect(numberOf(chat)).toBe(primaryNumber)
  expect(decodeURIComponent(chat!.split('text=')[1])).toContain('(ref. SE02-CUSTOM)')
  await expect(page.locator('.chat-continue')).toHaveCount(0)
})

test('a link shared in a WhatsApp chat tells the buyer to continue there, across pages in the tab', async ({
  page,
}) => {
  const copy = interfaceCopy('en')
  await page.goto('/en/products/metal-channel-strip-brushes?utm_source=whatsapp&utm_medium=messaging')
  const notice = page.locator('.product-detail-copy .chat-continue')
  await expect(notice).toContainText(copy.chatContinueBody)
  const href = await notice.locator('.wa-button').getAttribute('href')
  expect(numberOf(href)).toBe(primaryNumber)
  expect(decodeURIComponent(href!.split('text=')[1])).toContain('BR01-CUSTOM')
  await page.goto('/en/rfq?product=metal-channel-strip-brushes')
  await expect(page.locator('.rfq-side .chat-continue')).toBeVisible()
  // Other sources never see it.
  await page.evaluate(() => sessionStorage.clear())
  await page.goto('/en/rfq?utm_source=facebook&utm_medium=organic_social')
  await expect(page.locator('.chat-continue')).toHaveCount(0)
})

test('RFQ names the selected product with its reference and offers a confidentiality route', async ({
  page,
}) => {
  const copy = interfaceCopy('en')
  await page.goto('/en/rfq?product=sponge-rubber-seals')
  await expect(page.locator('.rfq-form .form-product')).toContainText('· SE02-CUSTOM')
  const aside = page.locator('.rfq-aside .nda-note')
  await expect(aside).toContainText(copy.ndaNote)
  await expect(aside.locator('a')).toHaveAttribute('href', 'mailto:contact@keliran.com')
  await page.getByText(copy.drawingsReview, { exact: true }).click()
  await expect(page.locator('.rfq-form .nda-note')).toBeVisible()
  await expect(
    page.getByRole('textbox', { name: `${getDictionary('en').email} *`, exact: true }),
  ).toBeVisible()
})

test('footer carries the statutory company line in every language', async ({ page }) => {
  for (const locale of locales) {
    const copy = interfaceCopy(locale)
    await page.goto(`/${locale}/contact`)
    const legal = page.locator('.footer-legal')
    await expect(legal, locale).toContainText('Keliran LTD')
    await expect(legal, locale).toContainText(`${copy.registration}: 15698503`)
    await expect(legal, locale).toContainText(
      `${copy.registeredOffice}: 483 Green Lanes, London, England, N13 4BS`,
    )
  }
})

test('supplier guide and legal page give the company record and the payment check', async ({ page }) => {
  const copy = interfaceCopy('en')
  await page.goto('/en/guides/supplier-qualification')
  const record = page.locator('.article-aside .supplier-record')
  await expect(record).toContainText(copy.companyRecordTitle)
  await expect(record).toContainText('Keliran LTD')
  await expect(record.locator('.payment-check')).toContainText(copy.paymentCheckTitle)
  await page.goto('/en/legal')
  await expect(page.locator('.article-aside .payment-check')).toContainText(copy.paymentCheckBody)
  await page.goto('/en/privacy')
  await expect(page.locator('.payment-check')).toHaveCount(0)
})

test('printed product and supplier pages keep the content, source address and company line only', async ({
  page,
}) => {
  await page.emulateMedia({ media: 'print' })
  await page.goto('/en/products/sponge-rubber-seals')
  for (const hidden of ['.site-header', '.inquiry-section', '.footer-grid', '.supplier-review nav'])
    await expect(page.locator(hidden).first(), hidden).toBeHidden()
  await expect(page.locator('.product-facts')).toBeVisible()
  await expect(page.locator('.footer-legal')).toBeVisible()
  await expect(page.locator('.print-source')).toContainText('/en/products/sponge-rubber-seals')
  await page.goto('/en/guides/supplier-qualification')
  await expect(page.locator('.supplier-record')).toBeVisible()
  await page.emulateMedia({ media: 'screen' })
  await expect(page.locator('.print-source')).toBeHidden()
})

for (const width of [390, 1280])
  test(`new procurement blocks fit long languages at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 })
    for (const locale of ['de', 'fr', 'ja', 'ko']) {
      for (const path of [
        '/products/sponge-rubber-seals?utm_source=whatsapp',
        '/rfq?product=metal-channel-strip-brushes',
        '/guides/supplier-qualification',
        '/legal',
      ]) {
        await page.goto(`/${locale}${path}`)
        expect(await noOverflow(page), `${locale}${path}`).toBe(true)
      }
      await expect(page.locator('.footer-legal')).toBeVisible()
    }
  })
