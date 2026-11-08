import { APIError, type PayloadRequest } from 'payload'
import type { ContentSlug } from '@/collections'
import { locales } from './locales'
import { lock } from './transactions'
import { mediaIdsOf, overlayLocale, releaseIssues, type ReleaseMedia, type Term } from './content-checks'

// Collect everything the release check needs for one document as it would be published.
export async function publishIssues(
  req: PayloadRequest,
  collection: ContentSlug,
  id: number | string | undefined,
  data: Record<string, any>,
): Promise<string[]> {
  const { payload } = req
  // Local API reads that receive req overwrite req.locale and req.fallbackLocale. Payload merges the
  // saved localized values by req.locale after this hook, so restore both before returning.
  const { locale, fallbackLocale } = req
  try {
    const stored = id
      ? ((await payload.findByID({
          collection,
          id,
          locale: 'all',
          fallbackLocale: false,
          draft: true,
          depth: 0,
          overrideAccess: true,
          req,
        })) as Record<string, any>)
      : {}
    const document = overlayLocale(stored, data, locale || 'en')
    const media: ReleaseMedia[] = []
    for (const mediaId of mediaIdsOf(document)) {
      await lock(req, `media:${mediaId}`)
      const found = await payload.find({
        collection: 'media',
        where: { id: { equals: mediaId } },
        locale: 'all',
        depth: 0,
        limit: 1,
        overrideAccess: true,
        req,
      })
      if (found.docs[0]) media.push(found.docs[0] as unknown as ReleaseMedia)
    }
    await lock(req, 'glossary')
    const terms = await payload.find({
      collection: 'glossary',
      limit: 1000,
      pagination: false,
      sort: 'term',
      overrideAccess: true,
      req,
    })
    const glossary: Term[] = terms.docs.map((t) => ({
      term: t.term,
      translations: t.translations as Term['translations'],
      protected: t.protected,
      note: t.note,
    }))
    return releaseIssues({ collection, document, media, glossary, locales })
  } finally {
    req.locale = locale
    req.fallbackLocale = fallbackLocale
  }
}

export async function assertPublishable(
  req: PayloadRequest,
  collection: ContentSlug,
  id: number | string | undefined,
  data: Record<string, any>,
) {
  // Publishing a single locale would merge one translation into the live version without checking
  // the others. Every locale is released together.
  if (req.query?.publishSpecificLocale)
    throw new APIError('请统一发布全部语言，不支持只发布单个语言。', 400, null, true)
  const issues = await publishIssues(req, collection, id, data)
  if (issues.length)
    throw new APIError(
      `发布前检查未通过（${issues.length} 项）：${issues.slice(0, 8).join('；')}${issues.length > 8 ? '…' : ''}`,
      400,
      { issues },
      true,
    )
}
