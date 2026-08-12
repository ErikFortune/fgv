/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';

import BetterSqlite3 from 'better-sqlite3';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Result, fail, succeed } from '@fgv/ts-utils';
import {
  IEdgeTarget,
  IMemoryRecord,
  IMemoryRecordSource,
  IScopedMemoryRecord,
  IVectorQueryHit,
  IVectorRebuildReport,
  MemoryEmbedder,
  MemoryId,
  MemoryScopeKey
} from '@fgv/ts-agent-memory';
import { SqliteVecVectorIndex } from '../../index';

function target(scope: string, id: string): IEdgeTarget {
  return { scope: scope as unknown as MemoryScopeKey, id: id as unknown as MemoryId };
}
function vec(...values: number[]): Float32Array {
  return Float32Array.from(values);
}

describe('SqliteVecVectorIndex', () => {
  let db: BetterSqlite3.Database;

  beforeEach(() => {
    db = new BetterSqlite3(':memory:');
  });
  afterEach(() => {
    db.close();
  });

  async function makeIndex(): Promise<SqliteVecVectorIndex> {
    return (await SqliteVecVectorIndex.create({ database: db })).orThrow();
  }

  describe('create', () => {
    test('succeeds over a fresh database with an empty index', async () => {
      expect(await SqliteVecVectorIndex.create({ database: db })).toSucceedAndSatisfy(
        (index: SqliteVecVectorIndex) => {
          expect(index.size).toBe(0);
        }
      );
    });

    test('rejects a table name that is not a simple identifier', async () => {
      expect(
        await SqliteVecVectorIndex.create({ database: db, tableName: 'bad name; DROP TABLE x' })
      ).toFailWith(/not a simple SQL identifier/i);
    });

    test('fails loudly when the sqlite-vec extension cannot load (closed database)', async () => {
      const closed = new BetterSqlite3(':memory:');
      closed.close();
      expect(await SqliteVecVectorIndex.create({ database: closed })).toFailWith(/failed to initialize/i);
    });

    test('recovers no dimension from a pre-existing non-vec0 table of the same name', async () => {
      // A plain table that happens to share the index's name has no `float[<n>]`
      // in its DDL, so no dimension is recovered — the index opens as if empty.
      db.exec('CREATE TABLE memory_vectors (foo TEXT)');
      expect(await SqliteVecVectorIndex.create({ database: db })).toSucceedAndSatisfy(
        (index: SqliteVecVectorIndex) => {
          expect(index.size).toBe(0);
        }
      );
    });
  });

  describe('add', () => {
    test('adds a vector and returns the canonical scoped key, growing size', async () => {
      const index = await makeIndex();
      expect(await index.add(target('knowledge', 'doc-a'), vec(1, 0, 0))).toSucceedWith('knowledge\0doc-a');
      expect(index.size).toBe(1);
    });

    test('rejects an empty vector', async () => {
      const index = await makeIndex();
      expect(await index.add(target('knowledge', 'doc-a'), vec())).toFailWith(
        /cannot add 'knowledge\0doc-a': empty vector/i
      );
    });

    test('rejects a vector whose dimension does not match the established dimension', async () => {
      const index = await makeIndex();
      (await index.add(target('knowledge', 'doc-a'), vec(1, 0, 0))).orThrow();
      expect(await index.add(target('knowledge', 'doc-b'), vec(1, 0))).toFailWith(
        /dimension 2 does not match index dimension 3/i
      );
    });

    test('replacing an existing target keeps size stable and the new vector wins the query', async () => {
      const index = await makeIndex();
      (await index.add(target('knowledge', 'doc-a'), vec(1, 0, 0))).orThrow();
      (await index.add(target('knowledge', 'doc-a'), vec(0, 0, 1))).orThrow();
      expect(index.size).toBe(1);
      expect(await index.query(vec(0, 0, 1), 1)).toSucceedAndSatisfy(
        (hits: ReadonlyArray<IVectorQueryHit>) => {
          expect(hits[0].target).toEqual(target('knowledge', 'doc-a'));
          expect(hits[0].score).toBeCloseTo(1, 5);
        }
      );
    });

    test('two records that share a stem across scopes are distinct entries', async () => {
      const index = await makeIndex();
      (await index.add(target('conversations/a', 'turn-3'), vec(1, 0, 0))).orThrow();
      (await index.add(target('conversations/b', 'turn-3'), vec(0, 1, 0))).orThrow();
      expect(index.size).toBe(2);
    });
  });

  describe('query', () => {
    async function seeded(): Promise<SqliteVecVectorIndex> {
      const index = await makeIndex();
      (await index.add(target('knowledge', 'x'), vec(1, 0, 0))).orThrow();
      (await index.add(target('knowledge', 'y'), vec(0, 1, 0))).orThrow();
      (await index.add(target('knowledge', 'z'), vec(0.9, 0.1, 0))).orThrow();
      return index;
    }

    test('returns hits in descending cosine-similarity score with round-tripped scoped targets', async () => {
      const index = await seeded();
      expect(await index.query(vec(1, 0, 0), 3)).toSucceedAndSatisfy(
        (hits: ReadonlyArray<IVectorQueryHit>) => {
          expect(hits.map((h) => h.target.id)).toEqual(['x', 'z', 'y']);
          expect(hits[0].target.scope).toBe('knowledge');
          expect(hits[0].score).toBeCloseTo(1, 5); // identical
          expect(hits[2].score).toBeCloseTo(0, 5); // orthogonal
          // scores are sorted descending
          expect(hits[0].score).toBeGreaterThan(hits[1].score);
          expect(hits[1].score).toBeGreaterThan(hits[2].score);
        }
      );
    });

    test('honors topK', async () => {
      const index = await seeded();
      expect(await index.query(vec(1, 0, 0), 2)).toSucceedAndSatisfy(
        (hits: ReadonlyArray<IVectorQueryHit>) => {
          expect(hits).toHaveLength(2);
          expect(hits.map((h) => h.target.id)).toEqual(['x', 'z']);
        }
      );
    });

    test('returns empty for topK <= 0', async () => {
      const index = await seeded();
      expect(await index.query(vec(1, 0, 0), 0)).toSucceedWith([]);
      expect(await index.query(vec(1, 0, 0), -5)).toSucceedWith([]);
    });

    test('returns empty before any add (no established dimension)', async () => {
      const index = await makeIndex();
      expect(await index.query(vec(1, 0, 0), 5)).toSucceedWith([]);
    });

    test('rejects a query vector of the wrong dimension', async () => {
      const index = await seeded();
      expect(await index.query(vec(1, 0), 3)).toFailWith(
        /query dimension 2 does not match index dimension 3/i
      );
    });
  });

  describe('remove', () => {
    test('removes an entry and shrinks size, returning the target', async () => {
      const index = await makeIndex();
      (await index.add(target('knowledge', 'doc-a'), vec(1, 0, 0))).orThrow();
      (await index.add(target('knowledge', 'doc-b'), vec(0, 1, 0))).orThrow();
      expect(await index.remove(target('knowledge', 'doc-a'))).toSucceedWith(target('knowledge', 'doc-a'));
      expect(index.size).toBe(1);
      expect(await index.query(vec(1, 0, 0), 5)).toSucceedAndSatisfy(
        (hits: ReadonlyArray<IVectorQueryHit>) => {
          expect(hits.map((h) => h.target.id)).toEqual(['doc-b']);
        }
      );
    });

    test('is idempotent — removing a missing target succeeds', async () => {
      const index = await makeIndex();
      (await index.add(target('knowledge', 'doc-a'), vec(1, 0, 0))).orThrow();
      expect(await index.remove(target('knowledge', 'missing'))).toSucceedWith(
        target('knowledge', 'missing')
      );
      expect(index.size).toBe(1);
    });

    test('succeeds before any add (no table yet)', async () => {
      const index = await makeIndex();
      expect(await index.remove(target('knowledge', 'doc-a'))).toSucceedWith(target('knowledge', 'doc-a'));
      expect(index.size).toBe(0);
    });
  });

  describe('custom table name', () => {
    test('two indexes on distinct tables in one database are independent', async () => {
      const a = (await SqliteVecVectorIndex.create({ database: db, tableName: 'idx_a' })).orThrow();
      const b = (await SqliteVecVectorIndex.create({ database: db, tableName: 'idx_b' })).orThrow();
      (await a.add(target('s', 'one'), vec(1, 0))).orThrow();
      expect(a.size).toBe(1);
      expect(b.size).toBe(0);
    });
  });

  describe('persistence across reopen (the durability guarantee)', () => {
    let dir: string;
    let dbPath: string;

    beforeEach(() => {
      dir = fs.mkdtempSync(path.join(os.tmpdir(), 'svtest-'));
      dbPath = path.join(dir, 'vectors.db');
    });
    afterEach(() => {
      fs.rmSync(dir, { recursive: true, force: true });
    });

    test('vectors written to a file survive a close + reopen with no re-embed, and the dimension is recovered', async () => {
      // First session: write three embeddings, then close the connection entirely.
      const first = new BetterSqlite3(dbPath);
      const writeIndex = (await SqliteVecVectorIndex.create({ database: first })).orThrow();
      (await writeIndex.add(target('knowledge', 'x'), vec(1, 0, 0))).orThrow();
      (await writeIndex.add(target('knowledge', 'y'), vec(0, 1, 0))).orThrow();
      (await writeIndex.add(target('conversations/c', 'turn-1'), vec(0.9, 0.1, 0))).orThrow();
      first.close();

      // Second session: a brand-new connection + index over the same file. No add
      // calls (no re-embedding) — the vectors and the established dimension come
      // straight off disk.
      const second = new BetterSqlite3(dbPath);
      const reopened = (await SqliteVecVectorIndex.create({ database: second })).orThrow();
      try {
        expect(reopened.size).toBe(3);
        expect(await reopened.query(vec(1, 0, 0), 3)).toSucceedAndSatisfy(
          (hits: ReadonlyArray<IVectorQueryHit>) => {
            expect(hits.map((h) => h.target.id)).toEqual(['x', 'turn-1', 'y']);
            expect(hits[0].score).toBeCloseTo(1, 5);
            // the cross-scope target round-trips its full (scope, id)
            expect(hits[1].target).toEqual(target('conversations/c', 'turn-1'));
          }
        );
        // The recovered dimension is enforced on a post-reopen add.
        expect(await reopened.add(target('knowledge', 'w'), vec(1, 0))).toFailWith(
          /dimension 2 does not match index dimension 3/i
        );
        // A matching-dimension add still works and persists incrementally.
        (await reopened.add(target('knowledge', 'w'), vec(0, 0, 1))).orThrow();
        expect(reopened.size).toBe(4);
      } finally {
        second.close();
      }
    });
  });

  describe('rebuild — the backfill the IVectorIndex contract now requires', () => {
    /** A scripted source; the embedder keys off the id's first char code. */
    function source(ids: ReadonlyArray<string>, listFails: boolean = false): IMemoryRecordSource {
      return {
        list: (): Promise<Result<ReadonlyArray<IScopedMemoryRecord>>> =>
          Promise.resolve(
            listFails
              ? fail('disk gone')
              : succeed(
                  ids.map((id) => ({
                    target: target('s', id),
                    record: {
                      envelope: { id: id as unknown as MemoryId } as IMemoryRecord<unknown>['envelope'],
                      body: `body-${id}`
                    }
                  }))
                )
          )
      };
    }
    const embed: MemoryEmbedder = (r) =>
      Promise.resolve(succeed(vec((r.envelope.id as string).charCodeAt(0), 1)));

    test('backfills a persistent index that was written to while unwired', async () => {
      // The scenario the ask names: records exist, the index does not know them.
      const index = await makeIndex();
      expect(index.size).toBe(0);
      expect(await index.rebuild(source(['a', 'b', 'c']), embed)).toSucceedWith({
        indexed: 3,
        declined: 0,
        skipped: []
      });
      expect(index.size).toBe(3);
      expect(await index.query(vec(99, 1), 1)).toSucceedAndSatisfy((hits: ReadonlyArray<IVectorQueryHit>) => {
        expect(hits[0].target.id).toBe('c');
      });
    });

    test('clears prior contents so a rebuild is not additive', async () => {
      const index = await makeIndex();
      (await index.add(target('s', 'stale'), vec(1, 1))).orThrow();
      expect(await index.rebuild(source(['a']), embed)).toSucceedWith({
        indexed: 1,
        declined: 0,
        skipped: []
      });
      expect(index.size).toBe(1);
    });

    test("defaults to 'fail': one bad record leaves the persisted index empty", async () => {
      // Durable storage makes this sharper than in-memory: a half-rebuilt file is a
      // wrong answer that survives the process.
      const index = await makeIndex();
      const failB: MemoryEmbedder = (r) =>
        (r.envelope.id as string) === 'b' ? Promise.resolve(fail('no model')) : embed(r);
      expect(await index.rebuild(source(['a', 'b', 'c']), failB)).toFailWith(/no model/);
      expect(index.size).toBe(0);
    });

    test("'skip' keeps the healthy records and reports each casualty", async () => {
      const index = await makeIndex();
      const failB: MemoryEmbedder = (r) =>
        (r.envelope.id as string) === 'b' ? Promise.resolve(fail('no model')) : embed(r);
      expect(
        await index.rebuild(source(['a', 'b', 'c']), failB, { onRecordError: 'skip' })
      ).toSucceedAndSatisfy((report: IVectorRebuildReport) => {
        expect(report.indexed).toBe(2);
        expect(report.skipped).toHaveLength(1);
        expect(report.skipped[0].target.id).toBe('b');
        expect(report.skipped[0].error).toMatch(/no model/);
      });
      expect(index.size).toBe(2);
    });

    test('counts a decline separately from a failure', async () => {
      const index = await makeIndex();
      const mixed: MemoryEmbedder = (r) => {
        const id: string = r.envelope.id as string;
        if (id === 'b') return Promise.resolve(fail('no model'));
        if (id === 'c') return Promise.resolve(succeed(undefined));
        return embed(r);
      };
      expect(
        await index.rebuild(source(['a', 'b', 'c']), mixed, { onRecordError: 'skip' })
      ).toSucceedAndSatisfy((report: IVectorRebuildReport) => {
        expect(report.indexed).toBe(1);
        expect(report.declined).toBe(1);
        expect(report.skipped.map((s) => s.target.id)).toEqual(['b']);
      });
    });

    test('a list failure is fatal under both modes', async () => {
      for (const mode of ['fail', 'skip'] as const) {
        const index = await makeIndex();
        expect(await index.rebuild(source([], true), embed, { onRecordError: mode })).toFailWith(
          /failed to list records.*disk gone/
        );
      }
    });

    test('a list failure leaves an already-populated PERSISTED index intact', async () => {
      // The regression this exists for, and it mattered most here: the table was
      // cleared before the list was even attempted, so a transient read error
      // destroyed durable data that survives the process. Fatal-to-the-call must
      // not mean destructive-to-the-data.
      for (const mode of ['fail', 'skip'] as const) {
        const index = await makeIndex();
        (await index.add(target('s', 'kept'), vec(1, 1))).orThrow();
        expect(await index.rebuild(source([], true), embed, { onRecordError: mode })).toFail();
        expect(index.size).toBe(1);
        expect(await index.query(vec(1, 1), 5)).toSucceedAndSatisfy(
          (hits: ReadonlyArray<IVectorQueryHit>) => {
            expect(hits.map((h) => h.target.id)).toEqual(['kept']);
          }
        );
      }
    });

    test("'skip' reports an add failure too", async () => {
      const index = await makeIndex();
      // Establish dimension 2, then hand the rebuild a 3-dim vector for 'b'.
      const badDim: MemoryEmbedder = (r) =>
        (r.envelope.id as string) === 'b' ? Promise.resolve(succeed(vec(1, 2, 3))) : embed(r);
      expect(await index.rebuild(source(['a', 'b']), badDim, { onRecordError: 'skip' })).toSucceedAndSatisfy(
        (report: IVectorRebuildReport) => {
          expect(report.indexed).toBe(1);
          expect(report.skipped).toHaveLength(1);
          expect(report.skipped[0].error).toMatch(/dimension/);
        }
      );
    });

    test("defaults to 'fail' on an ADD failure too, clearing the persisted table", async () => {
      // Distinct from the embed-failure path: here the embedder succeeds and the
      // index rejects the vector. On durable storage the clear is what stops a
      // half-rebuilt file outliving the process.
      const index = await makeIndex();
      const badDim: MemoryEmbedder = (r) =>
        (r.envelope.id as string) === 'b' ? Promise.resolve(succeed(vec(1, 2, 3))) : embed(r);
      expect(await index.rebuild(source(['a', 'b', 'c']), badDim)).toFailWith(/dimension/);
      expect(index.size).toBe(0);
    });

    test('rebuilding an index that was never added to is a no-op that succeeds', async () => {
      // Exercises the `_clear` guard when no statements are prepared yet.
      const index = await makeIndex();
      expect(await index.rebuild(source([]), embed)).toSucceedWith({
        indexed: 0,
        declined: 0,
        skipped: []
      });
    });
  });
});
