/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import {
  IIndexedMemoryRecord,
  IMemoryRecord,
  Kind,
  LinkTraversalRetriever,
  LINK_TRAVERSAL_NO_SEED_MESSAGE,
  LINK_TRAVERSAL_UNWIRED_MESSAGE,
  MemoryId,
  MemoryIndex,
  MemoryScopeKey,
  envelopeConverter
} from '../../../index';

interface IEntrySpec {
  readonly id: string;
  readonly scope?: string;
  readonly kind?: string;
  readonly tags?: ReadonlyArray<string>;
  readonly updated?: number;
  readonly seq?: number;
  readonly links?: ReadonlyArray<string>;
}

function makeEntry(spec: IEntrySpec): IIndexedMemoryRecord {
  const record: IMemoryRecord<unknown> = {
    envelope: envelopeConverter
      .convert({
        id: spec.id,
        entityId: spec.id,
        kind: spec.kind ?? 'experience',
        tags: spec.tags ?? [],
        links: (spec.links ?? []).map((target) => ({ type: 'rel', target })),
        created: 0,
        updated: spec.updated ?? 0,
        seq: spec.seq ?? 0,
        contentHash: 'h',
        provenance: { source: 'agent' }
      })
      .orThrow(),
    body: `body-${spec.id}`
  };
  return { scope: (spec.scope ?? 'experience') as MemoryScopeKey, record };
}

function buildIndex(specs: ReadonlyArray<IEntrySpec>): MemoryIndex {
  const index = MemoryIndex.create().orThrow();
  index.rebuild(specs.map(makeEntry)).orThrow();
  return index;
}

function ids(records: ReadonlyArray<IMemoryRecord<unknown>>): string[] {
  return records.map((r) => r.envelope.id as string);
}

describe('LinkTraversalRetriever', () => {
  test('reports the link-traversal capability', () => {
    const index = buildIndex([]);
    const retriever = LinkTraversalRetriever.create(index).orThrow();
    expect(retriever.capabilities).toEqual({
      supportsSemanticRecall: false,
      supportsTemporalQuery: false,
      supportsLinkTraversal: true
    });
  });

  describe('outbound traversal (linkedFrom)', () => {
    test('returns the direct outbound neighbors at the default single hop', async () => {
      const index = buildIndex([
        { id: 'a', links: ['b', 'c'] },
        { id: 'b', updated: 20 },
        { id: 'c', updated: 10 }
      ]);
      const retriever = LinkTraversalRetriever.create(index).orThrow();
      expect(await retriever.retrieve({ linkedFrom: 'a' as MemoryId })).toSucceedAndSatisfy((records) => {
        // Recency-ordered: b (updated 20) before c (updated 10). 'a' (the seed) excluded.
        expect(ids(records)).toEqual(['b', 'c']);
      });
    });

    test('stops at the default single hop (does not reach 2-hop neighbors)', async () => {
      const index = buildIndex([{ id: 'a', links: ['b'] }, { id: 'b', links: ['c'] }, { id: 'c' }]);
      const retriever = LinkTraversalRetriever.create(index).orThrow();
      expect(await retriever.retrieve({ linkedFrom: 'a' as MemoryId })).toSucceedAndSatisfy((records) => {
        expect(ids(records)).toEqual(['b']);
      });
    });

    test('follows multiple hops when hops is raised', async () => {
      const index = buildIndex([{ id: 'a', links: ['b'] }, { id: 'b', links: ['c'] }, { id: 'c' }]);
      const retriever = LinkTraversalRetriever.create(index).orThrow();
      expect(await retriever.retrieve({ linkedFrom: 'a' as MemoryId, hops: 2 })).toSucceedAndSatisfy(
        (records) => {
          expect(ids(records).sort()).toEqual(['b', 'c']);
        }
      );
    });
  });

  describe('inbound traversal (linkedTo)', () => {
    test('returns the records whose edges point at the seed (backlinks)', async () => {
      const index = buildIndex([
        { id: 'a', links: ['target'], updated: 30 },
        { id: 'b', links: ['target'], updated: 10 },
        { id: 'target' }
      ]);
      const retriever = LinkTraversalRetriever.create(index).orThrow();
      expect(await retriever.retrieve({ linkedTo: 'target' as MemoryId })).toSucceedAndSatisfy((records) => {
        expect(ids(records)).toEqual(['a', 'b']);
      });
    });
  });

  describe('cycle safety', () => {
    test('terminates on a self-loop and excludes the seed', async () => {
      const index = buildIndex([{ id: 'a', links: ['a'] }]);
      const retriever = LinkTraversalRetriever.create(index).orThrow();
      expect(await retriever.retrieve({ linkedFrom: 'a' as MemoryId, hops: 5 })).toSucceedAndSatisfy(
        (records) => {
          expect(records).toHaveLength(0);
        }
      );
    });

    test('terminates on a multi-hop cycle without revisiting', async () => {
      const index = buildIndex([
        { id: 'a', links: ['b'] },
        { id: 'b', links: ['c'] },
        { id: 'c', links: ['a'] }
      ]);
      const retriever = LinkTraversalRetriever.create(index).orThrow();
      expect(await retriever.retrieve({ linkedFrom: 'a' as MemoryId, hops: 10 })).toSucceedAndSatisfy(
        (records) => {
          // a→b→c→a: reaches b and c, then the edge back to the seed is pruned.
          expect(ids(records).sort()).toEqual(['b', 'c']);
        }
      );
    });
  });

  test('traverses a cross-kind edge (experience derivedFrom a knowledge doc)', async () => {
    const index = buildIndex([
      { id: 'turn-5', scope: 'conversations/conv-1', kind: 'summarized-turn', links: ['doc-1'] },
      { id: 'doc-1', scope: 'knowledge', kind: 'knowledge' }
    ]);
    const retriever = LinkTraversalRetriever.create(index).orThrow();
    expect(await retriever.retrieve({ linkedFrom: 'turn-5' as MemoryId })).toSucceedAndSatisfy((records) => {
      expect(ids(records)).toEqual(['doc-1']);
      expect(records[0].envelope.kind).toBe('knowledge');
    });
  });

  describe('post-filtering and bounds', () => {
    test('applies the kind pre-filter to the reached records', async () => {
      const index = buildIndex([
        { id: 'a', links: ['b', 'c'] },
        { id: 'b', kind: 'keep' },
        { id: 'c', kind: 'drop' }
      ]);
      const retriever = LinkTraversalRetriever.create(index).orThrow();
      expect(
        await retriever.retrieve({ linkedFrom: 'a' as MemoryId, kind: 'keep' as unknown as Kind })
      ).toSucceedAndSatisfy((records) => {
        expect(ids(records)).toEqual(['b']);
      });
    });

    test('applies the limit after ordering', async () => {
      const index = buildIndex([
        { id: 'a', links: ['b', 'c', 'd'] },
        { id: 'b', updated: 30 },
        { id: 'c', updated: 20 },
        { id: 'd', updated: 10 }
      ]);
      const retriever = LinkTraversalRetriever.create(index).orThrow();
      expect(await retriever.retrieve({ linkedFrom: 'a' as MemoryId, limit: 2 })).toSucceedAndSatisfy(
        (records) => {
          expect(ids(records)).toEqual(['b', 'c']);
        }
      );
    });

    test('returns empty when the seed is not in the index', async () => {
      const index = buildIndex([{ id: 'a', links: ['b'] }, { id: 'b' }]);
      const retriever = LinkTraversalRetriever.create(index).orThrow();
      expect(await retriever.retrieve({ linkedFrom: 'missing' as MemoryId })).toSucceedWith([]);
    });

    test('resolves every record sharing a reached id (cross-scope id reuse)', async () => {
      const index = buildIndex([
        { id: 'seed', scope: 'a', links: ['dup'] },
        { id: 'dup', scope: 'a' },
        { id: 'dup', scope: 'b' }
      ]);
      const retriever = LinkTraversalRetriever.create(index).orThrow();
      expect(await retriever.retrieve({ linkedFrom: 'seed' as MemoryId })).toSucceedAndSatisfy((records) => {
        expect(records).toHaveLength(2);
        expect(ids(records)).toEqual(['dup', 'dup']);
      });
    });
  });

  describe('loud degradation', () => {
    test('fails when no seed (linkedFrom / linkedTo) is supplied', async () => {
      const index = buildIndex([{ id: 'a' }]);
      const retriever = LinkTraversalRetriever.create(index).orThrow();
      expect(await retriever.retrieve({ hops: 2 })).toFailWith(LINK_TRAVERSAL_NO_SEED_MESSAGE);
    });
  });
});

describe('LINK_TRAVERSAL_UNWIRED_MESSAGE constant', () => {
  test('has the stable public message non-link retrievers use to degrade loudly', () => {
    // The link-traversal retriever supports the axis, so it never emits this
    // message; the constant is the shared one the non-link v1 retrievers raise
    // (asserted here to keep the public string stable).
    expect(LINK_TRAVERSAL_UNWIRED_MESSAGE).toMatch(/link traversal requires a backlink index/i);
  });

  test('a link query against the link-capable retriever still succeeds', async () => {
    const index = buildIndex([{ id: 'a', links: ['b'] }, { id: 'b' }]);
    const retriever = LinkTraversalRetriever.create(index).orThrow();
    expect(await retriever.retrieve({ linkedFrom: 'a' as MemoryId })).toSucceed();
  });
});
