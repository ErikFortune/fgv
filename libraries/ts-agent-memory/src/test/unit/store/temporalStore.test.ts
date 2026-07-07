/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { Converters, Result, succeed } from '@fgv/ts-utils';
import { FileTree } from '@fgv/ts-json-base';
import {
  AdmissionDecision,
  BodyConverterRegistry,
  EntityId,
  FileTreeMemoryStore,
  IBodyConverterRegistry,
  IIdentityCodec,
  IMemoryRecord,
  IWritePolicy,
  Kind,
  KnowledgeIdentityCodec,
  MemoryScopeKey,
  TemporalIdentityCodec,
  TemporalVersionedPolicy
} from '../../../index';

const factKind: Kind = 'fact' as Kind;
const knowledgeKind: Kind = 'knowledge' as Kind;
const factScope: MemoryScopeKey = 'facts/entities/fact-1' as MemoryScopeKey;

function mutableRoot(): FileTree.IMutableFileTreeDirectoryItem {
  const tree = FileTree.inMemory([], { mutable: true }).orThrow();
  const root = tree.getDirectory('/').orThrow();
  if (!FileTree.isMutableDirectoryItem(root)) {
    throw new Error('expected a mutable root directory');
  }
  return root;
}

function registry(): IBodyConverterRegistry {
  const reg = BodyConverterRegistry.create().orThrow();
  reg.register(factKind, Converters.string);
  reg.register(knowledgeKind, Converters.string);
  return reg;
}

const codecs: ReadonlyMap<Kind, IIdentityCodec> = new Map<Kind, IIdentityCodec>([
  [factKind, TemporalIdentityCodec.create('facts').orThrow()],
  [knowledgeKind, new KnowledgeIdentityCodec()]
]);

const temporalPolicies: ReadonlyMap<Kind, IWritePolicy> = new Map<Kind, IWritePolicy>([
  [factKind, TemporalVersionedPolicy.create().orThrow()]
]);

/** A record the consumer hands to `put`. The store mints the version `id`. */
function factRecord(entityId: string, body: string): IMemoryRecord<unknown> {
  return {
    envelope: {
      id: entityId as unknown as IMemoryRecord<unknown>['envelope']['id'],
      entityId: entityId as EntityId,
      kind: factKind,
      tags: [],
      links: [],
      created: 0,
      updated: 0,
      seq: 0,
      contentHash: '',
      provenance: { source: 'agent' }
    },
    body
  };
}

function knowledgeRecord(id: string, body: string): IMemoryRecord<unknown> {
  return {
    envelope: {
      id: id as unknown as IMemoryRecord<unknown>['envelope']['id'],
      entityId: id as EntityId,
      kind: knowledgeKind,
      tags: [],
      links: [],
      created: 0,
      updated: 0,
      seq: 0,
      contentHash: '',
      provenance: { source: 'agent' }
    },
    body
  };
}

describe('FileTreeMemoryStore — temporal (versioned) path', () => {
  let clockValue: number;
  const clock = (): number => clockValue;

  function createStore(
    root: FileTree.IMutableFileTreeDirectoryItem = mutableRoot(),
    policies: ReadonlyMap<Kind, IWritePolicy> = temporalPolicies
  ): FileTreeMemoryStore {
    return FileTreeMemoryStore.create({
      root,
      registry: registry(),
      codecs,
      writePolicies: policies,
      clock
    }).orThrow();
  }

  beforeEach(() => {
    clockValue = 1000;
  });

  describe('put / get', () => {
    test('first put writes v1 under the entity subtree with a minted version id', async () => {
      const store = createStore();
      expect(await store.put(factRecord('fact-1', 'the sky is blue'))).toSucceedAndSatisfy((put) => {
        expect(put.envelope.id).toBe('fact-1-v1');
        expect(put.envelope.entityId).toBe('fact-1');
        expect(put.envelope.temporal).toEqual({ valid_at: 1000 });
      });
      // Keyed get resolves the current version.
      expect(await store.get(factKind, 'fact-1' as EntityId)).toSucceedAndSatisfy((got) => {
        expect(got?.envelope.id).toBe('fact-1-v1');
        expect(got?.body).toBe('the sky is blue');
      });
      // The version file lives at facts/entities/fact-1/fact-1-v1.md.
      expect(await store.getById(factScope, 'fact-1-v1' as never)).toSucceedAndSatisfy((got) => {
        expect(got?.body).toBe('the sky is blue');
      });
    });

    test('get returns undefined for an entity with no versions', async () => {
      const store = createStore();
      expect(await store.get(factKind, 'nope' as EntityId)).toSucceedWith(undefined);
    });
  });

  describe("merge-patch-under-versioning (invalidate-don't-delete)", () => {
    test('a re-put yields a NEW version and invalidates the prior (both persist)', async () => {
      const store = createStore();
      expect(await store.put(factRecord('fact-1', 'the sky is blue'))).toSucceed();
      clockValue = 2000;
      expect(await store.put(factRecord('fact-1', 'the sky is grey'))).toSucceedAndSatisfy((put) => {
        expect(put.envelope.id).toBe('fact-1-v2');
        expect(put.envelope.temporal).toEqual({ valid_at: 2000 });
        expect(put.body).toBe('the sky is grey');
      });

      // Both versions persist.
      expect(await store.list({ kind: factKind })).toSucceedAndSatisfy((all) => {
        expect(all.map((r) => r.envelope.id).sort()).toEqual(['fact-1-v1', 'fact-1-v2']);
      });
      // The prior version now carries invalid_at.
      expect(await store.getById(factScope, 'fact-1-v1' as never)).toSucceedAndSatisfy((v1) => {
        expect(v1?.envelope.temporal).toEqual({ valid_at: 1000, invalid_at: 2000 });
      });
      // The new version is current.
      expect(await store.get(factKind, 'fact-1' as EntityId)).toSucceedAndSatisfy((cur) => {
        expect(cur?.envelope.id).toBe('fact-1-v2');
      });
    });

    test('survives a round-trip through disk (fresh store re-indexes the subtree)', async () => {
      const root = mutableRoot();
      const store = createStore(root);
      expect(await store.put(factRecord('fact-1', 'v1 body'))).toSucceed();
      clockValue = 2000;
      expect(await store.put(factRecord('fact-1', 'v2 body'))).toSucceed();

      const reopened = createStore(root);
      expect(await reopened.list({ kind: factKind })).toSucceedAndSatisfy((all) => {
        expect(all.map((r) => r.envelope.id).sort()).toEqual(['fact-1-v1', 'fact-1-v2']);
      });
      expect(await reopened.get(factKind, 'fact-1' as EntityId)).toSucceedAndSatisfy((cur) => {
        expect(cur?.envelope.id).toBe('fact-1-v2');
      });
    });

    test('an identical re-put is a no-op (entity dedup, no redundant version)', async () => {
      const store = createStore();
      expect(await store.put(factRecord('fact-1', 'same'))).toSucceed();
      clockValue = 2000;
      expect(await store.put(factRecord('fact-1', 'same'))).toSucceedAndSatisfy((put) => {
        expect(put.envelope.id).toBe('fact-1-v1'); // still v1
      });
      expect(await store.list({ kind: factKind })).toSucceedAndSatisfy((all) => {
        expect(all).toHaveLength(1);
      });
    });
  });

  describe('list({ asOf }) and get resolution', () => {
    test('asOf selects the version valid at the instant; get returns current', async () => {
      const store = createStore();
      expect(await store.put(factRecord('fact-1', 'blue'))).toSucceed(); // valid_at 1000
      clockValue = 2000;
      expect(await store.put(factRecord('fact-1', 'grey'))).toSucceed(); // v1 invalid_at 2000, v2 valid_at 2000

      // At t=1500 only v1 was valid.
      expect(await store.list({ kind: factKind, asOf: 1500 })).toSucceedAndSatisfy((at1500) => {
        expect(at1500.map((r) => r.envelope.id)).toEqual(['fact-1-v1']);
      });
      // At t=2500 v2 is valid.
      expect(await store.list({ kind: factKind, asOf: 2500 })).toSucceedAndSatisfy((at2500) => {
        expect(at2500.map((r) => r.envelope.id)).toEqual(['fact-1-v2']);
      });
      // Before either version existed.
      expect(await store.list({ kind: factKind, asOf: 500 })).toSucceedWith([]);
      // get (no asOf) returns the current version.
      expect(await store.get(factKind, 'fact-1' as EntityId)).toSucceedAndSatisfy((cur) => {
        expect(cur?.envelope.id).toBe('fact-1-v2');
      });
    });

    test('asOf passes non-temporal records through unchanged (timeless)', async () => {
      const store = createStore();
      expect(await store.put(knowledgeRecord('doc-a', 'flat body'))).toSucceed();
      expect(await store.put(factRecord('fact-1', 'blue'))).toSucceed();
      // asOf at an instant before the flat doc's created still includes it (timeless).
      expect(await store.list({ asOf: 500 })).toSucceedAndSatisfy((snap) => {
        expect(snap.map((r) => r.envelope.id).sort()).toEqual(['doc-a']);
      });
    });
  });

  describe("delete (soft / invalidate-don't-delete)", () => {
    test('invalidates the current version, retains history, returns the invalidated id', async () => {
      const store = createStore();
      expect(await store.put(factRecord('fact-1', 'blue'))).toSucceed();
      clockValue = 3000;
      expect(await store.delete(factKind, 'fact-1' as EntityId)).toSucceedWith('fact-1-v1' as never);

      // No current version after the soft delete.
      expect(await store.get(factKind, 'fact-1' as EntityId)).toSucceedWith(undefined);
      // But history is retained (the file still exists, now invalidated).
      expect(await store.list({ kind: factKind })).toSucceedAndSatisfy((all) => {
        expect(all).toHaveLength(1);
        expect(all[0].envelope.temporal).toEqual({ valid_at: 1000, invalid_at: 3000 });
      });
      // A second delete finds no current version.
      expect(await store.delete(factKind, 'fact-1' as EntityId)).toFailWith(/no record found/i);
    });
  });

  describe('policy admission on the versioned path', () => {
    test('a rejecting policy fails the put', async () => {
      const rejectingCodec: IIdentityCodec = TemporalIdentityCodec.create('facts').orThrow();
      const rejectPolicy: IWritePolicy = {
        mutableFields: ['body'],
        dedupScope: 'entity',
        admit: (): Result<AdmissionDecision> => succeed({ decision: 'reject', reason: 'blocked' }),
        applyUpdate: (existing): Result<IMemoryRecord<unknown>> => succeed(existing)
      };
      const store = FileTreeMemoryStore.create({
        root: mutableRoot(),
        registry: registry(),
        codecs: new Map<Kind, IIdentityCodec>([[factKind, rejectingCodec]]),
        writePolicies: new Map<Kind, IWritePolicy>([[factKind, rejectPolicy]]),
        clock
      }).orThrow();
      expect(await store.put(factRecord('fact-1', 'blue'))).toFailWith(/rejected by policy: blocked/i);
    });
  });

  describe('flat-path regression (adoption guarantee)', () => {
    test('a non-temporal kind is unaffected: flat put/get/delete, no entities/ subtree', async () => {
      const store = createStore();
      expect(await store.put(knowledgeRecord('doc-a', 'flat body'))).toSucceedAndSatisfy((put) => {
        // Flat: id === entityId, no temporal block, no minted version id.
        expect(put.envelope.id).toBe('doc-a');
        expect(put.envelope.entityId).toBe('doc-a');
        expect(put.envelope.temporal).toBeUndefined();
      });
      expect(await store.get(knowledgeKind, 'doc-a' as EntityId)).toSucceedAndSatisfy((got) => {
        expect(got?.body).toBe('flat body');
      });
      // The flat record lives at the flat knowledge scope, not under any entities/ subtree.
      expect(await store.getById('knowledge' as MemoryScopeKey, 'doc-a' as never)).toSucceedAndSatisfy(
        (got) => {
          expect(got?.envelope.id).toBe('doc-a');
        }
      );
      // Flat delete physically removes the record.
      expect(await store.delete(knowledgeKind, 'doc-a' as EntityId)).toSucceedWith('doc-a' as never);
      expect(await store.get(knowledgeKind, 'doc-a' as EntityId)).toSucceedWith(undefined);
      expect(await store.list({ kind: knowledgeKind })).toSucceedWith([]);
    });
  });
});
