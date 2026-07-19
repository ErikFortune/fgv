/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { Result, fail, succeed } from '@fgv/ts-utils';
import {
  FRAGMENT_SEMANTIC_UNWIRED_MESSAGE,
  FragmentSemanticRetriever,
  IEdgeTarget,
  IEmbeddedFragment,
  IFragmentLocator,
  IFragmentVectorIndex,
  IVectorQueryHit,
  MemoryId,
  MemoryScopeKey
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
  public query(
    __vector: Float32Array,
    topK: number,
    maxPerRecord?: number
  ): Promise<Result<ReadonlyArray<IVectorQueryHit>>> {
    this.lastTopK = topK;
    this.lastMaxPerRecord = maxPerRecord;
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
