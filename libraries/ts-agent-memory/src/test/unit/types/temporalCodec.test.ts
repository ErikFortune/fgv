/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import {
  EntityId,
  IIdentityCodec,
  IMemoryRecord,
  KnowledgeIdentityCodec,
  MemoryScopeKey,
  TemporalIdentityCodec,
  isTemporalIdentityCodec,
  isTemporalRecord,
  isVersionCurrent,
  isVersionValidAt,
  selectCurrentVersion,
  selectVersionAsOf
} from '../../../packlets/types';
import { envelopeConverter } from '../../../packlets/converters';

const codec: TemporalIdentityCodec = TemporalIdentityCodec.create('facts').orThrow();

describe('TemporalIdentityCodec', () => {
  describe('create', () => {
    test('rejects a non-portable base scope', () => {
      expect(TemporalIdentityCodec.create('has/slash')).toFailWith(/baseScope/i);
    });
  });

  describe('encode', () => {
    test('maps an entityId to the entity subtree, versioned', () => {
      expect(codec.encode('fact-1' as EntityId)).toSucceedWith({
        scope: 'facts/entities/fact-1' as MemoryScopeKey,
        idStem: 'fact-1',
        isVersioned: true
      });
    });

    test('rejects a non-portable entityId', () => {
      expect(codec.encode('bad/id' as EntityId)).toFailWith(/entityId/i);
    });
  });

  describe('encodeVersion', () => {
    test('forms the <entityId>-v<seq> stem', () => {
      expect(codec.encodeVersion('fact-1' as EntityId, 7)).toSucceedWith('fact-1-v7');
    });

    test('rejects a negative or non-integer seq', () => {
      expect(codec.encodeVersion('fact-1' as EntityId, -1)).toFailWith(/non-negative integer/i);
      expect(codec.encodeVersion('fact-1' as EntityId, 1.5)).toFailWith(/non-negative integer/i);
    });

    test('rejects a non-portable entityId', () => {
      expect(codec.encodeVersion('bad/id' as EntityId, 1)).toFailWith(/entityId/i);
    });
  });

  describe('decode / decodeVersion', () => {
    test('recovers the entityId and seq from a (scope, version stem)', () => {
      expect(codec.decodeVersion('facts/entities/fact-1' as MemoryScopeKey, 'fact-1-v3')).toSucceedWith({
        entityId: 'fact-1' as EntityId,
        seq: 3
      });
      expect(codec.decode('facts/entities/fact-1' as MemoryScopeKey, 'fact-1-v3')).toSucceedWith(
        'fact-1' as EntityId
      );
    });

    test('disambiguates an entityId that itself ends in -v<digits> via the scope', () => {
      // The subtree scope is authoritative for the entityId, so a stem whose
      // entityId is `rev-v2` parses correctly.
      expect(codec.decodeVersion('facts/entities/rev-v2' as MemoryScopeKey, 'rev-v2-v5')).toSucceedWith({
        entityId: 'rev-v2' as EntityId,
        seq: 5
      });
    });

    test('rejects a scope that is not <base>/entities/<entityId>', () => {
      expect(codec.decodeVersion('facts/fact-1' as MemoryScopeKey, 'fact-1-v0')).toFailWith(
        /must be 'facts\/entities\/<entityId>'/i
      );
      expect(codec.decodeVersion('other/entities/fact-1' as MemoryScopeKey, 'fact-1-v0')).toFailWith(
        /must be 'facts\/entities\/<entityId>'/i
      );
    });

    test('rejects a non-portable entityId embedded in the scope', () => {
      expect(codec.decodeVersion('facts/entities/ ' as MemoryScopeKey, ' -v0')).toFailWith(/entityId/i);
    });

    test('rejects a stem that does not carry the entity prefix', () => {
      expect(codec.decodeVersion('facts/entities/fact-1' as MemoryScopeKey, 'other-v0')).toFailWith(
        /must begin with 'fact-1-v'/i
      );
    });

    test('rejects a stem with a non-integer version suffix', () => {
      expect(codec.decodeVersion('facts/entities/fact-1' as MemoryScopeKey, 'fact-1-vX')).toFailWith(
        /non-integer version suffix/i
      );
    });
  });

  describe('verifyRoundTrip', () => {
    test('succeeds for a well-formed (scope, version stem)', () => {
      expect(codec.verifyRoundTrip('facts/entities/fact-1' as MemoryScopeKey, 'fact-1-v9')).toSucceedWith(
        true
      );
    });

    test('fails when the stem cannot be decoded', () => {
      expect(codec.verifyRoundTrip('facts/entities/fact-1' as MemoryScopeKey, 'fact-1-vZ')).toFailWith(
        /non-integer version suffix/i
      );
    });

    test('fails on a non-canonical (zero-padded) seq stem', () => {
      // `-v007` decodes to seq 7 but re-encodes to `-v7`, so it is not canonical.
      expect(codec.verifyRoundTrip('facts/entities/fact-1' as MemoryScopeKey, 'fact-1-v007')).toFailWith(
        /round-trip mismatch/i
      );
    });
  });
});

describe('isTemporalIdentityCodec', () => {
  test('is true for a temporal codec', () => {
    expect(isTemporalIdentityCodec(codec)).toBe(true);
  });

  test('is false for a flat codec', () => {
    const flat: IIdentityCodec = new KnowledgeIdentityCodec();
    expect(isTemporalIdentityCodec(flat)).toBe(false);
  });
});

/** Build a temporal version record for the selection-helper tests. */
// eslint-disable-next-line @rushstack/no-new-null -- invalid_at null is the meaningful still-valid sentinel
function versionRecord(seq: number, validAt: number, invalidAt?: number | null): IMemoryRecord<unknown> {
  const temporal: Record<string, unknown> = { valid_at: validAt };
  if (invalidAt !== undefined) {
    temporal.invalid_at = invalidAt;
  }
  return {
    envelope: envelopeConverter
      .convert({
        id: `fact-1-v${seq}`,
        entityId: 'fact-1',
        kind: 'fact',
        tags: [],
        links: [],
        created: validAt,
        updated: validAt,
        seq,
        contentHash: `h${seq}`,
        provenance: { source: 'agent' },
        temporal
      })
      .orThrow(),
    body: `body v${seq}`
  };
}

describe('temporal selection helpers', () => {
  const v1 = versionRecord(1, 100, 200);
  const v2 = versionRecord(2, 200);
  const atemporal: IMemoryRecord<unknown> = {
    envelope: envelopeConverter
      .convert({
        id: 'doc',
        entityId: 'doc',
        kind: 'knowledge',
        tags: [],
        links: [],
        created: 0,
        updated: 0,
        seq: 0,
        contentHash: 'h',
        provenance: { source: 'agent' }
      })
      .orThrow(),
    body: 'flat'
  };

  test('isTemporalRecord keys off the temporal block', () => {
    expect(isTemporalRecord(v1)).toBe(true);
    expect(isTemporalRecord(atemporal)).toBe(false);
  });

  test('isVersionCurrent is true only for a null/absent invalid_at', () => {
    expect(isVersionCurrent(v1)).toBe(false);
    expect(isVersionCurrent(v2)).toBe(true);
    expect(isVersionCurrent(versionRecord(3, 300, null))).toBe(true);
    expect(isVersionCurrent(atemporal)).toBe(false);
  });

  test('isVersionValidAt bounds by valid_at and invalid_at', () => {
    expect(isVersionValidAt(v1, 50)).toBe(false); // before valid_at
    expect(isVersionValidAt(v1, 150)).toBe(true); // within [100, 200)
    expect(isVersionValidAt(v1, 200)).toBe(false); // at invalid_at (exclusive)
    expect(isVersionValidAt(v2, 500)).toBe(true); // still valid
    expect(isVersionValidAt(atemporal, 500)).toBe(false);
  });

  test('isVersionValidAt defaults valid_at to created when absent', () => {
    const noValidAt: IMemoryRecord<unknown> = {
      envelope: envelopeConverter
        .convert({
          id: 'fact-1-v4',
          entityId: 'fact-1',
          kind: 'fact',
          tags: [],
          links: [],
          created: 400,
          updated: 400,
          seq: 4,
          contentHash: 'h4',
          provenance: { source: 'agent' },
          temporal: {}
        })
        .orThrow(),
      body: 'v4'
    };
    expect(isVersionValidAt(noValidAt, 399)).toBe(false);
    expect(isVersionValidAt(noValidAt, 400)).toBe(true);
  });

  test('selectCurrentVersion returns the highest-seq current version', () => {
    expect(selectCurrentVersion([v1, v2])?.envelope.id).toBe('fact-1-v2');
    // A fully-invalidated entity has no current version.
    expect(selectCurrentVersion([v1])).toBeUndefined();
    expect(selectCurrentVersion([])).toBeUndefined();
  });

  test('selectCurrentVersion is order-independent (highest seq wins on an unsorted input)', () => {
    const v3 = versionRecord(3, 300);
    // Descending input: the first candidate is already the max, so a later
    // candidate must NOT displace it.
    expect(selectCurrentVersion([v3, v2])?.envelope.id).toBe('fact-1-v3');
    expect(selectCurrentVersion([v2, v3])?.envelope.id).toBe('fact-1-v3');
  });

  test('selectVersionAsOf returns the highest-seq version valid at the instant', () => {
    expect(selectVersionAsOf([v1, v2], 150)?.envelope.id).toBe('fact-1-v1');
    expect(selectVersionAsOf([v1, v2], 250)?.envelope.id).toBe('fact-1-v2');
    expect(selectVersionAsOf([v1, v2], 50)).toBeUndefined();
  });
});
