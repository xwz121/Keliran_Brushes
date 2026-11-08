import { afterEach, expect, it, vi } from 'vitest'
import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3'
import type { Payload } from 'payload'
import { sweepInquiryFiles } from '../src/lib/inquiry-files'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
})

it('cleans expired attachments beyond the first page of retained inquiries', async () => {
  for (const [key, value] of Object.entries({
    R2_BUCKET: 'public-media',
    R2_PRIVATE_BUCKET: 'private-drawings',
    R2_ENDPOINT: 'https://storage.example.test',
    R2_ACCESS_KEY_ID: 'test-key',
    R2_SECRET_ACCESS_KEY: 'test-secret',
  }))
    vi.stubEnv(key, value)
  const send = vi.spyOn(S3Client.prototype, 'send').mockResolvedValue({ Contents: [] } as never)
  const attachment = { key: 'inquiries/expired/part.pdf', name: 'part.pdf' }
  const cms = {
    find: vi
      .fn()
      .mockResolvedValueOnce({
        docs: Array.from({ length: 100 }, (_, i) => ({ id: i + 1, attachments: [] })),
        hasNextPage: true,
      })
      .mockResolvedValueOnce({ docs: [{ id: 101, attachments: [attachment] }], hasNextPage: false }),
    update: vi.fn().mockResolvedValue({}),
  }
  await sweepInquiryFiles(cms as unknown as Payload)
  expect(cms.find).toHaveBeenNthCalledWith(2, expect.objectContaining({ page: 2, sort: 'id' }))
  expect(
    send.mock.calls.some(
      ([command]) => command instanceof DeleteObjectCommand && command.input.Key === attachment.key,
    ),
  ).toBe(true)
  expect(cms.update).toHaveBeenCalledWith({
    collection: 'inquiries',
    id: 101,
    data: { attachments: [{ ...attachment, deletedAt: expect.any(String) }] },
  })
})
