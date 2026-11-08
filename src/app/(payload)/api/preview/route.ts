import { NextResponse } from 'next/server'
import { siteURL } from '@/lib/env'
import { getCMS } from '@/lib/payload'
import { previewCookie } from '@/lib/site'
export async function GET(request: Request) {
  const url = new URL(request.url)
  const cms = await getCMS()
  if (!(await cms.auth({ headers: request.headers })).user)
    return NextResponse.redirect(new URL('/admin/login', siteURL))
  const path = url.searchParams.get('path') || '/en'
  const destination = /^\/(en|de|fr|es|it|ja|ko|zh-Hant)(\/|$)/.test(path) ? path : '/en'
  const response = NextResponse.redirect(new URL(destination, siteURL))
  response.cookies.set(previewCookie, url.searchParams.get('disable') === '1' ? '0' : '1', {
    httpOnly: true,
    sameSite: 'lax',
    secure: url.protocol === 'https:',
    path: '/',
    maxAge: 3600,
  })
  return response
}
