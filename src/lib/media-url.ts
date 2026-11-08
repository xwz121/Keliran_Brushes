import { siteURL } from './env'
/** Keep local Payload uploads same-origin; R2 assets retain their public CDN URL. */
export function mediaURL(value?: string | null) {
  if (!value) return undefined
  const url = new URL(value, siteURL)
  return url.origin === new URL(siteURL).origin ? `${url.pathname}${url.search}` : url.href
}
