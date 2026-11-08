import Link from 'next/link'
import Image from 'next/image'
import { materialName } from '@/lib/material-names'
import { ArrowUpRight } from 'lucide-react'
import type { Product } from '@/lib/preview-data'
import type { Locale } from '@/lib/locales'
import { getDictionary } from '@/lib/i18n'
export function ProductCard({
  product,
  locale,
  index = 0,
}: {
  product: Product
  locale: Locale
  index?: number
}) {
  const t = getDictionary(locale)
  return (
    <Link href={`/${locale}/products/${product.slug}`} className="product-card">
      <div className="product-card-top">
        <span className="product-index">{String(index + 1).padStart(2, '0')}</span>
        <span className="product-code">{product.code}</span>
      </div>
      {product.image && (
        <div className="product-card-image">
          <Image
            src={product.image}
            width={640}
            height={427}
            alt={product.imageAlt || product.title}
            sizes="(max-width:671px) 100vw, (max-width:1055px) 50vw, 33vw"
          />
          {product.illustrative && <span>{t.renderNote}</span>}
        </div>
      )}
      <div className="product-card-content">
        <h3>{product.title}</h3>
        <p>{product.summary}</p>
        <div className="material-tags">
          {product.materials.map((m) => (
            <span key={m}>{materialName(m, locale)}</span>
          ))}
        </div>
      </div>
      <div className="product-card-bottom">
        <span>{t.viewProduct}</span>
        <ArrowUpRight size={20} />
      </div>
    </Link>
  )
}
