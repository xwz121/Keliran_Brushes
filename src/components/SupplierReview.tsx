import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import type { Locale } from '@/lib/locales'
import type { SiteSetting } from '@/payload-types'
import { interfaceCopy } from '@/lib/interface-copy'
import { siteCopy } from '@/lib/site-copy'
import { BusinessDetails } from './BusinessDetails'
const supplierLinks = (locale: Locale) => {
  const u = interfaceCopy(locale),
    c = siteCopy(locale)
  return [
    [`/${locale}/legal`, u.companyInfo],
    [`/${locale}/guides/supplier-qualification`, c.supplier],
    [`/${locale}/about`, c.process],
  ] as const
}
// Payment details are only ever given in quotation and commercial documents; changes are verified first.
export function PaymentCheck({ locale }: { locale: Locale }) {
  const u = interfaceCopy(locale)
  return (
    <div className="payment-check">
      <h3>{u.paymentCheckTitle}</h3>
      <p>{u.paymentCheckBody}</p>
    </div>
  )
}
// A product page is often forwarded to quality, purchasing or finance colleagues: give them the
// supplier-review pages without a detour through the home page and without asking for their details.
export function SupplierReview({ locale }: { locale: Locale }) {
  const u = interfaceCopy(locale)
  return (
    <section className="container supplier-review" aria-labelledby="supplier-review-title">
      <div>
        <h2 id="supplier-review-title">{u.supplierReviewTitle}</h2>
        <p>{u.supplierReviewBody}</p>
      </div>
      <nav aria-labelledby="supplier-review-title">
        {supplierLinks(locale).map(([href, label]) => (
          <Link key={href} href={href} className="text-link">
            {label}
            <ArrowUpRight size={18} />
          </Link>
        ))}
      </nav>
    </section>
  )
}
// Supplier-qualification guide: the details a buyer copies into a supplier record, beside the guide.
export function SupplierRecord({ settings, locale }: { settings: Partial<SiteSetting>; locale: Locale }) {
  const u = interfaceCopy(locale)
  return (
    <div className="supplier-record">
      <span className="eyebrow">{u.companyRecordTitle}</span>
      <BusinessDetails settings={settings} locale={locale} />
      <Link className="text-link" href={`/${locale}/legal`}>
        {u.companyInfo}
        <ArrowUpRight size={18} />
      </Link>
      <PaymentCheck locale={locale} />
    </div>
  )
}
