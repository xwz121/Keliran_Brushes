'use client'
import { useEffect, useState } from 'react'
import { captureInquiryAttribution, isWhatsAppVisit } from '@/lib/inquiry-attribution'
import { interfaceCopy } from '@/lib/interface-copy'
import type { Locale } from '@/lib/locales'
import { WhatsAppButton } from './WhatsAppButton'
// Buyers who arrive from a link shared in a WhatsApp chat already have a conversation: they are told to
// continue it rather than re-enter the requirement in a form.
export function ContinueChatNotice({ locale, href }: { locale: Locale; href?: string | null }) {
  const [show, setShow] = useState(false)
  useEffect(() => {
    setShow(isWhatsAppVisit(captureInquiryAttribution()?.source))
  }, [])
  if (!show || !href) return null
  const u = interfaceCopy(locale)
  return (
    <aside className="chat-continue">
      <p className="chat-continue-title">{u.chatContinueTitle}</p>
      <p>{u.chatContinueBody}</p>
      <WhatsAppButton variant="compact" href={href} label={u.chatContinueCta} hint={u.whatsappOpens} />
    </aside>
  )
}
