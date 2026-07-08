/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { Converters, Result, fail, succeed } from '@fgv/ts-utils';
import { FileTree } from '@fgv/ts-json-base';
import {
  AdmissionDecision,
  BodyConverterRegistry,
  EntityId,
  FileTreeMemoryStore,
  IBodyConverterRegistry,
  IIdentityCodec,
  IMemoryEnvelope,
  IMemoryRecord,
  IWritePolicy,
  Kind,
  KnowledgeIdentityCodec,
  MemoryId,
  MemoryScopeKey,
  TemporalIdentityCodec,
  TemporalVersionedPolicy,
  serializeMemoryFile
} from '../../../index';

const factKind: Kind = 'fact' as Kind;
const knowledgeKind: Kind = 'knowledge' as Kind;
const factScope: MemoryScopeKey = 'facts/entities/fact-1' as MemoryScopeKey;

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

/**
 * A raw seeded `fact-1` version file. `invalidAt` absent → a CURRENT version;
 * seeding two current versions reproduces a stuck partial-invalidation state.
 */
function seedFactVersion(
  seq: number,
  validAt: number,
  invalidAt?: number
): { path: string; contents: string } {
  const temporal: Record<string, unknown> =
    invalidAt === undefined ? { valid_at: validAt } : { valid_at: validAt, invalid_at: invalidAt };
  const envelope: IMemoryEnvelope = {
    id: `fact-1-v${seq}` as MemoryId,
    entityId: 'fact-1' as EntityId,
    kind: factKind,
    tags: [],
    links: [],
    created: validAt,
    updated: validAt,
    seq,
    contentHash: `seed-${seq}`,
    provenance: { source: 'agent' },
    temporal
  };
  return {
    path: `facts/entities/fact-1/fact-1-v${seq}.md`,
    contents: serializeMemoryFile(envelope, `seed body v${seq}`).orThrow()
  };
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

/** Like {@link factRecord} but supplying an explicit world-truth `valid_at`. */
function factRecordAt(entityId: string, body: string, validAt: number): IMemoryRecord<unknown> {
  const base = factRecord(entityId, body);
  return { envelope: { ...base.envelope, temporal: { valid_at: validAt } }, body: base.body };
}

/** Like {@link factRecord} but supplying revised `tags` (metadata surface). */
function factRecordWithTags(
  entityId: string,
  body: string,
  tags: ReadonlyArray<string>
): IMemoryRecord<unknown> {
  const base = factRecord(entityId, body);
  return {
    envelope: { ...base.envelope, tags: tags as unknown as IMemoryEnvelope['tags'] },
    body: base.body
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

    test('a metadata-only revision (same body, revised tags) mints a new version, not swallowed', async () => {
      // TemporalVersionedPolicy declares tags/provenance mutable and
      // _buildVersionedRecord merges them via applyUpdate; the content-hash dedup
      // must NOT short-circuit a metadata-only revision, or that merge branch is
      // unreachable and the revision is dropped entirely.
      const store = createStore();
      expect(await store.put(factRecord('fact-1', 'same'))).toSucceedAndSatisfy((v1) => {
        expect(v1.envelope.id).toBe('fact-1-v1');
        expect(v1.envelope.tags).toEqual([]);
      });
      clockValue = 2000;
      expect(await store.put(factRecordWithTags('fact-1', 'same', ['reviewed']))).toSucceedAndSatisfy(
        (v2) => {
          expect(v2.envelope.id).toBe('fact-1-v2'); // a NEW version was minted
          expect(v2.envelope.tags).toEqual(['reviewed']); // metadata merged in
        }
      );
      // History retained (prior version invalidated), current resolves to v2.
      expect(await store.list({ kind: factKind })).toSucceedAndSatisfy((all) => {
        expect(all.map((r) => r.envelope.id).sort()).toEqual(['fact-1-v1', 'fact-1-v2']);
      });
      expect(await store.get(factKind, 'fact-1' as EntityId)).toSucceedAndSatisfy((cur) => {
        expect(cur?.envelope.id).toBe('fact-1-v2');
        expect(cur?.envelope.tags).toEqual(['reviewed']);
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

  describe('world-truth valid-time boundary (P2-1)', () => {
    test('a future-dated supersede closes the prior interval at the NEW valid_at (no gap)', async () => {
      const store = createStore();
      expect(await store.put(factRecord('fact-1', 'blue'))).toSucceed(); // v1 valid_at 1000
      clockValue = 2000;
      // The new version's world-truth validity starts in the future (5000), while
      // the transaction happens now (2000).
      expect(await store.put(factRecordAt('fact-1', 'grey', 5000))).toSucceedAndSatisfy((put) => {
        expect(put.envelope.temporal).toEqual({ valid_at: 5000 });
      });
      // The prior version's interval closes at the NEW valid_at (5000), NOT `now` (2000).
      expect(await store.getById(factScope, 'fact-1-v1' as never)).toSucceedAndSatisfy((v1) => {
        expect(v1?.envelope.temporal).toEqual({ valid_at: 1000, invalid_at: 5000 });
      });
      // As-of between the two valid_ats still resolves to v1 — no gap on the axis.
      expect(await store.list({ kind: factKind, asOf: 3000 })).toSucceedAndSatisfy((at3000) => {
        expect(at3000.map((r) => r.envelope.id)).toEqual(['fact-1-v1']);
      });
    });
  });

  describe('self-healing invalidation (P2-7)', () => {
    test('a put invalidates EVERY stuck-current prior version', async () => {
      // Seed a corrupt state: two current versions (a prior invalidation only
      // partially completed).
      const root = mutableRoot([seedFactVersion(1, 100), seedFactVersion(2, 200)]);
      const store = createStore(root);
      clockValue = 3000;
      expect(await store.put(factRecord('fact-1', 'v3 body'))).toSucceedAndSatisfy((put) => {
        expect(put.envelope.id).toBe('fact-1-v3');
      });
      // BOTH stuck versions are now invalidated at the new valid_at (3000).
      expect(await store.getById(factScope, 'fact-1-v1' as never)).toSucceedAndSatisfy((v1) => {
        expect(v1?.envelope.temporal).toEqual({ valid_at: 100, invalid_at: 3000 });
      });
      expect(await store.getById(factScope, 'fact-1-v2' as never)).toSucceedAndSatisfy((v2) => {
        expect(v2?.envelope.temporal).toEqual({ valid_at: 200, invalid_at: 3000 });
      });
      // Exactly one current version remains: the new one.
      expect(await store.get(factKind, 'fact-1' as EntityId)).toSucceedAndSatisfy((cur) => {
        expect(cur?.envelope.id).toBe('fact-1-v3');
      });
    });

    test('a delete invalidates EVERY stuck-current prior version', async () => {
      const root = mutableRoot([seedFactVersion(1, 100), seedFactVersion(2, 200)]);
      const store = createStore(root);
      clockValue = 4000;
      expect(await store.delete(factKind, 'fact-1' as EntityId)).toSucceedWith('fact-1-v2' as never);
      expect(await store.getById(factScope, 'fact-1-v1' as never)).toSucceedAndSatisfy((v1) => {
        expect(v1?.envelope.temporal).toEqual({ valid_at: 100, invalid_at: 4000 });
      });
      expect(await store.getById(factScope, 'fact-1-v2' as never)).toSucceedAndSatisfy((v2) => {
        expect(v2?.envelope.temporal).toEqual({ valid_at: 200, invalid_at: 4000 });
      });
      expect(await store.get(factKind, 'fact-1' as EntityId)).toSucceedWith(undefined);
    });
  });

  describe('policy admission on the versioned path', () => {
    function storeWithPolicy(policy: IWritePolicy): FileTreeMemoryStore {
      return FileTreeMemoryStore.create({
        root: mutableRoot(),
        registry: registry(),
        codecs: new Map<Kind, IIdentityCodec>([[factKind, TemporalIdentityCodec.create('facts').orThrow()]]),
        writePolicies: new Map<Kind, IWritePolicy>([[factKind, policy]]),
        clock
      }).orThrow();
    }

    test('a rejecting policy fails the put', async () => {
      const store = storeWithPolicy({
        mutableFields: ['body'],
        dedupScope: 'entity',
        admit: (): Result<AdmissionDecision> => succeed({ decision: 'reject', reason: 'blocked' }),
        applyUpdate: (existing): Result<IMemoryRecord<unknown>> => succeed(existing)
      });
      expect(await store.put(factRecord('fact-1', 'blue'))).toFailWith(/rejected by policy: blocked/i);
    });

    test('a policy whose admit fails propagates the failure', async () => {
      const store = storeWithPolicy({
        mutableFields: ['body'],
        dedupScope: 'entity',
        admit: (): Result<AdmissionDecision> => fail('admit exploded'),
        applyUpdate: (existing): Result<IMemoryRecord<unknown>> => succeed(existing)
      });
      expect(await store.put(factRecord('fact-1', 'blue'))).toFailWith(/admit exploded/i);
    });

    test('a policy omitting dedupScope falls back to the default (entity) dedup', async () => {
      const store = storeWithPolicy({
        mutableFields: ['body'],
        // dedupScope intentionally omitted → the store applies DEFAULT_DEDUP_SCOPE.
        admit: (): Result<AdmissionDecision> => succeed({ decision: 'accept' }),
        applyUpdate: (existing): Result<IMemoryRecord<unknown>> => succeed(existing)
      });
      expect(await store.put(factRecord('fact-1', 'same'))).toSucceed();
      clockValue = 2000;
      // Identical re-put is a no-op under the default entity dedup — no v2.
      expect(await store.put(factRecord('fact-1', 'same'))).toSucceedAndSatisfy((put) => {
        expect(put.envelope.id).toBe('fact-1-v1');
      });
    });

    test('a policy that returns a non-string merged body fails the update', async () => {
      const store = storeWithPolicy({
        mutableFields: ['body'],
        dedupScope: 'entity',
        admit: (): Result<AdmissionDecision> => succeed({ decision: 'accept' }),
        // Corrupt the merge output on the update branch.
        applyUpdate: (existing): Result<IMemoryRecord<unknown>> =>
          succeed({ envelope: existing.envelope, body: 42 })
      });
      expect(await store.put(factRecord('fact-1', 'v1'))).toSucceed();
      clockValue = 2000;
      expect(await store.put(factRecord('fact-1', 'v2'))).toFailWith(/non-string body/i);
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
