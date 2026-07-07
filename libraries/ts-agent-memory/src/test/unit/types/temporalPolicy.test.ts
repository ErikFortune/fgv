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
  MemoryId,
  Tag,
  TemporalVersionedPolicy
} from '../../../packlets/types';

function makeRecord(overrides?: Partial<IMemoryEnvelope>, body?: unknown): IMemoryRecord<unknown> {
  const envelope: IMemoryEnvelope = {
    id: 'fact-1-v1' as MemoryId,
    entityId: 'fact-1' as EntityId,
    kind: 'fact' as Kind,
    tags: ['sky'] as Tag[],
    links: [],
    created: 1000,
    updated: 1000,
    seq: 1,
    contentHash: 'hash-1',
    provenance: { source: 'agent' } as IProvenance,
    temporal: { valid_at: 1000 },
    ...overrides
  };
  return { envelope, body: body ?? 'the sky is blue' };
}

describe('TemporalVersionedPolicy', () => {
  let policy: TemporalVersionedPolicy;

  beforeEach(() => {
    policy = TemporalVersionedPolicy.create().orThrow();
  });

  test('exposes the temporal mutable surface and entity dedup', () => {
    expect(policy.mutableFields).toEqual(['body', 'tags', 'links', 'provenance', 'embeddingRef']);
    expect(policy.dedupScope).toBe('entity');
  });

  describe('admit', () => {
    test("always accepts (invalidate-don't-delete: never culls)", () => {
      expect(policy.admit(makeRecord(), [])).toSucceedWith({ decision: 'accept' });
      expect(policy.admit(makeRecord(), [makeRecord(), makeRecord()])).toSucceedWith({
        decision: 'accept'
      });
    });
  });

  describe('applyUpdate (forms the new version content)', () => {
    test('replaces a string body wholesale', () => {
      const existing = makeRecord(undefined, 'the sky is blue');
      expect(policy.applyUpdate(existing, { body: 'the sky is grey' })).toSucceedAndSatisfy((updated) => {
        expect(updated.body).toBe('the sky is grey');
      });
    });

    test('merges tags / provenance and preserves untouched envelope metadata', () => {
      const existing = makeRecord({ provenance: { source: 'agent', by: 'curator' } as IProvenance });
      expect(
        policy.applyUpdate(existing, { tags: ['sky', 'weather'], provenance: { model: 'gpt' } })
      ).toSucceedAndSatisfy((updated) => {
        expect(updated.envelope.tags).toEqual(['sky', 'weather']);
        expect(updated.envelope.provenance).toEqual({ source: 'agent', by: 'curator', model: 'gpt' });
        // Identity/transaction-time fields are carried verbatim (the store restamps them).
        expect(updated.envelope.entityId).toBe('fact-1');
      });
    });

    test('rejects a patch that deletes a required field', () => {
      expect(policy.applyUpdate(makeRecord(), { body: null })).toFailWith(/may not delete required field/i);
    });

    test('restores embeddingRef as absent when a null patch drops it (hash-stable)', () => {
      const existing = makeRecord({ embeddingRef: 'vec-1' });
      expect(policy.applyUpdate(existing, { embeddingRef: null })).toSucceedAndSatisfy((updated) => {
        expect(updated.envelope.embeddingRef).toBeUndefined();
      });
    });

    test('carries an untouched embeddingRef through a body-only patch', () => {
      const existing = makeRecord({ embeddingRef: 'vec-1' }, 'the sky is blue');
      expect(policy.applyUpdate(existing, { body: 'the sky is grey' })).toSucceedAndSatisfy((updated) => {
        expect(updated.body).toBe('the sky is grey');
        expect(updated.envelope.embeddingRef).toBe('vec-1');
      });
    });
  });
});
