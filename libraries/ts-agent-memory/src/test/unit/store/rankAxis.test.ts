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
  MemoryScopeKey,
  RankProjector,
  RecencyRetriever,
  TemporalIdentityCodec,
  TemporalVersionedPolicy,
  parseMemoryFile
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
    async function indexFromStore(store: FileTreeMemoryStore): Promise<MemoryIndex> {
      const records = (await store.list()).orThrow();
      const index = MemoryIndex.create().orThrow();
      // Scope is not returned by `list`; a per-id synthetic scope keeps the
      // (scope, id) index keys distinct, which is all ordering needs here.
      index
        .rebuild(
          records.map((record) => ({ scope: record.envelope.id as unknown as MemoryScopeKey, record }))
        )
        .orThrow();
      return index;
    }

    test('orders by store-stamped rank descending, honoring kinds + limit + offset', async () => {
      const store = createStore({ rankProjectors: knowledgeProjectors }).orThrow();
      // ranks: a=1, bbb=3, cc=2 (by body length)
      await store.put(makeRecord({ id: 'a', body: 'a' }));
      await store.put(makeRecord({ id: 'bbb', body: 'bbb' }));
      await store.put(makeRecord({ id: 'cc', body: 'cc' }));
      // A plain-kind record has no projector → rank absent → sorts last.
      await store.put(makeRecord({ id: 'p', kind: plainKind, body: 'zzzz' }));

      const retriever = RecencyRetriever.create(await indexFromStore(store)).orThrow();
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
});
