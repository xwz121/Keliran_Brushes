import { Fragment } from 'react'
import Link from 'next/link'
function inline(text: string) {
  return text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\(\/[a-zA-Z0-9/\-?#=&]+\))/g).map((s, i) => {
    if (s.startsWith('**')) return <strong key={i}>{s.slice(2, -2)}</strong>
    const m = s.match(/^\[([^\]]+)\]\((\/[^)]+)\)$/)
    return m ? (
      <Link key={i} href={m[2]}>
        {m[1]}
      </Link>
    ) : (
      <Fragment key={i}>{s}</Fragment>
    )
  })
}
export function MarkdownLite({ text }: { text: string }) {
  const blocks = text.split(/\n\s*\n/)
  return (
    <>
      {blocks.map((block, i) => {
        const lines = block.split('\n')
        if (lines[0]?.startsWith('|')) {
          const rows = lines
            .filter((l) => l.trim() && !/^\|[\s:|\-]+\|$/.test(l))
            .map((l) =>
              l
                .split('|')
                .slice(1, -1)
                .map((c) => c.trim()),
            )
          return (
            <div className="table-scroll" key={i} tabIndex={0}>
              <table className="data-table">
                <thead>
                  <tr>
                    {rows[0].map((c, j) => (
                      <th key={j} scope="col">
                        {inline(c)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(1).map((r, j) => (
                    <tr key={j}>
                      {r.map((c, k) => (
                        <td key={k}>{inline(c)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
        if (lines.every((l) => l.startsWith('- ')))
          return (
            <ul key={i}>
              {lines.map((l, j) => (
                <li key={j}>{inline(l.slice(2))}</li>
              ))}
            </ul>
          )
        return <p key={i}>{inline(block)}</p>
      })}
    </>
  )
}
export function RichSections({
  sections = [],
}: {
  sections?: { key: string; heading?: string | null; text?: string | null }[] | null
}) {
  return (
    <>
      {sections?.map((s) => (
        <section id={s.key} className="rich-section" key={s.key}>
          {s.heading && <h2>{s.heading}</h2>}
          {s.text && <MarkdownLite text={s.text} />}
        </section>
      ))}
    </>
  )
}
