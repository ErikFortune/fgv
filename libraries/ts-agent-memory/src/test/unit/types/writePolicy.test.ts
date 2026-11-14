/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import {
  EntityId,
  IEdgeTarget,
  IMemoryEnvelope,
  IMemoryRecord,
  IProvenance,
  Kind,
  KnowledgeLwwPolicy,
  MemoryCapCullPolicy,
  MemoryId,
  MemoryScopeKey,
  Tag
} from '../../../packlets/types';

interface IKnowledgeBody {
  readonly title: string;
  readonly text: string;
}

function makeRecord(overrides?: Partial<IMemoryEnvelope>, body?: unknown): IMemoryRecord<unknown> {
  const envelope: IMemoryEnvelope = {
    id: 'intro-to-rust' as MemoryId,
    entityId: 'intro-to-rust' as EntityId,
    kind: 'knowledge' as Kind,
    tags: ['rust'] as Tag[],
    links: [],
    created: 1000,
    updated: 1000,
    seq: 1,
    contentHash: 'hash-1',
    provenance: { source: 'agent' } as IProvenance,
    ...overrides
  };
  return {
    envelope,
    body: body ?? ({ title: 'Intro', text: 'original' } as IKnowledgeBody)
  };
}

describe('KnowledgeLwwPolicy', () => {
  let policy: KnowledgeLwwPolicy;

  beforeEach(() => {
    policy = KnowledgeLwwPolicy.create().orThrow();
  });

  test('create succeeds and exposes the knowledge mutable surface', () => {
    expect(policy.mutableFields).toEqual(['body', 'tags', 'links', 'provenance', 'embeddingRef']);
  });

  test('declares content-scoped dedup (knowledge collapses identical content across ids)', () => {
    expect(policy.dedupScope).toBe('content');
  });

  describe('admit', () => {
    test('always accepts (last-write-wins, no cap)', () => {
      expect(policy.admit(makeRecord(), [])).toSucceedWith({ decision: 'accept' });
      expect(policy.admit(makeRecord(), [makeRecord(), makeRecord()])).toSucceedWith({
        decision: 'accept'
      });
    });
  });

  describe('applyUpdate', () => {
    test('deep-merges a body change', () => {
      const existing = makeRecord(undefined, { title: 'Intro', text: 'original' });
      expect(policy.applyUpdate(existing, { body: { text: 'revised' } })).toSucceedAndSatisfy((updated) => {
        expect(updated.body).toEqual({ title: 'Intro', text: 'revised' });
      });
    });

    test('replaces arrays wholesale (RFC-7386 array semantics)', () => {
      const existing = makeRecord({ tags: ['rust', 'systems'] as Tag[] });
      expect(policy.applyUpdate(existing, { tags: ['rust'] })).toSucceedAndSatisfy((updated) => {
        expect(updated.envelope.tags).toEqual(['rust']);
      });
    });

    test('deep-merges provenance and preserves untouched keys', () => {
      const existing = makeRecord({ provenance: { source: 'agent', by: 'curator' } as IProvenance });
      expect(policy.applyUpdate(existing, { provenance: { model: 'gpt' } })).toSucceedAndSatisfy(
        (updated) => {
          expect(updated.envelope.provenance).toEqual({ source: 'agent', by: 'curator', model: 'gpt' });
        }
      );
    });

    test('sets embeddingRef when present in the patch', () => {
      const existing = makeRecord({ embeddingRef: 'vec-1' });
      expect(policy.applyUpdate(existing, { embeddingRef: 'vec-2' })).toSucceedAndSatisfy((updated) => {
        expect(updated.envelope.embeddingRef).toBe('vec-2');
      });
    });

    test('clears embeddingRef (to absent) when the patch deletes it (null = delete, RFC-7386)', () => {
      const existing = makeRecord({ embeddingRef: 'vec-1' });
      expect(policy.applyUpdate(existing, { embeddingRef: null })).toSucceedAndSatisfy((updated) => {
        expect(updated.envelope.embeddingRef).toBeUndefined();
      });
    });

    test('preserves an absent embeddingRef as absent on an unrelated update (hash-stable)', () => {
      const existing = makeRecord(); // no embeddingRef
      expect(policy.applyUpdate(existing, { body: { text: 'revised' } })).toSucceedAndSatisfy((updated) => {
        expect(updated.envelope.embeddingRef).toBeUndefined();
      });
    });

    test('preserves an explicit null embeddingRef when the patch does not touch it', () => {
      const existing = makeRecord({ embeddingRef: null });
      expect(policy.applyUpdate(existing, { body: { text: 'revised' } })).toSucceedAndSatisfy((updated) => {
        expect(updated.envelope.embeddingRef).toBeNull();
      });
    });

    test('ignores patch keys outside the mutable surface', () => {
      const existing = makeRecord();
      expect(
        policy.applyUpdate(existing, { id: 'tampered', created: 9999, body: { text: 'revised' } })
      ).toSucceedAndSatisfy((updated) => {
        expect(updated.envelope.id).toBe('intro-to-rust');
        expect(updated.envelope.created).toBe(1000);
        expect(updated.body).toEqual({ title: 'Intro', text: 'revised' });
      });
    });

    test('preserves identity and transaction-time envelope fields', () => {
      const existing = makeRecord();
      expect(policy.applyUpdate(existing, { tags: ['updated'] })).toSucceedAndSatisfy((updated) => {
        expect(updated.envelope.id).toBe('intro-to-rust');
        expect(updated.envelope.entityId).toBe('intro-to-rust');
        expect(updated.envelope.kind).toBe('knowledge');
        expect(updated.envelope.created).toBe(1000);
        expect(updated.envelope.seq).toBe(1);
        expect(updated.envelope.contentHash).toBe('hash-1');
      });
    });

    test('fails when a patch deletes a required mutable field', () => {
      const existing = makeRecord();
      expect(policy.applyUpdate(existing, { body: null })).toFailWith(
        /may not delete required field\(s\): body/i
      );
    });
  });

  /**
   * Pins the provenance merge contract documented in the package README
   * (§ "Record updates — the merge contract"). `provenance` is on this policy's
   * PINNED mutable surface, so these four behaviors are guarantees a consumer
   * may depend on — not incidental consequences of the merge configuration. If
   * one of these ever changes, the README claim is wrong and must move with it.
   */
  describe('provenance merge contract (README-pinned)', () => {
    /** `provenance` with one key to clear, one to revise, and one to leave alone. */
    function provenanceRecord(): IMemoryRecord<unknown> {
      return makeRecord({
        provenance: { source: 'agent', confidence: 0.9, note: 'stale' } as IProvenance
      });
    }

    test('an explicit null on a sub-key clears that key and preserves its siblings', () => {
      expect(policy.applyUpdate(provenanceRecord(), { provenance: { note: null } })).toSucceedAndSatisfy(
        (updated) => {
          expect(updated.envelope.provenance).toEqual({ source: 'agent', confidence: 0.9 });
        }
      );
    });

    test('a sub-key revision merges per key and preserves untouched siblings', () => {
      expect(policy.applyUpdate(provenanceRecord(), { provenance: { confidence: 0.5 } })).toSucceedAndSatisfy(
        (updated) => {
          expect(updated.envelope.provenance).toEqual({
            source: 'agent',
            confidence: 0.5,
            note: 'stale'
          });
        }
      );
    });

    test('a whole-block null is rejected loudly rather than silently accepted', () => {
      expect(policy.applyUpdate(provenanceRecord(), { provenance: null })).toFailWith(
        /may not delete required field\(s\): provenance/i
      );
    });

    test('a patch that does not mention provenance leaves it untouched', () => {
      expect(policy.applyUpdate(provenanceRecord(), { tags: ['x'] })).toSucceedAndSatisfy((updated) => {
        expect(updated.envelope.provenance).toEqual({
          source: 'agent',
          confidence: 0.9,
          note: 'stale'
        });
      });
    });

    test('the existing record is not mutated in place', () => {
      const existing = provenanceRecord();
      expect(policy.applyUpdate(existing, { provenance: { note: null } })).toSucceed();
      expect(existing.envelope.provenance).toEqual({
        source: 'agent',
        confidence: 0.9,
        note: 'stale'
      });
    });
  });
});

describe('MemoryCapCullPolicy', () => {
  const memoryFields: ReadonlyArray<string> = ['body', 'tags', 'links', 'provenance', 'embeddingRef'];

  /** Build a memory record with a distinct id and creation time. */
  function memoryRecord(id: string, created: number, body?: unknown): IMemoryRecord<unknown> {
    return makeRecord(
      {
        id: id as MemoryId,
        entityId: id as EntityId,
        kind: 'summarized-turn' as Kind,
        created,
        updated: created
      },
      body
    );
  }

  test('create succeeds and exposes the supplied mutable surface + entity dedup scope', () => {
    const policy = MemoryCapCullPolicy.create({ maxRecords: 3, mutableFields: memoryFields }).orThrow();
    expect(policy.mutableFields).toEqual(memoryFields);
    expect(policy.dedupScope).toBe('entity');
  });

  describe('admit', () => {
    test('accepts unconditionally when no cap is configured', () => {
      const policy = MemoryCapCullPolicy.create({ mutableFields: memoryFields }).orThrow();
      const cohort = [memoryRecord('turn-0', 1), memoryRecord('turn-1', 2), memoryRecord('turn-2', 3)];
      expect(policy.admit(memoryRecord('turn-3', 4), cohort)).toSucceedWith({ decision: 'accept' });
    });

    test('accepts while the cohort is below the cap', () => {
      const policy = MemoryCapCullPolicy.create({ maxRecords: 3, mutableFields: memoryFields }).orThrow();
      const cohort = [memoryRecord('turn-0', 1), memoryRecord('turn-1', 2)];
      expect(policy.admit(memoryRecord('turn-2', 3), cohort)).toSucceedWith({ decision: 'accept' });
    });

    test('culls the single oldest (by created ascending) when the cohort is at the cap', () => {
      const policy = MemoryCapCullPolicy.create({ maxRecords: 3, mutableFields: memoryFields }).orThrow();
      // Deliberately out of created order to prove the sort, not the input order.
      const cohort = [memoryRecord('turn-c', 30), memoryRecord('turn-a', 10), memoryRecord('turn-b', 20)];
      expect(policy.admit(memoryRecord('turn-new', 40), cohort)).toSucceedWith({
        decision: 'cull-oldest',
        evict: ['turn-a' as MemoryId]
      });
    });

    test('culls enough oldest records to land exactly at the cap when over it', () => {
      const policy = MemoryCapCullPolicy.create({ maxRecords: 2, mutableFields: memoryFields }).orThrow();
      const cohort = [
        memoryRecord('turn-a', 10),
        memoryRecord('turn-b', 20),
        memoryRecord('turn-c', 30),
        memoryRecord('turn-d', 40)
      ];
      // cohort 4, cap 2 → evict 4 - 2 + 1 = 3 oldest, leaving 1 + the incoming = 2.
      expect(policy.admit(memoryRecord('turn-new', 50), cohort)).toSucceedWith({
        decision: 'cull-oldest',
        evict: ['turn-a' as MemoryId, 'turn-b' as MemoryId, 'turn-c' as MemoryId]
      });
    });
  });

  describe('applyUpdate', () => {
    let policy: MemoryCapCullPolicy;

    beforeEach(() => {
      policy = MemoryCapCullPolicy.create({ maxRecords: 5, mutableFields: memoryFields }).orThrow();
    });

    test('deep-merges a body change over the declared mutable surface', () => {
      const existing = memoryRecord('turn-0', 1, { summary: 'first draft', turn: 0 });
      expect(policy.applyUpdate(existing, { body: { summary: 'revised' } })).toSucceedAndSatisfy(
        (updated) => {
          expect(updated.body).toEqual({ summary: 'revised', turn: 0 });
        }
      );
    });

    test('replaces arrays wholesale (RFC-7386 array semantics)', () => {
      const existing = makeRecord({
        id: 'turn-0' as MemoryId,
        kind: 'summarized-turn' as Kind,
        tags: ['draft', 'pending'] as Tag[]
      });
      expect(policy.applyUpdate(existing, { tags: ['final'] })).toSucceedAndSatisfy((updated) => {
        expect(updated.envelope.tags).toEqual(['final']);
      });
    });

    test('sets embeddingRef when present in the patch', () => {
      const existing = makeRecord({
        id: 'turn-0' as MemoryId,
        kind: 'summarized-turn' as Kind,
        embeddingRef: 'vec-1'
      });
      expect(policy.applyUpdate(existing, { embeddingRef: 'vec-2' })).toSucceedAndSatisfy((updated) => {
        expect(updated.envelope.embeddingRef).toBe('vec-2');
      });
    });

    test('clears embeddingRef (to absent) when the patch deletes it (null = delete)', () => {
      const existing = makeRecord({
        id: 'turn-0' as MemoryId,
        kind: 'summarized-turn' as Kind,
        embeddingRef: 'vec-1'
      });
      expect(policy.applyUpdate(existing, { embeddingRef: null })).toSucceedAndSatisfy((updated) => {
        expect(updated.envelope.embeddingRef).toBeUndefined();
      });
    });

    test('fails when a patch deletes a required mutable field', () => {
      const existing = memoryRecord('turn-0', 1);
      expect(policy.applyUpdate(existing, { tags: null })).toFailWith(
        /may not delete required field\(s\): tags/i
      );
    });

    test('preserves a field that is not declared mutable', () => {
      // mutableFields omits 'links', so a links patch is ignored and the
      // existing links are preserved verbatim.
      const narrow = MemoryCapCullPolicy.create({ maxRecords: 5, mutableFields: ['body'] }).orThrow();
      const existing = makeRecord(
        {
          id: 'turn-0' as MemoryId,
          kind: 'summarized-turn' as Kind,
          links: [
            {
              type: 'derived-from' as never,
              target: { scope: 'knowledge' as MemoryScopeKey, id: 'doc-1' as MemoryId } as IEdgeTarget
            }
          ]
        },
        { summary: 'old' }
      );
      expect(narrow.applyUpdate(existing, { body: { summary: 'x' }, links: [] })).toSucceedAndSatisfy(
        (updated) => {
          expect(updated.envelope.links).toEqual([
            { type: 'derived-from', target: { scope: 'knowledge', id: 'doc-1' } }
          ]);
          expect(updated.body).toEqual({ summary: 'x' });
        }
      );
    });

    test('preserves the body when body is not a declared mutable field', () => {
      // mutableFields is tags-only: a body patch is ignored and the existing
      // body is preserved verbatim (the `else existing.body` rebuild branch).
      const tagsOnly = MemoryCapCullPolicy.create({ maxRecords: 5, mutableFields: ['tags'] }).orThrow();
      const existing = makeRecord(
        { id: 'turn-0' as MemoryId, kind: 'summarized-turn' as Kind, tags: ['old'] as Tag[] },
        { summary: 'keep me' }
      );
      expect(
        tagsOnly.applyUpdate(existing, { tags: ['new'], body: { summary: 'ignored' } })
      ).toSucceedAndSatisfy((updated) => {
        expect(updated.envelope.tags).toEqual(['new']);
        expect(updated.body).toEqual({ summary: 'keep me' });
      });
    });

    test('preserves an absent embeddingRef as absent on an unrelated update (hash-stable)', () => {
      const existing = memoryRecord('turn-0', 1, { summary: 's' });
      expect(policy.applyUpdate(existing, { body: { summary: 't' } })).toSucceedAndSatisfy((updated) => {
        expect(updated.envelope.embeddingRef).toBeUndefined();
      });
    });

    test('preserves embeddingRef when it is not in the declared mutable surface', () => {
      const narrow = MemoryCapCullPolicy.create({ maxRecords: 5, mutableFields: ['body'] }).orThrow();
      const existing = makeRecord({
        id: 'turn-0' as MemoryId,
        kind: 'summarized-turn' as Kind,
        embeddingRef: 'vec-keep'
      });
      expect(narrow.applyUpdate(existing, { body: { summary: 'x' } })).toSucceedAndSatisfy((updated) => {
        expect(updated.envelope.embeddingRef).toBe('vec-keep');
      });
    });

    /**
     * Pins the policy-dependence caveat the README states alongside the
     * provenance merge contract: unlike {@link KnowledgeLwwPolicy}'s pinned
     * surface, this policy's surface is caller-supplied, so a consumer who does
     * not declare `provenance` mutable gets NEITHER the sub-key clear NOR the
     * loud whole-block rejection — every provenance patch key is simply inert.
     */
    describe('provenance guarantees are policy-dependent (README-pinned)', () => {
      const bodyOnly = (): MemoryCapCullPolicy =>
        MemoryCapCullPolicy.create({ maxRecords: 5, mutableFields: ['body'] }).orThrow();

      function undeclaredProvenanceRecord(): IMemoryRecord<unknown> {
        return makeRecord(
          {
            id: 'turn-0' as MemoryId,
            kind: 'summarized-turn' as Kind,
            provenance: { source: 'agent', note: 'stale' } as IProvenance
          },
          { summary: 'old' }
        );
      }

      test('a sub-key null is inert when provenance is not declared mutable', () => {
        expect(
          bodyOnly().applyUpdate(undeclaredProvenanceRecord(), { provenance: { note: null } })
        ).toSucceedAndSatisfy((updated) => {
          expect(updated.envelope.provenance).toEqual({ source: 'agent', note: 'stale' });
        });
      });

      test('a whole-block null is a silent no-op, not an error, when provenance is not declared mutable', () => {
        expect(
          bodyOnly().applyUpdate(undeclaredProvenanceRecord(), { provenance: null })
        ).toSucceedAndSatisfy((updated) => {
          expect(updated.envelope.provenance).toEqual({ source: 'agent', note: 'stale' });
        });
      });

      test('declaring provenance mutable restores both guarantees', () => {
        expect(
          policy.applyUpdate(undeclaredProvenanceRecord(), { provenance: { note: null } })
        ).toSucceedAndSatisfy((updated) => {
          expect(updated.envelope.provenance).toEqual({ source: 'agent' });
        });
        expect(policy.applyUpdate(undeclaredProvenanceRecord(), { provenance: null })).toFailWith(
          /may not delete required field\(s\): provenance/i
        );
      });
    });
  });
});
