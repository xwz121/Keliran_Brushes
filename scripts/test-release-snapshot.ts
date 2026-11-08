import assert from 'node:assert/strict'
import { Client } from 'pg'
import { ensureDataSnapshot, releaseTables } from './lib/vercel-release'

// Dedicated disposable local database; never load environment files here.
const name = `keliran_release_test_${process.pid}`
const base = 'postgresql://keliran@127.0.0.1:55439/'
const admin = new Client({ connectionString: `${base}postgres` })
const db = new Client({ connectionString: `${base}${name}` })
await admin.connect()
try {
  await admin.query(`CREATE DATABASE ${name}`)
  await db.connect()
  // Failure before all expected source tables exist must leave no partial backup.
  await assert.rejects(() => ensureDataSnapshot(db, `${base}${name}`))
  assert.equal((await db.query('SELECT to_regclass($1) AS n', [releaseTables.state])).rows[0].n, null)
  await db.query(`CREATE TYPE public.fixture_status AS ENUM ('draft', 'published')`)
  for (const table of ['products', 'pages', 'users', 'payload_migrations'])
    await db.query(`CREATE TABLE ${table} (id serial PRIMARY KEY, text_value text, precise numeric,
      status fixture_status, optional text, details jsonb)`)
  await db.query(
    `INSERT INTO products (text_value, precise, status, details)
    VALUES ($1, 9007199254740993.001, 'published', $2)`,
    ['繁體 / quoted " text', { secretFixture: 'local-only' }],
  )
  await ensureDataSnapshot(db, `${base}${name}`)
  const same = await db.query(`SELECT data = to_jsonb(p) AS same FROM ${releaseTables.rows} r,
    public.products p WHERE table_name = 'products'`)
  assert.equal(same.rows[0].same, true)
  await db.query(`CREATE TABLE restored (LIKE products INCLUDING ALL)`)
  await db.query(`INSERT INTO restored SELECT (jsonb_populate_record(NULL::products, data)).*
    FROM ${releaseTables.rows} WHERE table_name = 'products'`)
  assert.equal(
    (await db.query('SELECT to_jsonb(p) = to_jsonb(r) AS same FROM products p, restored r')).rows[0].same,
    true,
  )
  await db.query(`UPDATE products SET text_value = 'later edit'`)
  await ensureDataSnapshot(db, `${base}${name}`)
  assert.equal(
    (
      await db.query(`SELECT data->>'text_value' AS value FROM ${releaseTables.rows}
    WHERE table_name = 'products'`)
    ).rows[0].value,
    '繁體 / quoted " text',
  )
  await assert.rejects(() => ensureDataSnapshot(db, `${base}wrong-database`))
  const acl = await db.query(`SELECT relacl::text AS acl FROM pg_class WHERE oid = to_regclass($1)`, [
    releaseTables.rows,
  ])
  assert.ok(!acl.rows[0].acl.includes('{=') && !acl.rows[0].acl.includes(',='))
  console.log(
    'Snapshot integration passed: rollback, exact data, restore, immutable retry, identity and private ACL.',
  )
} finally {
  await db.end()
  await admin.query(`DROP DATABASE IF EXISTS ${name}`)
  await admin.end()
}
