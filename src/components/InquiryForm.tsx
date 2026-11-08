'use client'
import { captureInquiryAttribution } from '@/lib/inquiry-attribution'
import { interfaceCopy } from '@/lib/interface-copy'
import { useEffect, useRef, useState } from 'react'
import Script from 'next/script'
import { ArrowUpRight, CheckCircle2 } from 'lucide-react'
import type { Locale } from '@/lib/locales'
import { CommercialFields, RfqField, SpecificationFields } from './rfq/TechnicalFields'
import { getDictionary } from '@/lib/i18n'
import { buildWhatsAppURL } from '@/lib/whatsapp'
import { WhatsAppButton } from './WhatsAppButton'
import { EmailText } from './EmailText'
import type { ContentContext } from '@/lib/content-context'
import { otherSiteURL, siteLine } from '@/lib/site'
declare global {
  interface Window {
    turnstile?: {
      render: (element: HTMLElement, options: Record<string, unknown>) => string
      reset: (id?: string) => void
      remove: (id: string) => void
    }
  }
}
export function InquiryForm({
  locale,
  productSlug,
  productTitle,
  productCode,
  technical = false,
  uploadsEnabled = false,
  whatsapp,
  contentContext,
  contextTitle,
}: {
  locale: Locale
  productSlug?: string
  productTitle?: string
  productCode?: string
  technical?: boolean
  uploadsEnabled?: boolean
  whatsapp?: string
  contentContext?: ContentContext
  contextTitle?: string
}) {
  const t = getDictionary(locale),
    u = interfaceCopy(locale)
  // Every enquiry on this site is for its own product line; there is no line to choose.
  const line = siteLine
  const selectedProduct = productSlug
  const [files, setFiles] = useState<File[]>([])
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [safety, setSafety] = useState('unsure')
  const signedUploads = useRef<any[]>([])
  const session = useRef('')
  const uploaded = useRef<{ key: string; name: string; size: number; type: string }[]>([])
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [token, setToken] = useState('')
  const [ready, setReady] = useState(false)
  const container = useRef<HTMLDivElement>(null)
  const widget = useRef<string | null>(null)
  const submission = useRef('')
  const success = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (status === 'success') success.current?.focus()
  }, [status])
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
  useEffect(() => {
    if (ready && siteKey && container.current && window.turnstile) {
      widget.current = window.turnstile.render(container.current, {
        sitekey: siteKey,
        language: locale,
        callback: setToken,
        'expired-callback': () => setToken(''),
      })
      return () => {
        if (widget.current) window.turnstile?.remove(widget.current)
      }
    }
  }, [ready, siteKey, locale])
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (status === 'sending') return
    setStatus('sending')
    setError('')
    const form = e.currentTarget
    const data = Object.fromEntries(new FormData(form))
    submission.current ||= crypto.randomUUID()
    try {
      if (technical && !session.current) {
        const res = await fetch('/api/inquiry-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ submissionId: submission.current, turnstileToken: token }),
        })
        const json = await res.json()
        if (!res.ok) throw Error(res.status === 429 ? u.formRateLimit : t.formError)
        session.current = json.sessionToken
      }
      if (technical && files.length && !uploaded.current.length) {
        if (!signedUploads.current.length) {
          const res = await fetch('/api/inquiry-upload/sign', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              submissionId: submission.current,
              sessionToken: session.current,
              files: files.map((f) => ({ name: f.name, size: f.size, type: f.type })),
            }),
          })
          const json = await res.json()
          if (!res.ok)
            throw Error(
              res.status === 401 ? u.formExpired : res.status === 429 ? u.formRateLimit : u.uploadError,
            )
          signedUploads.current = json.files
        }
        for (let i = 0; i < files.length; i++) {
          const signed = signedUploads.current[i]
          await new Promise<void>((resolve, reject) => {
            const xhr = new XMLHttpRequest()
            xhr.open('PUT', signed.url)
            xhr.setRequestHeader('Content-Type', signed.type)
            xhr.upload.onprogress = (e) => {
              if (e.lengthComputable) setProgress(Math.round(((i + e.loaded / e.total) / files.length) * 100))
            }
            xhr.onload = () =>
              xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(Error(u.uploadError))
            xhr.onerror = () => reject(Error(u.uploadError))
            xhr.timeout = 120000
            xhr.ontimeout = () => reject(Error(u.uploadError))
            xhr.send(files[i])
          })
        }
        uploaded.current = signedUploads.current.map(({ key, name, size, type }: any) => ({
          key,
          name,
          size,
          type,
        }))
      }
      const rfq = technical
        ? {
            line,
            context: contentContext,
            ...Object.fromEntries(
              Object.entries(data)
                .filter(([k]) => k.startsWith('rfq.'))
                .map(([k, v]) => [k.slice(4), v]),
            ),
          }
        : undefined
      const response = await fetch('/api/inquiry-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...Object.fromEntries(Object.entries(data).filter(([k]) => !k.startsWith('rfq.'))),
          line,
          attribution: captureInquiryAttribution(),
          ...(technical
            ? {
                sessionToken: session.current,
                rfq,
                safetyCritical: safety,
                attachments: uploaded.current,
              }
            : {}),
          consent: data.consent === 'on',
          productSlug: selectedProduct,
          locale,
          sourcePath: window.location.pathname,
          turnstileToken: token,
          submissionId: submission.current,
        }),
      })
      if (!response.ok) {
        const failure = await response.json().catch(() => ({}))
        // The other product line has its own site; never replay the submission there.
        if (failure?.code === 'line-moved') throw Error(u.lineMoved)
        if (response.status === 401) {
          session.current = ''
          uploaded.current = []
          submission.current = ''
          signedUploads.current = []
        }
        throw Error(
          response.status === 401
            ? u.formExpired
            : response.status === 429
              ? u.formRateLimit
              : response.status === 400
                ? u.formValidation
                : t.formError,
        )
      }
      setStatus('success')
      form.reset()
      session.current = ''
      uploaded.current = []
      setFiles([])
    } catch (err) {
      if (err instanceof Error && [u.formExpired, u.uploadError].includes(err.message)) {
        session.current = ''
        submission.current = ''
        uploaded.current = []
        signedUploads.current = []
        setProgress(0)
      }
      const messages = [
        u.formExpired,
        u.uploadError,
        u.formRateLimit,
        u.formValidation,
        u.lineMoved,
        t.formError,
      ]
      setError(err instanceof Error && messages.includes(err.message) ? err.message : t.formError)
      setStatus('error')
      window.turnstile?.reset(widget.current || undefined)
      setToken('')
    }
  }
  const drawingEmail = `mailto:contact@keliran.com?subject=${encodeURIComponent(`Keliran enquiry — ${submission.current || selectedProduct || 'RFQ'}`)}`
  const whatsappHref = (message: string) => (whatsapp ? buildWhatsAppURL(whatsapp, message) : null)
  const photosHref = whatsappHref(u.whatsappMessage)
  // Name the product the enquiry is about, with the same reference used on the page, in chats and quotes.
  const productReference = selectedProduct && (
    <p className="form-hint form-product">
      {u.productReference}: {productTitle || selectedProduct}
      {productCode ? ` · ${productCode}` : ''}
    </p>
  )
  const messageHint = technical ? u.rfqMessageHintBrushes : t.messageHint
  if (status === 'success') {
    const followUp = whatsappHref(u.whatsappSubmittedMessage.replace('{ref}', submission.current))
    return (
      <div className="form-success" role="status" tabIndex={-1} ref={success}>
        <CheckCircle2 size={30} />
        <h3>{t.success}</h3>
        <p>{u.successNext}</p>
        <p className="inquiry-reference">
          {u.inquiryReference}: <strong>{submission.current}</strong>
        </p>
        <div className="drawing-links">
          {followUp && (
            <WhatsAppButton
              variant="compact"
              href={followUp}
              label={u.whatsappPhotos}
              hint={u.whatsappOpens}
            />
          )}
          <a className="text-link" href={drawingEmail}>
            {u.emailDrawings} <ArrowUpRight size={18} />
          </a>
        </div>
      </div>
    )
  }
  const contactRow = (
    <div className="form-row">
      <label>
        {t.name} <span>*</span>
        <input name="name" autoComplete="name" required maxLength={120} />
      </label>
      <label>
        {t.email} <span>*</span>
        <input name="email" type="email" autoComplete="email" required maxLength={254} />
      </label>
    </div>
  )
  const companyRow = (
    <div className="form-row">
      <label>
        {t.company}
        <input name="company" autoComplete="organization" maxLength={160} />
      </label>
      <label>
        {t.country}
        <input name="country" autoComplete="country-name" maxLength={100} />
      </label>
    </div>
  )
  const messageField = (
    <label>
      {technical ? u.rfqMessage : t.message} <span>*</span>
      <textarea
        name="message"
        rows={technical ? 5 : 6}
        required
        minLength={10}
        maxLength={5000}
        placeholder={messageHint}
      />
    </label>
  )
  return (
    <form
      className={`inquiry-form${technical ? ' rfq-form' : ''}`}
      onInvalid={(e) => {
        const field = e.target as HTMLInputElement
        field.setAttribute('aria-invalid', 'true')
      }}
      onInput={(e) => {
        const field = e.target as HTMLInputElement
        field.removeAttribute('aria-invalid')
      }}
      onSubmit={submit}
    >
      {!technical && productReference}
      {technical && contentContext && contextTitle && (
        <p className="form-hint form-context">
          {u.contextLabel}: {contextTitle}
        </p>
      )}
      {technical && productReference}
      <fieldset disabled={status === 'sending'} className="contact-fields">
        {technical ? (
          <>
            {messageField}
            <RfqField name="quantity" locale={locale} />
            {contactRow}
          </>
        ) : (
          <>
            {contactRow}
            {companyRow}
            {messageField}
          </>
        )}
      </fieldset>
      {technical && (
        <fieldset disabled={status === 'sending'} className="rfq-optional">
          <details className="technical-details">
            <summary>{u.moreTechnical}</summary>
            <SpecificationFields locale={locale} />
          </details>
          <details className="technical-details">
            <summary>{u.commercialDetails}</summary>
            {companyRow}
            <CommercialFields locale={locale} />
          </details>
          <details className="technical-details">
            <summary>{u.drawingsReview}</summary>
            <div className="upload-box">
              {uploadsEnabled ? (
                <label>
                  {u.attachDrawings}
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.dxf,.dwg,.step,.stp,.iges,.igs,.png,.jpg,.jpeg,.webp"
                    onChange={(e) => {
                      const selected = Array.from(e.target.files || [])
                      uploaded.current = []
                      signedUploads.current = []
                      setProgress(0)
                      if (session.current) {
                        session.current = ''
                        submission.current = ''
                        setToken('')
                        window.turnstile?.reset(widget.current || undefined)
                      }
                      if (selected.length > 5 || selected.some((f) => f.size > 10 * 1024 * 1024 || !f.size)) {
                        setError(u.filesLimit)
                        e.target.value = ''
                        setFiles([])
                        return
                      }
                      setFiles(selected)
                      setError('')
                    }}
                  />
                </label>
              ) : (
                <>
                  <p className="upload-title">{u.attachDrawings}</p>
                  <p className="form-hint">{u.filesEmail}</p>
                </>
              )}
              {uploadsEnabled && <p className="form-hint">{u.filesHelp}</p>}
              {!uploadsEnabled && (
                <div className="drawing-links">
                  {photosHref && (
                    <WhatsAppButton
                      variant="compact"
                      href={photosHref}
                      label={u.whatsappPhotos}
                      hint={u.whatsappOpens}
                    />
                  )}
                  <a className="text-link" href={drawingEmail}>
                    {u.emailDrawings} <ArrowUpRight size={18} />
                  </a>
                </div>
              )}
              {files.length > 0 && (
                <ul>
                  {files.map((f) => (
                    <li key={f.name}>
                      {f.name} ({(f.size / 1024).toFixed(0)} KB)
                    </li>
                  ))}
                </ul>
              )}
              {status === 'sending' && files.length > 0 && (
                <progress
                  className="upload-progress"
                  max="100"
                  value={progress}
                  aria-label={u.uploadProgress}
                />
              )}
            </div>
            <p className="form-hint nda-note">
              <EmailText text={u.ndaNote} />
            </p>
            <label>
              {u.safetyQuestion}
              <select value={safety} onChange={(e) => setSafety(e.target.value)}>
                <option value="unsure">{u.safetyUnsure}</option>
                <option value="no">{u.safetyNo}</option>
                <option value="yes">{u.safetyYes}</option>
              </select>
            </label>
            {safety === 'yes' && <p className="safety-note">{u.safetyNote}</p>}
          </details>
        </fieldset>
      )}
      <div className="honeypot" aria-hidden="true">
        <label>
          Website
          <input name="website" autoComplete="off" tabIndex={-1} />
        </label>
      </div>
      <p className="form-hint source-notice">{u.sourceNotice}</p>
      <label className="consent-row">
        <input name="consent" type="checkbox" required />
        <span>
          {t.privacyConsent}{' '}
          <a href={`/${locale}/privacy`} target="_blank" rel="noopener noreferrer">
            {t.privacy} ↗
          </a>
        </span>
      </label>
      {siteKey && (
        <>
          <Script
            src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
            onReady={() => setReady(true)}
          />
          <div ref={container} />
        </>
      )}
      {(status === 'error' || error) && (
        <p className="form-error" role="alert">
          {error || t.formError}
          {error === u.lineMoved && (
            <>
              {' '}
              <a href={`${otherSiteURL}/${locale}/rfq`}>{otherSiteURL.replace(/^https:\/\//, '')}</a>
            </>
          )}
        </p>
      )}
      <button
        className="button"
        type="submit"
        disabled={status === 'sending' || Boolean(siteKey && !token && !session.current)}
      >
        {status === 'sending' ? t.sending : t.submit}
        <ArrowUpRight size={20} />
      </button>
    </form>
  )
}
