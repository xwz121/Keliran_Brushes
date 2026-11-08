import { describe, expect, it } from 'vitest'
import profile from '../content/business-profile.json'
import { locales } from '../src/lib/locales'
import {
  countryCode,
  localizedAddress,
  localizedCountry,
  localizedEntityName,
  localizedJurisdiction,
} from '../src/lib/business-i18n'
import { organizationData } from '../src/lib/jsonld'
describe('business profile reading aids', () => {
  it('translates the Shanghai entity and address for every locale without Simplified Chinese leaking', () => {
    for (const locale of locales) {
      const name = localizedEntityName(profile.legalEntity, locale)
      const address = localizedAddress(profile.addressLines, locale)
      expect(address).not.toContain('\n')
      expect(address).not.toContain('闵') // Simplified-only form of 閔
      if (locale === 'zh-Hant') expect(address).not.toMatch(/[区号]/)
      if (locale === 'ja' || locale === 'zh-Hant') expect(name).toBe('上海柯立然科技有限公司')
      else {
        expect(name).toBe('Shanghai Keliran Technology Co., Ltd.')
        expect(address).toBe('No. 33 Shenhong Road, Minhang District, Shanghai')
      }
    }
    expect(localizedAddress(profile.addressLines, 'zh-Hant')).toBe('上海市閔行區申虹路33號')
    expect(localizedAddress(profile.addressLines, 'ja')).toBe('上海市閔行区申虹路33号')
  })
  it('localizes countries and the jurisdiction, and leaves unknown CMS values as entered', () => {
    expect(localizedCountry(profile.addressCountry, 'zh-Hant')).toBe('中國')
    expect(localizedCountry(profile.secondaryAddressCountry, 'de')).toBe('Vereinigtes Königreich')
    expect(localizedJurisdiction(profile.secondaryRegistrationJurisdiction, 'fr')).toBe(
      'Angleterre et pays de Galles',
    )
    expect(localizedJurisdiction(profile.secondaryRegistrationJurisdiction, 'en')).toBe('England and Wales')
    expect(localizedEntityName('Keliran LTD', 'ja')).toBe('Keliran LTD')
    expect(localizedAddress('Some other street', 'fr')).toBe('Some other street')
    expect(localizedCountry('Atlantis', 'it')).toBe('Atlantis')
    expect(countryCode('China')).toBe('CN')
  })
  it('keeps the registered name in structured data next to the localized one', () => {
    const data = organizationData(profile, 'fr')
    expect(data.name).toBe('Shanghai Keliran Technology Co., Ltd.')
    expect(data.legalName).toBe('上海柯立然科技有限公司')
    expect(data.address).toMatchObject({ addressCountry: 'CN' })
  })
})
