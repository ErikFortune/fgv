/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { Result, fail, succeed } from '@fgv/ts-utils';
import {
  HybridRetriever,
  IEdgeTarget,
  IIndexedMemoryRecord,
  IMemoryQuery,
  IMemoryRecord,
  IMemoryRetriever,
  IMemoryRetrieverCapabilities,
  IVectorIndex,
  IVectorQueryHit,
  Kind,
  MemoryId,
  MemoryIndex,
  MemoryScopeKey,
  RecencyRetriever,
  ScoreUnionMergeStrategy,
  SemanticRetriever,
  StructuredFilterRetriever,
  Tag,
  TagRetriever,
  envelopeConverter,
  guardRetrieverCapabilities,
  limitRecords,
  orderingCompare,
  rankCompare,
  recencyCompare
} from '../../../index';

/** A scope-qualified link-traversal seed for the retriever tests. */
function et(id: string, scope: string = 'knowledge'): IEdgeTarget {
  return { scope: scope as MemoryScopeKey, id: id as MemoryId };
}

interface IRecordSpec {
  readonly id: string;
  readonly scope?: string;
  readonly kind?: string;
  readonly tags?: ReadonlyArray<string>;
  readonly updated?: number;
  readonly seq?: number;
  readonly rank?: number;
}

function makeEntry(spec: IRecordSpec): IIndexedMemoryRecord {
  const record: IMemoryRecord<unknown> = {
    envelope: envelopeConverter
      .convert({
        id: spec.id,
        entityId: spec.id,
        kind: spec.kind ?? 'knowledge',
        tags: spec.tags ?? [],
        links: [],
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
  return { scope: (spec.scope ?? 'knowledge') as MemoryScopeKey, record };
}

function buildIndex(specs: ReadonlyArray<IRecordSpec>): MemoryIndex {
  const index = MemoryIndex.create().orThrow();
  index.rebuild(specs.map(makeEntry)).orThrow();
  return index;
}

function ids(records: ReadonlyArray<IMemoryRecord<unknown>>): ReadonlyArray<string> {
  return records.map((r) => r.envelope.id as string);
}

const knowledge: Kind = 'knowledge' as Kind;

describe('retrieve helpers', () => {
  describe('guardRetrieverCapabilities', () => {
    const noCaps = {
      supportsSemanticRecall: false,
      supportsTemporalQuery: false,
      supportsLinkTraversal: false
    };

    test('passes when no unsupported capability is requested', () => {
      expect(guardRetrieverCapabilities({}, noCaps)).toSucceed();
    });

    test('fails loudly when semantic recall is requested but unsupported', () => {
      expect(guardRetrieverCapabilities({ semantic: 'q' }, noCaps)).toFailWith(
        /semantic recall requires a vector index; none configured/i
      );
    });

    test('fails loudly when an as-of query is requested but unsupported', () => {
      expect(guardRetrieverCapabilities({ asOf: 5 }, noCaps)).toFailWith(
        /temporal query requires temporal index; none configured/i
      );
    });

    test('names the kind in the temporal failure when present', () => {
      expect(guardRetrieverCapabilities({ asOf: 5, kind: knowledge }, noCaps)).toFailWith(
        /none configured for kind knowledge/i
      );
    });

    test('fails loudly when a link-traversal axis is requested but unsupported', () => {
      expect(guardRetrieverCapabilities({ linkedTo: et('x') }, noCaps)).toFailWith(
        /link traversal requires a backlink index; none configured/i
      );
      expect(guardRetrieverCapabilities({ linkedFrom: et('x') }, noCaps)).toFailWith(
        /link traversal requires/i
      );
      expect(guardRetrieverCapabilities({ hops: 2 }, noCaps)).toFailWith(/link traversal requires/i);
    });

    test('passes a link-traversal axis when the capability is supported', () => {
      expect(
        guardRetrieverCapabilities({ linkedTo: et('x') }, { ...noCaps, supportsLinkTraversal: true })
      ).toSucceed();
    });
  });

  describe('limitRecords', () => {
    const records = buildIndex([{ id: 'a' }, { id: 'b' }, { id: 'c' }])
      .entries()
      .map((e) => e.record);

    test('returns all records when no limit is supplied', () => {
      expect(limitRecords(records)).toHaveLength(3);
    });

    test('truncates to the top-N for a positive limit', () => {
      expect(limitRecords(records, 2)).toHaveLength(2);
    });

    test('returns an empty array for a zero or negative limit', () => {
      expect(limitRecords(records, 0)).toEqual([]);
      expect(limitRecords(records, -1)).toEqual([]);
    });

    test('an absent offset is a no-op (byte-identical to today) — same reference returned', () => {
      expect(limitRecords(records, undefined, undefined)).toBe(records);
      expect(limitRecords(records, 2, undefined)).toHaveLength(2);
      // A non-positive offset is guarded like a non-positive limit — no skip.
      expect(limitRecords(records, undefined, 0)).toBe(records);
      expect(ids(limitRecords(records, undefined, -5))).toEqual(['a', 'b', 'c']);
    });

    test('offset skips after ordering; { offset, limit } is a stable page window', () => {
      expect(ids(limitRecords(records, undefined, 1))).toEqual(['b', 'c']);
      expect(ids(limitRecords(records, 1, 1))).toEqual(['b']);
      expect(ids(limitRecords(records, 2, 1))).toEqual(['b', 'c']);
    });

    test('an offset past the end yields an empty page (never a throw)', () => {
      expect(limitRecords(records, undefined, 3)).toEqual([]);
      expect(limitRecords(records, 5, 99)).toEqual([]);
    });

    test('a non-positive limit still wins over an offset window', () => {
      expect(limitRecords(records, 0, 1)).toEqual([]);
    });
  });
});

describe('RecencyRetriever', () => {
  test('reports all-false capabilities', () => {
    const r = RecencyRetriever.create(buildIndex([])).orThrow();
    expect(r.capabilities).toEqual({
      supportsSemanticRecall: false,
      supportsTemporalQuery: false,
      supportsLinkTraversal: false
    });
  });

  test('returns every record most-recently-updated first', async () => {
    const r = RecencyRetriever.create(
      buildIndex([
        { id: 'a', updated: 10 },
        { id: 'b', updated: 30 },
        { id: 'c', updated: 20 }
      ])
    ).orThrow();
    expect(await r.retrieve({})).toSucceedAndSatisfy((records: ReadonlyArray<IMemoryRecord<unknown>>) => {
      expect(ids(records)).toEqual(['b', 'c', 'a']);
    });
  });

  test('breaks ties on seq descending', async () => {
    const r = RecencyRetriever.create(
      buildIndex([
        { id: 'a', updated: 10, seq: 1 },
        { id: 'b', updated: 10, seq: 3 },
        { id: 'c', updated: 10, seq: 2 }
      ])
    ).orThrow();
    expect(await r.retrieve({})).toSucceedAndSatisfy((records: ReadonlyArray<IMemoryRecord<unknown>>) => {
      expect(ids(records)).toEqual(['b', 'c', 'a']);
    });
  });

  test('honors scope, kind, tag, predicate, and limit filters', async () => {
    const index = buildIndex([
      { id: 'a', scope: 'knowledge', kind: 'knowledge', tags: ['x'], updated: 50 },
      { id: 'b', scope: 'knowledge', kind: 'knowledge', tags: ['y'], updated: 40 },
      { id: 'c', scope: 'other', kind: 'knowledge', tags: ['x'], updated: 60 },
      { id: 'd', scope: 'knowledge', kind: 'note', tags: ['x'], updated: 70 }
    ]);
    const r = RecencyRetriever.create(index).orThrow();
    expect(
      await r.retrieve({
        scope: 'knowledge' as MemoryScopeKey,
        kind: knowledge,
        tag: 'x' as Tag,
        filter: (rec) => rec.envelope.id !== ('skip' as MemoryId),
        limit: 5
      })
    ).toSucceedAndSatisfy((records: ReadonlyArray<IMemoryRecord<unknown>>) => {
      expect(ids(records)).toEqual(['a']);
    });
  });

  test('limit truncates to the top-N after ordering', async () => {
    const r = RecencyRetriever.create(
      buildIndex([
        { id: 'a', updated: 10 },
        { id: 'b', updated: 30 },
        { id: 'c', updated: 20 }
      ])
    ).orThrow();
    expect(await r.retrieve({ limit: 2 })).toSucceedAndSatisfy(
      (records: ReadonlyArray<IMemoryRecord<unknown>>) => {
        expect(ids(records)).toEqual(['b', 'c']);
      }
    );
  });

  test('degrades loudly on a semantic request', async () => {
    const r = RecencyRetriever.create(buildIndex([{ id: 'a' }])).orThrow();
    expect(await r.retrieve({ semantic: 'hello' })).toFailWith(/semantic recall requires a vector index/i);
  });

  test('degrades loudly on a link-traversal request', async () => {
    const r = RecencyRetriever.create(buildIndex([{ id: 'a' }])).orThrow();
    expect(await r.retrieve({ linkedTo: et('a') })).toFailWith(/link traversal requires/i);
  });
});

describe('orderBy: rank axis', () => {
  const a1 = makeEntry({ id: 'a', rank: 1, updated: 100, seq: 1 }).record;
  const b3 = makeEntry({ id: 'b', rank: 3, updated: 100, seq: 2 }).record;
  const c2 = makeEntry({ id: 'c', rank: 2, updated: 100, seq: 3 }).record;
  const unranked = makeEntry({ id: 'z', updated: 999, seq: 4 }).record;

  describe('rankCompare', () => {
    test('orders by rank descending', () => {
      expect(
        [a1, b3, c2]
          .slice()
          .sort(rankCompare)
          .map((r) => r.envelope.id)
      ).toEqual(['b', 'c', 'a']);
    });

    test('places an absent-rank record last regardless of recency', () => {
      // `unranked` has the newest `updated`, but an absent rank sorts after every ranked record.
      expect(
        [unranked, a1, b3]
          .slice()
          .sort(rankCompare)
          .map((r) => r.envelope.id)
      ).toEqual(['b', 'a', 'z']);
      // Symmetric: absent on the left side of the compare too.
      expect(
        [a1, unranked]
          .slice()
          .sort(rankCompare)
          .map((r) => r.envelope.id)
      ).toEqual(['a', 'z']);
    });

    test('breaks an equal-rank tie by recency', () => {
      const b3b = makeEntry({ id: 'b2', rank: 3, updated: 50, seq: 9 }).record;
      // Equal rank 3 → newer `updated` (b3 at 100) first.
      expect(
        [b3b, b3]
          .slice()
          .sort(rankCompare)
          .map((r) => r.envelope.id)
      ).toEqual(['b', 'b2']);
    });
  });

  describe('orderingCompare', () => {
    test("returns recencyCompare for absent orderBy and 'recency'", () => {
      expect(orderingCompare()).toBe(recencyCompare);
      expect(orderingCompare('recency')).toBe(recencyCompare);
    });

    test("returns rankCompare for 'rank'", () => {
      expect(orderingCompare('rank')).toBe(rankCompare);
    });
  });

  describe.each([
    ['RecencyRetriever', (index: MemoryIndex): IMemoryRetriever => RecencyRetriever.create(index).orThrow()],
    ['TagRetriever', (index: MemoryIndex): IMemoryRetriever => TagRetriever.create(index).orThrow()],
    [
      'StructuredFilterRetriever',
      (index: MemoryIndex): IMemoryRetriever => StructuredFilterRetriever.create(index).orThrow()
    ]
  ])('%s honors orderBy', (name, make) => {
    // Tag / structured-filter need their axis present to return anything.
    const axis: IMemoryQuery =
      name === 'TagRetriever'
        ? { tag: 'x' as Tag }
        : name === 'StructuredFilterRetriever'
        ? { filter: () => true }
        : {};

    function orderedIndex(): MemoryIndex {
      return buildIndex([
        { id: 'a', rank: 1, tags: ['x'], updated: 100, seq: 1 },
        { id: 'b', rank: 3, tags: ['x'], updated: 100, seq: 2 },
        { id: 'c', rank: 2, tags: ['x'], updated: 100, seq: 3 },
        { id: 'z', tags: ['x'], updated: 999, seq: 4 }
      ]);
    }

    test("orderBy 'rank' orders by rank descending, absent last", async () => {
      const r = make(orderedIndex());
      expect(await r.retrieve({ ...axis, orderBy: 'rank' })).toSucceedAndSatisfy(
        (records: ReadonlyArray<IMemoryRecord<unknown>>) => {
          expect(ids(records)).toEqual(['b', 'c', 'a', 'z']);
        }
      );
    });

    test('orderBy absent is unchanged recency order', async () => {
      const r = make(orderedIndex());
      expect(await r.retrieve({ ...axis })).toSucceedAndSatisfy(
        (records: ReadonlyArray<IMemoryRecord<unknown>>) => {
          // `z` has the newest `updated`; the rest tie on `updated` and break by
          // seq descending (c=3, b=2, a=1) — recency order regardless of rank.
          expect(ids(records)).toEqual(['z', 'c', 'b', 'a']);
        }
      );
    });

    test('rank ordering composes with { limit, offset } for a bounded top-M page', async () => {
      const r = make(orderedIndex());
      expect(await r.retrieve({ ...axis, orderBy: 'rank', limit: 1, offset: 1 })).toSucceedAndSatisfy(
        (records: ReadonlyArray<IMemoryRecord<unknown>>) => {
          expect(ids(records)).toEqual(['c']);
        }
      );
    });
  });

  test("HybridRetriever re-orders the merged set by rank for orderBy 'rank'", async () => {
    const index = buildIndex([
      { id: 'a', rank: 1, tags: ['x'], updated: 100, seq: 1 },
      { id: 'b', rank: 3, tags: ['x'], updated: 100, seq: 2 },
      { id: 'c', rank: 2, tags: ['x'], updated: 100, seq: 3 }
    ]);
    const hybrid = HybridRetriever.create(
      [RecencyRetriever.create(index).orThrow(), TagRetriever.create(index).orThrow()],
      ScoreUnionMergeStrategy.create().orThrow()
    ).orThrow();
    expect(await hybrid.retrieve({ tag: 'x' as Tag, orderBy: 'rank' })).toSucceedAndSatisfy(
      (records: ReadonlyArray<IMemoryRecord<unknown>>) => {
        // All three score 2 (surfaced by both children); orderBy rank re-sorts the merge.
        expect(ids(records)).toEqual(['b', 'c', 'a']);
      }
    );
  });

  test("SemanticRetriever preserves vector-similarity order regardless of orderBy 'rank'", async () => {
    const index = buildIndex([
      { id: 'a', rank: 9, updated: 1 },
      { id: 'b', rank: 1, updated: 1 }
    ]);
    const vectorIndex: IVectorIndex = {
      add: (t: IEdgeTarget) => Promise.resolve(succeed(`ref-${t.id}`)),
      remove: (t: IEdgeTarget) => Promise.resolve(succeed(t)),
      query: () =>
        Promise.resolve(
          succeed([
            { target: et('b'), score: 0.9 },
            { target: et('a'), score: 0.5 }
          ])
        )
    };
    const r = SemanticRetriever.create({
      index,
      backend: {
        vectorIndex,
        embedQuery: () => Promise.resolve(succeed(Float32Array.from([0.1])))
      }
    }).orThrow();
    // Even though `a` has the higher rank, semantic keeps the similarity order (b before a).
    expect(await r.retrieve({ semantic: 'q', orderBy: 'rank' })).toSucceedAndSatisfy(
      (records: ReadonlyArray<IMemoryRecord<unknown>>) => {
        expect(ids(records)).toEqual(['b', 'a']);
      }
    );
  });
});

describe('query axes: kinds (kind-set) and offset', () => {
  function multiKindRetriever(): RecencyRetriever {
    return RecencyRetriever.create(
      buildIndex([
        { id: 'k1', kind: 'knowledge', updated: 40 },
        { id: 'n1', kind: 'note', updated: 30 },
        { id: 'e1', kind: 'event', updated: 20 },
        { id: 'k2', kind: 'knowledge', updated: 10 }
      ])
    ).orThrow();
  }

  describe('kinds', () => {
    test("an absent kinds axis imposes no kind constraint (today's behavior)", async () => {
      expect(await multiKindRetriever().retrieve({})).toSucceedAndSatisfy(
        (records: ReadonlyArray<IMemoryRecord<unknown>>) => {
          expect([...ids(records)].sort()).toEqual(['e1', 'k1', 'k2', 'n1']);
        }
      );
    });

    test('restricts to records in ANY of the listed kinds', async () => {
      expect(
        await multiKindRetriever().retrieve({
          kinds: ['knowledge', 'event'] as unknown as ReadonlyArray<Kind>
        })
      ).toSucceedAndSatisfy((records: ReadonlyArray<IMemoryRecord<unknown>>) => {
        expect([...ids(records)].sort()).toEqual(['e1', 'k1', 'k2']);
      });
    });

    test('an explicit empty kinds array matches NOTHING (not match-all)', async () => {
      expect(await multiKindRetriever().retrieve({ kinds: [] })).toSucceedWith([]);
    });

    test('kind and kinds compose as AND (kind must be a member of kinds)', async () => {
      // kind=knowledge AND kinds includes knowledge → knowledge records only.
      expect(
        await multiKindRetriever().retrieve({
          kind: knowledge,
          kinds: ['knowledge', 'note'] as unknown as ReadonlyArray<Kind>
        })
      ).toSucceedAndSatisfy((records: ReadonlyArray<IMemoryRecord<unknown>>) => {
        expect([...ids(records)].sort()).toEqual(['k1', 'k2']);
      });
      // kind=knowledge but kinds excludes knowledge → nothing can satisfy both.
      expect(
        await multiKindRetriever().retrieve({
          kind: knowledge,
          kinds: ['note', 'event'] as unknown as ReadonlyArray<Kind>
        })
      ).toSucceedWith([]);
    });
  });

  describe('offset', () => {
    function ordered(): RecencyRetriever {
      return RecencyRetriever.create(
        buildIndex([
          { id: 'a', updated: 10 },
          { id: 'b', updated: 40 },
          { id: 'c', updated: 30 },
          { id: 'd', updated: 20 }
        ])
      ).orThrow();
    }

    test('skips after ordering, forming a stable { offset, limit } page window', async () => {
      // Recency order is [b, c, d, a].
      expect(await ordered().retrieve({ offset: 1, limit: 2 })).toSucceedAndSatisfy(
        (records: ReadonlyArray<IMemoryRecord<unknown>>) => {
          expect(ids(records)).toEqual(['c', 'd']);
        }
      );
    });

    test('an absent offset is unchanged from today', async () => {
      expect(await ordered().retrieve({ limit: 2 })).toSucceedAndSatisfy(
        (records: ReadonlyArray<IMemoryRecord<unknown>>) => {
          expect(ids(records)).toEqual(['b', 'c']);
        }
      );
    });

    test('an offset past the end yields an empty page', async () => {
      expect(await ordered().retrieve({ offset: 99 })).toSucceedWith([]);
    });

    test('a negative offset does not slip into slice (treated as no skip)', async () => {
      expect(await ordered().retrieve({ offset: -3, limit: 2 })).toSucceedAndSatisfy(
        (records: ReadonlyArray<IMemoryRecord<unknown>>) => {
          expect(ids(records)).toEqual(['b', 'c']);
        }
      );
    });
  });
});

/** A retriever with configurable capabilities that records the query it received. */
class RecordingRetriever implements IMemoryRetriever {
  public lastQuery: IMemoryQuery | undefined;
  public readonly capabilities: IMemoryRetrieverCapabilities;
  public constructor(capabilities: IMemoryRetrieverCapabilities) {
    this.capabilities = capabilities;
  }
  public retrieve(query: IMemoryQuery): Promise<Result<ReadonlyArray<IMemoryRecord<unknown>>>> {
    this.lastQuery = query;
    return Promise.resolve(succeed([]));
  }
}

describe('TagRetriever', () => {
  test('returns records carrying the tag, recency-ordered', async () => {
    const r = TagRetriever.create(
      buildIndex([
        { id: 'a', tags: ['x'], updated: 10 },
        { id: 'b', tags: ['x', 'y'], updated: 30 },
        { id: 'c', tags: ['y'], updated: 20 }
      ])
    ).orThrow();
    expect(await r.retrieve({ tag: 'x' as Tag })).toSucceedAndSatisfy(
      (records: ReadonlyArray<IMemoryRecord<unknown>>) => {
        expect(ids(records)).toEqual(['b', 'a']);
      }
    );
  });

  test('returns empty (not failure) when no tag is supplied', async () => {
    const r = TagRetriever.create(buildIndex([{ id: 'a', tags: ['x'] }])).orThrow();
    expect(await r.retrieve({})).toSucceedWith([]);
  });

  test('degrades loudly on a semantic request', async () => {
    const r = TagRetriever.create(buildIndex([{ id: 'a', tags: ['x'] }])).orThrow();
    expect(await r.retrieve({ tag: 'x' as Tag, semantic: 'q' })).toFailWith(/semantic recall requires/i);
  });
});

describe('StructuredFilterRetriever', () => {
  test('applies the predicate over the scope/kind/tag pre-filter', async () => {
    const r = StructuredFilterRetriever.create(
      buildIndex([
        { id: 'keep-1', updated: 10 },
        { id: 'drop-1', updated: 30 },
        { id: 'keep-2', updated: 20 }
      ])
    ).orThrow();
    expect(
      await r.retrieve({ filter: (rec) => (rec.envelope.id as string).startsWith('keep') })
    ).toSucceedAndSatisfy((records: ReadonlyArray<IMemoryRecord<unknown>>) => {
      expect(ids(records)).toEqual(['keep-2', 'keep-1']);
    });
  });

  test('returns empty (not failure) when no predicate is supplied', async () => {
    const r = StructuredFilterRetriever.create(buildIndex([{ id: 'a' }])).orThrow();
    expect(await r.retrieve({})).toSucceedWith([]);
  });
});

/** A scripted in-memory vector index returning canned hits. */
class FakeVectorIndex implements IVectorIndex {
  private readonly _hits: ReadonlyArray<IVectorQueryHit>;
  private readonly _failQuery: boolean;
  /** The `topK` the most recent `query` call received — asserts forwarding. */
  public lastTopK: number | undefined;
  public constructor(hits: ReadonlyArray<IVectorQueryHit>, failQuery: boolean = false) {
    this._hits = hits;
    this._failQuery = failQuery;
  }
  public add(t: IEdgeTarget): Promise<Result<string>> {
    return Promise.resolve(succeed(`ref-${t.id}`));
  }
  public remove(t: IEdgeTarget): Promise<Result<IEdgeTarget>> {
    return Promise.resolve(succeed(t));
  }
  public query(__vector: Float32Array, topK: number): Promise<Result<ReadonlyArray<IVectorQueryHit>>> {
    this.lastTopK = topK;
    return Promise.resolve(this._failQuery ? fail('vector backend down') : succeed(this._hits));
  }
}

describe('SemanticRetriever', () => {
  const okEmbed = (): Promise<Result<Float32Array>> =>
    Promise.resolve(succeed(Float32Array.from([0.1, 0.2])));

  test('reports supportsSemanticRecall=false when no backend is wired', () => {
    const r = SemanticRetriever.create({ index: buildIndex([]) }).orThrow();
    expect(r.capabilities.supportsSemanticRecall).toBe(false);
  });

  test('reports supportsSemanticRecall=true when a backend is wired', () => {
    const r = SemanticRetriever.create({
      index: buildIndex([]),
      backend: { vectorIndex: new FakeVectorIndex([]), embedQuery: okEmbed }
    }).orThrow();
    expect(r.capabilities.supportsSemanticRecall).toBe(true);
  });

  test('degrades loudly on a semantic request when no backend is wired', async () => {
    const r = SemanticRetriever.create({ index: buildIndex([{ id: 'a' }]) }).orThrow();
    expect(await r.retrieve({ semantic: 'hi' })).toFailWith(
      /semantic recall requires a vector index; none configured/i
    );
  });

  test('returns empty (not failure) when no semantic term is supplied', async () => {
    const r = SemanticRetriever.create({ index: buildIndex([{ id: 'a' }]) }).orThrow();
    expect(await r.retrieve({})).toSucceedWith([]);
  });

  test('degrades loudly on an as-of request', async () => {
    const r = SemanticRetriever.create({ index: buildIndex([{ id: 'a' }]) }).orThrow();
    expect(await r.retrieve({ asOf: 5 })).toFailWith(/temporal query requires temporal index/i);
  });

  test('resolves vector hits back to records in hit order', async () => {
    const index = buildIndex([
      { id: 'a', updated: 1 },
      { id: 'b', updated: 99 },
      { id: 'c', updated: 50 }
    ]);
    const r = SemanticRetriever.create({
      index,
      backend: {
        vectorIndex: new FakeVectorIndex([
          { target: et('b'), score: 0.9 },
          { target: et('a'), score: 0.5 }
        ]),
        embedQuery: okEmbed
      }
    }).orThrow();
    expect(await r.retrieve({ semantic: 'q' })).toSucceedAndSatisfy(
      (records: ReadonlyArray<IMemoryRecord<unknown>>) => {
        // Hit order preserved (b before a), NOT recency order.
        expect(ids(records)).toEqual(['b', 'a']);
      }
    );
  });

  test('drops hits not present in the index and applies query filters', async () => {
    const index = buildIndex([
      { id: 'a', tags: ['x'] },
      { id: 'b', tags: ['y'] }
    ]);
    const r = SemanticRetriever.create({
      index,
      backend: {
        vectorIndex: new FakeVectorIndex([
          { target: et('gone'), score: 0.99 },
          { target: et('b'), score: 0.8 },
          { target: et('a'), score: 0.7 }
        ]),
        embedQuery: okEmbed
      }
    }).orThrow();
    expect(await r.retrieve({ semantic: 'q', tag: 'x' as Tag })).toSucceedAndSatisfy(
      (records: ReadonlyArray<IMemoryRecord<unknown>>) => {
        expect(ids(records)).toEqual(['a']);
      }
    );
  });

  test('forwards topK to the vector index and applies the post-filter limit', async () => {
    const index = buildIndex([{ id: 'a' }, { id: 'b' }, { id: 'c' }]);
    const vectorIndex = new FakeVectorIndex([
      { target: et('a'), score: 0.9 },
      { target: et('b'), score: 0.8 },
      { target: et('c'), score: 0.7 }
    ]);
    const r = SemanticRetriever.create({ index, backend: { vectorIndex, embedQuery: okEmbed } }).orThrow();
    expect(await r.retrieve({ semantic: 'q', topK: 2, limit: 2 })).toSucceedAndSatisfy(
      (records: ReadonlyArray<IMemoryRecord<unknown>>) => {
        expect(ids(records)).toEqual(['a', 'b']);
      }
    );
    // The retriever must forward the caller's topK to the vector backend, not its default.
    expect(vectorIndex.lastTopK).toBe(2);
  });

  test('defaults topK to 10 when the query omits it', async () => {
    const vectorIndex = new FakeVectorIndex([{ target: et('a'), score: 0.9 }]);
    const r = SemanticRetriever.create({
      index: buildIndex([{ id: 'a' }]),
      backend: { vectorIndex, embedQuery: okEmbed }
    }).orThrow();
    expect(await r.retrieve({ semantic: 'q' })).toSucceed();
    expect(vectorIndex.lastTopK).toBe(10);
  });

  test('fails loudly when the embedder fails', async () => {
    const r = SemanticRetriever.create({
      index: buildIndex([{ id: 'a' }]),
      backend: {
        vectorIndex: new FakeVectorIndex([]),
        embedQuery: () => Promise.resolve(fail('no embed model'))
      }
    }).orThrow();
    expect(await r.retrieve({ semantic: 'q' })).toFailWith(/query embedding failed: no embed model/i);
  });

  test('fails loudly when the vector backend fails', async () => {
    const r = SemanticRetriever.create({
      index: buildIndex([{ id: 'a' }]),
      backend: { vectorIndex: new FakeVectorIndex([], true), embedQuery: okEmbed }
    }).orThrow();
    expect(await r.retrieve({ semantic: 'q' })).toFailWith(/vector query failed: vector backend down/i);
  });

  test('normalizes a rejecting embedder into a Failure (never escapes as a rejection)', async () => {
    const r = SemanticRetriever.create({
      index: buildIndex([{ id: 'a' }]),
      backend: {
        vectorIndex: new FakeVectorIndex([]),
        embedQuery: () => Promise.reject(new Error('embedder blew up'))
      }
    }).orThrow();
    expect(await r.retrieve({ semantic: 'q' })).toFailWith(/query embedding failed: .*embedder blew up/i);
  });

  test('normalizes a rejecting vector backend into a Failure', async () => {
    // A vector index whose `query` rejects (throws) rather than returning a fail.
    const rejectingIndex: IVectorIndex = {
      add: (t: IEdgeTarget) => Promise.resolve(succeed(`ref-${t.id}`)),
      remove: (t: IEdgeTarget) => Promise.resolve(succeed(t)),
      query: () => Promise.reject(new Error('socket hangup'))
    };
    const r = SemanticRetriever.create({
      index: buildIndex([{ id: 'a' }]),
      backend: { vectorIndex: rejectingIndex, embedQuery: okEmbed }
    }).orThrow();
    expect(await r.retrieve({ semantic: 'q' })).toFailWith(/vector query failed: .*socket hangup/i);
  });
});

describe('ScoreUnionMergeStrategy', () => {
  test('unions, dedupes by id, and scores by retriever count', () => {
    const strategy = ScoreUnionMergeStrategy.create().orThrow();
    const [a, b, c] = [
      makeEntry({ id: 'a', updated: 10 }).record,
      makeEntry({ id: 'b', updated: 30 }).record,
      makeEntry({ id: 'c', updated: 20 }).record
    ];
    // 'b' appears in two sets (score 2); 'a' and 'c' in one each (score 1) — among
    // score-1 records, recency breaks the tie (c.updated 20 > a.updated 10).
    expect(
      strategy.merge([
        [a, b],
        [b, c]
      ])
    ).toSucceedAndSatisfy((records: ReadonlyArray<IMemoryRecord<unknown>>) => {
      expect(ids(records)).toEqual(['b', 'c', 'a']);
    });
  });

  test('counts an id at most once per result set', () => {
    const strategy = ScoreUnionMergeStrategy.create().orThrow();
    const a = makeEntry({ id: 'a', updated: 10 }).record;
    const b = makeEntry({ id: 'b', updated: 5 }).record;
    // 'a' twice in one set still scores 1; 'b' in two sets scores 2 → b ranks first.
    expect(strategy.merge([[a, a], [b], [b]])).toSucceedAndSatisfy(
      (records: ReadonlyArray<IMemoryRecord<unknown>>) => {
        expect(ids(records)).toEqual(['b', 'a']);
      }
    );
  });
});

describe('HybridRetriever', () => {
  function build(): { index: MemoryIndex } {
    return {
      index: buildIndex([
        { id: 'a', tags: ['x'], updated: 10 },
        { id: 'b', tags: ['y'], updated: 30 },
        { id: 'c', tags: ['x'], updated: 20 }
      ])
    };
  }

  test('requires at least one retriever', () => {
    const strategy = ScoreUnionMergeStrategy.create().orThrow();
    expect(HybridRetriever.create([], strategy)).toFailWith(/at least one retriever is required/i);
  });

  test('capabilities are the union of composed retrievers', () => {
    const { index } = build();
    const recency = RecencyRetriever.create(index).orThrow();
    const semantic = SemanticRetriever.create({
      index,
      backend: {
        vectorIndex: new FakeVectorIndex([]),
        embedQuery: () => Promise.resolve(succeed(Float32Array.from([1])))
      }
    }).orThrow();
    const hybrid = HybridRetriever.create(
      [recency, semantic],
      ScoreUnionMergeStrategy.create().orThrow()
    ).orThrow();
    expect(hybrid.capabilities).toEqual({
      supportsSemanticRecall: true,
      supportsTemporalQuery: false,
      supportsLinkTraversal: false
    });
  });

  test('merges the results of composed retrievers', async () => {
    const { index } = build();
    const recency = RecencyRetriever.create(index).orThrow();
    const tag = TagRetriever.create(index).orThrow();
    const hybrid = HybridRetriever.create(
      [recency, tag],
      ScoreUnionMergeStrategy.create().orThrow()
    ).orThrow();
    // recency returns a,b,c (with tag x filter: a,c); tag x returns a,c. Both
    // surface a & c (score 2), b absent. Use tag:x so recency also filters to x.
    expect(await hybrid.retrieve({ tag: 'x' as Tag })).toSucceedAndSatisfy(
      (records: ReadonlyArray<IMemoryRecord<unknown>>) => {
        expect([...ids(records)].sort()).toEqual(['a', 'c']);
      }
    );
  });

  test('routes a semantic query only to the semantic-capable child', async () => {
    const { index } = build();
    const recency = RecencyRetriever.create(index).orThrow();
    const semantic = SemanticRetriever.create({
      index,
      backend: {
        vectorIndex: new FakeVectorIndex([{ target: et('b'), score: 0.9 }]),
        embedQuery: () => Promise.resolve(succeed(Float32Array.from([1])))
      }
    }).orThrow();
    const hybrid = HybridRetriever.create(
      [recency, semantic],
      ScoreUnionMergeStrategy.create().orThrow()
    ).orThrow();
    // recency (no semantic support) gets the semantic field stripped → returns all
    // three; semantic returns just b. b therefore scores 2 and ranks first.
    expect(await hybrid.retrieve({ semantic: 'q' })).toSucceedAndSatisfy(
      (records: ReadonlyArray<IMemoryRecord<unknown>>) => {
        expect(records[0].envelope.id).toBe('b');
        expect([...ids(records)].sort()).toEqual(['a', 'b', 'c']);
      }
    );
  });

  test('routes link-traversal axes only to the link-capable child', async () => {
    const linkChild = new RecordingRetriever({
      supportsSemanticRecall: false,
      supportsTemporalQuery: false,
      supportsLinkTraversal: true
    });
    const plainChild = new RecordingRetriever({
      supportsSemanticRecall: false,
      supportsTemporalQuery: false,
      supportsLinkTraversal: false
    });
    const hybrid = HybridRetriever.create(
      [linkChild, plainChild],
      ScoreUnionMergeStrategy.create().orThrow()
    ).orThrow();
    expect(hybrid.capabilities.supportsLinkTraversal).toBe(true);
    // Union supports link traversal, so the hybrid does NOT loud-fail.
    expect(await hybrid.retrieve({ linkedTo: et('a'), hops: 2 })).toSucceed();
    // The link-capable child keeps the axes; the plain child has them stripped.
    expect(linkChild.lastQuery?.linkedTo).toEqual(et('a'));
    expect(linkChild.lastQuery?.hops).toBe(2);
    expect(plainChild.lastQuery?.linkedTo).toBeUndefined();
    expect(plainChild.lastQuery?.hops).toBeUndefined();
  });

  test('degrades loudly when its union does not support a requested capability', async () => {
    const { index } = build();
    const recency = RecencyRetriever.create(index).orThrow();
    const hybrid = HybridRetriever.create([recency], ScoreUnionMergeStrategy.create().orThrow()).orThrow();
    expect(await hybrid.retrieve({ semantic: 'q' })).toFailWith(/semantic recall requires/i);
  });

  test('propagates a child failure rather than dropping it silently', async () => {
    const { index } = build();
    const semantic = SemanticRetriever.create({
      index,
      backend: {
        vectorIndex: new FakeVectorIndex([], true),
        embedQuery: () => Promise.resolve(succeed(Float32Array.from([1])))
      }
    }).orThrow();
    const hybrid = HybridRetriever.create([semantic], ScoreUnionMergeStrategy.create().orThrow()).orThrow();
    expect(await hybrid.retrieve({ semantic: 'q' })).toFailWith(/vector query failed/i);
  });

  test('does not pre-truncate child result sets: limit is applied only post-merge', async () => {
    // Recency full order is [d,c,b,a]; semantic surfaces [d,a]. With a correct
    // (post-merge-only) limit, the merge sees BOTH full sets, so d and a each
    // score 2 and the limit-2 result is [d,a]. If the limit leaked into the
    // children, recency would pre-truncate to [d,c] and the result would wrongly
    // be [d,c] — a never reaching the merge to score 2.
    const index = buildIndex([
      { id: 'a', updated: 10 },
      { id: 'b', updated: 20 },
      { id: 'c', updated: 30 },
      { id: 'd', updated: 40 }
    ]);
    const recency = RecencyRetriever.create(index).orThrow();
    const semantic = SemanticRetriever.create({
      index,
      backend: {
        vectorIndex: new FakeVectorIndex([
          { target: et('d'), score: 0.9 },
          { target: et('a'), score: 0.8 }
        ]),
        embedQuery: () => Promise.resolve(succeed(Float32Array.from([1])))
      }
    }).orThrow();
    const hybrid = HybridRetriever.create(
      [recency, semantic],
      ScoreUnionMergeStrategy.create().orThrow()
    ).orThrow();
    expect(await hybrid.retrieve({ semantic: 'q', limit: 2 })).toSucceedAndSatisfy(
      (records: ReadonlyArray<IMemoryRecord<unknown>>) => {
        expect(ids(records)).toEqual(['d', 'a']);
      }
    );
  });

  test('applies the hybrid-level limit after merge', async () => {
    const { index } = build();
    const recency = RecencyRetriever.create(index).orThrow();
    const hybrid = HybridRetriever.create([recency], ScoreUnionMergeStrategy.create().orThrow()).orThrow();
    expect(await hybrid.retrieve({ limit: 1 })).toSucceedAndSatisfy(
      (records: ReadonlyArray<IMemoryRecord<unknown>>) => {
        expect(records).toHaveLength(1);
        expect(records[0].envelope.id).toBe('b');
      }
    );
  });

  test('applies the { offset, limit } window after merge', async () => {
    const { index } = build();
    const recency = RecencyRetriever.create(index).orThrow();
    const hybrid = HybridRetriever.create([recency], ScoreUnionMergeStrategy.create().orThrow()).orThrow();
    // Merged recency order is [b(30), c(20), a(10)]; offset 1 + limit 1 → [c].
    expect(await hybrid.retrieve({ offset: 1, limit: 1 })).toSucceedAndSatisfy(
      (records: ReadonlyArray<IMemoryRecord<unknown>>) => {
        expect(ids(records)).toEqual(['c']);
      }
    );
  });

  test('strips offset from child queries (offset is a post-merge concern)', async () => {
    const child = new RecordingRetriever({
      supportsSemanticRecall: false,
      supportsTemporalQuery: false,
      supportsLinkTraversal: false
    });
    const hybrid = HybridRetriever.create([child], ScoreUnionMergeStrategy.create().orThrow()).orThrow();
    expect(await hybrid.retrieve({ offset: 2, limit: 3 })).toSucceed();
    expect(child.lastQuery?.offset).toBeUndefined();
    expect(child.lastQuery?.limit).toBeUndefined();
  });

  test('passes the kinds axis through to children (a shared pre-filter axis)', async () => {
    const child = new RecordingRetriever({
      supportsSemanticRecall: false,
      supportsTemporalQuery: false,
      supportsLinkTraversal: false
    });
    const hybrid = HybridRetriever.create([child], ScoreUnionMergeStrategy.create().orThrow()).orThrow();
    expect(await hybrid.retrieve({ kinds: ['knowledge'] as unknown as ReadonlyArray<Kind> })).toSucceed();
    expect(child.lastQuery?.kinds).toEqual(['knowledge']);
  });
});
