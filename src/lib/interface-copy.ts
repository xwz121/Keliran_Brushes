import type { Locale } from './locales'
import en from './copy/en.json' with { type: 'json' }
import fr from './copy/fr.json' with { type: 'json' }
import de from './copy/de.json' with { type: 'json' }
import es from './copy/es.json' with { type: 'json' }
import it from './copy/it.json' with { type: 'json' }
import ko from './copy/ko.json' with { type: 'json' }
import ja from './copy/ja.json' with { type: 'json' }
import zh from './copy/zh-Hant.json' with { type: 'json' }
export type InterfaceCopy = typeof en
export const interfaceDictionaries: Record<Locale, InterfaceCopy> = {
  en,
  fr,
  de,
  es,
  it,
  ja,
  ko,
  'zh-Hant': zh,
}
export function interfaceCopy(locale: Locale): InterfaceCopy {
  return interfaceDictionaries[locale]
}
// Fills named placeholders such as {product} or {ref}; unknown placeholders are left visible.
export function fillCopy(template: string, values: Record<string, string>) {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match)
}
