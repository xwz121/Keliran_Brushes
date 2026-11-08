import type { SiteSetting } from '@/payload-types'
import { buildWhatsAppURL, formatWhatsAppNumber } from './whatsapp'
export type WhatsAppContact = { number: string; display: string; href: string }
export function phoneNumbers(settings: Partial<SiteSetting>) {
  return [...new Set([settings.phone, settings.phoneSecondary].filter((v): v is string => Boolean(v)))]
}
// The owner's WhatsApp Business account is registered only on this number (confirmed 2026-09-24).
// When the CMS lists it, it is the single WhatsApp contact and other listed numbers stay phone-only;
// without it, the CMS numbers are used in their CMS order. The CMS still decides whether WhatsApp is shown.
export const whatsappBusinessNumber = '8617509072335'
const isBusiness = (number: string) => number.replace(/\D/g, '') === whatsappBusinessNumber
export function whatsappContacts(settings: Partial<SiteSetting>, message: string): WhatsAppContact[] {
  if (!settings.whatsappEnabled) return []
  const numbers = [
    ...new Set(
      [settings.whatsappNumber, settings.whatsappNumberSecondary].filter((v): v is string => Boolean(v)),
    ),
  ]
  const business = numbers.find(isBusiness)
  return (business ? [business] : numbers).flatMap((number) => {
    const href = buildWhatsAppURL(number, message)
    return href
      ? [{ number: `+${number.replace(/\D/g, '')}`, display: formatWhatsAppNumber(number), href }]
      : []
  })
}
export function primaryWhatsApp(settings: Partial<SiteSetting>, message: string) {
  return whatsappContacts(settings, message)[0] || null
}
