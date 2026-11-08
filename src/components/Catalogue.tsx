'use client'
import { materialName } from '@/lib/material-names'
import { useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'
import type { Product } from '@/lib/preview-data'
import type { Locale } from '@/lib/locales'
import { getDictionary } from '@/lib/i18n'
import { ProductCard } from './ProductCard'
export function Catalogue({ products, locale }: { products: Product[]; locale: Locale }) {
  const t = getDictionary(locale)
  // Search and filters only help on longer lists; a short entry list is shown as-is.
  const showControls = products.length > 6
  const [q, setQ] = useState('')
  const [material, setMaterial] = useState('')
  const [category, setCategory] = useState('')
  const filtered = useMemo(
    () =>
      products.filter(
        (p) =>
          (!material || p.materials.includes(material)) &&
          (!category || p.category === category) &&
          `${p.code} ${p.title} ${p.summary} ${p.materials.join(' ')} ${p.materials.map((m) => materialName(m, locale)).join(' ')}`
            .toLocaleLowerCase()
            .includes(q.trim().toLocaleLowerCase()),
      ),
    [products, q, material, category, locale],
  )
  return (
    <>
      {showControls && (
        <div className="catalogue-filters">
          <label className="search-field">
            <Search size={19} />
            <input
              type="search"
              placeholder={t.search}
              aria-label={t.search}
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </label>
          <select aria-label={t.materialLabel} value={material} onChange={(e) => setMaterial(e.target.value)}>
            <option value="">{t.allMaterials}</option>
            {Array.from(new Set(products.flatMap((p) => p.materials))).map((m) => (
              <option key={m} value={m}>
                {materialName(m, locale)}
              </option>
            ))}
          </select>
          <select aria-label={t.categoryLabel} value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">{t.allCategories}</option>
            {Array.from(new Set(products.map((p) => p.category)))
              .filter(Boolean)
              .map((c) => (
                <option key={c}>{c}</option>
              ))}
          </select>
        </div>
      )}
      {showControls && (
        <div className="results-row">
          <span aria-live="polite">
            {new Intl.NumberFormat(locale).format(filtered.length)}{' '}
            {filtered.length === 1
              ? {
                  en: 'product',
                  fr: 'produit',
                  de: 'Produkt',
                  es: 'producto',
                  it: 'prodotto',
                  ja: t.results,
                  ko: t.results,
                  'zh-Hant': t.results,
                }[locale]
              : t.results}
          </span>
          {(q || material || category) && (
            <button
              className="reset-button"
              onClick={() => {
                setQ('')
                setMaterial('')
                setCategory('')
              }}
            >
              {t.reset}
              <X size={15} />
            </button>
          )}
        </div>
      )}
      <div className="product-grid catalogue-grid" data-motion="stagger">
        {filtered.map((p, i) => (
          <ProductCard product={p} index={i} locale={locale} key={p.id} />
        ))}
      </div>
      {!filtered.length && <div className="empty-state">{t.empty}</div>}
    </>
  )
}
