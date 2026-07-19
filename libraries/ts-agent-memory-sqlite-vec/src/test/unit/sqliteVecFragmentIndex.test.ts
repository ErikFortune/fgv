/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';

import BetterSqlite3 from 'better-sqlite3';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  IEdgeTarget,
  IEmbeddedFragment,
  IFragmentLocator,
  IVectorQueryHit,
  MemoryId,
  MemoryScopeKey
} from '@fgv/ts-agent-memory';
import { SqliteVecFragmentIndex } from '../../index';

function target(scope: string, id: string): IEdgeTarget {
  return { scope: scope as unknown as MemoryScopeKey, id: id as unknown as MemoryId };
}
function loc(start: number, end: number): IFragmentLocator {
  return { start, end };
}
function frag(start: number, end: number, ...values: number[]): IEmbeddedFragment {
  return { locator: loc(start, end), vector: Float32Array.from(values) };
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

    test('recovers no dimension from a pre-existing non-vec0 table of the same name', async () => {
      db.exec('CREATE TABLE memory_fragments (foo TEXT)');
      expect(await SqliteVecFragmentIndex.create({ database: db })).toSucceedAndSatisfy(
        (index: SqliteVecFragmentIndex) => {
          expect(index.recordCount).toBe(0);
        }
      );
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
      // EXISTS` no-ops against it, so preparing the vector INSERT against the missing
      // columns must fail loudly rather than corrupt state.
      db.exec('CREATE TABLE memory_fragments (foo TEXT)');
      const index = (await SqliteVecFragmentIndex.create({ database: db })).orThrow();
      expect(await index.addFragments(target('knowledge', 'doc-a'), [frag(0, 5, 1, 0)])).toFailWith(
        /cannot add 'knowledge\0doc-a'/i
      );
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
