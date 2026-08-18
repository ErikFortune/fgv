/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { Result, fail, succeed, DetailedResult, failWithDetail } from '@fgv/ts-utils';
import {
  EntityId,
  IFragmentQueryOptions,
  IIdentityCodecResult,
  IIdentityResolver,
  Kind,
  FRAGMENT_SEMANTIC_UNWIRED_MESSAGE,
  FragmentSemanticRetriever,
  IEdgeTarget,
  IEmbeddedFragment,
  IFragmentLocator,
  IFragmentVectorIndex,
  IVectorQueryHit,
  MemoryId,
  MemoryScopeKey,
  IFragmentVectorRebuildReport
} from '../../../index';

function target(scope: string, id: string): IEdgeTarget {
  return { scope: scope as MemoryScopeKey, id: id as MemoryId };
}

function loc(start: number, end: number): IFragmentLocator {
  return { start, end };
}

function hit(scope: string, id: string, start: number, end: number, score: number): IVectorQueryHit {
  return { target: target(scope, id), score, locator: loc(start, end) };
}

const okEmbed = (): Promise<Result<Float32Array>> => Promise.resolve(succeed(Float32Array.from([0.1, 0.2])));

/** A scripted fragment index that records the args it was queried with. */
class FakeFragmentIndex implements IFragmentVectorIndex {
  public lastTopK: number | undefined;
  public lastMaxPerRecord: number | undefined;
  public lastOptions: IFragmentQueryOptions | undefined;
  private readonly _hits: ReadonlyArray<IVectorQueryHit>;
  private readonly _fail: boolean;
  public constructor(hits: ReadonlyArray<IVectorQueryHit>, shouldFail: boolean = false) {
    this._hits = hits;
    this._fail = shouldFail;
  }
  public addFragments(
    __t: IEdgeTarget,
    fragments: ReadonlyArray<IEmbeddedFragment>
  ): Promise<Result<number>> {
    return Promise.resolve(succeed(fragments.length));
  }
  public remove(t: IEdgeTarget): Promise<Result<IEdgeTarget>> {
    return Promise.resolve(succeed(t));
  }
  public has(): Promise<Result<boolean>> {
    return Promise.resolve(succeed(false));
  }
  public get recordCount(): number {
    return 0;
  }
  public get fragmentCount(): number {
    return this._hits.length;
  }
  public rebuild(): Promise<DetailedResult<IFragmentVectorRebuildReport, IFragmentVectorRebuildReport>> {
    return Promise.resolve(failWithDetail('not used by the retriever'));
  }
  public query(
    __vector: Float32Array,
    topK: number,
    options?: IFragmentQueryOptions
  ): Promise<Result<ReadonlyArray<IVectorQueryHit>>> {
    this.lastTopK = topK;
    this.lastMaxPerRecord = options?.maxPerRecord;
    this.lastOptions = options;
    return Promise.resolve(this._fail ? fail('fragment backend down') : succeed(this._hits));
  }
}

describe('FragmentSemanticRetriever', () => {
  test('reports supportsFragmentRecall=false when no backend is wired', () => {
    const r = FragmentSemanticRetriever.create({}).orThrow();
    expect(r.capabilities.supportsFragmentRecall).toBe(false);
  });

  test('reports supportsFragmentRecall=true when a backend is wired', () => {
    const r = FragmentSemanticRetriever.create({
      backend: { fragmentIndex: new FakeFragmentIndex([]), embedQuery: okEmbed }
    }).orThrow();
    expect(r.capabilities.supportsFragmentRecall).toBe(true);
  });

  test('degrades loudly when no backend is wired — never a silent empty', async () => {
    const r = FragmentSemanticRetriever.create({}).orThrow();
    expect(await r.retrieve({ semantic: 'hi' })).toFailWith(FRAGMENT_SEMANTIC_UNWIRED_MESSAGE);
  });

  test('returns the per-fragment hits (target + locator + score) in backend order', async () => {
    const hits = [hit('knowledge', 'doc-a', 0, 5, 0.9), hit('knowledge', 'doc-a', 20, 25, 0.4)];
    const r = FragmentSemanticRetriever.create({
      backend: { fragmentIndex: new FakeFragmentIndex(hits), embedQuery: okEmbed }
    }).orThrow();
    expect(await r.retrieve({ semantic: 'q' })).toSucceedAndSatisfy(
      (result: ReadonlyArray<IVectorQueryHit>) => {
        expect(result).toEqual(hits);
        expect(result[0].locator).toEqual(loc(0, 5));
        expect(result[1].locator).toEqual(loc(20, 25));
      }
    );
  });

  test('forwards topK and maxPerRecord to the fragment index', async () => {
    const fragmentIndex = new FakeFragmentIndex([hit('knowledge', 'doc-a', 0, 5, 0.9)]);
    const r = FragmentSemanticRetriever.create({
      backend: { fragmentIndex, embedQuery: okEmbed }
    }).orThrow();
    expect(await r.retrieve({ semantic: 'q', topK: 3, maxPerRecord: 1 })).toSucceed();
    expect(fragmentIndex.lastTopK).toBe(3);
    expect(fragmentIndex.lastMaxPerRecord).toBe(1);
  });

  describe('record narrowing', () => {
    /** A resolver that answers from a fixed table; anything else is a codec miss. */
    function resolver(table: Record<string, IIdentityCodecResult>): IIdentityResolver {
      return {
        resolveIdentity: (kind: Kind, entityId: EntityId): Result<IIdentityCodecResult> => {
          const found = table[`${kind}/${entityId}`];
          return found !== undefined
            ? succeed(found)
            : fail(`no identity codec registered for kind '${kind}'`);
        }
      };
    }

    test('resolves (kind, entityId) through the codec and pushes scope + id at the index', async () => {
      const fragmentIndex = new FakeFragmentIndex([hit('knowledge', 'doc-a', 0, 5, 0.9)]);
      const r = FragmentSemanticRetriever.create({
        backend: { fragmentIndex, embedQuery: okEmbed },
        identityResolver: resolver({
          'knowledge/acme-corp': {
            scope: 'knowledge' as MemoryScopeKey,
            idStem: 'acme-corp',
            isVersioned: false
          }
        })
      }).orThrow();

      expect(
        await r.retrieve({
          semantic: 'q',
          entityId: 'acme-corp' as EntityId,
          kind: 'knowledge' as Kind
        })
      ).toSucceed();
      expect(fragmentIndex.lastOptions?.scope).toBe('knowledge');
      expect(fragmentIndex.lastOptions?.id).toBe('acme-corp');
    });

    test('the same entityId under a different kind resolves to a different scope', async () => {
      // The collision the consumer reported as their NORMAL case: a document named
      // acme-corp and the entity acme-corp coexist. `kind` selects the codec, so the
      // resolution is a function and there is nothing to disambiguate.
      const fragmentIndex = new FakeFragmentIndex([]);
      const r = FragmentSemanticRetriever.create({
        backend: { fragmentIndex, embedQuery: okEmbed },
        identityResolver: resolver({
          'knowledge/acme-corp': {
            scope: 'knowledge' as MemoryScopeKey,
            idStem: 'acme-corp',
            isVersioned: false
          },
          'entity/acme-corp': {
            scope: 'entities' as MemoryScopeKey,
            idStem: 'acme-corp',
            isVersioned: false
          }
        })
      }).orThrow();

      expect(
        await r.retrieve({ semantic: 'q', entityId: 'acme-corp' as EntityId, kind: 'knowledge' as Kind })
      ).toSucceed();
      expect(fragmentIndex.lastOptions?.scope).toBe('knowledge');

      expect(
        await r.retrieve({ semantic: 'q', entityId: 'acme-corp' as EntityId, kind: 'entity' as Kind })
      ).toSucceed();
      expect(fragmentIndex.lastOptions?.scope).toBe('entities');
    });

    test('a versioned kind narrows to the entity subtree and carries NO id', async () => {
      // Every version lives under the entity's own subtree, so omitting `id` is what
      // makes the narrowing mean "this entity" rather than "one of its versions".
      const fragmentIndex = new FakeFragmentIndex([]);
      const r = FragmentSemanticRetriever.create({
        backend: { fragmentIndex, embedQuery: okEmbed },
        identityResolver: resolver({
          'fact/e1': {
            scope: 'mem/entities/e1' as MemoryScopeKey,
            idStem: 'e1',
            isVersioned: true
          }
        })
      }).orThrow();

      expect(
        await r.retrieve({ semantic: 'q', entityId: 'e1' as EntityId, kind: 'fact' as Kind })
      ).toSucceed();
      expect(fragmentIndex.lastOptions?.scope).toBe('mem/entities/e1');
      expect(fragmentIndex.lastOptions?.id).toBeUndefined();
    });

    test('entityId without kind fails loudly rather than searching everything', async () => {
      const fragmentIndex = new FakeFragmentIndex([]);
      const r = FragmentSemanticRetriever.create({
        backend: { fragmentIndex, embedQuery: okEmbed },
        identityResolver: resolver({})
      }).orThrow();
      expect(await r.retrieve({ semantic: 'q', entityId: 'acme-corp' as EntityId })).toFailWith(
        /must be supplied together/i
      );
    });

    test('kind without entityId fails loudly too', async () => {
      const fragmentIndex = new FakeFragmentIndex([]);
      const r = FragmentSemanticRetriever.create({
        backend: { fragmentIndex, embedQuery: okEmbed },
        identityResolver: resolver({})
      }).orThrow();
      expect(await r.retrieve({ semantic: 'q', kind: 'knowledge' as Kind })).toFailWith(
        /must be supplied together/i
      );
    });

    test('a narrowing with no resolver wired fails rather than silently searching globally', async () => {
      const fragmentIndex = new FakeFragmentIndex([]);
      const r = FragmentSemanticRetriever.create({
        backend: { fragmentIndex, embedQuery: okEmbed }
      }).orThrow();
      expect(
        await r.retrieve({ semantic: 'q', entityId: 'acme-corp' as EntityId, kind: 'knowledge' as Kind })
      ).toFailWith(/no identity resolver is wired/i);
    });

    test('an unresolvable identifier fails loudly and never reaches the index', async () => {
      const fragmentIndex = new FakeFragmentIndex([]);
      const r = FragmentSemanticRetriever.create({
        backend: { fragmentIndex, embedQuery: okEmbed },
        identityResolver: resolver({})
      }).orThrow();
      expect(
        await r.retrieve({ semantic: 'q', entityId: 'ghost' as EntityId, kind: 'nope' as Kind })
      ).toFailWith(/cannot resolve 'nope'\/'ghost'.*no identity codec/i);
      expect(fragmentIndex.lastOptions).toBeUndefined();
    });

    test('a bad narrowing costs no embed call — validated before the paid step', async () => {
      // embedQuery is typically a network round trip; the narrowing check is a local
      // Map lookup. A typo'd kind should not bill the caller for an embedding.
      let embedCalls = 0;
      const countingEmbed = (): Promise<Result<Float32Array>> => {
        embedCalls += 1;
        return Promise.resolve(succeed(Float32Array.from([1, 0])));
      };
      const fragmentIndex = new FakeFragmentIndex([]);
      const r = FragmentSemanticRetriever.create({
        backend: { fragmentIndex, embedQuery: countingEmbed },
        identityResolver: resolver({})
      }).orThrow();

      expect(
        await r.retrieve({ semantic: 'q', entityId: 'ghost' as EntityId, kind: 'nope' as Kind })
      ).toFail();
      expect(embedCalls).toBe(0);

      // ...while a well-formed query still embeds exactly once.
      expect(await r.retrieve({ semantic: 'q' })).toSucceed();
      expect(embedCalls).toBe(1);
    });

    test('an unscoped query still passes no scope, and needs no resolver', async () => {
      const fragmentIndex = new FakeFragmentIndex([]);
      const r = FragmentSemanticRetriever.create({
        backend: { fragmentIndex, embedQuery: okEmbed }
      }).orThrow();
      expect(await r.retrieve({ semantic: 'q', maxPerRecord: 2 })).toSucceed();
      expect(fragmentIndex.lastOptions?.scope).toBeUndefined();
      expect(fragmentIndex.lastOptions?.maxPerRecord).toBe(2);
    });
  });

  test('defaults topK to 10 and leaves maxPerRecord undefined when the query omits them', async () => {
    const fragmentIndex = new FakeFragmentIndex([hit('knowledge', 'doc-a', 0, 5, 0.9)]);
    const r = FragmentSemanticRetriever.create({
      backend: { fragmentIndex, embedQuery: okEmbed }
    }).orThrow();
    expect(await r.retrieve({ semantic: 'q' })).toSucceed();
    expect(fragmentIndex.lastTopK).toBe(10);
    expect(fragmentIndex.lastMaxPerRecord).toBeUndefined();
  });

  test('fails loudly when the embedder fails', async () => {
    const r = FragmentSemanticRetriever.create({
      backend: {
        fragmentIndex: new FakeFragmentIndex([]),
        embedQuery: () => Promise.resolve(fail('no embed model'))
      }
    }).orThrow();
    expect(await r.retrieve({ semantic: 'q' })).toFailWith(
      /fragment recall: query embedding failed: no embed model/i
    );
  });

  test('fails loudly when the fragment backend fails', async () => {
    const r = FragmentSemanticRetriever.create({
      backend: { fragmentIndex: new FakeFragmentIndex([], true), embedQuery: okEmbed }
    }).orThrow();
    expect(await r.retrieve({ semantic: 'q' })).toFailWith(
      /fragment recall: fragment query failed: fragment backend down/i
    );
  });

  test('normalizes a rejecting embedder into a Failure (never escapes as a rejection)', async () => {
    const r = FragmentSemanticRetriever.create({
      backend: {
        fragmentIndex: new FakeFragmentIndex([]),
        embedQuery: () => Promise.reject(new Error('embedder blew up'))
      }
    }).orThrow();
    expect(await r.retrieve({ semantic: 'q' })).toFailWith(
      /fragment recall: query embedding failed: .*embedder blew up/i
    );
  });

  test('normalizes a rejecting fragment backend into a Failure', async () => {
    const rejectingIndex: IFragmentVectorIndex = {
      addFragments: (__t: IEdgeTarget, f: ReadonlyArray<IEmbeddedFragment>) =>
        Promise.resolve(succeed(f.length)),
      remove: (t: IEdgeTarget) => Promise.resolve(succeed(t)),
      has: () => Promise.resolve(succeed(false)),
      recordCount: 0,
      fragmentCount: 0,
      rebuild: () => Promise.resolve(failWithDetail('unused')),
      query: () => Promise.reject(new Error('socket hangup'))
    };
    const r = FragmentSemanticRetriever.create({
      backend: { fragmentIndex: rejectingIndex, embedQuery: okEmbed }
    }).orThrow();
    expect(await r.retrieve({ semantic: 'q' })).toFailWith(
      /fragment recall: fragment query failed: .*socket hangup/i
    );
  });
});
