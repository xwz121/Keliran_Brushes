import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { drafts } from '../seed/catalogue'
import '../seed/resources'
import { hash, deterministicChecks } from '../../src/lib/ai/checks'
import { locales, type Locale } from '../../src/lib/locales'

export const releaseDirectory = 'content/release-20260924'
export async function approvedRelease() {
  const read = async (name: string) => JSON.parse(await readFile(`${releaseDirectory}/${name}.json`, 'utf8'))
  const source = await read('en')
  const resolutions = await read('review-resolutions')
  assert.equal(resolutions.sourceHash, hash(source), 'Stale coordinator review')
  const glossary = [
    'Keliran',
    'EPDM',
    'NBR',
    'FKM',
    'VMQ',
    'CR',
    'PA6',
    'PA66',
    'PA612',
    'PBT',
    'PP',
    'PEEK',
    'SS304',
    'SS316',
    'IP',
    'NEMA',
    'REACH',
    'RoHS',
  ].map((term) => ({ term, protected: true }))
  const dictionaries = {} as Record<Locale, Record<string, string>>
  const reviews: Record<string, unknown> = {}
  for (const locale of locales) {
    const dictionary = await read(locale)
    const review = await read(`${locale}.review`)
    assert.deepEqual(Object.keys(dictionary).sort(), Object.keys(source).sort(), `${locale}: text keys`)
    assert.equal(review.sourceHash, hash(source), `${locale}: stale source review`)
    const resolution = resolutions.locales[locale]
    assert.equal(resolution.reviewHash, hash(review), `${locale}: review report changed`)
    assert.equal(resolution.reviewedTargetHash, review.targetHash, `${locale}: original review mismatch`)
    assert.equal(
      resolution.finalTargetHash,
      hash(dictionary),
      `${locale}: text changed after coordinator review`,
    )
    assert.deepEqual(
      deterministicChecks(source, dictionary, locale, glossary),
      [],
      `${locale}: structural checks`,
    )
    const issues = review.batches.flatMap((batch: any) =>
      batch.result.issues.map((issue: any) => ({ batch: batch.batch, ...issue })),
    )
    assert.equal(resolution.issues.length, issues.length, `${locale}: unresolved issues`)
    for (const issue of issues) {
      const decision = resolution.issues.find(
        (r: any) => r.batch === issue.batch && r.key === issue.key && r.issue === issue.issue,
      )
      assert.equal(decision?.disposition, 'resolved', `${locale}: unresolved ${issue.key}`)
      assert.equal(
        decision.finalText,
        dictionary[decision.finalKey],
        `${locale}: stale resolution ${issue.key}`,
      )
    }
    assert.equal(review.batches.length, 7, `${locale}: incomplete review`)
    for (const batch of review.batches) {
      assert.ok(batch.responseId && batch.model && batch.completedAt, `${locale}: missing API evidence`)
    }
    dictionaries[locale] = dictionary
    reviews[locale] = {
      hash: hash(review),
      coordinatorResolutionHash: hash(resolution),
      responses: review.batches.map((b: any) => b.responseId),
    }
  }
  const translate = (text: string, locale: Locale) => {
    if (!text) return ''
    const key = hash(text).slice(0, 20)
    assert.equal(source[key], text, 'Seed text differs from reviewed source')
    const result = dictionaries[locale][key]
    assert.ok(result?.trim(), `${locale}: missing ${key}`)
    return result
  }
  const entries = drafts.map(({ collection, slug, data }) => {
    const { title, summary, description, seoTitle, seoDescription, sections, specifications, ...shared } =
      data
    const text = { title, summary, description, seoTitle, seoDescription }
    return {
      collection,
      slug,
      shared,
      translations: Object.fromEntries(
        locales.map((locale) => [
          locale,
          {
            ...Object.fromEntries(
              Object.entries(text).map(([key, value]) => [key, translate(value || '', locale)]),
            ),
            sections: (sections || []).map((s: any) => ({
              key: s.key,
              heading: translate(s.heading, locale),
              text: translate(s.text, locale),
            })),
            ...(specifications
              ? {
                  specifications: specifications.map((s: any) => ({
                    ...s,
                    label: translate(s.label, locale),
                  })),
                }
              : {}),
          },
        ]),
      ),
    }
  })
  const media = await read('media')
  for (const asset of media) {
    assert.equal(asset.approved, true)
    assert.equal(asset.illustrative, true)
    assert.equal(
      createHash('sha256')
        .update(await readFile(asset.sourcePath))
        .digest('hex'),
      asset.sha256,
    )
    // Use the reviewed dictionary for every caption as well as the body text.
    asset.alt = Object.fromEntries(locales.map((locale) => [locale, translate(asset.alt.en, locale)]))
  }
  const businessProfile = JSON.parse(await readFile('content/business-profile.json', 'utf8'))
  assert.equal(businessProfile.secondaryRegistrationNo, '15698503')
  const manifest = {
    release: '20260924',
    sourceHash: hash(source),
    locales,
    reviews,
    reviewMethod: resolutions.method,
    entries,
    media,
    businessProfile,
    approval:
      'Owner authorised translation, review, current illustrative assets and publication. Keliran LTD rename confirmed by owner; public Companies House page still shows the former name. API review is a language/content review, not certification or legal verification.',
  }
  return { manifest, manifestHash: hash(manifest) }
}
