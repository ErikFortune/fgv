/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { Converters, Logging, Result } from '@fgv/ts-utils';
import { FileTree } from '@fgv/ts-json-base';
import {
  BodyConverterRegistry,
  EntityId,
  FileTreeMemoryStore,
  IBodyConverterRegistry,
  IIdentityCodec,
  IMemoryRecord,
  IWritePolicy,
  Kind,
  KnowledgeIdentityCodec,
  MemoryIndex,
  MemoryObservationStore,
  MemoryScopeKey,
  RankProjector,
  RecencyRetriever,
  TemporalIdentityCodec,
  TemporalVersionedPolicy,
  parseMemoryFile,
  ReconcileReport
} from '../../../index';

const knowledgeKind: Kind = 'knowledge' as Kind;
const plainKind: Kind = 'plain' as Kind;
const factKind: Kind = 'fact' as Kind;

/** Host projector: rank = body length. Generic numeric ordering — the store never interprets meaning. */
const lengthProjector: RankProjector = (record) => (record.body as string).length;

/** A projector that always throws — exercises the guard-host-callback path. */
const throwingProjector: RankProjector = () => {
  throw new Error('projector boom');
};

function mutableRoot(
  files: ReadonlyArray<{ path: string; contents: string }> = []
): FileTree.IMutableFileTreeDirectoryItem {
  const tree = FileTree.inMemory([...files], { mutable: true }).orThrow();
  const root = tree.getDirectory('/').orThrow();
  if (!FileTree.isMutableDirectoryItem(root)) {
    throw new Error('expected a mutable root directory');
  }
  return root;
}

/** Resolves a persisted memory file under the `knowledge` scope directory. */
function persistedFile(
  root: FileTree.IMutableFileTreeDirectoryItem,
  name: string
): FileTree.IFileTreeFileItem {
  const scopeDir = root
    .getChildren()
    .orThrow()
    .find((c): c is FileTree.IFileTreeDirectoryItem => c.type === 'directory' && c.name === 'knowledge');
  if (scopeDir === undefined) {
    throw new Error('expected a knowledge scope directory');
  }
  const file = scopeDir
    .getChildren()
    .orThrow()
    .find((c): c is FileTree.IFileTreeFileItem => c.type === 'file' && c.name === name);
  if (file === undefined) {
    throw new Error(`expected a persisted file named ${name}`);
  }
  return file;
}

function registry(): IBodyConverterRegistry {
  const reg = BodyConverterRegistry.create().orThrow();
  reg.register(knowledgeKind, Converters.string);
  reg.register(plainKind, Converters.string);
  reg.register(factKind, Converters.string);
  return reg;
}

const codecs: ReadonlyMap<Kind, IIdentityCodec> = new Map<Kind, IIdentityCodec>([
  [knowledgeKind, new KnowledgeIdentityCodec()],
  [plainKind, new KnowledgeIdentityCodec()],
  [factKind, TemporalIdentityCodec.create('facts').orThrow()]
]);

const temporalPolicies: ReadonlyMap<Kind, IWritePolicy> = new Map<Kind, IWritePolicy>([
  [factKind, TemporalVersionedPolicy.create().orThrow()]
]);

interface IRecordSpec {
  readonly id: string;
  readonly entityId?: string;
  readonly kind?: Kind;
  readonly body: string;
  readonly tags?: ReadonlyArray<string>;
}

function makeRecord(spec: IRecordSpec): IMemoryRecord<unknown> {
  return {
    envelope: {
      id: spec.id as unknown as IMemoryRecord<unknown>['envelope']['id'],
      entityId: (spec.entityId ?? spec.id) as EntityId,
      kind: spec.kind ?? knowledgeKind,
      tags: (spec.tags ?? []) as unknown as IMemoryRecord<unknown>['envelope']['tags'],
      links: [],
      created: 0,
      updated: 0,
      seq: 0,
      contentHash: '',
      provenance: { source: 'agent' }
    },
    body: spec.body
  };
}

describe('FileTreeMemoryStore rank axis', () => {
  let clockValue: number;
  const clock = (): number => clockValue;

  beforeEach(() => {
    clockValue = 1000;
  });

  function createStore(
    params: {
      root?: FileTree.IMutableFileTreeDirectoryItem;
      rankProjectors?: ReadonlyMap<Kind, RankProjector>;
      writePolicies?: ReadonlyMap<Kind, IWritePolicy>;
      logger?: Logging.ILogger;
    } = {}
  ): Result<FileTreeMemoryStore> {
    return FileTreeMemoryStore.create({
      root: params.root ?? mutableRoot(),
      registry: registry(),
      codecs,
      writePolicies: params.writePolicies,
      rankProjectors: params.rankProjectors,
      logger: params.logger,
      clock
    });
  }

  const knowledgeProjectors: ReadonlyMap<Kind, RankProjector> = new Map<Kind, RankProjector>([
    [knowledgeKind, lengthProjector]
  ]);

  async function indexFromStore(store: FileTreeMemoryStore): Promise<MemoryIndex> {
    // `listScoped` returns the real `(scope, id)` addresses, so the index is keyed
    // the way the store keys it rather than by a fabricated stand-in.
    const scoped = (await store.listScoped()).orThrow();
    const index = MemoryIndex.create().orThrow();
    index
      .rebuild(scoped.map(({ target, record }) => ({ scope: target.scope, envelope: record.envelope })))
      .orThrow();
    return index;
  }

  describe('put stamps rank (flat / non-versioned path)', () => {
    test('runs the kind projector and stamps the numeric result', async () => {
      const store = createStore({ rankProjectors: knowledgeProjectors }).orThrow();
      expect(await store.put(makeRecord({ id: 'doc-a', body: 'abcd' }))).toSucceedAndSatisfy(
        (rec: IMemoryRecord<unknown>) => {
          expect(rec.envelope.rank).toBe(4);
        }
      );
    });

    test('leaves rank absent for a kind with no projector', async () => {
      const store = createStore({ rankProjectors: knowledgeProjectors }).orThrow();
      expect(
        await store.put(makeRecord({ id: 'p-1', kind: plainKind, body: 'anything' }))
      ).toSucceedAndSatisfy((rec: IMemoryRecord<unknown>) => {
        expect(rec.envelope.rank).toBeUndefined();
      });
    });

    test('is byte-identical (rank absent) when no projector map is wired', async () => {
      const store = createStore().orThrow();
      expect(await store.put(makeRecord({ id: 'doc-a', body: 'abcd' }))).toSucceedAndSatisfy(
        (rec: IMemoryRecord<unknown>) => {
          expect(rec.envelope.rank).toBeUndefined();
        }
      );
    });
  });

  describe('body revision re-stamps rank (staleness contract)', () => {
    test('a body-only revision recomputes rank against the current body', async () => {
      const store = createStore({ rankProjectors: knowledgeProjectors }).orThrow();
      expect(await store.put(makeRecord({ id: 'doc-a', body: 'ab' }))).toSucceedAndSatisfy(
        (rec: IMemoryRecord<unknown>) => {
          expect(rec.envelope.rank).toBe(2);
        }
      );
      clockValue = 2000;
      expect(await store.put(makeRecord({ id: 'doc-a', body: 'abcdef' }))).toSucceedAndSatisfy(
        (rec: IMemoryRecord<unknown>) => {
          expect(rec.envelope.rank).toBe(6);
          expect(rec.envelope.updated).toBe(2000);
        }
      );
    });
  });

  describe('throwing projector degrades to rank-absent', () => {
    test('logs a warn and leaves rank absent without failing the write', async () => {
      const logger = new Logging.InMemoryLogger();
      const store = createStore({
        rankProjectors: new Map<Kind, RankProjector>([[knowledgeKind, throwingProjector]]),
        logger
      }).orThrow();
      expect(await store.put(makeRecord({ id: 'doc-a', body: 'abcd' }))).toSucceedAndSatisfy(
        (rec: IMemoryRecord<unknown>) => {
          expect(rec.envelope.rank).toBeUndefined();
        }
      );
      expect(logger.logged.some((m) => /rank projector threw/i.test(m))).toBe(true);
    });

    test('an UPDATE whose projector throws CLEARS the prior rank (flat path staleness contract)', async () => {
      let shouldThrow: boolean = false;
      const flakyProjector: RankProjector = (record) => {
        if (shouldThrow) {
          throw new Error('projector boom');
        }
        return (record.body as string).length;
      };
      const store = createStore({
        rankProjectors: new Map<Kind, RankProjector>([[knowledgeKind, flakyProjector]])
      }).orThrow();
      // First write succeeds → rank stamped to a nonzero value.
      expect(await store.put(makeRecord({ id: 'doc-a', body: 'abcd' }))).toSucceedAndSatisfy(
        (rec: IMemoryRecord<unknown>) => {
          expect(rec.envelope.rank).toBe(4);
        }
      );
      // Update with a body revision while the projector now throws → the prior
      // rank (4) must NOT survive; the record is stamped rank-absent.
      shouldThrow = true;
      clockValue = 2000;
      expect(await store.put(makeRecord({ id: 'doc-a', body: 'abcdefgh' }))).toSucceedAndSatisfy(
        (rec: IMemoryRecord<unknown>) => {
          expect(rec.envelope.rank).toBeUndefined();
          expect(rec.envelope.updated).toBe(2000);
        }
      );
    });

    test('an UPDATE whose projector throws CLEARS the prior rank (versioned path staleness contract)', async () => {
      let shouldThrow: boolean = false;
      const flakyProjector: RankProjector = (record) => {
        if (shouldThrow) {
          throw new Error('projector boom');
        }
        return (record.body as string).length;
      };
      const store = createStore({
        rankProjectors: new Map<Kind, RankProjector>([[factKind, flakyProjector]]),
        writePolicies: temporalPolicies
      }).orThrow();
      expect(await store.put(makeRecord({ id: 'fact-1', kind: factKind, body: 'aa' }))).toSucceedAndSatisfy(
        (rec: IMemoryRecord<unknown>) => {
          expect(rec.envelope.rank).toBe(2);
        }
      );
      shouldThrow = true;
      clockValue = 2000;
      // The new version merges over the current version (which carried rank 2);
      // the throwing projector must clear it so the new version is rank-absent.
      expect(
        await store.put(makeRecord({ id: 'fact-1', kind: factKind, body: 'aaaaa' }))
      ).toSucceedAndSatisfy((rec: IMemoryRecord<unknown>) => {
        expect(rec.envelope.rank).toBeUndefined();
      });
    });
  });

  describe('put stamps rank (versioned / temporal path)', () => {
    const factProjectors: ReadonlyMap<Kind, RankProjector> = new Map<Kind, RankProjector>([
      [factKind, lengthProjector]
    ]);

    test('stamps rank on the first version and re-stamps on a subsequent version', async () => {
      const store = createStore({
        rankProjectors: factProjectors,
        writePolicies: temporalPolicies
      }).orThrow();
      expect(await store.put(makeRecord({ id: 'fact-1', kind: factKind, body: 'aa' }))).toSucceedAndSatisfy(
        (rec: IMemoryRecord<unknown>) => {
          expect(rec.envelope.rank).toBe(2);
        }
      );
      clockValue = 2000;
      expect(
        await store.put(makeRecord({ id: 'fact-1', kind: factKind, body: 'aaaaa' }))
      ).toSucceedAndSatisfy((rec: IMemoryRecord<unknown>) => {
        expect(rec.envelope.rank).toBe(5);
      });
    });

    test('leaves rank absent on the versioned path when the kind has no projector', async () => {
      const store = createStore({ writePolicies: temporalPolicies }).orThrow();
      expect(await store.put(makeRecord({ id: 'fact-1', kind: factKind, body: 'aa' }))).toSucceedAndSatisfy(
        (rec: IMemoryRecord<unknown>) => {
          expect(rec.envelope.rank).toBeUndefined();
        }
      );
    });
  });

  describe('persistence round-trip', () => {
    test('rank serializes to frontmatter and reloads on rebuild (no recompute-on-load)', async () => {
      const root = mutableRoot();
      const store = createStore({ root, rankProjectors: knowledgeProjectors }).orThrow();
      await store.put(makeRecord({ id: 'doc-a', body: 'abcd' }));

      // Read the raw persisted file and confirm rank is in the frontmatter.
      const scopeDir = root
        .getChildren()
        .orThrow()
        .find((c): c is FileTree.IFileTreeDirectoryItem => c.type === 'directory' && c.name === 'knowledge');
      expect(scopeDir).toBeDefined();
      const file = scopeDir!
        .getChildren()
        .orThrow()
        .find((c): c is FileTree.IFileTreeFileItem => c.type === 'file' && c.name === 'doc-a.md');
      expect(file).toBeDefined();
      const raw = file!.getRawContents().orThrow();
      expect(parseMemoryFile(raw, registry())).toSucceedAndSatisfy((rec: IMemoryRecord<unknown>) => {
        expect(rec.envelope.rank).toBe(4);
      });

      // A brand-new store over the same root reloads rank from frontmatter WITHOUT any projector wired.
      const reloaded = createStore({ root }).orThrow();
      expect(await reloaded.getById('knowledge' as MemoryScopeKey, 'doc-a' as never)).toSucceedAndSatisfy(
        (rec: IMemoryRecord<unknown> | undefined) => {
          expect(rec?.envelope.rank).toBe(4);
        }
      );
    });
  });

  describe('orderBy: rank retrieval (store-stamped ranks flow end-to-end)', () => {
    test('orders by store-stamped rank descending, honoring kinds + limit + offset', async () => {
      const store = createStore({ rankProjectors: knowledgeProjectors }).orThrow();
      // ranks: a=1, bbb=3, cc=2 (by body length)
      await store.put(makeRecord({ id: 'a', body: 'a' }));
      await store.put(makeRecord({ id: 'bbb', body: 'bbb' }));
      await store.put(makeRecord({ id: 'cc', body: 'cc' }));
      // A plain-kind record has no projector → rank absent → sorts last.
      await store.put(makeRecord({ id: 'p', kind: plainKind, body: 'zzzz' }));

      const retriever = RecencyRetriever.create({
        index: await indexFromStore(store),
        resolver: store
      }).orThrow();
      expect(await retriever.retrieve({ orderBy: 'rank' })).toSucceedAndSatisfy(
        (records: ReadonlyArray<IMemoryRecord<unknown>>) => {
          expect(records.map((r) => r.envelope.id)).toEqual(['bbb', 'cc', 'a', 'p']);
        }
      );

      // Kind-set scoped, rank-ordered, paged: skip the top, take one.
      expect(
        await retriever.retrieve({ kinds: [knowledgeKind], orderBy: 'rank', limit: 1, offset: 1 })
      ).toSucceedAndSatisfy((records: ReadonlyArray<IMemoryRecord<unknown>>) => {
        expect(records.map((r) => r.envelope.id)).toEqual(['cc']);
      });
    });
  });
  describe("reconcile(kind, 'rank') — the migration path", () => {
    /**
     * Seed a store with no projector wired, then reopen the SAME root with one.
     * This is the exact situation the consumer described: records already exist
     * and the projector has never run against them.
     */
    async function populatedThenProjectored(): Promise<{
      root: FileTree.IMutableFileTreeDirectoryItem;
      store: FileTreeMemoryStore;
    }> {
      const root = mutableRoot();
      const before = createStore({ root }).orThrow();
      (await before.put(makeRecord({ id: 'long', body: 'xxxxxxxxxx' }))).orThrow();
      (await before.put(makeRecord({ id: 'short', body: 'x' }))).orThrow();
      const store = createStore({ root, rankProjectors: knowledgeProjectors }).orThrow();
      return { root, store };
    }

    test('refuses a file whose envelope id no longer matches its filename', async () => {
      // Reconcile is a read-then-write, and a file can be edited after the index
      // was built. It applies the same consistency checks the load paths do, so an
      // inconsistent-but-parseable file fails loudly instead of being rewritten.
      const root = mutableRoot();
      const seed = createStore({ root }).orThrow();
      (await seed.put(makeRecord({ id: 'doc-a', body: 'abcd' }))).orThrow();

      const store = createStore({ root, rankProjectors: knowledgeProjectors }).orThrow();
      const file = persistedFile(root, 'doc-a.md');
      if (!FileTree.isMutableFileItem(file)) {
        throw new Error('expected a mutable file item');
      }
      // Corrupt the frontmatter id so it no longer agrees with the filename stem.
      file.setRawContents(file.getRawContents().orThrow().replace('id: doc-a', 'id: doc-b')).orThrow();

      expect(await store.reconcile(knowledgeKind, 'rank')).toFailWith(/does not match filename stem/i);
    });

    test('carries an authored body through unconverted, normalizing only line endings', async () => {
      // Copilot round 2 surfaced that the docstring claimed the body came back
      // "verbatim". It does not: `splitFrontmatter` strips a trailing \r per line
      // and `joinFrontmatter` writes \n, so a CRLF-authored file is LF-normalized.
      // That is the store's behavior on every write, not a reconcile quirk — pinned
      // here so the docstring and the code cannot drift apart again.
      const root = mutableRoot();
      const seed = createStore({ root }).orThrow();
      (await seed.put(makeRecord({ id: 'crlf', body: 'alpha\nbeta' }))).orThrow();

      // Rewrite the persisted file with CRLF line endings, as an external editor would.
      const file = persistedFile(root, 'crlf.md');
      const authored = file.getRawContents().orThrow().replace(/\n/g, '\r\n');
      if (!FileTree.isMutableFileItem(file)) {
        throw new Error('expected a mutable file item');
      }
      file.setRawContents(authored).orThrow();
      expect(file.getRawContents().orThrow()).toContain('\r\n');

      const store = createStore({ root, rankProjectors: knowledgeProjectors }).orThrow();
      expect(await store.reconcile(knowledgeKind, 'rank')).toSucceedAndSatisfy((r: ReconcileReport) => {
        expect(r.repaired).toBe(1);
      });

      const after = persistedFile(root, 'crlf.md').getRawContents().orThrow();
      // The authored characters survive; the line endings are normalized.
      expect(after).toContain('alpha\nbeta');
      expect(after).not.toContain('\r\n');
      expect(parseMemoryFile(after, registry())).toSucceedAndSatisfy((rec: IMemoryRecord<unknown>) => {
        expect(rec.body).toBe('alpha\nbeta');
        expect(rec.envelope.rank).toBe('alpha\nbeta'.length);
      });
    });

    test('reproduces the inversion, then fixes it', async () => {
      const { store } = await populatedThenProjectored();

      // A newly-written record IS ranked; the pre-existing ones are not. Absent
      // sorts last and the unranked pair then falls through to the RECENCY
      // tiebreak, so the projector's highest-scoring record ('long', scored 10)
      // lands dead last — below 'new' (3) and below 'short' (1). That is the
      // consumer's finding, and the tiebreak makes it worse than they described:
      // the surviving order among unranked records is arbitrary with respect to
      // rank, so it looks like a working ranking with a plausible tail.
      (await store.put(makeRecord({ id: 'new', body: 'yyy' }))).orThrow();
      const before = RecencyRetriever.create({
        index: await indexFromStore(store),
        resolver: store
      }).orThrow();
      expect(await before.retrieve({ kinds: [knowledgeKind], orderBy: 'rank' })).toSucceedAndSatisfy(
        (records: ReadonlyArray<IMemoryRecord<unknown>>) => {
          expect(records.map((r) => r.envelope.id)).toEqual(['new', 'short', 'long']);
        }
      );

      expect(await store.reconcile(knowledgeKind, 'rank')).toSucceedAndSatisfy((r: ReconcileReport) => {
        expect(r.repaired).toBe(2);
      });

      const after = RecencyRetriever.create({
        index: await indexFromStore(store),
        resolver: store
      }).orThrow();
      expect(await after.retrieve({ kinds: [knowledgeKind], orderBy: 'rank' })).toSucceedAndSatisfy(
        (records: ReadonlyArray<IMemoryRecord<unknown>>) => {
          // Now ordered by what the projector actually says: 10, 3, 1.
          expect(records.map((r) => r.envelope.id)).toEqual(['long', 'new', 'short']);
        }
      );
    });

    test('does not disturb transaction time — that is the whole reason it is not a put', async () => {
      const { store } = await populatedThenProjectored();
      const readBack = async (id: string): Promise<IMemoryRecord<unknown>> =>
        (
          await store.getById('knowledge' as MemoryScopeKey, id as IMemoryRecord<unknown>['envelope']['id'])
        ).orThrow()!;

      const beforeRec = await readBack('long');
      clockValue = 99999; // a reconcile that stamped `updated` would pick this up
      expect(await store.reconcile(knowledgeKind, 'rank')).toSucceedAndSatisfy((r: ReconcileReport) => {
        expect(r.repaired).toBe(2);
      });
      const afterRec = await readBack('long');

      expect(afterRec.envelope.rank).toBe(10);
      expect(afterRec.envelope.updated).toBe(beforeRec.envelope.updated);
      expect(afterRec.envelope.created).toBe(beforeRec.envelope.created);
      expect(afterRec.envelope.seq).toBe(beforeRec.envelope.seq);
      expect(afterRec.envelope.contentHash).toBe(beforeRec.envelope.contentHash);
      // And the body is byte-identical — a rank reconcile must not rewrite content.
      expect(afterRec.body).toBe('xxxxxxxxxx');
    });

    test('fires no write observation — a reconcile is not a write', async () => {
      const root = mutableRoot();
      const seeded = createStore({ root }).orThrow();
      (await seeded.put(makeRecord({ id: 'a', body: 'aaaa' }))).orThrow();

      const observations = MemoryObservationStore.create().orThrow();
      const store = FileTreeMemoryStore.create({
        root,
        registry: registry(),
        codecs,
        rankProjectors: knowledgeProjectors,
        observers: [observations],
        clock
      }).orThrow();

      expect(await store.reconcile(knowledgeKind, 'rank')).toSucceedAndSatisfy((r: ReconcileReport) => {
        expect(r.repaired).toBe(1);
      });
      expect(observations.query({})).toHaveLength(0);
    });

    test('is idempotent — a second run changes nothing and reports 0', async () => {
      const { store } = await populatedThenProjectored();
      expect(await store.reconcile(knowledgeKind, 'rank')).toSucceedAndSatisfy((r: ReconcileReport) => {
        expect(r.repaired).toBe(2);
      });
      // The count is "records whose rank actually changed", so a converged store
      // reports 0 and writes no files. This is also why a partial failure is safe.
      expect(await store.reconcile(knowledgeKind, 'rank')).toSucceedAndSatisfy((r: ReconcileReport) => {
        expect(r.repaired).toBe(0);
      });
    });

    test('fails loudly for a kind with no projector, rather than reporting 0', async () => {
      const { store } = await populatedThenProjectored();
      // Reporting "0 reconciled" here would be indistinguishable from "already
      // consistent" — the exact ambiguity this whole lane exists to remove.
      expect(await store.reconcile(plainKind, 'rank')).toFailWith(
        /no rank projector is registered for this kind/i
      );
    });

    test('touches only the requested kind', async () => {
      const root = mutableRoot();
      const seeded = createStore({ root }).orThrow();
      (await seeded.put(makeRecord({ id: 'k', body: 'kkkk' }))).orThrow();
      (await seeded.put(makeRecord({ id: 'p', kind: plainKind, body: 'pppppp' }))).orThrow();

      const store = createStore({
        root,
        rankProjectors: new Map<Kind, RankProjector>([
          [knowledgeKind, lengthProjector],
          [plainKind, lengthProjector]
        ])
      }).orThrow();
      expect(await store.reconcile(knowledgeKind, 'rank')).toSucceedAndSatisfy((r: ReconcileReport) => {
        expect(r.repaired).toBe(1);
      });

      const plain = (
        await store.getById('knowledge' as MemoryScopeKey, 'p' as IMemoryRecord<unknown>['envelope']['id'])
      ).orThrow();
      expect(plain?.envelope.rank).toBeUndefined();
    });

    test('fails loudly when a record has become unreadable since the index was built', async () => {
      // The index is built at open; `_restampOne` re-reads from disk. If the file
      // changed underneath (external edit, partial write), the reconcile must say
      // so rather than skip the record and report a count that looks complete.
      const root = mutableRoot();
      const seeded = createStore({ root }).orThrow();
      (await seeded.put(makeRecord({ id: 'a', body: 'aaaa' }))).orThrow();
      const store = createStore({ root, rankProjectors: knowledgeProjectors }).orThrow();

      const scopeDir = root
        .getChildren()
        .orThrow()
        .find((c) => c.name === 'knowledge');
      if (scopeDir === undefined || scopeDir.type !== 'directory') {
        throw new Error('expected a knowledge scope directory');
      }
      const file = scopeDir
        .getChildren()
        .orThrow()
        .find((c) => c.name === 'a.md');
      if (file === undefined || file.type !== 'file' || !FileTree.isMutableFileItem(file)) {
        throw new Error('expected a mutable a.md');
      }
      file.setRawContents('this file no longer has frontmatter').orThrow();

      expect(await store.reconcile(knowledgeKind, 'rank')).toFailWith(
        /reconcile 'knowledge' rank.*'a'.*frontmatter/i
      );
    });

    test('a throwing projector clears rank, matching the write path', async () => {
      const root = mutableRoot();
      const seeded = createStore({ root, rankProjectors: knowledgeProjectors }).orThrow();
      (await seeded.put(makeRecord({ id: 'a', body: 'aaaa' }))).orThrow();

      const logger = new Logging.InMemoryLogger();
      const store = createStore({
        root,
        rankProjectors: new Map<Kind, RankProjector>([[knowledgeKind, throwingProjector]]),
        logger
      }).orThrow();
      // Reused `_stampRank`, so the reconcile inherits the write path's staleness
      // contract: a throw CLEARS a now-unjustified rank rather than keeping it.
      expect(await store.reconcile(knowledgeKind, 'rank')).toSucceedAndSatisfy((r: ReconcileReport) => {
        expect(r.repaired).toBe(1);
      });
      const rec = (
        await store.getById('knowledge' as MemoryScopeKey, 'a' as IMemoryRecord<unknown>['envelope']['id'])
      ).orThrow();
      expect(rec?.envelope.rank).toBeUndefined();
      expect(logger.logged.some((m) => /rank projector threw/.test(m))).toBe(true);
    });
  });
});
