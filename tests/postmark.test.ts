import { describe, it, expect, vi } from 'vitest'
import { sendPostmark } from '../src/lib/postmark'

const message = {
  from: 'Keliran <sales@keliran.com>',
  to: 'buyer@example.com',
  subject: 'Test',
  textBody: 'Body',
  tag: 'test',
}
type Fetch = typeof globalThis.fetch
const reply = (status: number, body: unknown) =>
  vi.fn(async () =>
    typeof body === 'string' ? new Response(body, { status }) : Response.json(body, { status }),
  ) as unknown as Fetch
const send = (fetch: Fetch) => sendPostmark(message, { token: 'POSTMARK_API_TEST', fetch })

describe('Postmark outcome classification', () => {
  it('records an accepted message with its MessageID', async () => {
    const fetch = reply(200, { ErrorCode: 0, Message: 'OK', MessageID: 'abc-123' })
    expect(await send(fetch)).toEqual({ outcome: 'sent', messageId: 'abc-123' })
    const [url, init] = (fetch as any).mock.calls[0]
    expect(url).toBe('https://api.postmarkapp.com/email')
    expect(init.headers['X-Postmark-Server-Token']).toBe('POSTMARK_API_TEST')
    expect(JSON.parse(init.body)).toMatchObject({
      From: message.from,
      To: message.to,
      MessageStream: 'outbound',
      TrackOpens: false,
      TrackLinks: 'None',
    })
  })
  it.each([
    [422, 406, 'inactive recipient'],
    [422, 300, 'invalid request'],
    [401, 10, 'bad token'],
    [422, 412, 'account pending approval'],
    [422, 413, 'account not approved'],
  ])('treats HTTP %i / ErrorCode %i (%s) as permanent', async (status, code) => {
    const result = await send(reply(status, { ErrorCode: code, Message: 'Rejected' }))
    expect(result.outcome).toBe('permanent')
    expect(result).toMatchObject({ error: expect.stringContaining(String(code)) })
  })
  it.each([429, 500, 503])('retries HTTP %i, which Postmark did not accept', async (status) => {
    expect((await send(reply(status, { ErrorCode: 100, Message: 'Busy' }))).outcome).toBe('retryable')
  })
  it('does not retry an ambiguous gateway timeout, timeout or unreadable success', async () => {
    expect((await send(reply(504, 'Gateway timeout'))).outcome).toBe('unknown')
    expect((await send(reply(200, 'not json'))).outcome).toBe('unknown')
    expect((await send(reply(200, { ErrorCode: 0, Message: 'OK' }))).outcome).toBe('unknown')
    const timeout = vi.fn(async () => {
      throw new DOMException('The operation was aborted due to timeout', 'TimeoutError')
    }) as unknown as Fetch
    expect((await send(timeout)).outcome).toBe('unknown')
  })
  it('treats an unreadable rejection as permanent and a missing token as not configured', async () => {
    expect((await send(reply(400, '<html>'))).outcome).toBe('permanent')
    const unused = vi.fn() as unknown as Fetch
    expect(await sendPostmark(message, { token: '', fetch: unused })).toMatchObject({ outcome: 'permanent' })
    expect(unused).not.toHaveBeenCalled()
  })
})
