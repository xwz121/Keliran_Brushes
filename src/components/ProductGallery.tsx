'use client'
import Image from 'next/image'
import { useState } from 'react'
export function ProductGallery({
  images,
  caption,
}: {
  images: { url: string; alt: string; illustrative: boolean }[]
  caption: string
}) {
  const [index, setIndex] = useState(0)
  const selected = images[index]
  if (!selected) return <div className="detail-visual" />
  return (
    <div className="product-gallery">
      <figure className="detail-visual">
        <Image
          src={selected.url}
          alt={selected.alt}
          width={1536}
          height={1024}
          sizes="(max-width: 900px) 100vw, 50vw"
          priority
        />
        {selected.illustrative && <figcaption>{caption}</figcaption>}
      </figure>
      {images.length > 1 && (
        <div className="gallery-thumbnails">
          {images.map((img, i) => (
            <button
              key={img.url}
              aria-label={img.alt || `${i + 1}`}
              aria-pressed={i === index}
              onClick={() => setIndex(i)}
            >
              <Image src={img.url} alt="" width={120} height={90} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
