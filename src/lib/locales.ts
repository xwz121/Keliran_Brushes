export const locales = ['en', 'fr', 'de', 'es', 'it', 'ja', 'ko', 'zh-Hant'] as const
export type Locale = (typeof locales)[number]
export const localeNames: Record<Locale, string> = {
  en: 'English',
  fr: 'Français',
  de: 'Deutsch',
  es: 'Español',
  it: 'Italiano',
  ja: '日本語',
  ko: '한국어',
  'zh-Hant': '繁體中文',
}
export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale)
}
export function asLocale(value: string): Locale {
  return isLocale(value) ? value : 'en'
}
export function localizedPath(path: string, locale: Locale): string {
  const [, current, ...rest] = path.split('/')
  return isLocale(current) ? `/${[locale, ...rest].join('/')}` : `/${locale}`
}
