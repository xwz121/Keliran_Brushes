export const isProductionDeployment =
  process.env.VERCEL_ENV === 'production' || process.env.DEPLOYMENT_ENV === 'production'
// The production domain is part of this release, including canonical URLs,
// CSRF origin validation and the hostname expected from Turnstile.
export const siteURL = (
  isProductionDeployment
    ? 'https://keliran.com'
    : process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
).replace(/\/$/, '')
export const noIndexSite = !isProductionDeployment
export const previewMode = process.env.CONTENT_PREVIEW_MODE === 'true' && !isProductionDeployment
export function serviceStatus() {
  return {
    database: Boolean(process.env.DATABASE_URL),
    storage: ['R2_BUCKET', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_ENDPOINT', 'R2_PUBLIC_URL'].every(
      (k) => Boolean(process.env[k]),
    ),
    ai: Boolean(process.env.OPENAI_API_KEY),
    email: ['RESEND_API_KEY', 'EMAIL_FROM', 'SALES_EMAIL'].every((k) => Boolean(process.env[k])),
    turnstile: Boolean(process.env.TURNSTILE_SECRET_KEY && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY),
    preview: previewMode,
  }
}
