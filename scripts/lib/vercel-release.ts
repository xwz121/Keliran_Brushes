import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import type { Client } from 'pg'

export const releaseHash = '249d8acd28ebebd87d001c8fd4bb3c90f5ffcf104ba142e752c448368f90b87b'
export const releaseTables = {
  state: 'public._keliran_release_20260924_state',
  tables: 'public._keliran_release_20260924_tables',
  rows: 'public._keliran_release_20260924_rows',
}
const quote = (name: string) => `"${name.replaceAll('"', '""')}"`

// Cloud releases use exactly the connection configured for the running website.
// Never fall back to a developer's .env or a different UNPOOLED endpoint.
export function cloudDatabase(env: Record<string, string | undefined>, manifestHash: string) {
  assert.equal(env.VERCEL, '1', 'This release must run inside Vercel')
  assert.equal(env.VERCEL_ENV, 'production', 'Production environment required')
  assert.equal(env.VERCEL_GIT_COMMIT_REF, 'main', 'Only main may publish this release')
  assert.equal(env.VERCEL_GIT_REPO_SLUG, 'Keliran_Sealing', 'Unexpected repository')
  assert.equal(env.VERCEL_GIT_REPO_OWNER, 'xwz121', 'Unexpected repository owner')
  assert.equal(manifestHash, releaseHash, 'The approved release changed')
  assert.ok(env.DATABASE_URL, 'Vercel DATABASE_URL is required')
  const url = new URL(env.DATABASE_URL)
  assert.ok(['postgres:', 'postgresql:'].includes(url.protocol), 'PostgreSQL required')
  assert.ok(!['localhost', '127.0.0.1', '::1', '[::1]'].includes(url.hostname), 'Cloud database required')
  assert.ok(url.pathname.length > 1, 'A database name is required')
  return env.DATABASE_URL
}

export function databaseFingerprint(connection: string) {
  const url = new URL(connection)
  return createHash('sha256')
    .update(`${url.hostname}:${url.port}${url.pathname}:${url.username}`)
    .digest('hex')
}

export async function releaseState(db: Client) {
  const exists = await db.query('SELECT to_regclass($1) AS name', [`${releaseTables.state}`])
  if (!exists.rows[0].name) return null
  const result = await db.query(`SELECT * FROM ${releaseTables.state} WHERE manifest_hash = $1`, [
    releaseHash,
  ])
  assert.equal(result.rows.length, 1, 'Unexpected release snapshot; inspect before continuing')
  return result.rows[0]
}

// Durable, transactionally consistent data snapshot inside the same protected
// database, using unregistered tables in the existing schema so CREATE SCHEMA
// privileges are not needed. It is not an off-site disaster-recovery backup or a schema pg_dump.
// JSONB preserves old enum values independently of later schema migrations.
export async function ensureDataSnapshot(db: Client, connection: string) {
  const fingerprint = databaseFingerprint(connection)
  const existing = await releaseState(db)
  if (existing) {
    assert.equal(existing.database_fingerprint, fingerprint)
    assert.ok(existing.snapshot_at)
    return existing
  }
  await db.query('BEGIN ISOLATION LEVEL REPEATABLE READ')
  try {
    const tables = await db.query(
      `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`,
    )
    const names: string[] = tables.rows.map((r) => r.tablename)
    // site_settings is introduced by the redesign migration; old production
    // databases legitimately do not have it yet. Snapshot every existing table.
    for (const name of ['products', 'pages', 'users', 'payload_migrations'])
      assert.ok(names.includes(name), `Expected existing website table ${name}`)
    await db.query(`CREATE TABLE ${releaseTables.state} (
      manifest_hash text PRIMARY KEY, database_fingerprint text NOT NULL,
      snapshot_at timestamptz NOT NULL DEFAULT now(), completed_at timestamptz,
      deployment_commit text, result jsonb
    )`)
    await db.query(`CREATE TABLE ${releaseTables.tables} (
      table_name text PRIMARY KEY, row_count bigint NOT NULL, columns jsonb NOT NULL
    )`)
    await db.query(`CREATE TABLE ${releaseTables.rows} (
      table_name text NOT NULL, data jsonb NOT NULL
    )`)
    await db.query(`CREATE INDEX ON ${releaseTables.rows} (table_name)`)
    for (const name of names) {
      const copied = await db.query(
        `INSERT INTO ${releaseTables.rows} SELECT $1, to_jsonb(t) FROM public.${quote(name)} t`,
        [name],
      )
      const columns = await db.query(
        `SELECT column_name, data_type, udt_name, column_default, is_nullable,
        ordinal_position FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position`,
        [name],
      )
      await db.query(`INSERT INTO ${releaseTables.tables} VALUES ($1, $2, $3)`, [
        name,
        copied.rowCount,
        JSON.stringify(columns.rows),
      ])
    }
    for (const table of Object.values(releaseTables))
      await db.query(`REVOKE ALL ON TABLE ${table} FROM PUBLIC`)
    const bad = await db.query(`SELECT t.table_name FROM ${releaseTables.tables} t
      LEFT JOIN (SELECT table_name, count(*) AS n FROM ${releaseTables.rows} GROUP BY table_name) r
      USING (table_name) WHERE t.row_count <> coalesce(r.n, 0)`)
    assert.equal(bad.rowCount, 0, 'Snapshot row count mismatch')
    await db.query(
      `INSERT INTO ${releaseTables.state} (manifest_hash, database_fingerprint)
      VALUES ($1, $2)`,
      [releaseHash, fingerprint],
    )
    await db.query('COMMIT')
    console.log(
      JSON.stringify({
        release: 'durable-data-snapshot',
        tables: names.length,
        tablesPrefix: '_keliran_release_20260924_',
      }),
    )
    return await releaseState(db)
  } catch (error) {
    await db.query('ROLLBACK')
    throw error
  }
}
