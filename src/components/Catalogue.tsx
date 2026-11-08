'use client'
import { materialName } from '@/lib/material-names'
import { useEffect, useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'
import type { Product } from '@/lib/preview-data'
import type { Locale } from '@/lib/locales'
import { getDictionary } from '@/lib/i18n'
import { siteCopy } from '@/lib/site-copy'
import { ProductCard } from './ProductCard'
export function Catalogue({
  products,
  locale,
  initialLine = '',
  defaultLine = '',
}: {
  products: Product[]
  locale: Locale
  initialLine?: string
  // Server-read ?line= so the first render is already filtered (no 16 → 4 card jump after hydration).
  defaultLine?: string
}) {
  const t = getDictionary(locale)
  const c = siteCopy(locale)
  const [line, setLine] = useState(initialLine || defaultLine)
  useEffect(() => {
    if (!initialLine && !defaultLine) {
      const value = new URLSearchParams(window.location.search).get('line')
      if (value === 'sealing' || value === 'brushes') setLine(value)
    }
  }, [initialLine, defaultLine])
  // Search and filters only help on longer lists; a short entry list is shown as-is.
  const showControls = products.length > 6
  const [q, setQ] = useState('')
  const [material, setMaterial] = useState('')
  const [category, setCategory] = useState('')
  const filtered = useMemo(
    () =>
      products.filter(
        (p) =>
          (!line || p.line === line) &&
          (!material || p.materials.includes(material)) &&
          (!category || p.category === category) &&
          `${p.code} ${p.title} ${p.summary} ${p.materials.join(' ')} ${p.materials.map((m) => materialName(m, locale)).join(' ')}`
            .toLocaleLowerCase()
            .includes(q.trim().toLocaleLowerCase()),
      ),
    [products, q, material, category, line, locale],
  )
  return (
    <>
      {!initialLine && (
        <div className="line-tabs" role="group" aria-label={c.lineLabel}>
          {[
            ['', c.all],
            ['sealing', c.sealing],
            ['brushes', c.brushes],
          ].map(([value, label]) => (
            <button
              type="button"
              aria-pressed={line === value}
              key={value}
              onClick={() => {
                setLine(value)
                setMaterial('')
                setCategory('')
                const u = new URL(window.location.href)
                value ? u.searchParams.set('line', value) : u.searchParams.delete('line')
                window.history.replaceState(null, '', u)
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}
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
            {Array.from(
              new Set(products.filter((p) => !line || p.line === line).flatMap((p) => p.materials)),
            ).map((m) => (
              <option key={m} value={m}>
                {materialName(m, locale)}
              </option>
            ))}
          </select>
          <select aria-label={t.categoryLabel} value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">{t.allCategories}</option>
            {Array.from(new Set(products.filter((p) => !line || p.line === line).map((p) => p.category)))
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
          {(q || material || category || (!initialLine && line)) && (
            <button
              className="reset-button"
              onClick={() => {
                setQ('')
                setLine(initialLine)
                if (!initialLine) {
                  const url = new URL(window.location.href)
                  url.searchParams.delete('line')
                  window.history.replaceState(null, '', url)
                }
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
