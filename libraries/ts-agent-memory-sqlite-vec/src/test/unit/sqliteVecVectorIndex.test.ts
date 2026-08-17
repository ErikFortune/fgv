/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';

import BetterSqlite3 from 'better-sqlite3';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { DetailedResult, Result, fail, succeed } from '@fgv/ts-utils';
import {
  IEdgeTarget,
  IMemoryRecord,
  IMemoryRecordListing,
  IMemoryRecordSource,
  IVectorQueryHit,
  IVectorRebuildReport,
  Kind,
  MemoryEmbedder,
  MemoryId,
  MemoryScopeKey
} from '@fgv/ts-agent-memory';
import { ISqliteVecVectorIndexHandle, SqliteVecVectorIndex } from '../../index';

function target(scope: string, id: string): IEdgeTarget {
  return { scope: scope as unknown as MemoryScopeKey, id: id as unknown as MemoryId };
}
function vec(...values: number[]): Float32Array {
  return Float32Array.from(values);
}

/**
 * How many of this process's open descriptors point at `file`, or `undefined` on a
 * platform without `/proc/self/fd` (i.e. not Linux), where the caller should skip
 * the assertion. CI is Linux, so the leak gate is real there; on a macOS dev box the
 * test degrades to running the code path without checking the descriptor.
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

  describe('size', () => {
    test('returns a number under better-sqlite3 safe-integer mode, not a bigint', async () => {
      // `COUNT(*)` comes back as a `bigint` once the consumer enables safe-integer
      // mode, and `size` is declared `number` on `IVectorIndex`. Without the
      // conversion the bigint leaks through the contract AND onward into
      // `IIndexCoverage.indexSize`, which is also declared `number` — so a coverage
      // report would carry a value of the wrong runtime type while type-checking
      // clean. The fragment index's two counts have always converted; this one was
      // the outlier.
      //
      // The flag is set BEFORE the index is created, which is the only ordering
      // that reproduces it: `defaultSafeIntegers` applies to statements prepared
      // AFTER the call, and the index prepares its own at create/first-add. Setting
      // it afterwards leaves the already-prepared `count` statement in number mode
      // and the test passes against the unfixed code — a false pin. Consumers own
      // the connection here (BYO `Database`), so flag-then-hand-over is the
      // realistic order.
      db.defaultSafeIntegers(true);
      const index = await makeIndex();
      (await index.add(target('knowledge', 'a'), Float32Array.from([1, 0]))).orThrow();
      (await index.add(target('knowledge', 'b'), Float32Array.from([0, 1]))).orThrow();

      expect(typeof index.size).toBe('number');
      expect(index.size).toBe(2);
    });
  });

  describe('has', () => {
    test('answers false before any add has created the table', async () => {
      const index = await makeIndex();
      expect(await index.has(target('knowledge', 'a'))).toSucceedWith(false);
    });

    test('answers true for a held target, false after removal', async () => {
      const index = await makeIndex();
      const t = target('knowledge', 'a');
      (await index.add(t, Float32Array.from([1, 0]))).orThrow();
      expect(await index.has(t)).toSucceedWith(true);
      (await index.remove(t)).orThrow();
      expect(await index.has(t)).toSucceedWith(false);
    });

    test('keys on scope as well as id', async () => {
      const index = await makeIndex();
      (await index.add(target('conv-a', 'turn-3'), Float32Array.from([1, 0]))).orThrow();
      expect(await index.has(target('conv-a', 'turn-3'))).toSucceedWith(true);
      expect(await index.has(target('conv-b', 'turn-3'))).toSucceedWith(false);
    });

    test('survives a reopen — the point of a durable index', async () => {
      // `has` reading true across a restart is what lets a repair skip a record
      // without re-embedding it, which is the whole reason it is on the contract.
      const index = await makeIndex();
      (await index.add(target('knowledge', 'a'), Float32Array.from([1, 0]))).orThrow();
      const reopened = (await SqliteVecVectorIndex.create({ database: db })).orThrow();
      expect(await reopened.has(target('knowledge', 'a'))).toSucceedWith(true);
    });

    test('fails rather than throwing when the connection is closed', async () => {
      const index = await makeIndex();
      (await index.add(target('knowledge', 'a'), Float32Array.from([1, 0]))).orThrow();
      db.close();
      expect(await index.has(target('knowledge', 'a'))).toFailWith(/cannot check 'knowledge/i);
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

  describe('open (path-based factory)', () => {
    let dir: string;
    let dbPath: string;

    beforeEach(() => {
      dir = fs.mkdtempSync(path.join(os.tmpdir(), 'svopen-'));
      dbPath = path.join(dir, 'vectors.db');
    });
    afterEach(() => {
      fs.rmSync(dir, { recursive: true, force: true });
    });

    test('opens the file itself and returns a usable index', async () => {
      const opened = await SqliteVecVectorIndex.open({ path: dbPath });
      expect(opened).toSucceed();
      const handle: ISqliteVecVectorIndexHandle = opened.orThrow();
      expect(await handle.index.add(target('knowledge', 'a'), vec(1, 0, 0))).toSucceed();
      expect(handle.index.size).toBe(1);
      expect(handle.close()).toSucceedWith(true);
    });

    test('persists across an open + close + open cycle, dimension recovered', async () => {
      const first = (await SqliteVecVectorIndex.open({ path: dbPath })).orThrow();
      (await first.index.add(target('knowledge', 'x'), vec(1, 0, 0))).orThrow();
      expect(first.close()).toSucceedWith(true);

      const second = (await SqliteVecVectorIndex.open({ path: dbPath })).orThrow();
      expect(second.index.size).toBe(1);
      expect(await second.index.has(target('knowledge', 'x'))).toSucceedWith(true);
      // The dimension came back from the table schema, so a mismatched add still fails.
      expect(await second.index.add(target('knowledge', 'y'), vec(1, 0))).toFailWith(
        /does not match index dimension/i
      );
      expect(second.close()).toSucceedWith(true);
    });

    test('honors tableName', async () => {
      const handle = (await SqliteVecVectorIndex.open({ path: dbPath, tableName: 'custom_vecs' })).orThrow();
      (await handle.index.add(target('knowledge', 'a'), vec(1, 0))).orThrow();
      expect(handle.close()).toSucceedWith(true);

      // A default-named index over the same file sees nothing — the rows are in the custom table.
      const other = (await SqliteVecVectorIndex.open({ path: dbPath })).orThrow();
      expect(other.index.size).toBe(0);
      expect(other.close()).toSucceedWith(true);
    });

    test('the handle close is idempotent', async () => {
      const handle = (await SqliteVecVectorIndex.open({ path: dbPath })).orThrow();
      expect(handle.close()).toSucceedWith(true);
      expect(handle.close()).toSucceedWith(true);
    });

    test('the index is unusable after its handle is closed', async () => {
      const handle = (await SqliteVecVectorIndex.open({ path: dbPath })).orThrow();
      (await handle.index.add(target('knowledge', 'a'), vec(1, 0))).orThrow();
      expect(handle.close()).toSucceedWith(true);
      expect(await handle.index.add(target('knowledge', 'b'), vec(0, 1))).toFail();
    });

    test('a create()-made index exposes no way to close the consumer connection', async () => {
      // The gate this shape exists for: `close` travels on the handle `open` returns,
      // so an index built over a consumer-owned handle is structurally incapable of
      // closing it. Asserted at runtime here; the type carries no `close` either,
      // which is the half a test cannot state.
      const index = await makeIndex();
      expect((index as unknown as { close?: unknown }).close).toBeUndefined();
      // ...and the consumer's connection is still open and usable afterwards.
      expect(await index.add(target('knowledge', 'a'), vec(1, 0))).toSucceed();
      expect(db.open).toBe(true);
    });

    test('fails without leaking the connection when initialization fails after the file is opened', async () => {
      // A bad table name fails inside create(), i.e. AFTER open() has already created
      // the file. The connection open() made must be closed before it returns, or a
      // failed open leaks a file handle per call.
      //
      // This asserts on the process's open descriptors, NOT on "can I open the file
      // again" — SQLite permits many connections to one file, so a reopen-and-write
      // succeeds just as happily when the first connection was leaked. That weaker
      // form was written first and verified to pass against the un-cleaned-up code,
      // i.e. it pinned nothing.
      const before = openFdCountFor(dbPath);
      expect(
        await SqliteVecVectorIndex.open({ path: dbPath, tableName: 'bad name; DROP TABLE x' })
      ).toFailWith(/not a simple SQL identifier/i);
      const after = openFdCountFor(dbPath);
      if (before !== undefined && after !== undefined) {
        expect(after).toBe(before);
      }
    });

    test("accepts ':memory:' and yields an owned ephemeral connection", async () => {
      // Documented on ISqliteVecVectorIndexOpenParams.path, so it is pinned here
      // rather than left as an untested claim.
      const handle = (await SqliteVecVectorIndex.open({ path: ':memory:' })).orThrow();
      expect(await handle.index.add(target('knowledge', 'a'), vec(1, 0))).toSucceed();
      expect(handle.index.size).toBe(1);
      expect(handle.close()).toSucceedWith(true);
    });

    test('fails when the path cannot be opened', async () => {
      expect(
        await SqliteVecVectorIndex.open({ path: path.join(dir, 'no', 'such', 'dir', 'x.db') })
      ).toFailWith(/failed to open/i);
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
    /**
     * A scripted source; the embedder keys off the id's first char code. Every
     * record is of kind `note` unless `kinds` maps an id to something else, and
     * `excluded` is reported only when supplied — an untracking source is the
     * "cannot say" case.
     */
    function source(
      ids: ReadonlyArray<string>,
      listFails: boolean = false,
      kinds: Readonly<Record<string, string>> = {},
      excluded?: ReadonlyMap<Kind, number>
    ): IMemoryRecordSource {
      return {
        list: (): Promise<Result<IMemoryRecordListing>> =>
          Promise.resolve(
            listFails
              ? fail('disk gone')
              : succeed({
                  records: ids.map((id) => ({
                    target: target('s', id),
                    record: {
                      envelope: {
                        id: id as unknown as MemoryId,
                        kind: (kinds[id] ?? 'note') as Kind
                      } as IMemoryRecord<unknown>['envelope'],
                      body: `body-${id}`
                    }
                  })),
                  ...(excluded === undefined ? {} : { excluded })
                })
          )
      };
    }

    const embed: MemoryEmbedder = (r) =>
      Promise.resolve(succeed(vec((r.envelope.id as string).charCodeAt(0), 1)));

    test('backfills a persistent index that was written to while unwired', async () => {
      // The scenario the ask names: records exist, the index does not know them.
      const index = await makeIndex();
      expect(index.size).toBe(0);
      expect(await index.rebuild(source(['a', 'b', 'c']), embed)).toSucceedAndSatisfy(
        (report: IVectorRebuildReport) => {
          expect(report.indexed).toEqual(new Map([['note', 3]]));
          expect(report.declined).toEqual(new Map<Kind, number>());
          expect(report.skipped).toEqual([]);
        }
      );
      expect(index.size).toBe(3);
      expect(await index.query(vec(99, 1), 1)).toSucceedAndSatisfy((hits: ReadonlyArray<IVectorQueryHit>) => {
        expect(hits[0].target.id).toBe('c');
      });
    });

    test('clears prior contents so a rebuild is not additive', async () => {
      const index = await makeIndex();
      (await index.add(target('s', 'stale'), vec(1, 1))).orThrow();
      expect(await index.rebuild(source(['a']), embed)).toSucceedAndSatisfy(
        (report: IVectorRebuildReport) => {
          expect(report.indexed).toEqual(new Map([['note', 1]]));
        }
      );
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
        expect(report.indexed).toEqual(new Map([['note', 2]]));
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
        expect(report.indexed).toEqual(new Map([['note', 1]]));
        expect(report.declined).toEqual(new Map([['note', 1]]));
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

    test('a clear failure is a Failure, not an exception thrown out of rebuild', async () => {
      // `_clear` runs a better-sqlite3 statement. Before this, a closed
      // connection (or any driver error) escaped as a throw from a method whose
      // signature promises a Result — unlike add / remove / query, which have
      // always been capture-wrapped.
      const own = new BetterSqlite3(':memory:');
      const index = (await SqliteVecVectorIndex.create({ database: own })).orThrow();
      (await index.add(target('s', 'seed'), vec(1, 1))).orThrow();
      own.close();
      expect(await index.rebuild(source(['a']), embed)).toFailWith(/failed to clear the index/i);
    });

    test('says so when the rollback ALSO fails, rather than reporting a clean abort', async () => {
      // The 'fail' path promises an empty index. If the rollback cannot deliver
      // one, a caller retrying against a table that is neither the old index nor
      // empty is working from a state the contract never described — so both
      // failures are reported, not just the one that started it.
      const own = new BetterSqlite3(':memory:');
      const index = (await SqliteVecVectorIndex.create({ database: own })).orThrow();
      const collapsing: MemoryEmbedder = (r) => {
        if ((r.envelope.id as string) === 'b') {
          own.close();
          return Promise.resolve(fail('model down'));
        }
        return Promise.resolve(succeed(vec(1, 1)));
      };
      expect(await index.rebuild(source(['a', 'b']), collapsing)).toFailWith(
        /embedding 's\0b' failed: model down \(rollback also failed:/
      );
    });

    test('a throwing source becomes a failure and leaves the persisted index intact', async () => {
      const index = await makeIndex();
      (await index.add(target('s', 'kept'), vec(1, 1))).orThrow();
      const throwing: IMemoryRecordSource = {
        list: () => {
          throw new Error('source exploded');
        }
      };
      expect(await index.rebuild(throwing, embed)).toFailWith(/failed to list records.*source exploded/);
      expect(index.size).toBe(1);
    });

    test('a throwing embedder becomes a failure and still clears, rather than escaping mid-rebuild', async () => {
      // Worse here than in memory: an exception escaping past the `'fail'`
      // rollback would leave a DURABLE table holding a partial index that
      // survives the process, which a later query would answer from.
      const index = await makeIndex();
      let calls: number = 0;
      const throwingEmbed: MemoryEmbedder = () => {
        calls += 1;
        if (calls === 1) {
          return Promise.resolve(succeed(vec(1, 1)));
        }
        throw new Error('embedder exploded');
      };
      expect(await index.rebuild(source(['a', 'b']), throwingEmbed)).toFailWith(
        /embedding 's\0b' failed.*embedder exploded/
      );
      expect(index.size).toBe(0);
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
          expect(report.indexed).toEqual(new Map([['note', 1]]));
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
      expect(await index.rebuild(source([]), embed)).toSucceedAndSatisfy((report: IVectorRebuildReport) => {
        expect(report.indexed.size).toBe(0);
        expect(report.declined.size).toBe(0);
        expect(report.skipped).toEqual([]);
      });
    });

    describe('per-kind coverage, matching the in-memory index exactly', () => {
      test('resolves indexed and declined by kind and propagates the source exclusions', async () => {
        const index = await makeIndex();
        const declineB: MemoryEmbedder = (r) =>
          (r.envelope.id as string) === 'b' ? Promise.resolve(succeed(undefined)) : embed(r);
        const scripted = source(
          ['a', 'b', 'c'],
          false,
          { a: 'knowledge', b: 'knowledge', c: 'ingestion-job' },
          new Map<Kind, number>([['audit' as Kind, 4]])
        );
        expect(await index.rebuild(scripted, declineB)).toSucceedAndSatisfy(
          (report: IVectorRebuildReport) => {
            expect(report.indexed).toEqual(
              new Map([
                ['knowledge', 1],
                ['ingestion-job', 1]
              ])
            );
            expect(report.declined).toEqual(new Map([['knowledge', 1]]));
            expect(report.excluded).toEqual(new Map([['audit', 4]]));
          }
        );
      });

      test('a source that does not report exclusions yields undefined, NOT an empty map', async () => {
        const index = await makeIndex();
        expect(await index.rebuild(source(['a']), embed)).toSucceedAndSatisfy(
          (report: IVectorRebuildReport) => {
            expect(report.excluded).toBeUndefined();
          }
        );
      });
    });

    describe("a 'fail' failure carries the report too", () => {
      test('reports the aborted attempt, and the persisted table is still cleared', async () => {
        // Sharper here than in-memory: the report says how far a rebuild got
        // BEFORE the durable table was emptied, which is the state a caller has
        // to reason about after a failed backfill.
        const index = await makeIndex();
        const failC: MemoryEmbedder = (r) =>
          (r.envelope.id as string) === 'c' ? Promise.resolve(fail('no model')) : embed(r);
        const result: DetailedResult<IVectorRebuildReport, IVectorRebuildReport> = await index.rebuild(
          source(['a', 'b', 'c'], false, { a: 'knowledge', b: 'knowledge', c: 'knowledge' }),
          failC
        );
        expect(result).toFailWith(/no model/);
        expect(result.detail).toBeDefined();
        expect(result.detail!.indexed).toEqual(new Map([['knowledge', 2]]));
        expect(index.size).toBe(0);
      });

      test('carries NO report when the source cannot list — nothing was attempted', async () => {
        const index = await makeIndex();
        (await index.add(target('s', 'kept'), vec(1, 1))).orThrow();
        const result = await index.rebuild(source([], true), embed);
        expect(result).toFailWith(/failed to list records/i);
        expect(result.detail).toBeUndefined();
        // And the healthy persisted index is untouched.
        expect(index.size).toBe(1);
      });

      test('carries NO report when the clear itself fails — nothing was attempted', async () => {
        const own = new BetterSqlite3(':memory:');
        const index = (await SqliteVecVectorIndex.create({ database: own })).orThrow();
        (await index.add(target('s', 'seed'), vec(1, 1))).orThrow();
        own.close();
        const result = await index.rebuild(source(['a']), embed);
        expect(result).toFailWith(/failed to clear the index/i);
        expect(result.detail).toBeUndefined();
      });
    });
  });
});
