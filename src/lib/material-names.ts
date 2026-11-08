import { locales, type Locale } from './locales'
// Display names only: stored material values, filters and product references stay stable.
const names: Record<string, string[]> = {
  'EPDM sponge': [
    'EPDM sponge',
    'EPDM cellulaire',
    'EPDM-Moosgummi',
    'EPDM esponjoso',
    'EPDM espanso',
    'EPDMスポンジ',
    'EPDM 스펀지',
    'EPDM 發泡橡膠',
  ],
  'Silicone foam': [
    'Silicone foam',
    'Mousse de silicone',
    'Silikonschaum',
    'Espuma de silicona',
    'Schiuma di silicone',
    'シリコーンフォーム',
    '실리콘 폼',
    '矽膠發泡材料',
  ],
  Silicone: ['Silicone', 'Silicone', 'Silikon', 'Silicona', 'Silicone', 'シリコーン', '실리콘', '矽膠'],
  'PVC/TPE carrier': [
    'PVC/TPE carrier',
    'Support PVC/TPE',
    'PVC/TPE-Träger',
    'Soporte de PVC/TPE',
    'Supporto in PVC/TPE',
    'PVC/TPE保持部',
    'PVC/TPE 지지체',
    'PVC/TPE 支撐部',
  ],
}
export function materialName(value: string, locale: Locale) {
  return names[value]?.[locales.indexOf(locale)] || value
}
