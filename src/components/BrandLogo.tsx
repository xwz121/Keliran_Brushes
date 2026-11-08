import Image from 'next/image'
export function BrandLogo({
  surface = 'light',
  footer = false,
}: {
  surface?: 'light' | 'dark'
  footer?: boolean
}) {
  return (
    <Image
      className={`brand-logo${footer ? ' brand-logo--footer' : ''}`}
      src={`/brand/1.2x/keliran-${surface}.svg`}
      alt="Keliran"
      width={760}
      height={240}
      preload={!footer}
      loading={footer ? 'eager' : undefined}
    />
  )
}
