'use client'
import { useTheme } from '@payloadcms/ui'
export function AdminLogo() {
  const { theme } = useTheme()
  return (
    <img
      src={`/brand/1.2x/keliran-${theme === 'dark' ? 'dark' : 'light'}.svg`}
      width={760}
      height={240}
      alt="Keliran"
      style={{ width: 230, maxWidth: '100%', height: 'auto' }}
    />
  )
}

export function AdminIcon() {
  return <img src="/brand/1.2x/keliran-symbol.svg" width={26} height={26} alt="Keliran" />
}
