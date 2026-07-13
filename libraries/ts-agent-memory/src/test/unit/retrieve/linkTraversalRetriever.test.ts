/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import {
  IEdgeTarget,
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

const DEFAULT_SCOPE: string = 'experience';

/** A link target authored either as a bare id (same-scope) or an explicit `(scope, id)`. */
type LinkSpec = string | { readonly id: string; readonly scope: string };

interface IEntrySpec {
  readonly id: string;
  readonly scope?: string;
  readonly kind?: string;
  readonly tags?: ReadonlyArray<string>;
  readonly updated?: number;
  readonly seq?: number;
  readonly links?: ReadonlyArray<LinkSpec>;
  readonly rank?: number;
}

/** A scope-qualified traversal seed (defaults to the fixture's default scope). */
function seed(id: string, scope: string = DEFAULT_SCOPE): IEdgeTarget {
  return { scope: scope as MemoryScopeKey, id: id as MemoryId };
}

function makeEntry(spec: IEntrySpec): IIndexedMemoryRecord {
  const scope: string = spec.scope ?? DEFAULT_SCOPE;
  const record: IMemoryRecord<unknown> = {
    envelope: envelopeConverter
      .convert({
        id: spec.id,
        entityId: spec.id,
        kind: spec.kind ?? 'experience',
        tags: spec.tags ?? [],
        // A bare link id defaults its target scope to the source record's own
        // scope (the same-conversation case); an object carries an explicit scope.
        links: (spec.links ?? []).map((l) =>
          typeof l === 'string'
            ? { type: 'rel', target: { scope, id: l } }
            : { type: 'rel', target: { scope: l.scope, id: l.id } }
        ),
        created: 0,
        updated: spec.updated ?? 0,
        seq: spec.seq ?? 0,
        contentHash: 'h',
        ...(spec.rank !== undefined ? { rank: spec.rank } : {}),
        provenance: { source: 'agent' }
      })
      .orThrow(),
    body: `body-${spec.id}`
  };
  return { scope: scope as MemoryScopeKey, record };
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
      expect(await retriever.retrieve({ linkedFrom: seed('a') })).toSucceedAndSatisfy((records) => {
        // Recency-ordered: b (updated 20) before c (updated 10). 'a' (the seed) excluded.
        expect(ids(records)).toEqual(['b', 'c']);
      });
    });

    test('stops at the default single hop (does not reach 2-hop neighbors)', async () => {
      const index = buildIndex([{ id: 'a', links: ['b'] }, { id: 'b', links: ['c'] }, { id: 'c' }]);
      const retriever = LinkTraversalRetriever.create(index).orThrow();
      expect(await retriever.retrieve({ linkedFrom: seed('a') })).toSucceedAndSatisfy((records) => {
        expect(ids(records)).toEqual(['b']);
      });
    });

    test('follows multiple hops when hops is raised', async () => {
      const index = buildIndex([{ id: 'a', links: ['b'] }, { id: 'b', links: ['c'] }, { id: 'c' }]);
      const retriever = LinkTraversalRetriever.create(index).orThrow();
      expect(await retriever.retrieve({ linkedFrom: seed('a'), hops: 2 })).toSucceedAndSatisfy((records) => {
        expect(ids(records).sort()).toEqual(['b', 'c']);
      });
    });
  });

  describe('orderBy axis', () => {
    function seedIndex(): MemoryIndex {
      // Seed 'a' links to three ranked neighbors. `rank` and `updated` are
      // deliberately INVERTED so the rank order (n3,n2,n1) is the exact reverse of
      // the recency order (n1,n2,n3) — proving orderBy actually re-sorts.
      return buildIndex([
        { id: 'a', links: ['n1', 'n3', 'n2'] },
        { id: 'n1', rank: 1, updated: 300, seq: 1 },
        { id: 'n3', rank: 3, updated: 100, seq: 3 },
        { id: 'n2', rank: 2, updated: 200, seq: 2 }
      ]);
    }

    test("orderBy 'rank' orders reached records by rank descending", async () => {
      const retriever = LinkTraversalRetriever.create(seedIndex()).orThrow();
      expect(await retriever.retrieve({ linkedFrom: seed('a'), orderBy: 'rank' })).toSucceedAndSatisfy(
        (records) => {
          expect(ids(records)).toEqual(['n3', 'n2', 'n1']);
        }
      );
    });

    test('orderBy absent is unchanged recency order', async () => {
      const retriever = LinkTraversalRetriever.create(seedIndex()).orThrow();
      expect(await retriever.retrieve({ linkedFrom: seed('a') })).toSucceedAndSatisfy((records) => {
        // Recency: most-recently-updated first → n1(300), n2(200), n3(100).
        expect(ids(records)).toEqual(['n1', 'n2', 'n3']);
      });
    });

    test("orderBy 'rank' composes with { limit, offset }", async () => {
      const retriever = LinkTraversalRetriever.create(seedIndex()).orThrow();
      expect(
        await retriever.retrieve({ linkedFrom: seed('a'), orderBy: 'rank', limit: 1, offset: 1 })
      ).toSucceedAndSatisfy((records) => {
        expect(ids(records)).toEqual(['n2']);
      });
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
      expect(await retriever.retrieve({ linkedTo: seed('target') })).toSucceedAndSatisfy((records) => {
        expect(ids(records)).toEqual(['a', 'b']);
      });
    });
  });

  describe('cycle safety', () => {
    test('terminates on a self-loop and excludes the seed', async () => {
      const index = buildIndex([{ id: 'a', links: ['a'] }]);
      const retriever = LinkTraversalRetriever.create(index).orThrow();
      expect(await retriever.retrieve({ linkedFrom: seed('a'), hops: 5 })).toSucceedAndSatisfy((records) => {
        expect(records).toHaveLength(0);
      });
    });

    test('terminates on a multi-hop cycle without revisiting', async () => {
      const index = buildIndex([
        { id: 'a', links: ['b'] },
        { id: 'b', links: ['c'] },
        { id: 'c', links: ['a'] }
      ]);
      const retriever = LinkTraversalRetriever.create(index).orThrow();
      expect(await retriever.retrieve({ linkedFrom: seed('a'), hops: 10 })).toSucceedAndSatisfy((records) => {
        // a→b→c→a: reaches b and c, then the edge back to the seed is pruned.
        expect(ids(records).sort()).toEqual(['b', 'c']);
      });
    });
  });

  test('traverses a cross-kind edge (experience derivedFrom a knowledge doc)', async () => {
    const index = buildIndex([
      {
        id: 'turn-5',
        scope: 'conversations/conv-1',
        kind: 'summarized-turn',
        links: [{ id: 'doc-1', scope: 'knowledge' }]
      },
      { id: 'doc-1', scope: 'knowledge', kind: 'knowledge' }
    ]);
    const retriever = LinkTraversalRetriever.create(index).orThrow();
    expect(
      await retriever.retrieve({ linkedFrom: seed('turn-5', 'conversations/conv-1') })
    ).toSucceedAndSatisfy((records) => {
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
        await retriever.retrieve({ linkedFrom: seed('a'), kind: 'keep' as unknown as Kind })
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
      expect(await retriever.retrieve({ linkedFrom: seed('a'), limit: 2 })).toSucceedAndSatisfy((records) => {
        expect(ids(records)).toEqual(['b', 'c']);
      });
    });

    test('returns empty when the seed is not in the index', async () => {
      const index = buildIndex([{ id: 'a', links: ['b'] }, { id: 'b' }]);
      const retriever = LinkTraversalRetriever.create(index).orThrow();
      expect(await retriever.retrieve({ linkedFrom: seed('missing') })).toSucceedWith([]);
    });

    test('reaches ONLY the same-scope target when an id is reused across scopes', async () => {
      // 'seed' (scope a) links a bare 'dup' → the edge target is {scope a, id dup}.
      // Two records share the stem 'dup' (scopes a and b); the scoped edge must
      // reach ONLY dup@a, never dup@b — the whole point of scope-qualified targets.
      const index = buildIndex([
        { id: 'seed', scope: 'a', links: ['dup'] },
        { id: 'dup', scope: 'a', tags: ['in-a'] },
        { id: 'dup', scope: 'b', tags: ['in-b'] }
      ]);
      const retriever = LinkTraversalRetriever.create(index).orThrow();
      expect(await retriever.retrieve({ linkedFrom: seed('seed', 'a') })).toSucceedAndSatisfy((records) => {
        expect(records).toHaveLength(1);
        expect(records[0].envelope.tags).toEqual(['in-a']);
      });
    });

    test('an explicit cross-scope edge reaches the other scope', async () => {
      // The same fixture, but the edge names dup@b explicitly → traversal follows
      // it to the b-scope record, proving explicit scope is honored verbatim.
      const index = buildIndex([
        { id: 'seed', scope: 'a', links: [{ id: 'dup', scope: 'b' }] },
        { id: 'dup', scope: 'a', tags: ['in-a'] },
        { id: 'dup', scope: 'b', tags: ['in-b'] }
      ]);
      const retriever = LinkTraversalRetriever.create(index).orThrow();
      expect(await retriever.retrieve({ linkedFrom: seed('seed', 'a') })).toSucceedAndSatisfy((records) => {
        expect(records).toHaveLength(1);
        expect(records[0].envelope.tags).toEqual(['in-b']);
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
    expect(await retriever.retrieve({ linkedFrom: seed('a') })).toSucceed();
  });
});
