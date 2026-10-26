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
  IEmbeddedFragment,
  IMemoryRecord,
  IMemoryRecordSource,
  IVectorQueryHit,
  Kind,
  MemoryId,
  MemoryScopeKey
} from '@fgv/ts-agent-memory';
import { IIndexIdentityReport, SqliteVecFragmentIndex, SqliteVecVectorIndex } from '../../index';
// eslint-disable-next-line @rushstack/packlets/mechanics -- the internal helper's released guard is unreachable through either index
import { IndexIdentity } from '../../packlets/sqlite-vec-index/indexIdentity';

const META: string = 'fgv_sqlite_vec_meta';

function target(id: string): IEdgeTarget {
  return { scope: 's' as unknown as MemoryScopeKey, id: id as unknown as MemoryId };
}

/** A scripted source over records `s/<id>` of kind `note`. */
function source(ids: ReadonlyArray<string>): IMemoryRecordSource {
  return {
    list: () =>
      Promise.resolve(
        succeed({
          records: ids.map((id) => ({
            target: target(id),
            record: {
              envelope: {
                id: id as unknown as MemoryId,
                kind: 'note' as Kind
              } as IMemoryRecord<unknown>['envelope'],
              body: `body-${id}`
            }
          }))
        })
      )
  };
}

/** The pieces of either index a test needs, bound to one concrete instance. */
interface IHarness {
  identity(): Result<IIndexIdentityReport>;
  adoptIdentity(): Result<IIndexIdentityReport>;
  release(): void;
  write(id: string, values: ReadonlyArray<number>): Promise<Result<unknown>>;
  query(values: ReadonlyArray<number>): Promise<Result<ReadonlyArray<IVectorQueryHit>>>;
  rebuild(
    ids: ReadonlyArray<string>,
    vectorFor: (id: string) => Promise<Result<ReadonlyArray<number>>>,
    onRecordError?: 'fail' | 'skip'
  ): Promise<DetailedResult<unknown, unknown>>;
  size(): number;
}

interface IHandle {
  readonly harness: IHarness;
  close(): Result<true>;
}

/** One of the two index lanes, so every behaviour is pinned on both. */
interface ILane {
  readonly name: string;
  readonly defaultTable: string;
  create(database: BetterSqlite3.Database, identity?: string, tableName?: string): Promise<Result<IHarness>>;
  open(dbPath: string, identity?: string): Promise<Result<IHandle>>;
}

function vectorHarness(index: SqliteVecVectorIndex): IHarness {
  return {
    identity: () => index.identity(),
    adoptIdentity: () => index.adoptIdentity(),
    release: () => index.release(),
    write: (id, values) => index.add(target(id), Float32Array.from(values)),
    query: (values) => index.query(Float32Array.from(values), 10),
    rebuild: (ids, vectorFor, onRecordError) =>
      index.rebuild(
        source(ids),
        async (r) =>
          (await vectorFor(r.envelope.id as string)).onSuccess((v) => succeed(Float32Array.from(v))),
        { onRecordError }
      ),
    size: () => index.size
  };
}

function fragmentHarness(index: SqliteVecFragmentIndex): IHarness {
  const fragment = (values: ReadonlyArray<number>): IEmbeddedFragment => ({
    vector: Float32Array.from(values),
    locator: { start: 0, end: 1 }
  });
  return {
    identity: () => index.identity(),
    adoptIdentity: () => index.adoptIdentity(),
    release: () => index.release(),
    write: (id, values) => index.addFragments(target(id), [fragment(values)]),
    query: (values) => index.query(Float32Array.from(values), 10),
    rebuild: (ids, vectorFor, onRecordError) =>
      index.rebuild(
        source(ids),
        async (r) =>
          (await vectorFor(r.envelope.id as string)).onSuccess((v) =>
            succeed<ReadonlyArray<IEmbeddedFragment>>([fragment(v)])
          ),
        { onRecordError }
      ),
    size: () => index.fragmentCount
  };
}

const lanes: ReadonlyArray<ILane> = [
  {
    name: 'SqliteVecVectorIndex',
    defaultTable: 'memory_vectors',
    create: async (database, identity, tableName) =>
      (await SqliteVecVectorIndex.create({ database, identity, tableName })).onSuccess((i) =>
        succeed(vectorHarness(i))
      ),
    open: async (dbPath, identity) =>
      (await SqliteVecVectorIndex.open({ path: dbPath, identity })).onSuccess((h) =>
        succeed({ harness: vectorHarness(h.index), close: () => h.close() })
      )
  },
  {
    name: 'SqliteVecFragmentIndex',
    defaultTable: 'memory_fragments',
    create: async (database, identity, tableName) =>
      (await SqliteVecFragmentIndex.create({ database, identity, tableName })).onSuccess((i) =>
        succeed(fragmentHarness(i))
      ),
    open: async (dbPath, identity) =>
      (await SqliteVecFragmentIndex.open({ path: dbPath, identity })).onSuccess((h) =>
        succeed({ harness: fragmentHarness(h.index), close: () => h.close() })
      )
  }
];

const ok = (values: ReadonlyArray<number>): Promise<Result<ReadonlyArray<number>>> =>
  Promise.resolve(succeed(values));

function tableExists(db: BetterSqlite3.Database, name: string): boolean {
  return db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?").get(name) !== undefined;
}

function metaRow(db: BetterSqlite3.Database, table: string): unknown {
  if (!tableExists(db, META)) {
    return undefined;
  }
  return db.prepare(`SELECT identity, state, meta_version FROM ${META} WHERE table_name = ?`).get(table);
}

describe.each(lanes)('$name identity', (lane: ILane) => {
  let dir: string;
  let file: string;
  const opened: BetterSqlite3.Database[] = [];

  function connect(options?: BetterSqlite3.Options): BetterSqlite3.Database {
    const db = new BetterSqlite3(file, options);
    opened.push(db);
    return db;
  }

  async function make(identity?: string, db?: BetterSqlite3.Database, tableName?: string): Promise<IHarness> {
    return (await lane.create(db ?? connect(), identity, tableName)).orThrow();
  }

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'svidentity-'));
    file = path.join(dir, 'index.db');
  });
  afterEach(() => {
    for (const db of opened.splice(0)) {
      db.close();
    }
    fs.rmSync(dir, { recursive: true, force: true });
  });

  describe('statuses', () => {
    test("'fresh' before the table exists, and neither open nor identity() writes anything", async () => {
      const db = connect();
      const index = await make('m1', db);
      expect(index.identity()).toSucceedWith({ status: 'fresh' });
      expect(tableExists(db, META)).toBe(false);
      expect(tableExists(db, lane.defaultTable)).toBe(false);
    });

    test("'match' after the first write, and again from a fresh connection to the same file", async () => {
      const index = await make('m1');
      expect(await index.write('a', [1, 0])).toSucceed();
      expect(index.identity()).toSucceedWith({ status: 'match' });
      const reopened = await make('m1');
      expect(reopened.identity()).toSucceedWith({ status: 'match' });
      expect(await reopened.query([1, 0])).toSucceedAndSatisfy((hits: ReadonlyArray<IVectorQueryHit>) => {
        expect(hits).toHaveLength(1);
      });
    });

    test("'mismatch' names the stored identity, fences writes and queries, and deletes nothing", async () => {
      const first = await make('m1');
      (await first.write('a', [1, 0])).orThrow();
      const swapped = await make('m2');
      expect(swapped.identity()).toSucceedWith({ status: 'mismatch', stored: 'm1' });
      expect(await swapped.write('b', [0, 1])).toFailWith(/'mismatch'.*'m1'.*'m2'.*rebuild/);
      expect(await swapped.query([1, 0])).toFailWith(/'mismatch'/);
      expect(swapped.size()).toBe(1);
    });

    test("'absent' over vectors written without an identity: not fenced, and a plain write commits nothing", async () => {
      const legacy = await make();
      (await legacy.write('a', [1, 0])).orThrow();
      const index = await make('m1');
      expect(index.identity()).toSucceedWith({ status: 'absent' });
      expect(await index.write('b', [0, 1])).toSucceed();
      expect(await index.query([1, 0])).toSucceed();
      expect(index.identity()).toSucceedWith({ status: 'absent' });
    });

    test("'unchecked' without a caller identity, naming the stored one when there is one", async () => {
      const legacy = await make();
      (await legacy.write('a', [1, 0])).orThrow();
      expect(legacy.identity()).toSucceedWith({ status: 'unchecked' });
      const db = connect();
      // Loads the extension onto this connection, which the DROP of a vec0 table needs.
      await make('m1', db);
      db.exec(`DROP TABLE ${lane.defaultTable}`);
      (await (await make('m1', db)).write('a', [1, 0])).orThrow();
      expect((await make()).identity()).toSucceedWith({ status: 'unchecked', stored: 'm1' });
    });

    test("'incomplete' after a rebuild that never finished — the crash case", async () => {
      const index = await make('m1');
      (await index.write('a', [1, 0])).orThrow();
      // A rebuild whose second embed never returns is a process that died mid-loop:
      // the clear has committed, nothing after it ever will.
      let reached: () => void = () => undefined;
      const stalled = new Promise<void>((resolve) => {
        reached = resolve;
      });
      const abandoned: Promise<unknown> = index.rebuild(['a', 'b'], (id) => {
        if (id === 'b') {
          reached();
          return new Promise(() => undefined);
        }
        return ok([1, 0]);
      });
      await stalled;
      // Never settles: the "process" is gone.
      expect(abandoned).toBeInstanceOf(Promise);
      const survivor = await make('m1');
      expect(survivor.identity()).toSucceedWith({ status: 'incomplete' });
      expect(await survivor.write('c', [1, 0])).toFailWith(/'incomplete'.*rebuild/);
      expect(await survivor.query([1, 0])).toFailWith(/'incomplete'/);
      // A partial table is partial whatever the reader expects.
      expect((await make()).identity()).toSucceedWith({ status: 'incomplete' });
      expect((await make('other')).identity()).toSucceedWith({ status: 'incomplete' });
    });

    test("'incomplete' after a 'fail' rollback, cleared by a rebuild that completes", async () => {
      const index = await make('m1');
      (await index.write('a', [1, 0])).orThrow();
      expect(
        await index.rebuild(['a', 'b', 'c'], (id) =>
          id === 'b' ? Promise.resolve(fail('model down')) : ok([1, 0])
        )
      ).toFailWith(/model down/);
      expect(index.identity()).toSucceedWith({ status: 'incomplete' });
      expect(index.adoptIdentity()).toFailWith(/'incomplete'.*rebuild/);
      expect(await index.rebuild(['a', 'b'], () => ok([1, 0]))).toSucceed();
      expect(index.identity()).toSucceedWith({ status: 'match' });
      expect(await index.query([1, 0])).toSucceed();
    });
  });

  describe('commit points', () => {
    test('the first write stores the identity with the table, in one committed transaction', async () => {
      const db = connect();
      const index = await make('m1', db);
      (await index.write('a', [1, 0])).orThrow();
      expect(tableExists(db, lane.defaultTable)).toBe(true);
      expect(metaRow(db, lane.defaultTable)).toEqual({ identity: 'm1', state: 'complete', meta_version: 1 });
    });

    test('the vec0 CREATE and the identity insert roll back together', async () => {
      const db = connect();
      // A meta table that refuses the insert, so the transaction fails after the
      // CREATE VIRTUAL TABLE has run inside it.
      db.exec(
        `CREATE TABLE ${META} (table_name TEXT PRIMARY KEY, identity TEXT, state TEXT NOT NULL, meta_version INTEGER NOT NULL);` +
          `CREATE TRIGGER refuse BEFORE INSERT ON ${META} BEGIN SELECT RAISE(ABORT, 'scripted refusal'); END;`
      );
      const index = await make('m1', db);
      expect(await index.write('a', [1, 0])).toFailWith(/scripted refusal/);
      expect(tableExists(db, lane.defaultTable)).toBe(false);
      expect(metaRow(db, lane.defaultTable)).toBeUndefined();
      expect(index.identity()).toSucceedWith({ status: 'fresh' });
      // The handle was left as it was, so the next write establishes the table cleanly.
      db.exec('DROP TRIGGER refuse');
      expect(await index.write('a', [1, 0])).toSucceed();
      expect(index.identity()).toSucceedWith({ status: 'match' });
    });

    test("rebuild marks the row 'rebuilding' with no identity while it runs, and commits its own at the end", async () => {
      const db = connect();
      const index = await make('m2', db);
      (await index.write('a', [1, 0])).orThrow();
      const seen: unknown[] = [];
      const report = await index.rebuild(['a', 'b'], (id) => {
        seen.push(metaRow(db, lane.defaultTable));
        return ok(id === 'a' ? [1, 0] : [0, 1]);
      });
      expect(report).toSucceed();
      expect(seen[0]).toEqual({ identity: null, state: 'rebuilding', meta_version: 1 });
      expect(metaRow(db, lane.defaultTable)).toEqual({ identity: 'm2', state: 'complete', meta_version: 1 });
    });

    test("a 'skip' rebuild that skips records still completes and commits", async () => {
      const index = await make('m1');
      (await index.write('a', [1, 0])).orThrow();
      expect(
        await index.rebuild(
          ['a', 'b'],
          (id) => (id === 'b' ? Promise.resolve(fail('nope')) : ok([1, 0])),
          'skip'
        )
      ).toSucceed();
      expect(index.identity()).toSucceedWith({ status: 'match' });
    });

    test('a rebuild of a fresh index marks it, creates the table without committing, then commits', async () => {
      const db = connect();
      const index = await make('m1', db);
      const report = await index.rebuild(['a'], () => {
        // The table does not exist yet, so the status is still 'fresh'.
        expect(metaRow(db, lane.defaultTable)).toEqual({
          identity: null,
          state: 'rebuilding',
          meta_version: 1
        });
        return ok([1, 0]);
      });
      expect(report).toSucceed();
      expect(index.identity()).toSucceedWith({ status: 'match' });
    });

    test('a rebuild without an identity commits a complete row with none', async () => {
      const db = connect();
      const index = await make(undefined, db);
      (await index.write('a', [1, 0])).orThrow();
      expect(await index.rebuild(['a'], () => ok([1, 0]))).toSucceed();
      expect(metaRow(db, lane.defaultTable)).toEqual({ identity: null, state: 'complete', meta_version: 1 });
      expect((await make('m1')).identity()).toSucceedWith({ status: 'absent' });
    });

    test('a rebuild cannot change the dimension: it fails and leaves the index incomplete', async () => {
      const index = await make('m1');
      (await index.write('a', [1, 0])).orThrow();
      expect(await index.rebuild(['a'], () => ok([1, 0, 0]))).toFailWith(/dimension 3 does not match/);
      expect(index.identity()).toSucceedWith({ status: 'incomplete' });
    });

    test('a final commit that hits SQLITE_BUSY is a Failure, and the index reports incomplete', async () => {
      const db = connect({ timeout: 0 });
      const index = await make('m1', db);
      (await index.write('a', [1, 0])).orThrow();
      const other = connect();
      const report = await index.rebuild(
        ['a', 'b'],
        (id) => {
          if (id === 'b') {
            // Another connection on the same file takes the write lock before the end.
            other.exec('BEGIN IMMEDIATE');
          }
          return ok([1, 0]);
        },
        'skip'
      );
      expect(report).toFailWith(/failed to commit the index identity: .*(busy|locked)/i);
      other.exec('ROLLBACK');
      expect(index.identity()).toSucceedWith({ status: 'incomplete' });
    });

    test('a marker that changed during the rebuild fails the commit rather than being overwritten', async () => {
      const db = connect();
      const index = await make('m1', db);
      (await index.write('a', [1, 0])).orThrow();
      const report = await index.rebuild(['a'], () => {
        db.prepare(`DELETE FROM ${META} WHERE table_name = ?`).run(lane.defaultTable);
        return ok([1, 0]);
      });
      expect(report).toFailWith(/marker .* changed while the rebuild ran/);
    });
  });

  describe('adoptIdentity', () => {
    test("records the identity over 'absent' vectors without re-embedding, durably", async () => {
      const legacy = await make();
      (await legacy.write('a', [1, 0])).orThrow();
      const index = await make('m1');
      expect(index.adoptIdentity()).toSucceedWith({ status: 'match' });
      expect(index.size()).toBe(1);
      expect((await make('m1')).identity()).toSucceedWith({ status: 'match' });
      expect((await make('m2')).identity()).toSucceedWith({ status: 'mismatch', stored: 'm1' });
    });

    test("is refused for 'fresh', 'mismatch' and 'unchecked', naming the status", async () => {
      const fresh = await make('m1');
      expect(fresh.adoptIdentity()).toFailWith(/status is 'fresh'/);
      (await fresh.write('a', [1, 0])).orThrow();
      expect((await make('m2')).adoptIdentity()).toFailWith(/status is 'mismatch'.*rebuild the index/);
      expect((await make()).adoptIdentity()).toFailWith(/status is 'unchecked'/);
    });

    test("is an idempotent no-op on 'match' that writes nothing", async () => {
      const db = connect();
      const index = await make('m1', db);
      (await index.write('a', [1, 0])).orThrow();
      const before = metaRow(db, lane.defaultTable);
      expect(index.adoptIdentity()).toSucceedWith({ status: 'match' });
      expect(index.adoptIdentity()).toSucceedWith({ status: 'match' });
      expect(metaRow(db, lane.defaultTable)).toEqual(before);
      // A read-only connection proves it: any write there would be a Failure.
      const reader = await make('m1', connect({ readonly: true }));
      expect(reader.adoptIdentity()).toSucceedWith({ status: 'match' });
    });

    test('a migration that adopts twice succeeds both times', async () => {
      (await (await make()).write('a', [1, 0])).orThrow();
      const index = await make('m1');
      expect(index.identity()).toSucceedWith({ status: 'absent' });
      expect(index.adoptIdentity()).toSucceedWith({ status: 'match' });
      expect(index.adoptIdentity()).toSucceedWith({ status: 'match' });
    });

    test('fails on a read-only connection rather than pretending to adopt', async () => {
      (await (await make()).write('a', [1, 0])).orThrow();
      const reader = await make('m1', connect({ readonly: true }));
      expect(reader.identity()).toSucceedWith({ status: 'absent' });
      expect(reader.adoptIdentity()).toFailWith(/cannot adopt identity: .*readonly/i);
    });
  });

  describe('the orphan row a DROP TABLE leaves behind', () => {
    test("reads as 'fresh', never 'match', and the next first write replaces it", async () => {
      const db = connect();
      (await (await make('m1', db)).write('a', [1, 0])).orThrow();
      db.exec(`DROP TABLE ${lane.defaultTable}`);
      expect(metaRow(db, lane.defaultTable)).toEqual({ identity: 'm1', state: 'complete', meta_version: 1 });
      const recreated = await make('m2', db);
      expect(recreated.identity()).toSucceedWith({ status: 'fresh' });
      (await recreated.write('a', [1, 0])).orThrow();
      expect(recreated.identity()).toSucceedWith({ status: 'match' });
      expect((await make('m1', db)).identity()).toSucceedWith({ status: 'mismatch', stored: 'm2' });
    });

    test('is deleted by a first write that has no identity, so it cannot describe the new vectors', async () => {
      const db = connect();
      (await (await make('m1', db)).write('a', [1, 0])).orThrow();
      db.exec(`DROP TABLE ${lane.defaultTable}`);
      (await (await make(undefined, db)).write('a', [1, 0])).orThrow();
      expect(metaRow(db, lane.defaultTable)).toBeUndefined();
      expect((await make('m1', db)).identity()).toSucceedWith({ status: 'absent' });
    });
  });

  test('two tables in one file carry independent identities', async () => {
    const db = connect();
    (await (await make('m1', db, 'first')).write('a', [1, 0])).orThrow();
    (await (await make(undefined, db, 'second')).write('a', [1, 0])).orThrow();
    expect((await make('m1', db, 'first')).identity()).toSucceedWith({ status: 'match' });
    expect((await make('m1', db, 'second')).identity()).toSucceedWith({ status: 'absent' });
    expect((await make('m2', db, 'first')).identity()).toSucceedWith({ status: 'mismatch', stored: 'm1' });
  });

  test('a read-only connection reports and queries, and a write on it is a Failure', async () => {
    (await (await make('m1')).write('a', [1, 0])).orThrow();
    const reader = await make('m1', connect({ readonly: true }));
    expect(reader.identity()).toSucceedWith({ status: 'match' });
    expect(await reader.query([1, 0])).toSucceed();
    expect(await reader.write('b', [1, 0])).toFailWith(/readonly/i);
  });

  test('a read-only connection to a fresh file reports fresh, and its first write is a Failure', async () => {
    connect().exec('CREATE TABLE unrelated (x INTEGER)');
    const reader = await make('m1', connect({ readonly: true }));
    expect(reader.identity()).toSucceedWith({ status: 'fresh' });
    expect(await reader.write('a', [1, 0])).toFailWith(/readonly/i);
  });

  test('safe-integer mode: meta_version arrives as a bigint and is narrowed', async () => {
    (await (await make('m1')).write('a', [1, 0])).orThrow();
    const db = connect();
    db.defaultSafeIntegers(true);
    const index = await make('m1', db);
    expect(index.identity()).toSucceedWith({ status: 'match' });
    expect(await index.write('b', [0, 1])).toSucceed();
  });

  test('another connection creating the table first: its row is kept and the fence decides', async () => {
    const disagreeing = await make('m2');
    const agreeing = await make('m1');
    const first = await make('m1');
    (await first.write('a', [1, 0])).orThrow();
    // Neither early handle saw the table, so each first write takes the
    // table-creating path — and finds, inside its transaction, that the status is
    // no longer 'fresh'. The row `first` committed is left alone either way.
    expect(await disagreeing.write('b', [0, 1])).toFailWith(/'mismatch'/);
    expect(await agreeing.write('c', [0, 1])).toSucceed();
    expect(agreeing.identity()).toSucceedWith({ status: 'match' });
    expect(agreeing.size()).toBe(2);
  });

  test('an identity is bound, never interpolated', async () => {
    const hostile = `m'); DROP TABLE ${META}; --`;
    const index = await make(hostile);
    (await index.write('a', [1, 0])).orThrow();
    expect((await make(hostile)).identity()).toSucceedWith({ status: 'match' });
  });

  test('open() threads the identity through to the index it creates', async () => {
    const handle = (await lane.open(file, 'm1')).orThrow();
    (await handle.harness.write('a', [1, 0])).orThrow();
    expect(handle.close()).toSucceed();
    const again = (await lane.open(file, 'm2')).orThrow();
    expect(again.harness.identity()).toSucceedWith({ status: 'mismatch', stored: 'm1' });
    expect(again.close()).toSucceed();
  });

  test('identity() takes both of its reads inside one transaction — a single snapshot', async () => {
    // Another connection cannot be made to run between two synchronous reads in
    // one JS turn, so the interleaving itself is not reproducible here. What is
    // pinned instead is the property that excludes it: each of the three reads
    // runs while the connection is inside a transaction, and none is left open
    // afterwards. Before the change, all three ran outside one.
    const db = connect();
    (await (await make('m1', db)).write('a', [1, 0])).orThrow();
    const reads: Array<{ readonly sql: string; readonly inTransaction: boolean }> = [];
    const realPrepare = db.prepare.bind(db);
    const prepare = jest.spyOn(db, 'prepare').mockImplementation((sql: string) => {
      const statement = realPrepare(sql);
      const realGet = statement.get.bind(statement);
      jest.spyOn(statement, 'get').mockImplementation((...params: unknown[]) => {
        reads.push({ sql, inTransaction: db.inTransaction });
        return realGet(...params);
      });
      return statement;
    });
    const index = await make('m1', db);
    expect(index.identity()).toSucceedWith({ status: 'match' });
    prepare.mockRestore();
    const identityReads = reads.filter((r) => /sqlite_master|FROM fgv_sqlite_vec_meta/.test(r.sql));
    // sqlite_master for the vec0 table, sqlite_master for the meta table, the row.
    expect(identityReads.length).toBeGreaterThanOrEqual(3);
    expect(identityReads.slice(-3).every((r) => r.inTransaction)).toBe(true);
    expect(db.inTransaction).toBe(false);
  });

  describe('failures', () => {
    test('a released index fails identity() and adoptIdentity()', async () => {
      const index = await make('m1');
      index.release();
      expect(index.identity()).toFailWith(/cannot read identity: the index has been released/);
      expect(index.adoptIdentity()).toFailWith(/cannot adopt identity: the index has been released/);
    });

    test('a closed connection is a Failure from identity(), not a throw', async () => {
      const db = new BetterSqlite3(file);
      const index = await make('m1', db);
      db.close();
      expect(index.identity()).toFailWith(/cannot read identity/);
    });

    test('a row written by a newer layout is refused rather than guessed at', async () => {
      const db = connect();
      (await (await make('m1', db)).write('a', [1, 0])).orThrow();
      db.prepare(`UPDATE ${META} SET meta_version = 2`).run();
      const index = await make('m1', db);
      expect(index.identity()).toFailWith(/meta_version 2.*reads only 1/);
      expect(await index.query([1, 0])).toFailWith(/meta_version 2/);
    });

    test('a malformed row is refused', async () => {
      const db = connect();
      (await (await make('m1', db)).write('a', [1, 0])).orThrow();
      db.prepare(`UPDATE ${META} SET identity = x'00'`).run();
      expect((await make('m1', db)).identity()).toFailWith(/malformed identity row/);
    });
  });
});

describe('identity across lanes', () => {
  test('a record index and a fragment index on one connection are checked independently', async () => {
    const db = new BetterSqlite3(':memory:');
    try {
      const records = (await SqliteVecVectorIndex.create({ database: db, identity: 'records-1' })).orThrow();
      const fragments = (
        await SqliteVecFragmentIndex.create({ database: db, identity: 'fragments-1' })
      ).orThrow();
      (await records.add(target('a'), Float32Array.from([1, 0]))).orThrow();
      (
        await fragments.addFragments(target('a'), [{ vector: Float32Array.from([1, 0]), fragmentId: 'f' }])
      ).orThrow();
      expect(records.identity()).toSucceedWith({ status: 'match' });
      expect(fragments.identity()).toSucceedWith({ status: 'match' });
      const swapped = (
        await SqliteVecFragmentIndex.create({ database: db, identity: 'fragments-2' })
      ).orThrow();
      expect(swapped.identity()).toSucceedWith({ status: 'mismatch', stored: 'fragments-1' });
      expect(records.identity()).toSucceedWith({ status: 'match' });
    } finally {
      db.close();
    }
  });

  test('the internal helper refuses to read once released', () => {
    const db = new BetterSqlite3(':memory:');
    try {
      const identity = new IndexIdentity(db, 't', 'm1');
      identity.release();
      expect(identity.report()).toFailWith(/released/);
    } finally {
      db.close();
    }
  });
});
