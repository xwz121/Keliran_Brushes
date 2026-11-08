import { whatsappBusinessNumber } from '../../src/lib/contact-channels'
// WhatsApp Business is registered only on the primary number; the UK number is phone-only.
export const primaryNumber = whatsappBusinessNumber
export const approvedNumbers = ['8617509072335', '447536120830']
export const approvedLink = /^https:\/\/wa\.me\/(8617509072335|447536120830)\?/
export const numberOf = (href: string | null) => href?.match(/wa\.me\/(\d+)/)?.[1] || ''
