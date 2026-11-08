import type { SiteSetting } from '@/payload-types'
import type { Locale } from './locales'
import { interfaceCopy } from './interface-copy'
import { localizedAddress, localizedEntityName, localizedJurisdiction } from './business-i18n'
const oneLine = (value: string) =>
  value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join(', ')
// Statutory website disclosure for each entity the CMS lists with a registration number: name, number,
// place of registration and the address listed for it (for Keliran LTD this is its registered office).
// Entities without a registration number are described on the company pages, not in this line.
export function registeredEntityLines(settings: Partial<SiteSetting>, locale: Locale): string[] {
  const u = interfaceCopy(locale)
  return [
    [settings.legalEntity, settings.registrationNo, settings.registrationJurisdiction, settings.addressLines],
    [
      settings.secondaryLegalEntity,
      settings.secondaryRegistrationNo,
      settings.secondaryRegistrationJurisdiction,
      settings.secondaryAddressLines,
    ],
  ].flatMap(([name, number, jurisdiction, address]) =>
    name && number
      ? [
          [
            localizedEntityName(name, locale),
            `${u.registration}: ${number}`,
            jurisdiction ? localizedJurisdiction(jurisdiction, locale) : '',
            address ? `${u.registeredOffice}: ${oneLine(localizedAddress(address, locale))}` : '',
          ]
            .filter(Boolean)
            .join(' · '),
        ]
      : [],
  )
}
