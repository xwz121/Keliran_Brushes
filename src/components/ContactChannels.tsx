import type { Locale } from '@/lib/locales'
import type { SiteSetting } from '@/payload-types'
import { phoneNumbers, primaryWhatsApp, whatsappContacts } from '@/lib/contact-channels'
import { formatWhatsAppNumber } from '@/lib/whatsapp'
import { interfaceCopy } from '@/lib/interface-copy'
import { WhatsAppButton } from './WhatsAppButton'
export function ContactChannels({ settings, locale }: { settings: Partial<SiteSetting>; locale: Locale }) {
  const c = interfaceCopy(locale)
  return (
    <div className="contact-channels">
      {settings.publicEmail && <a href={`mailto:${settings.publicEmail}`}>{settings.publicEmail}</a>}
      {phoneNumbers(settings).map((phone) => (
        <a key={phone} href={`tel:${phone.replace(/[^+\d]/g, '')}`} aria-label={`${c.phoneLabel} ${phone}`}>
          {formatWhatsAppNumber(phone)}
        </a>
      ))}
      {whatsappContacts(settings, c.whatsappMessage).map(({ number, display, href }) => (
        <a key={number} href={href} target="_blank" rel="noopener noreferrer">
          WhatsApp {display} <span aria-hidden="true">↗</span>
          <span className="visually-hidden"> ({c.whatsappOpens})</span>
        </a>
      ))}
      {settings.linkedinUrl && (
        <a href={settings.linkedinUrl} target="_blank" rel="noopener noreferrer">
          LinkedIn ↗
        </a>
      )}
      {settings.facebookUrl && (
        <a href={settings.facebookUrl} target="_blank" rel="noopener noreferrer">
          Facebook ↗
        </a>
      )}
    </div>
  )
}
// One tap straight to the primary number; shown on narrow screens where the header has no WhatsApp button.
export function WhatsAppFloat({ settings, locale }: { settings: Partial<SiteSetting>; locale: Locale }) {
  const c = interfaceCopy(locale)
  const primary = settings.whatsappFloating ? primaryWhatsApp(settings, c.whatsappMessage) : null
  return primary ? (
    <WhatsAppButton
      variant="float"
      href={primary.href}
      label="WhatsApp"
      ariaLabel={`${c.whatsappLabel} (${c.whatsappOpens})`}
    />
  ) : null
}
