/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import {
  EntityId,
  IMemoryEnvelope,
  IMemoryRecord,
  IProvenance,
  Kind,
  KnowledgeLwwPolicy,
  MemoryId,
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
});
