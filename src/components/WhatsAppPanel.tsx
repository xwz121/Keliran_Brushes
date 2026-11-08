import type { Locale } from '@/lib/locales'
import type { WhatsAppContact } from '@/lib/contact-channels'
import { interfaceCopy } from '@/lib/interface-copy'
import { WhatsAppButton } from './WhatsAppButton'
export function WhatsAppPanel({
  contacts,
  locale,
  heading: Heading = 'h2',
}: {
  contacts: WhatsAppContact[]
  locale: Locale
  heading?: 'h2' | 'h3'
}) {
  const [primary, ...others] = contacts
  if (!primary) return null
  const u = interfaceCopy(locale)
  return (
    <section className="wa-panel">
      <Heading className="wa-panel-title">{u.whatsappPanelTitle}</Heading>
      <p className="wa-panel-body">{u.whatsappPanelBody}</p>
      <WhatsAppButton
        href={primary.href}
        label={u.whatsappCta}
        detail={primary.display}
        hint={u.whatsappOpens}
      />
      {others.map((c) => (
        <a key={c.number} className="wa-secondary" href={c.href} target="_blank" rel="noopener noreferrer">
          WhatsApp {c.display} <span aria-hidden="true">↗</span>
          <span className="visually-hidden"> ({u.whatsappOpens})</span>
        </a>
      ))}
    </section>
  )
}
