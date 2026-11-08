'use client'
import { useDocumentInfo, useFormFields } from '@payloadcms/ui'
export function AttachmentLinks() {
  const { id } = useDocumentInfo()
  const rows = useFormFields(([fields]) => fields.attachments?.rows)
  return (
    <div>
      <h4>私有询盘附件</h4>
      {rows?.length ? (
        rows.map((_, i) => (
          <p key={i}>
            <a href={`/api/inquiry-attachments/${id}/${i}`} target="_blank" rel="noopener noreferrer">
              下载附件 {i + 1} ↗
            </a>
          </p>
        ))
      ) : (
        <p>无附件。过期文件无法下载。</p>
      )}
    </div>
  )
}
