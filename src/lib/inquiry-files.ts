import { randomUUID } from 'node:crypto'
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { z } from 'zod'
import type { Payload } from 'payload'
import { HttpError } from './http'
export const fileTypes: Record<string, string> = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  dxf: 'application/octet-stream',
  dwg: 'application/octet-stream',
  step: 'application/octet-stream',
  stp: 'application/octet-stream',
  iges: 'application/octet-stream',
  igs: 'application/octet-stream',
}
export const fileSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(180)
    .refine((n) => !/[\/\\\x00-\x1f]/.test(n), 'Invalid filename'),
  size: z
    .number()
    .int()
    .positive()
    .max(10 * 1024 * 1024),
  type: z.string().max(100).optional(),
})
export const attachmentSchema = fileSchema.extend({ key: z.string().max(250) })
export function uploadConfigured() {
  return Boolean(
    process.env.R2_PRIVATE_BUCKET &&
    process.env.R2_PRIVATE_BUCKET !== process.env.R2_BUCKET &&
    ['R2_ENDPOINT', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY'].every((k) => process.env[k]),
  )
}
const bucket = () => process.env.R2_PRIVATE_BUCKET!
function client() {
  if (!uploadConfigured())
    throw new HttpError(503, 'Drawing uploads are not available. You can submit the enquiry without files.')
  return new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  })
}
export function extension(name: string) {
  return name.split('.').pop()?.toLowerCase() || ''
}
export function validateFile(raw: unknown) {
  const f = fileSchema.safeParse(raw)
  if (!f.success || !fileTypes[extension(f.data.name)])
    throw new HttpError(400, 'Use PDF, CAD, PNG, JPG or WebP files, up to 10 MB each.')
  return f.data
}
export function ownsKey(key: string, id: string) {
  if (!z.uuid().safeParse(id).success) return false
  return new RegExp(
    `^inquiries/${id}/[a-f0-9-]{36}\\.(pdf|dxf|dwg|step|stp|iges|igs|png|jpg|jpeg|webp)$`,
  ).test(key)
}
export async function signUpload(id: string, raw: unknown) {
  const f = validateFile(raw),
    ext = extension(f.name),
    type = fileTypes[ext],
    key = `inquiries/${id}/${randomUUID()}.${ext}`
  const url = await getSignedUrl(
    client(),
    new PutObjectCommand({ Bucket: bucket(), Key: key, ContentLength: f.size, ContentType: type }),
    { expiresIn: 600, signableHeaders: new Set(['content-type', 'content-length']) },
  )
  return { name: f.name, size: f.size, key, type, url }
}
export function validSignature(ext: string, b: Uint8Array) {
  const bytes = Buffer.from(b),
    text = bytes.toString('utf8')
  if (/<(?:script|html)|<\?php/i.test(text)) return false
  if (ext === 'pdf') return text.startsWith('%PDF-')
  if (ext === 'png') return bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  if (ext === 'jpg' || ext === 'jpeg') return bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
  if (ext === 'webp') return text.slice(0, 4) === 'RIFF' && text.slice(8, 12) === 'WEBP'
  if (ext === 'dwg') return /^AC10\d\d/.test(text)
  if (ext === 'step' || ext === 'stp') return /^\s*ISO-10303-21;/.test(text)
  if (ext === 'dxf') return /^AutoCAD Binary DXF/.test(text) || /^\s*0\s+SECTION\b/.test(text)
  if (ext === 'iges' || ext === 'igs')
    return /^[\x09\x0a\x0d\x20-\x7e]*$/.test(text) && /^.{72}S\s*\d+/m.test(text)
  return false
}
export async function verifyObject(id: string, f: z.infer<typeof attachmentSchema>) {
  if (!ownsKey(f.key, id)) throw new HttpError(400, 'Invalid attachment reference.')
  validateFile(f)
  const s3 = client()
  try {
    const head = await s3.send(new HeadObjectCommand({ Bucket: bucket(), Key: f.key }))
    if (
      head.ContentLength !== f.size ||
      head.ContentType !== fileTypes[extension(f.name)] ||
      extension(f.key) !== extension(f.name)
    )
      throw Error()
    const sample = await s3.send(
      new GetObjectCommand({ Bucket: bucket(), Key: f.key, Range: 'bytes=0-1023' }),
    )
    if (!validSignature(extension(f.name), await sample.Body!.transformToByteArray())) throw Error()
  } catch {
    await s3.send(new DeleteObjectCommand({ Bucket: bucket(), Key: f.key })).catch(() => {})
    throw new HttpError(400, `The file ${f.name} could not be verified. Remove it or upload a valid file.`)
  }
}
export async function signDownload(key: string, name: string) {
  return getSignedUrl(
    client(),
    new GetObjectCommand({
      Bucket: bucket(),
      Key: key,
      ResponseContentDisposition: `attachment; filename*=UTF-8''${encodeURIComponent(name)}`,
      ResponseContentType: 'application/octet-stream',
    }),
    { expiresIn: 300 },
  )
}
export async function sweepInquiryFiles(cms: Payload) {
  if (!uploadConfigured()) return
  const s3 = client()
  const cutoff = new Date().toISOString()
  for (let page = 1; ; page++) {
    const due = await cms.find({
      collection: 'inquiries',
      where: { retentionUntil: { less_than: cutoff } },
      sort: 'id',
      page,
      limit: 100,
      depth: 0,
    })
    for (const d of due.docs) {
      let changed = false
      const attachments = []
      for (const a of d.attachments || []) {
        if (!a.deletedAt) {
          await s3.send(new DeleteObjectCommand({ Bucket: bucket(), Key: a.key }))
          attachments.push({ ...a, deletedAt: new Date().toISOString() })
          changed = true
        } else attachments.push(a)
      }
      if (changed) await cms.update({ collection: 'inquiries', id: d.id, data: { attachments } })
    }
    if (!due.hasNextPage) break
  }
  let cursor: string | undefined
  do {
    const objects = await s3.send(
      new ListObjectsV2Command({
        Bucket: bucket(),
        Prefix: 'inquiries/',
        ContinuationToken: cursor,
        MaxKeys: 100,
      }),
    )
    for (const o of objects.Contents || []) {
      if (!o.Key || !o.LastModified || Date.now() - o.LastModified.getTime() < 86400000) continue
      const id = o.Key.split('/')[1]
      const found = await cms.find({
        collection: 'inquiries',
        where: { submissionId: { equals: id } },
        limit: 1,
        depth: 0,
      })
      if (!found.docs.some((d) => d.attachments?.some((a) => a.key === o.Key && !a.deletedAt)))
        await s3.send(new DeleteObjectCommand({ Bucket: bucket(), Key: o.Key }))
    }
    cursor = objects.IsTruncated ? objects.NextContinuationToken : undefined
  } while (cursor)
}
