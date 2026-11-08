import { createLocalReq, type Payload, type PayloadRequest } from 'payload'
import { sql } from '@payloadcms/db-postgres'

export async function lock(req: PayloadRequest, key: string) {
  const id = await req.transactionID
  if (id === undefined || id === null) throw new Error('This operation requires a database transaction.')
  const session = req.payload.db.sessions?.[id]
  if (!session) throw Error('Database session is missing.')
  await (session.db as { execute: (query: ReturnType<typeof sql>) => Promise<unknown> }).execute(
    sql`select pg_advisory_xact_lock(hashtextextended(${key}, 0))`,
  )
}
export async function transaction<T>(payload: Payload, key: string, fn: (req: PayloadRequest) => Promise<T>) {
  const id = await payload.db.beginTransaction()
  if (id === null) throw new Error('Transactions are required.')
  const req = await createLocalReq(
    { req: { transactionID: id }, context: { skipRevalidation: true } },
    payload,
  )
  try {
    await lock(req, key)
    const result = await fn(req)
    await payload.db.commitTransaction(id)
    return result
  } catch (error) {
    await payload.db.rollbackTransaction(id)
    throw error
  }
}
