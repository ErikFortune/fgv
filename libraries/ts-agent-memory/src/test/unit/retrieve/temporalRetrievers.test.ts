/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import {
  AsOfRetriever,
  CurrentValidRetriever,
  HistoryRetriever,
  HybridRetriever,
  IIndexedMemoryRecord,
  IMemoryRecord,
  Kind,
  MemoryIndex,
  MemoryScopeKey,
  RecencyRetriever,
  ScoreUnionMergeStrategy,
  envelopeConverter
} from '../../../index';

const factKind: Kind = 'fact' as Kind;

interface IVersionSpec {
  readonly entityId: string;
  readonly seq: number;
  readonly validAt: number;
  // eslint-disable-next-line @rushstack/no-new-null -- invalid_at null is the meaningful still-valid sentinel
  readonly invalidAt?: number | null;
  readonly kind?: string;
}

function versionEntry(spec: IVersionSpec): IIndexedMemoryRecord {
  const temporal: Record<string, unknown> = { valid_at: spec.validAt };
  if (spec.invalidAt !== undefined) {
    temporal.invalid_at = spec.invalidAt;
  }
  const record: IMemoryRecord<unknown> = {
    envelope: envelopeConverter
      .convert({
        id: `${spec.entityId}-v${spec.seq}`,
        entityId: spec.entityId,
        kind: spec.kind ?? 'fact',
        tags: [],
        links: [],
        created: spec.validAt,
        updated: spec.validAt,
        seq: spec.seq,
        contentHash: `h-${spec.entityId}-${spec.seq}`,
        provenance: { source: 'agent' },
        temporal
      })
      .orThrow(),
    body: `${spec.entityId} v${spec.seq}`
  };
  return { scope: `facts/entities/${spec.entityId}` as MemoryScopeKey, record };
}

/** A flat (non-temporal) entry, to prove the temporal retrievers ignore it. */
function flatEntry(id: string): IIndexedMemoryRecord {
  const record: IMemoryRecord<unknown> = {
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
        contentHash: `h-${id}`,
        provenance: { source: 'agent' }
      })
      .orThrow(),
    body: id
  };
  return { scope: 'knowledge' as MemoryScopeKey, record };
}

function ids(records: ReadonlyArray<IMemoryRecord<unknown>>): string[] {
  return records.map((r) => r.envelope.id as string);
}

// fact-1: v1 [100,200), v2 [200,∞) current. fact-2: v1 [150,∞) current. Plus a flat doc.
function buildIndex(): MemoryIndex {
  const index = MemoryIndex.create().orThrow();
  index
    .rebuild([
      versionEntry({ entityId: 'fact-1', seq: 1, validAt: 100, invalidAt: 200 }),
      versionEntry({ entityId: 'fact-1', seq: 2, validAt: 200 }),
      versionEntry({ entityId: 'fact-2', seq: 3, validAt: 150 }),
      flatEntry('doc-a')
    ])
    .orThrow();
  return index;
}

describe('temporal retrievers', () => {
  const index: MemoryIndex = buildIndex();

  describe('CurrentValidRetriever', () => {
    const retriever = CurrentValidRetriever.create(index).orThrow();

    test('declares supportsTemporalQuery', () => {
      expect(retriever.capabilities.supportsTemporalQuery).toBe(true);
    });

    test('returns the current version per temporal entity, ignoring flat records', async () => {
      expect(await retriever.retrieve({})).toSucceedAndSatisfy((records) => {
        expect(ids(records).sort()).toEqual(['fact-1-v2', 'fact-2-v3']);
      });
    });

    test('honors scope / kind pre-filter and limit', async () => {
      expect(await retriever.retrieve({ kind: factKind, limit: 1 })).toSucceedAndSatisfy((records) => {
        expect(records).toHaveLength(1);
      });
    });
  });

  describe('AsOfRetriever', () => {
    const retriever = AsOfRetriever.create(index).orThrow();

    test('empty when no asOf axis is supplied', async () => {
      expect(await retriever.retrieve({})).toSucceedWith([]);
    });

    test('returns the version valid at asOf per entity', async () => {
      expect(await retriever.retrieve({ asOf: 150 })).toSucceedAndSatisfy((records) => {
        // fact-1 v1 valid at 150; fact-2 v1 valid at 150.
        expect(ids(records).sort()).toEqual(['fact-1-v1', 'fact-2-v3']);
      });
      expect(await retriever.retrieve({ asOf: 250 })).toSucceedAndSatisfy((records) => {
        expect(ids(records).sort()).toEqual(['fact-1-v2', 'fact-2-v3']);
      });
      expect(await retriever.retrieve({ asOf: 50 })).toSucceedWith([]);
    });
  });

  describe('HistoryRetriever', () => {
    const retriever = HistoryRetriever.create(index).orThrow();

    test('returns all versions ascending by valid_at', async () => {
      expect(await retriever.retrieve({ kind: factKind })).toSucceedAndSatisfy((records) => {
        expect(ids(records)).toEqual(['fact-1-v1', 'fact-2-v3', 'fact-1-v2']);
      });
    });

    test('applies the limit after ordering', async () => {
      expect(await retriever.retrieve({ kind: factKind, limit: 2 })).toSucceedAndSatisfy((records) => {
        expect(ids(records)).toEqual(['fact-1-v1', 'fact-2-v3']);
      });
    });
  });

  describe('loud-degrade + Hybrid composite', () => {
    test('a non-temporal retriever loud-degrades on an asOf query', async () => {
      const recency = RecencyRetriever.create(index).orThrow();
      expect(await recency.retrieve({ asOf: 150 })).toFailWith(/temporal query requires temporal index/i);
    });

    test('a Hybrid of [Recency, AsOf] lights up temporal recall via the temporal child', async () => {
      const recency = RecencyRetriever.create(index).orThrow();
      const asOf = AsOfRetriever.create(index).orThrow();
      const hybrid = HybridRetriever.create(
        [recency, asOf],
        ScoreUnionMergeStrategy.create().orThrow()
      ).orThrow();
      // The union supports temporal query, so the guard passes; Recency gets asOf
      // stripped (returns everything), AsOf returns the valid-at versions.
      expect(hybrid.capabilities.supportsTemporalQuery).toBe(true);
      expect(await hybrid.retrieve({ asOf: 250, kind: factKind })).toSucceedAndSatisfy((records) => {
        // fact-1-v2 is surfaced by BOTH (recency all + asOf), so it ranks first.
        expect(ids(records)[0]).toBe('fact-1-v2');
        expect(ids(records)).toContain('fact-2-v3');
      });
    });
  });
});
