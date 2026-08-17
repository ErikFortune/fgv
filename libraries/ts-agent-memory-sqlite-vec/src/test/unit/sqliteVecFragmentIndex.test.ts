/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';

import BetterSqlite3 from 'better-sqlite3';
import { load as loadSqliteVec } from 'sqlite-vec';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Result, fail, succeed } from '@fgv/ts-utils';
import {
  IEdgeTarget,
  IEmbeddedFragment,
  IFragmentLocator,
  IFragmentVectorRebuildReport,
  IMemoryRecord,
  IMemoryRecordListing,
  IMemoryRecordSource,
  IScopedMemoryRecord,
  IVectorQueryHit,
  Kind,
  MemoryId,
  MemoryScopeKey
} from '@fgv/ts-agent-memory';
import { ISqliteVecFragmentIndexHandle, SqliteVecFragmentIndex } from '../../index';

function target(scope: string, id: string): IEdgeTarget {
  return { scope: scope as unknown as MemoryScopeKey, id: id as unknown as MemoryId };
}
function loc(start: number, end: number): IFragmentLocator {
  return { start, end };
}
function frag(start: number, end: number, ...values: number[]): IEmbeddedFragment {
  return { locator: loc(start, end), vector: Float32Array.from(values) };
}

/**
 * How many of this process's open descriptors point at `file`, or `undefined` on a
 * platform without `/proc/self/fd`, where the caller should skip the assertion.
 */
function openFdCountFor(file: string): number | undefined {
  const fdDir: string = '/proc/self/fd';
  if (!fs.existsSync(fdDir)) {
    return undefined;
  }
  let n: number = 0;
  for (const fd of fs.readdirSync(fdDir)) {
    try {
      if (fs.readlinkSync(path.join(fdDir, fd)) === file) {
        n++;
      }
    } catch {
      // the descriptor closed between readdir and readlink; it is not ours to count
    }
  }
  return n;
}

describe('SqliteVecFragmentIndex', () => {
  let db: BetterSqlite3.Database;

  beforeEach(() => {
    db = new BetterSqlite3(':memory:');
  });
  afterEach(() => {
    // Some tests close `db` themselves to exercise error paths; guard double-close.
    if (db.open) {
      db.close();
    }
  });

  async function makeIndex(): Promise<SqliteVecFragmentIndex> {
    return (await SqliteVecFragmentIndex.create({ database: db })).orThrow();
  }

  describe('open (path-based factory)', () => {
    let dir: string;
    let dbPath: string;

    beforeEach(() => {
      dir = fs.mkdtempSync(path.join(os.tmpdir(), 'svfragopen-'));
      dbPath = path.join(dir, 'fragments.db');
    });
    afterEach(() => {
      fs.rmSync(dir, { recursive: true, force: true });
    });

    test('opens the file itself and returns a usable index', async () => {
      const opened = await SqliteVecFragmentIndex.open({ path: dbPath });
      expect(opened).toSucceed();
      const handle: ISqliteVecFragmentIndexHandle = opened.orThrow();
      expect(await handle.index.addFragments(target('knowledge', 'doc-a'), [frag(0, 5, 1, 0)])).toSucceedWith(
        1
      );
      expect(handle.index.recordCount).toBe(1);
      expect(handle.index.fragmentCount).toBe(1);
      expect(handle.close()).toSucceedWith(true);
    });

    test('persists across an open + close + open cycle', async () => {
      const first = (await SqliteVecFragmentIndex.open({ path: dbPath })).orThrow();
      (
        await first.index.addFragments(target('knowledge', 'doc-a'), [frag(0, 5, 1, 0), frag(5, 10, 0, 1)])
      ).orThrow();
      expect(first.close()).toSucceedWith(true);

      const second = (await SqliteVecFragmentIndex.open({ path: dbPath })).orThrow();
      expect(second.index.recordCount).toBe(1);
      expect(second.index.fragmentCount).toBe(2);
      expect(await second.index.has(target('knowledge', 'doc-a'))).toSucceedWith(true);
      expect(second.close()).toSucceedWith(true);
    });

    test('the handle close is idempotent', async () => {
      const handle = (await SqliteVecFragmentIndex.open({ path: dbPath })).orThrow();
      expect(handle.close()).toSucceedWith(true);
      expect(handle.close()).toSucceedWith(true);
    });

    test('a create()-made index exposes no way to close the consumer connection', async () => {
      const index = (await SqliteVecFragmentIndex.create({ database: db })).orThrow();
      expect((index as unknown as { close?: unknown }).close).toBeUndefined();
      expect(await index.addFragments(target('knowledge', 'doc-a'), [frag(0, 5, 1, 0)])).toSucceed();
      expect(db.open).toBe(true);
    });

    test('fails without leaking the connection when initialization fails after the file is opened', async () => {
      // Asserts on the process's open descriptors rather than on "can I reopen the
      // file" — SQLite permits many connections to one file, so the reopen form
      // passes just as happily against a leak. See the sibling test in
      // sqliteVecVectorIndex.test.ts.
      const before = openFdCountFor(dbPath);
      expect(
        await SqliteVecFragmentIndex.open({ path: dbPath, tableName: 'bad name; DROP TABLE x' })
      ).toFailWith(/not a simple SQL identifier/i);
      const after = openFdCountFor(dbPath);
      if (before !== undefined && after !== undefined) {
        expect(after).toBe(before);
      }
    });

    test('fails when the path cannot be opened', async () => {
      expect(
        await SqliteVecFragmentIndex.open({ path: path.join(dir, 'no', 'such', 'dir', 'x.db') })
      ).toFailWith(/failed to open/i);
    });
  });

  describe('create', () => {
    test('succeeds over a fresh database with an empty index', async () => {
      expect(await SqliteVecFragmentIndex.create({ database: db })).toSucceedAndSatisfy(
        (index: SqliteVecFragmentIndex) => {
          expect(index.recordCount).toBe(0);
          expect(index.fragmentCount).toBe(0);
        }
      );
    });

    test('rejects a table name that is not a simple identifier', async () => {
      expect(
        await SqliteVecFragmentIndex.create({ database: db, tableName: 'bad name; DROP TABLE x' })
      ).toFailWith(/not a simple SQL identifier/i);
    });

    test('fails loudly when the sqlite-vec extension cannot load (closed database)', async () => {
      const closed = new BetterSqlite3(':memory:');
      closed.close();
      expect(await SqliteVecFragmentIndex.create({ database: closed })).toFailWith(/failed to initialize/i);
    });

    test('rejects a pre-existing non-vec0 table of the same name rather than adopting it', async () => {
      db.exec('CREATE TABLE memory_fragments (foo TEXT)');
      expect(await SqliteVecFragmentIndex.create({ database: db })).toFailWith(
        /auxiliary columns \[\] but this index requires \[start_off, end_off, fragment_id\]/i
      );
    });

    describe('auxiliary-column schema detection', () => {
      // `CREATE VIRTUAL TABLE IF NOT EXISTS` is a no-op against an existing table and
      // vec0 has no `ALTER TABLE ADD COLUMN`, so a database written by an earlier
      // version keeps its narrower column set. Without detection the widened INSERT
      // surfaces an opaque `no such column: fragment_id` at statement-prepare time.
      function createLegacyTable(database: BetterSqlite3.Database): void {
        loadSqliteVec(database);
        database.exec(
          'CREATE VIRTUAL TABLE memory_fragments USING vec0(' +
            'target_key TEXT PARTITION KEY, embedding float[2] distance_metric=cosine, ' +
            '+start_off integer, +end_off integer)'
        );
      }

      test('fails with an actionable message naming expected and found columns', async () => {
        createLegacyTable(db);
        expect(await SqliteVecFragmentIndex.create({ database: db })).toFailWith(
          /auxiliary columns \[start_off, end_off\] but this index requires \[start_off, end_off, fragment_id\]/i
        );
      });

      test('states that a drop-and-re-index is required and that no data is lost', async () => {
        createLegacyTable(db);
        expect(await SqliteVecFragmentIndex.create({ database: db })).toFailWith(
          /cannot be altered in place[\s\S]*drop-and-re-index[\s\S]*DROP TABLE "memory_fragments"[\s\S]*costs embedding time, never data/i
        );
      });

      test('does not surface the opaque sqlite "no such column" error', async () => {
        createLegacyTable(db);
        const created = await SqliteVecFragmentIndex.create({ database: db });
        expect(created).toFail();
        expect(created.isFailure() && created.message).not.toMatch(/no such column/i);
      });

      test('accepts a table whose auxiliary columns match, regardless of declaration order', async () => {
        loadSqliteVec(db);
        db.exec(
          'CREATE VIRTUAL TABLE memory_fragments USING vec0(' +
            'target_key TEXT PARTITION KEY, embedding float[3] distance_metric=cosine, ' +
            '+fragment_id text, +end_off integer, +start_off integer)'
        );
        expect(await SqliteVecFragmentIndex.create({ database: db })).toSucceed();
      });

      test('rejects a table that mimics the auxiliary columns but has no vec0 embedding column', async () => {
        db.exec(
          'CREATE TABLE memory_fragments ("+start_off" integer, "+end_off" integer, "+fragment_id" text)'
        );
        expect(await SqliteVecFragmentIndex.create({ database: db })).toFailWith(/no vec0 embedding column/i);
      });

      test('rejects a table with the right number of columns but a different one', async () => {
        loadSqliteVec(db);
        db.exec(
          'CREATE VIRTUAL TABLE memory_fragments USING vec0(' +
            'target_key TEXT PARTITION KEY, embedding float[2] distance_metric=cosine, ' +
            '+start_off integer, +end_off integer, +frag_id text)'
        );
        expect(await SqliteVecFragmentIndex.create({ database: db })).toFailWith(
          /auxiliary columns \[start_off, end_off, frag_id\]/i
        );
      });
    });
  });

  describe('addFragments', () => {
    test('stores every fragment and reports the count; tracks record/fragment counts', async () => {
      const index = await makeIndex();
      expect(
        await index.addFragments(target('knowledge', 'doc-a'), [frag(0, 5, 1, 0), frag(5, 10, 0, 1)])
      ).toSucceedWith(2);
      expect(index.recordCount).toBe(1);
      expect(index.fragmentCount).toBe(2);
    });

    test('whole-record replace — a second addFragments drops the prior fragments', async () => {
      const index = await makeIndex();
      const t = target('knowledge', 'doc-a');
      (await index.addFragments(t, [frag(0, 5, 1, 0), frag(5, 10, 0, 1)])).orThrow();
      expect(await index.addFragments(t, [frag(0, 3, 1, 1)])).toSucceedWith(1);
      expect(index.recordCount).toBe(1);
      expect(index.fragmentCount).toBe(1);
      expect(await index.query(Float32Array.from([1, 1]), 5)).toSucceedAndSatisfy(
        (hits: ReadonlyArray<IVectorQueryHit>) => {
          expect(hits).toHaveLength(1);
          expect(hits[0].locator).toEqual(loc(0, 3));
        }
      );
    });

    test('an empty fragments array drops an existing record', async () => {
      const index = await makeIndex();
      const t = target('knowledge', 'doc-a');
      (await index.addFragments(t, [frag(0, 5, 1, 0)])).orThrow();
      expect(await index.addFragments(t, [])).toSucceedWith(0);
      expect(index.recordCount).toBe(0);
      expect(index.fragmentCount).toBe(0);
    });

    test('an empty fragments array on a fresh index is a no-op (no table created)', async () => {
      const index = await makeIndex();
      expect(await index.addFragments(target('knowledge', 'doc-a'), [])).toSucceedWith(0);
      expect(index.recordCount).toBe(0);
      // A later real add still establishes the dimension cleanly.
      expect(await index.addFragments(target('knowledge', 'doc-b'), [frag(0, 5, 1, 0)])).toSucceedWith(1);
    });

    test('same stem in different scopes are distinct entries', async () => {
      const index = await makeIndex();
      (await index.addFragments(target('conversations/a', 'turn-3'), [frag(0, 5, 1, 0)])).orThrow();
      (await index.addFragments(target('conversations/b', 'turn-3'), [frag(0, 5, 0, 1)])).orThrow();
      expect(index.recordCount).toBe(2);
      expect(index.fragmentCount).toBe(2);
    });

    test('fails loudly on an empty fragment vector — and stores nothing', async () => {
      const index = await makeIndex();
      expect(
        await index.addFragments(target('knowledge', 'doc-a'), [frag(0, 5, 1, 0), frag(5, 10)])
      ).toFailWith(/cannot add 'knowledge\0doc-a': empty fragment vector/i);
      expect(index.recordCount).toBe(0);
    });

    test('fails loudly on a fragment-dimension mismatch against the established dimension', async () => {
      const index = await makeIndex();
      (await index.addFragments(target('knowledge', 'a'), [frag(0, 5, 1, 0)])).orThrow();
      expect(await index.addFragments(target('knowledge', 'b'), [frag(0, 5, 1, 0, 0)])).toFailWith(
        /fragment dimension 3 does not match index dimension 2/i
      );
    });

    test('rejects a non-safe-integer locator offset up front (never persists an unreadable locator)', async () => {
      const index = await makeIndex();
      // A non-integer offset: reject before the write, with a clear message.
      expect(await index.addFragments(target('knowledge', 'doc-a'), [frag(0.5, 5, 1, 0)])).toFailWith(
        /locator \[0\.5, 5\) offsets must be safe integers/i
      );
      // A too-large (non-safe) integer offset is likewise rejected.
      expect(
        await index.addFragments(target('knowledge', 'doc-b'), [frag(0, Number.MAX_SAFE_INTEGER + 1, 1, 0)])
      ).toFailWith(/offsets must be safe integers/i);
      expect(index.recordCount).toBe(0);
    });

    test('a failed multi-fragment add on a fresh index does not establish a dimension (all-or-nothing)', async () => {
      const index = await makeIndex();
      // dim 2 then dim 3 in the same batch: fails, and must NOT commit dim 2.
      expect(
        await index.addFragments(target('knowledge', 'doc-1'), [frag(0, 5, 1, 0), frag(5, 10, 1, 0, 0)])
      ).toFailWith(/fragment dimension 3 does not match index dimension 2/i);
      expect(index.recordCount).toBe(0);
      // A fresh dim-3 record now indexes cleanly (the index was never poisoned to dim 2).
      expect(await index.addFragments(target('knowledge', 'doc-2'), [frag(0, 5, 1, 0, 0)])).toSucceedWith(1);
    });

    test('fails loudly (best-effort caller unaffected) when the underlying add throws', async () => {
      const index = await makeIndex();
      (await index.addFragments(target('knowledge', 'doc-a'), [frag(0, 5, 1, 0)])).orThrow();
      db.close();
      expect(await index.addFragments(target('knowledge', 'doc-b'), [frag(0, 5, 0, 1)])).toFailWith(
        /cannot add 'knowledge\0doc-b'/i
      );
    });

    test('fails loudly (never silently corrupts) when the table name collides with a non-vec0 table', async () => {
      // A plain table already occupies the default name. `CREATE VIRTUAL TABLE IF NOT
      // EXISTS` no-ops against it, so the collision must fail loudly rather than
      // corrupt state — `create` now catches it up front via the auxiliary-column
      // check, so the index is never handed out at all.
      db.exec('CREATE TABLE memory_fragments (foo TEXT)');
      expect(await SqliteVecFragmentIndex.create({ database: db })).toFailWith(/auxiliary columns/i);
    });
  });

  describe('query', () => {
    async function seeded(): Promise<SqliteVecFragmentIndex> {
      const index = await makeIndex();
      (
        await index.addFragments(target('knowledge', 'doc-a'), [frag(0, 5, 1, 0), frag(5, 10, 0, 1)])
      ).orThrow();
      (await index.addFragments(target('knowledge', 'doc-b'), [frag(0, 5, 1, 1)])).orThrow();
      return index;
    }

    test('returns fragment hits in descending score order, each carrying its locator', async () => {
      const index = await seeded();
      expect(await index.query(Float32Array.from([1, 0]), 3)).toSucceedAndSatisfy(
        (hits: ReadonlyArray<IVectorQueryHit>) => {
          expect(hits[0].target.id).toBe('doc-a');
          expect(hits[0].locator).toEqual(loc(0, 5));
          expect(hits[0].score).toBeCloseTo(1, 5);
          expect(hits[1].target.id).toBe('doc-b');
          expect(hits[1].score).toBeCloseTo(1 / Math.sqrt(2), 5);
          expect(hits[2].target.id).toBe('doc-a');
          expect(hits[2].locator).toEqual(loc(5, 10));
          expect(hits[2].score).toBeCloseTo(0, 5);
        }
      );
    });

    test('truncates to topK', async () => {
      const index = await seeded();
      expect(await index.query(Float32Array.from([1, 0]), 2)).toSucceedAndSatisfy(
        (hits: ReadonlyArray<IVectorQueryHit>) => {
          expect(hits).toHaveLength(2);
          expect(hits.map((h) => h.target.id)).toEqual(['doc-a', 'doc-b']);
        }
      );
    });

    test('maxPerRecord caps fragments per record during selection (before the topK cut)', async () => {
      const index = await makeIndex();
      (
        await index.addFragments(target('knowledge', 'doc-a'), [
          frag(0, 5, 1, 0),
          frag(5, 10, 0.9, 0.1),
          frag(10, 15, 0.8, 0.2)
        ])
      ).orThrow();
      (await index.addFragments(target('knowledge', 'doc-b'), [frag(0, 5, 0.7, 0.3)])).orThrow();
      // Without a cap the top-2 would be doc-a twice; maxPerRecord=1 surfaces doc-b.
      expect(await index.query(Float32Array.from([1, 0]), 2, 1)).toSucceedAndSatisfy(
        (hits: ReadonlyArray<IVectorQueryHit>) => {
          expect(hits).toHaveLength(2);
          expect(hits.map((h) => h.target.id)).toEqual(['doc-a', 'doc-b']);
          expect(hits[0].locator).toEqual(loc(0, 5));
        }
      );
    });

    test('maxPerRecord=0 yields no hits', async () => {
      const index = await seeded();
      expect(await index.query(Float32Array.from([1, 0]), 5, 0)).toSucceedWith([]);
    });

    test('maxPerRecord larger than any record leaves the ranking unchanged', async () => {
      const index = await seeded();
      expect(await index.query(Float32Array.from([1, 0]), 5, 10)).toSucceedAndSatisfy(
        (hits: ReadonlyArray<IVectorQueryHit>) => {
          expect(hits).toHaveLength(3);
          expect(hits[0].target.id).toBe('doc-a');
        }
      );
    });

    test('returns empty for a non-positive topK', async () => {
      const index = await seeded();
      expect(await index.query(Float32Array.from([1, 0]), 0)).toSucceedWith([]);
      expect(await index.query(Float32Array.from([1, 0]), -5)).toSucceedWith([]);
    });

    test('returns empty before any add (no established dimension)', async () => {
      const index = await makeIndex();
      expect(await index.query(Float32Array.from([1, 0, 0]), 5)).toSucceedWith([]);
    });

    test('returns empty when a capped query runs against an emptied (but existing) table', async () => {
      const index = await makeIndex();
      const t = target('knowledge', 'doc-a');
      (await index.addFragments(t, [frag(0, 5, 1, 0)])).orThrow();
      (await index.addFragments(t, [])).orThrow(); // table now exists but holds 0 rows
      // fetchK derives from the (zero) fragment count under a cap → short-circuits to [].
      expect(await index.query(Float32Array.from([1, 0]), 5, 2)).toSucceedWith([]);
    });

    test('rejects a query vector of the wrong dimension', async () => {
      const index = await seeded();
      expect(await index.query(Float32Array.from([1, 0, 0]), 3)).toFailWith(
        /query dimension 3 does not match index dimension 2/i
      );
    });

    test('a capped query stops at topK even when more ranked rows remain', async () => {
      // maxPerRecord makes the fetch span the full ranked set (3 fragments), but
      // topK=1 must return exactly one hit — the top row — and stop.
      const index = await seeded();
      expect(await index.query(Float32Array.from([1, 0]), 1, 5)).toSucceedAndSatisfy(
        (hits: ReadonlyArray<IVectorQueryHit>) => {
          expect(hits).toHaveLength(1);
          expect(hits[0].target.id).toBe('doc-a');
          expect(hits[0].locator).toEqual(loc(0, 5));
        }
      );
    });

    test('fails loudly when the underlying query throws', async () => {
      const index = await seeded();
      db.close();
      expect(await index.query(Float32Array.from([1, 0]), 3)).toFailWith(/query failed/i);
    });
  });

  describe('remove', () => {
    test('removes every fragment of a record and is reflected in subsequent queries', async () => {
      const index = await makeIndex();
      const a = target('knowledge', 'doc-a');
      const b = target('knowledge', 'doc-b');
      (await index.addFragments(a, [frag(0, 5, 1, 0), frag(5, 10, 1, 0)])).orThrow();
      (await index.addFragments(b, [frag(0, 5, 0, 1)])).orThrow();
      expect(await index.remove(a)).toSucceedWith(a);
      expect(index.recordCount).toBe(1);
      expect(index.fragmentCount).toBe(1);
      expect(await index.query(Float32Array.from([1, 0]), 5)).toSucceedAndSatisfy(
        (hits: ReadonlyArray<IVectorQueryHit>) => {
          expect(hits.map((h) => h.target.id)).toEqual(['doc-b']);
        }
      );
    });

    test('is idempotent — removing a missing target succeeds', async () => {
      const index = await makeIndex();
      (await index.addFragments(target('knowledge', 'doc-a'), [frag(0, 5, 1, 0)])).orThrow();
      expect(await index.remove(target('knowledge', 'missing'))).toSucceedWith(
        target('knowledge', 'missing')
      );
      expect(index.recordCount).toBe(1);
    });

    test('succeeds before any add (no table yet)', async () => {
      const index = await makeIndex();
      expect(await index.remove(target('knowledge', 'doc-a'))).toSucceedWith(target('knowledge', 'doc-a'));
      expect(index.recordCount).toBe(0);
    });

    test('fails loudly when the underlying remove throws', async () => {
      const index = await makeIndex();
      (await index.addFragments(target('knowledge', 'doc-a'), [frag(0, 5, 1, 0)])).orThrow();
      db.close();
      expect(await index.remove(target('knowledge', 'doc-a'))).toFailWith(
        /cannot remove 'knowledge\0doc-a'/i
      );
    });
  });

  describe('safe-integer mode and corrupt persisted data', () => {
    const toBlob = (...v: number[]): Uint8Array => new Uint8Array(Float32Array.from(v).buffer);

    async function seededWithRow(): Promise<SqliteVecFragmentIndex> {
      // A valid add creates the table and establishes dim 2; corrupt rows are then
      // inserted directly to model externally-edited / safe-integer-mode data.
      const index = await makeIndex();
      (await index.addFragments(target('knowledge', 'doc-a'), [frag(0, 5, 1, 0)])).orThrow();
      return index;
    }

    function insertRaw(key: string, start: bigint, end: bigint, ...vec: number[]): void {
      db.prepare(
        'INSERT INTO memory_fragments(target_key, embedding, start_off, end_off) VALUES (?, ?, ?, ?)'
      ).run(key, toBlob(...vec), start, end);
    }

    /** Insert a row with arbitrary (possibly NULL) identity columns, bypassing the write-side guards. */
    function insertRawIdentity(
      key: string,
      start: bigint | null,
      end: bigint | null,
      fragmentId: string | null,
      ...vec: number[]
    ): void {
      db.prepare(
        'INSERT INTO memory_fragments(target_key, embedding, start_off, end_off, fragment_id) ' +
          'VALUES (?, ?, ?, ?, ?)'
      ).run(key, toBlob(...vec), start, end, fragmentId);
    }

    test('fails loudly when a stored locator has a start offset but no end offset', async () => {
      // `Number(null)` is 0, so coercing a half-NULL pair would silently fabricate a
      // span rather than surface the corruption.
      const index = await seededWithRow();
      insertRawIdentity('knowledge\0doc-b', BigInt(3), null, 'frag-1', 0, 1);
      expect(await index.query(Float32Array.from([0, 1]), 5)).toFailWith(
        /locator has only one of its start\/end offsets/i
      );
    });

    test('fails loudly when a stored locator has an end offset but no start offset', async () => {
      const index = await seededWithRow();
      insertRawIdentity('knowledge\0doc-b', null, BigInt(9), 'frag-1', 0, 1);
      expect(await index.query(Float32Array.from([0, 1]), 5)).toFailWith(
        /locator has only one of its start\/end offsets/i
      );
    });

    test('fails loudly when a stored row carries neither a locator nor a fragment id', async () => {
      const index = await seededWithRow();
      insertRawIdentity('knowledge\0doc-b', null, null, null, 0, 1);
      expect(await index.query(Float32Array.from([0, 1]), 5)).toFailWith(
        /carries neither a locator nor a fragment id/i
      );
    });

    test('coerces bigint offsets (better-sqlite3 safe-integer mode) to number locators', async () => {
      const index = await seededWithRow();
      // Under safe-integer mode every integer column comes back as a bigint.
      db.defaultSafeIntegers(true);
      expect(await index.query(Float32Array.from([1, 0]), 1)).toSucceedAndSatisfy(
        (hits: ReadonlyArray<IVectorQueryHit>) => {
          const locator = hits[0].locator;
          expect(locator).toEqual(loc(0, 5));
          expect(typeof locator?.start).toBe('number');
          expect(typeof locator?.end).toBe('number');
        }
      );
    });

    test('fails loudly when a stored offset is outside the safe-integer range', async () => {
      const index = await seededWithRow();
      // Safe-integer mode returns the huge offset as a bigint (no read-time throw),
      // so the _toOffset guard is what must fire.
      db.defaultSafeIntegers(true);
      insertRaw('knowledge\0doc-b', BigInt(2) ** BigInt(60), BigInt(0), 0, 1);
      expect(await index.query(Float32Array.from([0, 1]), 5)).toFailWith(
        /locator offset .* is not a safe integer/i
      );
    });

    test('fails loudly when a stored key is missing the NUL separator', async () => {
      const index = await seededWithRow();
      insertRaw('nonulkey', BigInt(0), BigInt(5), 0, 1);
      expect(await index.query(Float32Array.from([0, 1]), 5)).toFailWith(/missing scope\/id separator/i);
    });
  });

  describe('fragment identity', () => {
    /** A fragment identified only by an opaque id — no honest body span. */
    function idFrag(fragmentId: string, ...values: number[]): IEmbeddedFragment {
      return { fragmentId, vector: Float32Array.from(values) };
    }

    test('rejects a fragment carrying neither a locator nor a fragmentId', async () => {
      const index = await makeIndex();
      expect(
        await index.addFragments(target('knowledge', 'doc-a'), [{ vector: Float32Array.from([1, 0]) }])
      ).toFailWith(/at least one of 'locator' or 'fragmentId'/i);
      expect(index.fragmentCount).toBe(0);
    });

    test('carries an opaque fragmentId through to the query hit verbatim', async () => {
      const index = await makeIndex();
      const opaque = 'urn:frag:9f8e::{not-parsed}';
      (await index.addFragments(target('knowledge', 'doc-a'), [idFrag(opaque, 1, 0)])).orThrow();
      expect(await index.query(Float32Array.from([1, 0]), 1)).toSucceedAndSatisfy(
        (hits: ReadonlyArray<IVectorQueryHit>) => {
          expect(hits[0].fragmentId).toBe(opaque);
          expect(hits[0].locator).toBeUndefined();
        }
      );
    });

    test('carries both identities when a fragment supplies both', async () => {
      const index = await makeIndex();
      (
        await index.addFragments(target('knowledge', 'doc-a'), [
          { ...frag(2, 8, 1, 0), fragmentId: 'frag-1' }
        ])
      ).orThrow();
      expect(await index.query(Float32Array.from([1, 0]), 1)).toSucceedAndSatisfy(
        (hits: ReadonlyArray<IVectorQueryHit>) => {
          expect(hits[0].locator).toEqual(loc(2, 8));
          expect(hits[0].fragmentId).toBe('frag-1');
        }
      );
    });

    test('a locator-only fragment produces a hit with no fragmentId key at all', async () => {
      // Byte-identical to what this index produced before `fragment_id` existed: the
      // key is absent, not present-and-undefined, so an existing caller's structural
      // comparisons are unaffected by the addition.
      const index = await makeIndex();
      (await index.addFragments(target('knowledge', 'doc-a'), [frag(0, 5, 1, 0)])).orThrow();
      expect(await index.query(Float32Array.from([1, 0]), 1)).toSucceedAndSatisfy(
        (hits: ReadonlyArray<IVectorQueryHit>) => {
          expect(Object.keys(hits[0]).sort()).toEqual(['locator', 'score', 'target']);
          expect(hits[0]).toStrictEqual({
            target: target('knowledge', 'doc-a'),
            score: hits[0].score,
            locator: loc(0, 5)
          });
        }
      );
    });

    test('an id-only fragment produces a hit with no locator key at all', async () => {
      const index = await makeIndex();
      (await index.addFragments(target('knowledge', 'doc-a'), [idFrag('frag-1', 1, 0)])).orThrow();
      expect(await index.query(Float32Array.from([1, 0]), 1)).toSucceedAndSatisfy(
        (hits: ReadonlyArray<IVectorQueryHit>) => {
          expect(Object.keys(hits[0]).sort()).toEqual(['fragmentId', 'score', 'target']);
        }
      );
    });

    test('skips the safe-integer offset check for a fragment with no locator', async () => {
      // The write-side offset validation must not fire (or throw on `BigInt(undefined)`)
      // when there is no locator to validate.
      const index = await makeIndex();
      expect(await index.addFragments(target('knowledge', 'doc-a'), [idFrag('frag-1', 1, 0)])).toSucceedWith(
        1
      );
    });

    test('still rejects a non-safe-integer offset when a locator IS supplied', async () => {
      const index = await makeIndex();
      expect(
        await index.addFragments(target('knowledge', 'doc-a'), [
          { locator: loc(0.5, 5), fragmentId: 'frag-1', vector: Float32Array.from([1, 0]) }
        ])
      ).toFailWith(/offsets must be safe integers/i);
    });

    test('round-trips every identity shape across a close + reopen', async () => {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'svfragid-'));
      const dbPath = path.join(dir, 'fragments.db');
      const first = new BetterSqlite3(dbPath);
      try {
        const writeIndex = (await SqliteVecFragmentIndex.create({ database: first })).orThrow();
        (
          await writeIndex.addFragments(target('knowledge', 'doc-a'), [
            frag(0, 5, 1, 0),
            idFrag('frag-rewritten', 0, 1),
            { ...frag(5, 9, 0.9, 0.1), fragmentId: 'frag-both' }
          ])
        ).orThrow();
      } finally {
        first.close();
      }

      const second = new BetterSqlite3(dbPath);
      try {
        const reopened = (await SqliteVecFragmentIndex.create({ database: second })).orThrow();
        expect(reopened.fragmentCount).toBe(3);
        expect(await reopened.query(Float32Array.from([1, 0]), 3)).toSucceedAndSatisfy(
          (hits: ReadonlyArray<IVectorQueryHit>) => {
            const byShape = new Map(hits.map((h) => [h.fragmentId ?? '<none>', h]));
            expect(byShape.get('<none>')?.locator).toEqual(loc(0, 5));
            expect(byShape.get('frag-rewritten')?.locator).toBeUndefined();
            expect(byShape.get('frag-both')?.locator).toEqual(loc(5, 9));
          }
        );
      } finally {
        second.close();
        fs.rmSync(dir, { recursive: true, force: true });
      }
    });
  });

  describe('has', () => {
    test('answers false before any add has created the table', async () => {
      // The table is created lazily on first add, so "nothing held" must be a
      // truthful `false` rather than a statement-prepare error.
      const index = await makeIndex();
      expect(await index.has(target('knowledge', 'doc-1'))).toSucceedWith(false);
    });

    test('answers true once a record has fragments, false after removal', async () => {
      const index = await makeIndex();
      const t = target('knowledge', 'doc-1');
      (await index.addFragments(t, [frag(0, 5, 1, 0)])).orThrow();
      expect(await index.has(t)).toSucceedWith(true);
      (await index.remove(t)).orThrow();
      expect(await index.has(t)).toSucceedWith(false);
    });

    test('keys on scope as well as id', async () => {
      const index = await makeIndex();
      (await index.addFragments(target('conv-a', 'turn-3'), [frag(0, 5, 1, 0)])).orThrow();
      expect(await index.has(target('conv-a', 'turn-3'))).toSucceedWith(true);
      expect(await index.has(target('conv-b', 'turn-3'))).toSucceedWith(false);
    });

    test('fails rather than throwing when the connection is closed', async () => {
      const index = await makeIndex();
      (await index.addFragments(target('knowledge', 'doc-1'), [frag(0, 5, 1, 0)])).orThrow();
      db.close();
      expect(await index.has(target('knowledge', 'doc-1'))).toFailWith(/cannot check 'knowledge/i);
    });
  });

  describe('rebuild', () => {
    function record(id: string, kind: string = 'knowledge'): IMemoryRecord<unknown> {
      return {
        envelope: { id: id as MemoryId, kind: kind as Kind } as IMemoryRecord<unknown>['envelope'],
        body: `body-${id}`
      };
    }
    function scoped(scope: string, id: string, kind?: string): IScopedMemoryRecord {
      return { target: target(scope, id), record: record(id, kind) };
    }
    class FakeSource implements IMemoryRecordSource {
      private readonly _result: Result<ReadonlyArray<IScopedMemoryRecord>>;
      private readonly _excluded: ReadonlyMap<Kind, number> | undefined;
      public constructor(
        result: Result<ReadonlyArray<IScopedMemoryRecord>>,
        excluded?: ReadonlyMap<Kind, number>
      ) {
        this._result = result;
        this._excluded = excluded;
      }
      public list(): Promise<Result<IMemoryRecordListing>> {
        return Promise.resolve(
          this._result.onSuccess((records) =>
            succeed(this._excluded === undefined ? { records } : { records, excluded: this._excluded })
          )
        );
      }
    }
    const embed = (): Promise<Result<ReadonlyArray<IEmbeddedFragment>>> =>
      Promise.resolve(succeed([frag(0, 5, 1, 0), frag(5, 10, 0, 1)]));

    test('re-embeds every record and resolves indexed and the fan-out by kind', async () => {
      const index = await makeIndex();
      const source = new FakeSource(succeed([scoped('knowledge', 'a'), scoped('conv-a', 't1', 'turn')]));
      expect(await index.rebuild(source, embed)).toSucceedAndSatisfy(
        (report: IFragmentVectorRebuildReport) => {
          expect(report.indexed.get('knowledge' as Kind)).toBe(1);
          expect(report.fragments.get('knowledge' as Kind)).toBe(2);
          expect(report.indexed.get('turn' as Kind)).toBe(1);
          expect(report.fragments.get('turn' as Kind)).toBe(2);
        }
      );
      expect(index.recordCount).toBe(2);
      expect(index.fragmentCount).toBe(4);
    });

    test('clears prior contents first', async () => {
      const index = await makeIndex();
      (await index.addFragments(target('knowledge', 'old'), [frag(0, 5, 1, 0)])).orThrow();
      const source = new FakeSource(succeed([scoped('knowledge', 'a')]));
      expect(await index.rebuild(source, embed)).toSucceed();
      expect(index.recordCount).toBe(1);
      expect(await index.has(target('knowledge', 'old'))).toSucceedWith(false);
    });

    test('fails on a list failure WITHOUT discarding a healthy persisted index', async () => {
      // The durability stake: on this backend, clearing before the list would be
      // real data loss surviving the process, not a transient inconvenience.
      const index = await makeIndex();
      (await index.addFragments(target('knowledge', 'seed'), [frag(0, 5, 1, 1)])).orThrow();
      const result = await index.rebuild(new FakeSource(fail('disk gone')), embed);
      expect(result.isFailure()).toBe(true);
      expect(result.detail).toBeUndefined();
      expect(index.recordCount).toBe(1);
    });

    test('counts an empty-array embed as declined, and still replaces', async () => {
      const index = await makeIndex();
      (await index.addFragments(target('knowledge', 'a'), [frag(0, 5, 1, 1)])).orThrow();
      const source = new FakeSource(succeed([scoped('knowledge', 'a')]));
      expect(await index.rebuild(source, () => Promise.resolve(succeed([])))).toSucceedAndSatisfy(
        (report: IFragmentVectorRebuildReport) => {
          expect(report.declined.get('knowledge' as Kind)).toBe(1);
          expect(report.indexed.size).toBe(0);
        }
      );
      expect(index.recordCount).toBe(0);
    });

    test("'fail' rolls back to empty and carries the attempt on the detail", async () => {
      const index = await makeIndex();
      let calls: number = 0;
      const flaky = (): Promise<Result<ReadonlyArray<IEmbeddedFragment>>> => {
        calls += 1;
        return Promise.resolve(calls === 1 ? succeed([frag(0, 5, 1, 1)]) : fail('no model'));
      };
      const source = new FakeSource(succeed([scoped('knowledge', 'a'), scoped('conv-a', 't1')]));
      const result = await index.rebuild(source, flaky);
      expect(result.isFailure()).toBe(true);
      expect(result.detail?.indexed.get('knowledge' as Kind)).toBe(1);
      expect(index.recordCount).toBe(0);
    });

    test("'skip' keeps the healthy records and reports every casualty", async () => {
      const index = await makeIndex();
      let calls: number = 0;
      const flaky = (): Promise<Result<ReadonlyArray<IEmbeddedFragment>>> => {
        calls += 1;
        return Promise.resolve(calls === 1 ? fail('no model') : succeed([frag(0, 5, 1, 1)]));
      };
      const source = new FakeSource(succeed([scoped('conv-a', 't1'), scoped('knowledge', 'a')]));
      expect(await index.rebuild(source, flaky, { onRecordError: 'skip' })).toSucceedAndSatisfy(
        (report: IFragmentVectorRebuildReport) => {
          expect(report.skipped).toHaveLength(1);
          expect(report.indexed.get('knowledge' as Kind)).toBe(1);
        }
      );
      expect(index.recordCount).toBe(1);
    });

    test("'skip' also survives an ADD failure", async () => {
      const index = await makeIndex();
      let calls: number = 0;
      const embedThenBad = (): Promise<Result<ReadonlyArray<IEmbeddedFragment>>> => {
        calls += 1;
        // A dimension mismatch against the established dimension is an add-side
        // rejection, distinct from an embedder failure.
        return Promise.resolve(calls === 1 ? succeed([frag(0, 5, 1, 1)]) : succeed([frag(0, 5, 1, 1, 1)]));
      };
      const source = new FakeSource(succeed([scoped('knowledge', 'a'), scoped('conv-a', 't1')]));
      expect(await index.rebuild(source, embedThenBad, { onRecordError: 'skip' })).toSucceedAndSatisfy(
        (report: IFragmentVectorRebuildReport) => {
          expect(report.skipped).toHaveLength(1);
          expect(report.indexed.get('knowledge' as Kind)).toBe(1);
        }
      );
      expect(index.recordCount).toBe(1);
    });

    test('fails with no detail when the up-front clear fails — nothing was attempted', async () => {
      // Distinct from a mid-loop rollback: the table still holds whatever it held,
      // so an all-zero report would describe an index this call never disturbed.
      const index = await makeIndex();
      (await index.addFragments(target('knowledge', 'seed'), [frag(0, 5, 1, 1)])).orThrow();
      db.close();
      const result = await index.rebuild(new FakeSource(succeed([scoped('knowledge', 'a')])), embed);
      expect(result.isFailure()).toBe(true);
      expect(result.message).toMatch(/failed to clear the index/i);
      expect(result.detail).toBeUndefined();
    });

    test("'fail' rolls back when the ADD is what failed, not the embedder", async () => {
      const index = await makeIndex();
      let calls: number = 0;
      const embedThenBad = (): Promise<Result<ReadonlyArray<IEmbeddedFragment>>> => {
        calls += 1;
        return Promise.resolve(calls === 1 ? succeed([frag(0, 5, 1, 1)]) : succeed([frag(0, 5, 1, 1, 1)]));
      };
      const source = new FakeSource(succeed([scoped('knowledge', 'a'), scoped('conv-a', 't1')]));
      const result = await index.rebuild(source, embedThenBad);
      expect(result.isFailure()).toBe(true);
      expect(result.detail?.indexed.get('knowledge' as Kind)).toBe(1);
      expect(index.recordCount).toBe(0);
    });

    test('propagates the listing excluded tally rather than dropping it', async () => {
      const index = await makeIndex();
      const source = new FakeSource(
        succeed([scoped('knowledge', 'a')]),
        new Map<Kind, number>([['bookkeeping' as Kind, 3]])
      );
      expect(await index.rebuild(source, embed)).toSucceedAndSatisfy(
        (report: IFragmentVectorRebuildReport) => {
          expect(report.excluded?.get('bookkeeping' as Kind)).toBe(3);
        }
      );
    });

    test('captures a rejecting embedder rather than letting it escape', async () => {
      const index = await makeIndex();
      const source = new FakeSource(succeed([scoped('knowledge', 'a')]));
      expect(await index.rebuild(source, () => Promise.reject(new Error('socket hangup')))).toFailWith(
        /socket hangup/i
      );
    });

    test('reports a rollback that also failed, rather than silently promising empty', async () => {
      // The `'fail'` path promises an empty index; a caller retrying against a
      // table that is neither the old index nor empty is in a state the contract
      // never described, and on a durable table that state survives the process.
      const index = await makeIndex();
      const source = new FakeSource(succeed([scoped('knowledge', 'a'), scoped('conv-a', 't1')]));
      let calls: number = 0;
      const flaky = (): Promise<Result<ReadonlyArray<IEmbeddedFragment>>> => {
        calls += 1;
        if (calls === 2) {
          db.close();
          return Promise.resolve(fail('no model'));
        }
        return Promise.resolve(succeed([frag(0, 5, 1, 1)]));
      };
      expect(await index.rebuild(source, flaky)).toFailWith(/rollback also failed/i);
    });
  });

  describe('custom table name', () => {
    test('two fragment indexes on distinct tables in one database are independent', async () => {
      const a = (await SqliteVecFragmentIndex.create({ database: db, tableName: 'frag_a' })).orThrow();
      const b = (await SqliteVecFragmentIndex.create({ database: db, tableName: 'frag_b' })).orThrow();
      (await a.addFragments(target('s', 'one'), [frag(0, 5, 1, 0)])).orThrow();
      expect(a.fragmentCount).toBe(1);
      expect(b.fragmentCount).toBe(0);
    });
  });

  describe('persistence across reopen (the durability guarantee)', () => {
    let dir: string;
    let dbPath: string;

    beforeEach(() => {
      dir = fs.mkdtempSync(path.join(os.tmpdir(), 'svfrag-'));
      dbPath = path.join(dir, 'fragments.db');
    });
    afterEach(() => {
      fs.rmSync(dir, { recursive: true, force: true });
    });

    test('fragments written to a file survive a close + reopen with no re-embed, dimension + locators recovered', async () => {
      const first = new BetterSqlite3(dbPath);
      const writeIndex = (await SqliteVecFragmentIndex.create({ database: first })).orThrow();
      (
        await writeIndex.addFragments(target('knowledge', 'doc-a'), [
          frag(0, 5, 1, 0, 0),
          frag(5, 12, 0, 1, 0)
        ])
      ).orThrow();
      (
        await writeIndex.addFragments(target('conversations/c', 'turn-1'), [frag(0, 8, 0.9, 0.1, 0)])
      ).orThrow();
      first.close();

      // Second session: a brand-new connection + index over the same file. No adds
      // (no re-embedding) — fragments, dimension, and locators come straight off disk.
      const second = new BetterSqlite3(dbPath);
      const reopened = (await SqliteVecFragmentIndex.create({ database: second })).orThrow();
      try {
        expect(reopened.recordCount).toBe(2);
        expect(reopened.fragmentCount).toBe(3);
        expect(await reopened.query(Float32Array.from([1, 0, 0]), 3)).toSucceedAndSatisfy(
          (hits: ReadonlyArray<IVectorQueryHit>) => {
            expect(hits[0].target).toEqual(target('knowledge', 'doc-a'));
            expect(hits[0].locator).toEqual(loc(0, 5));
            expect(hits[0].score).toBeCloseTo(1, 5);
            // the cross-scope target round-trips its full (scope, id) and locator
            expect(hits[1].target).toEqual(target('conversations/c', 'turn-1'));
            expect(hits[1].locator).toEqual(loc(0, 8));
          }
        );
        // The recovered dimension is enforced on a post-reopen add.
        expect(await reopened.addFragments(target('knowledge', 'w'), [frag(0, 4, 1, 0)])).toFailWith(
          /fragment dimension 2 does not match index dimension 3/i
        );
        // A matching-dimension add still works and persists incrementally.
        (await reopened.addFragments(target('knowledge', 'w'), [frag(0, 4, 0, 0, 1)])).orThrow();
        expect(reopened.recordCount).toBe(3);
      } finally {
        second.close();
      }
    });
  });
});
