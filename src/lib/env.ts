import { devPort, productionSiteURL } from './site'
export const isProductionDeployment =
  process.env.VERCEL_ENV === 'production' || process.env.DEPLOYMENT_ENV === 'production'
// Production always uses the launched domain: canonical URLs, CSRF origin
// validation and the hostname expected from Turnstile all depend on it.
// Preview deployments use their configured URL, then the stable branch URL.
export const siteURL = (
  isProductionDeployment
    ? productionSiteURL
    : process.env.NEXT_PUBLIC_SERVER_URL ||
      (process.env.VERCEL_BRANCH_URL ? `https://${process.env.VERCEL_BRANCH_URL}` : '') ||
      `http://127.0.0.1:${devPort}`
).replace(/\/$/, '')
// Browser origins allowed to post forms and use the admin. Outside production the
// same port is accepted on both loopback names, since cookies differ between them.
export const allowedOrigins = (() => {
  const origin = new URL(siteURL)
  if (isProductionDeployment || !['127.0.0.1', 'localhost'].includes(origin.hostname)) return [origin.origin]
  return ['127.0.0.1', 'localhost'].map((host) => `${origin.protocol}//${host}:${origin.port || devPort}`)
})()
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
