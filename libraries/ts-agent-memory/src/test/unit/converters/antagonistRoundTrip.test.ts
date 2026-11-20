/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

/**
 * Antagonist torture test — convert/validate round-trip symmetry (target class
 * 7): every OPTIONAL field the envelope/edge/provenance shapes carry must
 * survive a full on-disk round-trip (serialize → YAML text → parse), not just a
 * single `Converter.convert` pass in memory. This exercises the exact path a
 * corrupted or field-dropping serializer/parser pair would break, mirroring the
 * `aiClientToolConfig`/`annotations` field-drop class named in the brief.
 */

import '@fgv/ts-utils-jest';
import { Converters } from '@fgv/ts-utils';
import {
  BodyConverterRegistry,
  IBodyConverterRegistry,
  IMemoryEnvelope,
  parseMemoryFile,
  serializeMemoryFile
} from '../../../index';

const kind = 'note' as IMemoryEnvelope['kind'];

function registry(): IBodyConverterRegistry {
  const reg = BodyConverterRegistry.create().orThrow();
  reg.register(kind, Converters.string);
  return reg;
}

describe('antagonist — full on-disk round-trip preserves every optional field', () => {
  // Wrong impl this catches: a serializer/parser pair where one side silently
  // drops an optional field (the exact class of bug the brief calls out for
  // `aiClientToolConfig`/`annotations`-shaped converters) — e.g. omitting
  // `temporal.invalid_at: null`, an edge's `valid_at`/`invalid_at`/`provenance`,
  // a `null` `embeddingRef`, or a provenance extension key, because the author
  // forgot to thread it through both the YAML emit AND the envelope Converter.
  test('every optional envelope/edge/provenance field set simultaneously survives a full YAML round-trip', () => {
    const envelope: IMemoryEnvelope = {
      id: 'doc-1' as IMemoryEnvelope['id'],
      entityId: 'doc-1' as IMemoryEnvelope['entityId'],
      kind,
      tags: ['t1', 't2'] as unknown as IMemoryEnvelope['tags'],
      links: [
        {
          type: 'rel' as never,
          target: { scope: 'knowledge', id: 'doc-2' } as never,
          confidence: 0.42,
          provenance: { source: 'agent', by: 'curator', extra: { nested: true } },
          valid_at: 111,

          invalid_at: null
        }
      ],
      created: 1000,
      updated: 2000,
      seq: 7,
      contentHash: 'abc123',
      provenance: {
        source: 'host-ingest',
        by: 'erik',
        model: 'gpt-5',
        confidence: 0.87,
        derivedFrom: { scope: 'conversations/c1', id: 'turn-3' } as never,
        // Opaque extension keys (per IProvenance's `[key: string]: unknown` arm).
        sentiment: { score: 0.5 },
        epistemic: 'belief'
      },

      temporal: { valid_at: 500, invalid_at: null },

      embeddingRef: null
    };

    const raw = serializeMemoryFile(envelope, 'the body text').orThrow();
    expect(parseMemoryFile(raw, registry())).toSucceedAndSatisfy((record) => {
      // Deep-equal the ENTIRE envelope, not field-by-field — a partial assertion
      // list is exactly how a single dropped field slips through review.
      expect(record.envelope).toEqual(envelope);
      expect(record.body).toBe('the body text');
    });
  });

  test('an absent temporal/embeddingRef/edge-optionals round-trips to fully absent (no null-vs-undefined drift)', () => {
    const envelope: IMemoryEnvelope = {
      id: 'doc-2' as IMemoryEnvelope['id'],
      entityId: 'doc-2' as IMemoryEnvelope['entityId'],
      kind,
      tags: [],
      links: [{ type: 'rel' as never, target: { scope: 'knowledge', id: 'doc-3' } as never }],
      created: 0,
      updated: 0,
      seq: 0,
      contentHash: '',
      provenance: { source: 'agent' }
    };
    const raw = serializeMemoryFile(envelope, 'body').orThrow();
    expect(parseMemoryFile(raw, registry())).toSucceedAndSatisfy((record) => {
      expect(record.envelope.temporal).toBeUndefined();
      expect(record.envelope.embeddingRef).toBeUndefined();
      expect(record.envelope.links[0].confidence).toBeUndefined();
      expect(record.envelope.links[0].provenance).toBeUndefined();
      expect(record.envelope.links[0].valid_at).toBeUndefined();
      expect(record.envelope.links[0].invalid_at).toBeUndefined();
      expect(record.envelope).toEqual(envelope);
    });
  });
});
