'use client'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { captureInquiryAttribution } from '@/lib/inquiry-attribution'
export function InquiryAttribution() {
  const pathname = usePathname()
  useEffect(() => {
    captureInquiryAttribution()
  }, [pathname])
  return null
}
