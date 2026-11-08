import { NextResponse, type NextRequest } from 'next/server'
import { asLocale } from './lib/locales'
export function proxy(request: NextRequest) {
  const headers = new Headers(request.headers)
  headers.set('x-site-locale', asLocale(request.nextUrl.pathname.split('/')[1]))
  // The public path only (no query string), for the printed "online version" line.
  headers.set('x-site-path', request.nextUrl.pathname)
  return NextResponse.next({ request: { headers } })
}
export const config = { matcher: ['/((?!api|admin|_next|brand|images|favicon).*)'] }
