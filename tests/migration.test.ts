import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { locales } from '../src/lib/locales'
import {
  acceptedSourceMigrations,
  canonical,
  identityFingerprint,
  optionalSourceMigrations,
  releaseEvidence,
  sameDatabase,
  snapshotHash,
  sourceMigrations,
  type DatabaseIdentity,
  type RelationField,
} from '../scripts/migration/lib'

const fields: RelationField[] = [
  { name: 'relatedGuides', relationTo: 'guides', hasMany: true },
  { name: 'image', relationTo: 'media', hasMany: false },
]
describe('migration change detection', () => {
  it('ignores database IDs, timestamps, row IDs and empty locales, but not content', () => {
    const source = {
      id: 7,
      slug: 'pbt',
      title: { en: 'PBT', de: 'PBT', fr: '' },
      sections: [{ id: 'a1', key: 'scope', text: { en: 'Scope' } }],
      relatedGuides: [3],
      image: 11,
      updatedAt: '2026-09-24T00:00:00.000Z',
    }
    const target = {
      ...source,
      id: 1,
      title: { en: 'PBT', de: 'PBT' },
      sections: [{ id: 'zz', key: 'scope', text: { en: 'Scope' } }],
      relatedGuides: [{ id: 40 }],
      image: 2,
      updatedAt: '2026-11-08T00:00:00.000Z',
    }
    const fromSource = (c: string, id: unknown) =>
      c === 'media'
        ? id === 11
          ? 'media:abc'
          : undefined
        : id === 3
          ? 'guides/measure-strip-brush'
          : undefined
    const fromTarget = (c: string, id: unknown) =>
      c === 'media'
        ? id === 2
          ? 'media:abc'
          : undefined
        : id === 40
          ? 'guides/measure-strip-brush'
          : undefined
    const a = snapshotHash(canonical(source, fields, fromSource), null)
    expect(snapshotHash(canonical(target, fields, fromTarget), null)).toBe(a)
    const edited = { ...target, title: { en: 'PBT filament', de: 'PBT' } }
    expect(snapshotHash(canonical(edited, fields, fromTarget), null)).not.toBe(a)
    // A newer draft is part of the snapshot, so an unpublished edit counts as an edit.
    expect(
      snapshotHash(canonical(target, fields, fromTarget), canonical(edited, fields, fromTarget)),
    ).not.toBe(a)
  })
  it('keeps release review evidence only for texts identical to the reviewed release', () => {
    const en = JSON.parse(readFileSync('content/release-20260924/en.json', 'utf8'))
    const key = Object.keys(en)[0]
    const title = Object.fromEntries(
      locales.map((l) => [l, JSON.parse(readFileSync(`content/release-20260924/${l}.json`, 'utf8'))[key]]),
    )
    expect(releaseEvidence({ title })).toEqual([])
    expect(releaseEvidence({ title: { ...title, de: `${title.de} (bearbeitet)` } })).toEqual(['title.de'])
    expect(releaseEvidence({ title: { ...title, en: 'A new English title' } })).toEqual([
      'title: English not in reviewed release',
    ])
  })
  it('recognises the same database through another host or role, and a different one', () => {
    const source: DatabaseIdentity = {
      database: 'neondb',
      systemIdentifier: '7301',
      neonTimeline: 'tl-1',
      neonEndpoint: 'ep-pooler',
      serverAddress: '10.0.0.1:5432',
      host: 'ep-x-pooler.neon.tech',
    }
    expect(sameDatabase({ ...source, host: 'ep-x.neon.tech', neonEndpoint: 'ep-direct' }, source)).toBe(true)
    expect(sameDatabase({ ...source, neonTimeline: 'tl-2', systemIdentifier: '7302' }, source)).toBe(false)
    expect(sameDatabase({ ...source, database: 'keliran_brushes' }, source)).toBe(false)
    expect(identityFingerprint(source)).toMatch(/^[a-f0-9]{16}$/)
    // Alibaba RDS: no system identifier for ordinary accounts; one instance, several databases.
    const cms: DatabaseIdentity = {
      database: 'keliran_CMS',
      systemIdentifier: null,
      neonTimeline: null,
      neonEndpoint: null,
      serverAddress: '172.16.0.8:3433',
      host: 'pgm-example.pg.rds.aliyuncs.com',
    }
    const internal = { ...cms, host: 'pgm-example.pg.rds.aliyuncs.com.internal' }
    expect(sameDatabase(internal, cms)).toBe(true)
    expect(sameDatabase({ ...cms, database: 'keliran_brushes' }, cms)).toBe(false)
    expect(sameDatabase({ ...cms, serverAddress: '172.16.9.9:3433' }, cms)).toBe(false)
    expect(sameDatabase({ ...cms, serverAddress: null }, cms)).toBe(true)
  })
})

describe('accepted keliran.com schema for the export', () => {
  it('runs before or after keliran.com removes its AI translation records', () => {
    expect(acceptedSourceMigrations(sourceMigrations)).toBe(true)
    expect(acceptedSourceMigrations([...sourceMigrations, ...optionalSourceMigrations])).toBe(true)
  })
  it('stops on any other history', () => {
    expect(acceptedSourceMigrations(sourceMigrations.slice(0, -1))).toBe(false)
    expect(acceptedSourceMigrations([...sourceMigrations, '20270101_000000_unknown'])).toBe(false)
    expect(acceptedSourceMigrations([...sourceMigrations, '20261108_103755_brushes_site'])).toBe(false)
  })
})
