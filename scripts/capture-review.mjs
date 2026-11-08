import { chromium } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
const browser = await chromium.launch({ channel: 'chrome' })
const context = await browser.newContext({
  storageState: '.local/review-state.json',
  viewport: { width: 1440, height: 1000 },
  deviceScaleFactor: 1,
  // Full-page captures do not scroll, so below-the-fold reveals would stay at their start state.
  reducedMotion: 'reduce',
})
const page = await context.newPage()
await mkdir('docs/review', { recursive: true })
for (const [name, path, width] of [
  ['home-desktop', '/en', 1440],
  ['home-mobile', '/en', 390],
  ['brushes-desktop', '/en/strip-brushes', 1440],
  ['rfq-mobile', '/en/rfq?line=brushes', 390],
]) {
  await page.setViewportSize({ width, height: 1000 })
  await page.goto(`http://127.0.0.1:3200${path}`, { waitUntil: 'networkidle' })
  await page.screenshot({ path: `docs/review/${name}.png`, fullPage: true })
  console.log(`${name}: ${await page.title()}`)
}
await browser.close()
