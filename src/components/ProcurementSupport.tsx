import { getCollection } from '@/lib/content'
import { interfaceCopy, type InterfaceCopy } from '@/lib/interface-copy'
import {
  materialBindings,
  procurementInputs,
  procurementRelations,
  type MaterialRole,
} from '@/lib/procurement-relations'
import type { Locale } from '@/lib/locales'
import { siteCopy } from '@/lib/site-copy'
import { ResourceCard } from './ResourceUI'

export function roleLabel(role: MaterialRole, locale: Locale) {
  const u = interfaceCopy(locale)
  return {
    'seal-body': u.sealBodyRole,
    filament: u.filamentRole,
    'backing-channel': u.backingRole,
    'mounting-holder': u.holderRole,
  }[role]
}
export function PreparationInputs({
  id,
  locale,
  blank = false,
}: {
  id: string
  locale: Locale
  blank?: boolean
}) {
  const fields = procurementInputs[id]
  if (!fields?.length) return null
  const u = interfaceCopy(locale)
  return (
    <section className="rich-section procurement-inputs" id="prepare-information">
      <h2>{blank ? u.blankRecordTitle : u.prepareTitle}</h2>
      <p>{blank ? u.blankRecordBody : u.prepareBody}</p>
      {blank ? (
        <table className="data-table">
          <thead>
            <tr>
              <th>{u.prepareTitle}</th>
              <th>{u.recordValue}</th>
            </tr>
          </thead>
          <tbody>
            {fields.map((key) => (
              <tr key={key}>
                <th scope="row">{u[key as keyof InterfaceCopy]}</th>
                <td className="blank-record-cell">________________</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <ul className="preparation-list">
          {fields.map((key) => (
            <li key={key}>{u[key as keyof InterfaceCopy]}</li>
          ))}
        </ul>
      )}
    </section>
  )
}

export async function ProcurementSupport({
  id,
  locale,
  preview = false,
  omit = [],
}: {
  id: string
  locale: Locale
  preview?: boolean
  omit?: string[]
}) {
  const relations = (procurementRelations[id] || []).filter((x) => !omit.includes(`${x.kind}/${x.slug}`))
  if (!relations.length) return null
  const collections = [...new Set(relations.map((r) => r.kind))]
  const data = new Map(
    await Promise.all(
      collections.map(async (kind) => [kind, await getCollection(locale, kind, preview)] as const),
    ),
  )
  const visible = relations.flatMap((relation) => {
    const doc = data.get(relation.kind)?.find((d) => d.slug === relation.slug && d.title)
    return doc ? [{ ...relation, doc }] : []
  })
  if (!visible.length) return null
  const u = interfaceCopy(locale)
  const materialId = id.startsWith('materials/') ? id.split('/')[1] : undefined
  return (
    <section className="related-block procurement-support" id="specification-path">
      <h2>{u.decisionTitle}</h2>
      <p>{u.candidateNote}</p>
      <div className="resource-grid">
        {visible.map(({ kind, slug, doc }) => (
          <div key={`${kind}/${slug}`}>
            {kind === 'products' && materialId && 'materials' in doc && (
              <p className="eyebrow">
                {[
                  ...new Set(
                    materialBindings({ slug, line: doc.line || undefined, materials: doc.materials || [] })
                      .filter(
                        (b) =>
                          b.materialId === materialId || (materialId === 'epdm' && b.label === 'EPDM sponge'),
                      )
                      .map((b) => roleLabel(b.role, locale)),
                  ),
                ].join(' · ')}
              </p>
            )}
            <ResourceCard collection={kind} doc={doc} locale={locale} />
          </div>
        ))}
      </div>
    </section>
  )
}

export function GuideDownload({ locale, slug }: { locale: Locale; slug: string }) {
  const line =
    slug === 'measure-door-seal' ? 'sealing' : slug === 'measure-strip-brush' ? 'strip-brush' : undefined
  if (!line) return null
  const c = siteCopy(locale)
  return (
    <section className="download-bar guide-download">
      <div>
        <h2>{c.downloads}</h2>
        <p>{interfaceCopy(locale).downloadIntro}</p>
      </div>
      <a href={`/downloads/${locale}/${line}-rfq-checklist.txt`} download>
        {line === 'sealing' ? c.sealing : c.brushes} — {c.downloads}
      </a>
    </section>
  )
}
