import Link from 'next/link'
import { headers } from 'next/headers'
import { asLocale } from '@/lib/locales'
import { interfaceCopy } from '@/lib/interface-copy'
import { getDictionary } from '@/lib/i18n'
export default async function NotFound() {
  const locale = asLocale((await headers()).get('x-site-locale') || 'en'),
    u = interfaceCopy(locale)
  return (
    <section className="container section empty-state">
      <p className="eyebrow">404</p>
      <h1>{u.notFound}</h1>
      <p>{u.notFoundBody}</p>
      <Link href={`/${locale}`} className="button">
        {getDictionary(locale).home}
      </Link>
    </section>
  )
}
