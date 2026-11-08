'use client'
import { useCallback, useEffect, useState } from 'react'
import { locales } from '@/lib/locales'
const labels: Record<string, string> = {
  solutions: '解决方案',
  cases: '应用案例',
  guides: '采购指南',
  faqs: '常见问题',
  products: '产品',
  categories: '分类',
  materials: '材料',
  applications: '应用',
  pages: '页面',
  queued: '排队中',
  running: '检查中',
  passed: '通过',
  failed: '未通过',
  stale: '源内容已变化',
  published: '已发布',
  translate: '翻译',
  technical: '技术审核',
  language: '语言审核',
  checks: '确定性检查',
  database: '数据库',
  storage: 'R2 图片存储',
  ai: 'OpenAI 翻译与审核',
  email: 'Resend 询盘邮件',
  turnstile: 'Turnstile 验证',
  preview: '本地示例预览',
}
export function TranslationCenter() {
  const [data, setData] = useState<any>(null)
  const [selection, setSelection] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const refresh = useCallback(async () => {
    try {
      const r = await fetch('/api/release-center')
      if (r.ok) setData(await r.json())
    } catch {}
  }, [])
  useEffect(() => {
    void refresh()
    const timer = setInterval(refresh, 10000)
    return () => clearInterval(timer)
  }, [refresh])
  async function action(action: string, id: number, collection?: string) {
    setBusy(true)
    setMessage('')
    try {
      const r = await fetch('/api/release-center', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, id, collection }),
      })
      const result = await r.json()
      if (!r.ok) throw Error(result.error)
      setMessage(
        action === 'publish'
          ? `${locales.length} 种语言已统一发布。`
          : '任务已进入队列，后台会自动保存检查结果。',
      )
      await refresh()
    } catch (e) {
      setMessage(e instanceof Error ? e.message : '请求失败')
    } finally {
      setBusy(false)
    }
  }
  return (
    <section className="release-center">
      <header>
        <p className="release-eyebrow">KELIRAN SEALING / CONTENT OPERATIONS</p>
        <h2>多语发布中心</h2>
        <p>
          英文定稿 → {locales.length - 1} 种语言翻译 → 技术审核 → 语言审核 → 术语与数值检查 → 人工统一发布
        </p>
      </header>
      {!data ? (
        <p>正在读取内容…</p>
      ) : (
        <>
          <div className="service-grid">
            {Object.entries(data.services).map(([key, value]) => (
              <div className="service-item" key={key}>
                <span className={value ? 'service-dot ready' : 'service-dot'} />
                <span>{labels[key]}</span>
                <strong>
                  {key === 'preview' ? (value ? '已启用' : '已关闭') : value ? '已配置' : '未配置'}
                </strong>
              </div>
            ))}
          </div>
          <div className="release-start">
            <label htmlFor="release-content">选择英文源内容</label>
            <div>
              <select id="release-content" value={selection} onChange={(e) => setSelection(e.target.value)}>
                <option value="">请选择…</option>
                {data.contents.map((group: any) => (
                  <optgroup label={labels[group.collection]} key={group.collection}>
                    {group.docs.map((doc: any) => (
                      <option value={`${group.collection}:${doc.id}`} key={doc.id}>
                        {doc.title}
                        {doc.factsConfirmed ? '' : ' · 事实待确认'}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <button
                disabled={busy || !selection || !data.services.ai}
                onClick={() => {
                  const [c, id] = selection.split(':')
                  void action('start', Number(id), c)
                }}
              >
                开始翻译与检查
              </button>
            </div>
            <p>
              先保存英文草稿与共享参数；修改内容、术语或模型后需要重新检查。每种语言最多自动修复两轮。最终发布会同时更新{' '}
              {locales.length} 种语言。
            </p>
          </div>
          {message && (
            <p className="release-message" role="status">
              {message}
            </p>
          )}
          <div className="release-runs">
            {data.runs.length === 0 ? (
              <p>还没有检查任务。可先从「官网内容」编辑并保存英文草稿。</p>
            ) : (
              data.runs.map((run: any) => (
                <details className="release-run" key={run.id}>
                  <summary>
                    <span>{run.title}</span>
                    <strong>{labels[run.status] || run.status}</strong>
                    <time>{new Date(run.createdAt).toLocaleString('zh-CN')}</time>
                  </summary>
                  <div className="release-run-body">
                    <a href={`/admin/collections/${run.targetCollection}/${run.targetId}`}>编辑源内容 ↗</a>
                    <div className="language-results">
                      {Object.entries(run.results || {}).map(([locale, result]: [string, any]) => (
                        <article key={locale}>
                          <h4>
                            {locale.toUpperCase()} <span>{labels[result.stage] || result.stage}</span>
                          </h4>
                          <p>修复轮次：{result.round} / 2</p>
                          {[
                            ...(result.technical?.issues || []),
                            ...(result.language?.issues || []),
                            ...(result.checks || []),
                          ].map((issue: string, i: number) => (
                            <p key={i} className="review-issue">
                              {issue}
                            </p>
                          ))}
                          <details>
                            <summary>查看译文与检查记录</summary>
                            <pre>
                              {JSON.stringify(
                                { text: result.texts, reviews: result.history, usage: result.usage },
                                null,
                                2,
                              )}
                            </pre>
                          </details>
                        </article>
                      ))}
                    </div>
                    {run.error && <p role="alert">{run.error}</p>}
                    <button
                      disabled={busy || run.status !== 'passed'}
                      onClick={() => void action('publish', run.id)}
                    >
                      确认并统一发布 {locales.length} 种语言
                    </button>
                  </div>
                </details>
              ))
            )}
          </div>
        </>
      )}
    </section>
  )
}
