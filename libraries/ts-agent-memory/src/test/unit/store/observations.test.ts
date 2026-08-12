/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { Converters, Logging, fail, succeed } from '@fgv/ts-utils';
import { FileTree } from '@fgv/ts-json-base';
import {
  BodyConverterRegistry,
  EntityId,
  FileTreeMemoryStore,
  IBodyConverterRegistry,
  IIdentityCodec,
  IMemoryObservationRecord,
  IVectorIndex,
  IMemoryObserver,
  IMemoryRecord,
  IWritePolicy,
  Kind,
  KnowledgeIdentityCodec,
  MemoryCapCullPolicy,
  MemoryEmbedder,
  MemoryId,
  MemoryObservationStore,
  MtmIdentityCodec,
  InMemoryCosineIndex,
  envelopeConverter
} from '../../../index';

const knowledgeKind: Kind = 'knowledge' as Kind;

function makeRecord(id: string, body: string = `body for ${id}`): IMemoryRecord<unknown> {
  return {
    envelope: envelopeConverter
      .convert({
        id,
        entityId: id,
        kind: 'knowledge',
        tags: [],
        links: [],
        created: 0,
        updated: 0,
        seq: 0,
        contentHash: '',
        provenance: { source: 'agent' }
      })
      .orThrow(),
    body
  };
}

function mutableRoot(): FileTree.IMutableFileTreeDirectoryItem {
  const tree = FileTree.inMemory([], { mutable: true }).orThrow();
  const root = tree.getDirectory('/').orThrow();
  if (!FileTree.isMutableDirectoryItem(root)) {
    throw new Error('expected a mutable root directory');
  }
  return root;
}

function knowledgeRegistry(): IBodyConverterRegistry {
  const registry = BodyConverterRegistry.create().orThrow();
  registry.register(knowledgeKind, Converters.string);
  return registry;
}

const knowledgeCodecs: ReadonlyMap<Kind, IIdentityCodec> = new Map<Kind, IIdentityCodec>([
  [knowledgeKind, new KnowledgeIdentityCodec()]
]);

let clockValue: number;
const clock = (): number => clockValue;

function createStore(
  observers?: ReadonlyArray<IMemoryObserver>,
  logger?: Logging.ILogger
): FileTreeMemoryStore {
  return FileTreeMemoryStore.create({
    root: mutableRoot(),
    registry: knowledgeRegistry(),
    codecs: knowledgeCodecs,
    clock,
    observers,
    logger
  }).orThrow();
}

describe('FileTreeMemoryStore observations', () => {
  beforeEach(() => {
    clockValue = 1000;
  });

  describe('when no observers are wired (B1 behavior unchanged)', () => {
    test('put / get / delete still succeed and produce no records', async () => {
      const store = createStore();
      expect(await store.put(makeRecord('doc-a'))).toSucceed();
      expect(await store.get(knowledgeKind, 'doc-a' as EntityId)).toSucceedAndSatisfy(
        (rec: IMemoryRecord<unknown> | undefined) => {
          expect(rec?.envelope.id).toBe('doc-a');
        }
      );
      expect(await store.delete(knowledgeKind, 'doc-a' as EntityId)).toSucceedWith(
        'doc-a' as unknown as MemoryId
      );
    });
  });

  describe('when an observation store is wired', () => {
    let observations: MemoryObservationStore;
    let store: FileTreeMemoryStore;

    beforeEach(() => {
      observations = MemoryObservationStore.create().orThrow();
      store = createStore([observations]);
    });

    test('fires a write observation on put', async () => {
      await store.put(makeRecord('doc-a'));
      const records: ReadonlyArray<IMemoryObservationRecord> = observations.query({ phase: 'write' });
      expect(records).toHaveLength(1);
      expect(records[0]).toMatchObject({
        seq: 1,
        timestamp: 1000,
        phase: 'write',
        scope: 'knowledge',
        id: 'doc-a',
        kind: 'knowledge',
        outcome: 'success'
      });
      expect(records[0].provenance).toEqual({ source: 'agent' });
    });

    test('fires a read observation on get (found and not-found)', async () => {
      await store.put(makeRecord('doc-a'));
      await store.get(knowledgeKind, 'doc-a' as EntityId);
      await store.get(knowledgeKind, 'missing' as EntityId);
      const reads: ReadonlyArray<IMemoryObservationRecord> = observations.query({ phase: 'read' });
      expect(reads).toHaveLength(2);
      expect(reads[0]).toMatchObject({ outcome: 'success', id: 'doc-a' });
      expect(reads[1]).toMatchObject({ outcome: 'success', scope: 'knowledge' });
      expect(reads[1].id).toBeUndefined();
    });

    test('fires a delete observation on delete', async () => {
      await store.put(makeRecord('doc-a'));
      await store.delete(knowledgeKind, 'doc-a' as EntityId);
      const deletes: ReadonlyArray<IMemoryObservationRecord> = observations.query({ phase: 'delete' });
      expect(deletes).toHaveLength(1);
      expect(deletes[0]).toMatchObject({ outcome: 'success', id: 'doc-a', kind: 'knowledge' });
    });

    test('records a failure outcome with the error message', async () => {
      const result = await store.delete(knowledgeKind, 'never-written' as EntityId);
      expect(result).toFail();
      const deletes: ReadonlyArray<IMemoryObservationRecord> = observations.query({ phase: 'delete' });
      expect(deletes).toHaveLength(1);
      expect(deletes[0].outcome).toBe('failure');
      expect(deletes[0].error).toMatch(/no record found/i);
    });

    test('assigns strictly increasing observation seq across ops', async () => {
      await store.put(makeRecord('doc-a'));
      await store.get(knowledgeKind, 'doc-a' as EntityId);
      await store.delete(knowledgeKind, 'doc-a' as EntityId);
      expect(observations.query().map((r) => r.seq)).toEqual([1, 2, 3]);
      expect(observations.lastSeq).toBe(3);
    });
  });

  describe('cap-cull eviction observations', () => {
    const mtmKind: Kind = 'mtm' as Kind;

    function mtmRegistry(): IBodyConverterRegistry {
      const registry = BodyConverterRegistry.create().orThrow();
      registry.register(mtmKind, Converters.string);
      return registry;
    }

    function makeMtmRecord(turn: number, body: string): IMemoryRecord<unknown> {
      return {
        envelope: envelopeConverter
          .convert({
            id: `turn-${turn}`,
            entityId: `conv-1:${turn}`,
            kind: 'mtm',
            tags: [],
            links: [],
            created: 0,
            updated: 0,
            seq: 0,
            contentHash: '',
            provenance: { source: 'agent' }
          })
          .orThrow(),
        body
      };
    }

    test('fires a delete observation for each record evicted by cap-cull', async () => {
      const observations = MemoryObservationStore.create().orThrow();
      const capCull: IWritePolicy = MemoryCapCullPolicy.create({
        maxRecords: 2,
        mutableFields: ['body', 'tags', 'links', 'provenance', 'embeddingRef']
      }).orThrow();
      const store = FileTreeMemoryStore.create({
        root: mutableRoot(),
        registry: mtmRegistry(),
        codecs: new Map<Kind, IIdentityCodec>([[mtmKind, new MtmIdentityCodec()]]),
        writePolicies: new Map<Kind, IWritePolicy>([[mtmKind, capCull]]),
        clock,
        observers: [observations]
      }).orThrow();

      for (let turn = 0; turn < 3; turn++) {
        clockValue = 1000 + turn; // distinct `created` so turn-0 is unambiguously oldest.
        (await store.put(makeMtmRecord(turn, `turn ${turn}`))).orThrow();
      }

      // The third put admits turn-2 and evicts the oldest (turn-0): the audit
      // stream must carry a `'delete'` observation naming the evicted record,
      // in the same (scope, kind) as the write that triggered it.
      const deletes: ReadonlyArray<IMemoryObservationRecord> = observations.query({ phase: 'delete' });
      expect(deletes).toHaveLength(1);
      expect(deletes[0]).toMatchObject({
        phase: 'delete',
        outcome: 'success',
        id: 'turn-0',
        kind: 'mtm',
        scope: 'conversations/conv-1'
      });

      // Three writes + one eviction delete = four observations, strictly
      // increasing seq (the store is the single seq authority).
      expect(observations.query({ phase: 'write' })).toHaveLength(3);
      expect(observations.query().map((r) => r.seq)).toEqual([1, 2, 3, 4]);
    });
  });

  describe('embed outcome on the write observation', () => {
    // The gap this closes: `embeddingRef` absence is three-ways ambiguous, and
    // the put's own outcome is 'success' in all three because embed-on-write is
    // best-effort. Without this field a consumer wanting per-record index
    // coverage has to keep its own ledger, derived from a field that cannot
    // distinguish a policy decision from an outage.
    function embeddingStore(
      embed?: MemoryEmbedder,
      observers?: ReadonlyArray<IMemoryObserver>,
      embedKinds?: ReadonlySet<Kind>,
      vectorIndex: IVectorIndex = InMemoryCosineIndex.create().orThrow()
    ): FileTreeMemoryStore {
      return FileTreeMemoryStore.create({
        root: mutableRoot(),
        registry: knowledgeRegistry(),
        codecs: knowledgeCodecs,
        clock,
        vectorIndex: embed === undefined ? undefined : vectorIndex,
        embed,
        embedKinds,
        observers
      }).orThrow();
    }

    const okEmbed: MemoryEmbedder = () => Promise.resolve(succeed(Float32Array.from([1, 0])));

    function writeEmbeds(o: MemoryObservationStore): ReadonlyArray<unknown> {
      return o.query({ phase: 'write' }).map((r) => r.embed);
    }

    test("reports 'embedded' when the record made it into the index", async () => {
      const observations = MemoryObservationStore.create().orThrow();
      const store = embeddingStore(okEmbed, [observations]);
      expect(await store.put(makeRecord('doc-a'))).toSucceed();
      expect(writeEmbeds(observations)).toEqual(['embedded']);
    });

    test("reports 'declined' — distinguishable from a failure, which it was not before", async () => {
      const observations = MemoryObservationStore.create().orThrow();
      const store = embeddingStore(() => Promise.resolve(succeed(undefined)), [observations]);
      expect(await store.put(makeRecord('doc-a'))).toSucceedAndSatisfy((record: IMemoryRecord<unknown>) => {
        // The record looks identical to the failure case from the outside:
        // no embeddingRef, and the put succeeded. Only the observation differs.
        expect(record.envelope.embeddingRef).toBeUndefined();
      });
      expect(writeEmbeds(observations)).toEqual(['declined']);
    });

    test("reports 'excluded' when the kind never reaches the embedder", async () => {
      const observations = MemoryObservationStore.create().orThrow();
      const store = embeddingStore(okEmbed, [observations], new Set<Kind>([]));
      expect(await store.put(makeRecord('doc-a'))).toSucceed();
      expect(writeEmbeds(observations)).toEqual(['excluded']);
    });

    test("reports 'failed' for an embedder failure, while the put still succeeds", async () => {
      const observations = MemoryObservationStore.create().orThrow();
      const store = embeddingStore(() => Promise.resolve(fail('model down')), [observations]);
      expect(await store.put(makeRecord('doc-a'))).toSucceed();
      const records = observations.query({ phase: 'write' });
      // The put's own outcome stays 'success' — that is the point: a best-effort
      // embed failure is invisible on the outcome axis and needs its own.
      expect(records[0].outcome).toBe('success');
      expect(records[0].embed).toBe('failed');
    });

    test("reports 'failed' for an index add failure too, not just an embedder failure", async () => {
      // Provoked through the real index's own dimension check rather than a
      // mock: the first record establishes a 2-dimension index, the second
      // arrives with 3, and `add` rejects it. A real failure mode of the shipped
      // index is a better witness here than a double that always says no.
      const observations = MemoryObservationStore.create().orThrow();
      let width: number = 2;
      const wideningEmbed: MemoryEmbedder = () => Promise.resolve(succeed(new Float32Array(width).fill(1)));
      const store = embeddingStore(wideningEmbed, [observations]);
      expect(await store.put(makeRecord('doc-a'))).toSucceed();
      width = 3;
      expect(await store.put(makeRecord('doc-b'))).toSucceed();
      expect(writeEmbeds(observations)).toEqual(['embedded', 'failed']);
    });

    test('is absent when nothing is wired — not a fifth value', async () => {
      // "The question does not apply" must not be reported as a coverage state,
      // or every unwired deployment reads as a vault full of gaps.
      const observations = MemoryObservationStore.create().orThrow();
      const store = createStore([observations]);
      expect(await store.put(makeRecord('doc-a'))).toSucceed();
      expect(writeEmbeds(observations)).toEqual([undefined]);
    });

    test('is absent on a dedup no-op, which attempts nothing', async () => {
      const observations = MemoryObservationStore.create().orThrow();
      const store = embeddingStore(okEmbed, [observations]);
      expect(await store.put(makeRecord('doc-a'))).toSucceed();
      expect(await store.put(makeRecord('doc-a'))).toSucceed();
      expect(writeEmbeds(observations)).toEqual(['embedded', undefined]);
    });

    test('is absent on read and delete observations', async () => {
      const observations = MemoryObservationStore.create().orThrow();
      const store = embeddingStore(okEmbed, [observations]);
      (await store.put(makeRecord('doc-a'))).orThrow();
      (await store.get(knowledgeKind, 'doc-a' as EntityId)).orThrow();
      (await store.delete(knowledgeKind, 'doc-a' as EntityId)).orThrow();
      expect(observations.query({ phase: 'read' })[0].embed).toBeUndefined();
      expect(observations.query({ phase: 'delete' })[0].embed).toBeUndefined();
    });

    test('query({ embed }) answers "which writes left the index short" without a scan', async () => {
      const observations = MemoryObservationStore.create().orThrow();
      let mode: 'ok' | 'decline' | 'fail' = 'ok';
      const varying: MemoryEmbedder = () => {
        if (mode === 'decline') {
          return Promise.resolve(succeed(undefined));
        }
        if (mode === 'fail') {
          return Promise.resolve(fail('model down'));
        }
        return Promise.resolve(succeed(Float32Array.from([1, 0])));
      };
      const store = embeddingStore(varying, [observations]);
      (await store.put(makeRecord('doc-a'))).orThrow();
      mode = 'decline';
      (await store.put(makeRecord('doc-b'))).orThrow();
      mode = 'fail';
      (await store.put(makeRecord('doc-c'))).orThrow();

      expect(observations.query({ embed: 'failed' }).map((r) => r.id)).toEqual(['doc-c']);
      expect(observations.query({ embed: 'declined' }).map((r) => r.id)).toEqual(['doc-b']);
      expect(observations.query({ embed: 'embedded' }).map((r) => r.id)).toEqual(['doc-a']);
    });

    test('is absent on a failed write, which is a statement about a stored record', async () => {
      // An embed step may well have run before the failure — the vector add
      // happens before the persist by design, so a failed write can even leave an
      // orphan vector for a later rebuild to reconcile. The field deliberately
      // says nothing there: it answers "is this STORED record in the index?", and
      // a failed write produced no stored record.
      const observations = MemoryObservationStore.create().orThrow();
      const store = embeddingStore(okEmbed, [observations]);
      const mismatched: IMemoryRecord<unknown> = {
        ...makeRecord('doc-a'),
        body: 42 as unknown as string
      };
      expect(await store.put(mismatched)).toFail();
      const records = observations.query({ phase: 'write' });
      expect(records[0].outcome).toBe('failure');
      expect(records[0].embed).toBeUndefined();
    });

    test('an embed criterion never matches a record that carries no embed outcome', async () => {
      const observations = MemoryObservationStore.create().orThrow();
      const store = createStore([observations]);
      (await store.put(makeRecord('doc-a'))).orThrow();
      for (const embed of ['embedded', 'declined', 'excluded', 'failed'] as const) {
        expect(observations.query({ embed })).toHaveLength(0);
      }
    });
  });

  describe('observer error handling', () => {
    test('a failing observer never affects the store op and is logged', async () => {
      const logger = new Logging.InMemoryLogger();
      const failing: IMemoryObserver = {
        observe: () => Promise.resolve(fail('observer boom'))
      };
      const store = createStore([failing], logger);
      expect(await store.put(makeRecord('doc-a'))).toSucceed();
      expect(logger.logged.some((m) => /observer failed \(swallowed\): observer boom/i.test(m))).toBe(true);
    });

    test('a throwing observer never affects the store op and is logged', async () => {
      const logger = new Logging.InMemoryLogger();
      const throwing: IMemoryObserver = {
        observe: () => {
          throw new Error('observer kaboom');
        }
      };
      const store = createStore([throwing], logger);
      expect(await store.put(makeRecord('doc-a'))).toSucceed();
      expect(logger.logged.some((m) => /observer threw \(swallowed\): .*kaboom/i.test(m))).toBe(true);
    });

    test('a logger that throws while reporting a failed observer never breaks the store op', async () => {
      class ThrowingWarnLogger extends Logging.NoOpLogger {
        public warn(): never {
          throw new Error('logger down');
        }
      }
      const failing: IMemoryObserver = {
        observe: () => Promise.resolve(fail('observer boom'))
      };
      const store = createStore([failing], new ThrowingWarnLogger());
      expect(await store.put(makeRecord('doc-a'))).toSucceed();
    });

    test('a fire-and-forget observer is dispatched without blocking and errors are swallowed', async () => {
      const seen: IMemoryObservationRecord[] = [];
      const observer: IMemoryObserver = {
        fireAndForget: true,
        observe: (record) => {
          seen.push(record);
          return Promise.resolve(succeed(record));
        }
      };
      const store = createStore([observer]);
      expect(await store.put(makeRecord('doc-a'))).toSucceed();
      // Allow the detached dispatch to run.
      await Promise.resolve();
      expect(seen).toHaveLength(1);
      expect(seen[0].phase).toBe('write');
    });
  });
});
