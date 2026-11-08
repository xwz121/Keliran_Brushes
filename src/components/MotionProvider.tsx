'use client'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
// Loads the reveal engine after hydration, per page, and never for reduced-motion visitors.
export function MotionProvider() {
  const pathname = usePathname()
  useEffect(() => {
    // Nothing to animate (e.g. the RFQ and product pages): do not download the engine at all.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (!document.querySelector('[data-motion]')) return
    let live = true
    let stop: (() => void) | undefined
    import('@/lib/motion/engine')
      .then(({ startMotion }) => {
        if (live) stop = startMotion()
      })
      .catch(() => {})
    return () => {
      live = false
      stop?.()
    }
  }, [pathname])
  return null
}
