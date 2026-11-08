import type { Locale } from './locales'
// Reading aids for the owner-provided business profile in each site language. The CMS keeps the
// registered values (and content/business-profile.json is part of the approved release manifest, so
// it is not edited); unknown values render exactly as entered.
const normalize = (value: string) => value.replace(/\r\n/g, '\n').trim()
const shanghaiName = '上海柯立然科技有限公司'
// Pinyin of 柯立然 is "Keliran": a translation for readers, not a separately registered name.
const shanghaiNameIntl = 'Shanghai Keliran Technology Co., Ltd.'
const shanghaiStreet = 'No. 33 Shenhong Road, Minhang District, Shanghai'
const latin = (value: string) => ({ en: value, fr: value, de: value, es: value, it: value, ko: value })
const names: Record<string, Partial<Record<Locale, string>>> = {
  // Japanese and Traditional Chinese readers get the registered characters unchanged.
  [shanghaiName]: latin(shanghaiNameIntl),
}
const addresses: Record<string, Partial<Record<Locale, string>>> = {
  [`${shanghaiStreet}\n上海市闵行区申虹路33号`]: {
    ...latin(shanghaiStreet),
    ja: '上海市閔行区申虹路33号',
    'zh-Hant': '上海市閔行區申虹路33號',
  },
}
const jurisdictions: Record<string, Partial<Record<Locale, string>>> = {
  'England and Wales': {
    fr: 'Angleterre et pays de Galles',
    de: 'England und Wales',
    es: 'Inglaterra y Gales',
    it: 'Inghilterra e Galles',
    ja: 'イングランドおよびウェールズ',
    ko: '잉글랜드 및 웨일스',
    'zh-Hant': '英格蘭及威爾斯',
  },
}
const regions: Record<string, string> = { China: 'CN', 'United Kingdom': 'GB' }
const pick = (table: Record<string, Partial<Record<Locale, string>>>, value: string, locale: Locale) =>
  table[normalize(value)]?.[locale] ?? value
export function localizedEntityName(value: string | null | undefined, locale: Locale) {
  return value ? pick(names, value, locale) : ''
}
export function localizedAddress(value: string | null | undefined, locale: Locale) {
  return value ? pick(addresses, value, locale) : ''
}
export function localizedJurisdiction(value: string | null | undefined, locale: Locale) {
  return value ? pick(jurisdictions, value, locale) : ''
}
export function countryCode(value: string | null | undefined) {
  return value ? regions[normalize(value)] : undefined
}
export function localizedCountry(value: string | null | undefined, locale: Locale) {
  if (!value) return ''
  const code = countryCode(value)
  return code ? new Intl.DisplayNames([locale], { type: 'region' }).of(code) || value : value
}
