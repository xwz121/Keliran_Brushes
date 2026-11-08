import type { Locale } from '@/lib/locales'
import { interfaceCopy } from '@/lib/interface-copy'
export function InquiryNextSteps({ locale }: { locale: Locale }) {
  const u = interfaceCopy(locale)
  return (
    <div className="inquiry-next-steps">
      <h3>{u.nextTitle}</h3>
      <ol>
        {[u.nextReview, u.nextQuote, u.nextSample].map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
    </div>
  )
}
