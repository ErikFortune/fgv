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
  IMemoryObserver,
  IMemoryRecord,
  Kind,
  KnowledgeIdentityCodec,
  MemoryId,
  MemoryObservationStore,
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
