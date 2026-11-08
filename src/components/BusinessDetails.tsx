import type { SiteSetting } from '@/payload-types'
import type { Locale } from '@/lib/locales'
import { interfaceCopy } from '@/lib/interface-copy'
import {
  localizedAddress,
  localizedCountry,
  localizedEntityName,
  localizedJurisdiction,
} from '@/lib/business-i18n'
export function BusinessDetails({ settings, locale }: { settings: Partial<SiteSetting>; locale: Locale }) {
  const c = interfaceCopy(locale)
  const entities = [
    {
      name: settings.legalEntity,
      address: settings.addressLines,
      country: settings.addressCountry,
      registration: settings.registrationNo,
      jurisdiction: settings.registrationJurisdiction,
    },
    {
      name: settings.secondaryLegalEntity,
      address: settings.secondaryAddressLines,
      country: settings.secondaryAddressCountry,
      registration: settings.secondaryRegistrationNo,
      jurisdiction: settings.secondaryRegistrationJurisdiction,
    },
  ].filter((e) => e.name)
  return (
    <div className="business-details">
      {entities.map((e) => {
        const name = localizedEntityName(e.name, locale)
        return (
          <section key={e.name}>
            <h3>{name}</h3>
            {/* A translated name is a reading aid; keep the registered form visible for verification. */}
            {name !== e.name && (
              <p className="registered-name small-text">
                {c.registeredName}: <span lang="zh-Hans">{e.name}</span>
              </p>
            )}
            {e.address && (
              <address>
                {localizedAddress(e.address, locale)}
                <br />
                {localizedCountry(e.country, locale)}
              </address>
            )}
            {e.registration && (
              <p>
                {c.registration}: {e.registration}
                {e.jurisdiction ? ` · ${localizedJurisdiction(e.jurisdiction, locale)}` : ''}
              </p>
            )}
          </section>
        )
      })}
      {settings.vatNo && (
        <p>
          {c.vat}: {settings.vatNo}
        </p>
      )}
    </div>
  )
}
