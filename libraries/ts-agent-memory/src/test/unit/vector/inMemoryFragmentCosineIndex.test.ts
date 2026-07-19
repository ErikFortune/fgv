/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { Result, fail, succeed } from '@fgv/ts-utils';
import {
  IEdgeTarget,
  IEmbeddedFragment,
  IFragmentLocator,
  IMemoryRecord,
  IMemoryRecordSource,
  IScopedMemoryRecord,
  IVectorQueryHit,
  InMemoryFragmentCosineIndex,
  MemoryId,
  MemoryScopeKey
} from '../../../index';

/** A scope-qualified target from a `(scope, id)` pair. */
function target(scope: string, id: string): IEdgeTarget {
  return { scope: scope as MemoryScopeKey, id: id as MemoryId };
}

/** A locator over an arbitrary `[start, end)` span (opaque to the index). */
function loc(start: number, end: number): IFragmentLocator {
  return { start, end };
}

/** An embedded fragment from a locator + a raw vector. */
function frag(start: number, end: number, vector: number[]): IEmbeddedFragment {
  return { locator: loc(start, end), vector: Float32Array.from(vector) };
}

/** A trivial record carrying just the id + a marker body, for rebuild tests. */
function record(id: string, body: string = `body-${id}`): IMemoryRecord<unknown> {
  return {
    envelope: { id: id as MemoryId } as IMemoryRecord<unknown>['envelope'],
    body
  };
}

/** A scope-qualified record entry for a rebuild source. */
function scoped(scope: string, id: string, body?: string): IScopedMemoryRecord {
  return { target: target(scope, id), record: record(id, body) };
}

/** A scripted record source for `rebuild`. */
class FakeSource implements IMemoryRecordSource {
  private readonly _result: Result<ReadonlyArray<IScopedMemoryRecord>>;
  public constructor(result: Result<ReadonlyArray<IScopedMemoryRecord>>) {
    this._result = result;
  }
  public list(): Promise<Result<ReadonlyArray<IScopedMemoryRecord>>> {
    return Promise.resolve(this._result);
  }
}

describe('InMemoryFragmentCosineIndex', () => {
  describe('addFragments', () => {
    test('stores every fragment and reports the count; tracks record/fragment counts', async () => {
      const index = InMemoryFragmentCosineIndex.create().orThrow();
      expect(index.recordCount).toBe(0);
      expect(index.fragmentCount).toBe(0);
      const t = target('knowledge', 'doc-1');
      expect(await index.addFragments(t, [frag(0, 5, [1, 0]), frag(5, 10, [0, 1])])).toSucceedWith(2);
      expect(index.recordCount).toBe(1);
      expect(index.fragmentCount).toBe(2);
    });

    test('whole-record replace — a second addFragments drops the prior fragments', async () => {
      const index = InMemoryFragmentCosineIndex.create().orThrow();
      const t = target('knowledge', 'doc-1');
      expect(await index.addFragments(t, [frag(0, 5, [1, 0]), frag(5, 10, [0, 1])])).toSucceedWith(2);
      // Re-author with a single fragment: the old two must be gone.
      expect(await index.addFragments(t, [frag(0, 3, [1, 1])])).toSucceedWith(1);
      expect(index.recordCount).toBe(1);
      expect(index.fragmentCount).toBe(1);
      expect(await index.query(Float32Array.from([1, 1]), 5)).toSucceedAndSatisfy(
        (hits: ReadonlyArray<IVectorQueryHit>) => {
          expect(hits).toHaveLength(1);
          expect(hits[0].locator).toEqual(loc(0, 3));
        }
      );
    });

    test('an empty fragments array drops the record entirely', async () => {
      const index = InMemoryFragmentCosineIndex.create().orThrow();
      const t = target('knowledge', 'doc-1');
      expect(await index.addFragments(t, [frag(0, 5, [1, 0])])).toSucceedWith(1);
      expect(await index.addFragments(t, [])).toSucceedWith(0);
      expect(index.recordCount).toBe(0);
      expect(index.fragmentCount).toBe(0);
    });

    test('same stem in different scopes are distinct entries', async () => {
      const index = InMemoryFragmentCosineIndex.create().orThrow();
      const a = target('conv-a', 'turn-3');
      const b = target('conv-b', 'turn-3');
      expect(await index.addFragments(a, [frag(0, 5, [1, 0])])).toSucceedWith(1);
      expect(await index.addFragments(b, [frag(0, 5, [0, 1])])).toSucceedWith(1);
      expect(index.recordCount).toBe(2);
      expect(await index.query(Float32Array.from([1, 1]), 5)).toSucceedAndSatisfy(
        (hits: ReadonlyArray<IVectorQueryHit>) => {
          expect(hits).toHaveLength(2);
          expect(hits.map((h) => h.target)).toEqual(expect.arrayContaining([a, b]));
        }
      );
    });

    test('fails loudly on an empty fragment vector — and does not partially store', async () => {
      const index = InMemoryFragmentCosineIndex.create().orThrow();
      const t = target('knowledge', 'doc-1');
      // First fragment is fine, second is empty: whole-record-replace must be all-or-nothing.
      expect(await index.addFragments(t, [frag(0, 5, [1, 0]), frag(5, 10, [])])).toFailWith(
        /empty fragment vector/i
      );
      expect(index.recordCount).toBe(0);
      expect(index.fragmentCount).toBe(0);
    });

    test('fails loudly on a fragment-dimension mismatch against the established dimension', async () => {
      const index = InMemoryFragmentCosineIndex.create().orThrow();
      expect(await index.addFragments(target('knowledge', 'a'), [frag(0, 5, [1, 0])])).toSucceed();
      expect(await index.addFragments(target('knowledge', 'b'), [frag(0, 5, [1, 0, 0])])).toFailWith(
        /fragment dimension 3 does not match index dimension 2/i
      );
    });

    test('a failed multi-fragment add on a fresh index does not establish a dimension (all-or-nothing)', async () => {
      const index = InMemoryFragmentCosineIndex.create().orThrow();
      // Batch: first fragment (dim 2) would set the dimension, second (dim 3) fails
      // the check. The failed add must leave the index wholly dimensionless — not
      // half-committed to dim 2 — so a later legitimate dim-3 add still succeeds.
      expect(
        await index.addFragments(target('knowledge', 'doc-1'), [frag(0, 5, [1, 0]), frag(5, 10, [1, 0, 0])])
      ).toFailWith(/fragment dimension 3 does not match index dimension 2/i);
      expect(index.recordCount).toBe(0);
      expect(index.fragmentCount).toBe(0);
      // The dimension was never committed: a fresh dim-3 record indexes cleanly.
      expect(await index.addFragments(target('knowledge', 'doc-2'), [frag(0, 5, [1, 0, 0])])).toSucceedWith(
        1
      );
      expect(await index.query(Float32Array.from([1, 0, 0]), 1)).toSucceedAndSatisfy(
        (hits: ReadonlyArray<IVectorQueryHit>) => {
          expect(hits[0].target.id).toBe('doc-2');
          expect(hits[0].score).toBeCloseTo(1);
        }
      );
    });

    test('stores a defensive copy — mutating the caller buffer after add does not corrupt the index', async () => {
      const index = InMemoryFragmentCosineIndex.create().orThrow();
      const buffer = Float32Array.from([1, 0]);
      (
        await index.addFragments(target('knowledge', 'doc-1'), [{ locator: loc(0, 5), vector: buffer }])
      ).orThrow();
      buffer[0] = 0;
      buffer[1] = 1;
      expect(await index.query(Float32Array.from([1, 0]), 1)).toSucceedAndSatisfy(
        (hits: ReadonlyArray<IVectorQueryHit>) => {
          expect(hits[0].score).toBeCloseTo(1);
        }
      );
    });
  });

  describe('query', () => {
    async function seeded(): Promise<InMemoryFragmentCosineIndex> {
      const index = InMemoryFragmentCosineIndex.create().orThrow();
      (
        await index.addFragments(target('knowledge', 'doc-a'), [frag(0, 5, [1, 0]), frag(5, 10, [0, 1])])
      ).orThrow();
      (await index.addFragments(target('knowledge', 'doc-b'), [frag(0, 5, [1, 1])])).orThrow();
      return index;
    }

    test('returns fragment hits in descending cosine-similarity order, each carrying its locator', async () => {
      const index = await seeded();
      expect(await index.query(Float32Array.from([1, 0]), 3)).toSucceedAndSatisfy(
        (hits: ReadonlyArray<IVectorQueryHit>) => {
          // doc-a[0,5] matches [1,0] best (score 1), then doc-b (1/sqrt2), then doc-a[5,10] (0).
          expect(hits[0].target.id).toBe('doc-a');
          expect(hits[0].locator).toEqual(loc(0, 5));
          expect(hits[0].score).toBeCloseTo(1);
          expect(hits[1].target.id).toBe('doc-b');
          expect(hits[1].score).toBeCloseTo(1 / Math.sqrt(2));
          expect(hits[2].target.id).toBe('doc-a');
          expect(hits[2].locator).toEqual(loc(5, 10));
          expect(hits[2].score).toBeCloseTo(0);
        }
      );
    });

    test('truncates to topK', async () => {
      const index = await seeded();
      expect(await index.query(Float32Array.from([1, 0]), 2)).toSucceedAndSatisfy(
        (hits: ReadonlyArray<IVectorQueryHit>) => {
          expect(hits).toHaveLength(2);
          expect(hits.map((h) => h.locator)).toEqual([loc(0, 5), loc(0, 5)]);
          expect(hits[0].target.id).toBe('doc-a');
          expect(hits[1].target.id).toBe('doc-b');
        }
      );
    });

    test('maxPerRecord caps fragments per record during selection (before the topK cut)', async () => {
      const index = InMemoryFragmentCosineIndex.create().orThrow();
      // doc-a has three fragments that all beat doc-b's single fragment.
      (
        await index.addFragments(target('knowledge', 'doc-a'), [
          frag(0, 5, [1, 0]),
          frag(5, 10, [0.9, 0.1]),
          frag(10, 15, [0.8, 0.2])
        ])
      ).orThrow();
      (await index.addFragments(target('knowledge', 'doc-b'), [frag(0, 5, [0.7, 0.3])])).orThrow();
      // Without a cap, top-2 would be doc-a twice. With maxPerRecord=1, doc-b surfaces.
      expect(await index.query(Float32Array.from([1, 0]), 2, 1)).toSucceedAndSatisfy(
        (hits: ReadonlyArray<IVectorQueryHit>) => {
          expect(hits).toHaveLength(2);
          expect(hits.map((h) => h.target.id)).toEqual(['doc-a', 'doc-b']);
          expect(hits[0].locator).toEqual(loc(0, 5));
        }
      );
    });

    test('maxPerRecord=0 yields no hits', async () => {
      const index = await seeded();
      expect(await index.query(Float32Array.from([1, 0]), 5, 0)).toSucceedWith([]);
    });

    test('maxPerRecord larger than any record leaves the ranking unchanged', async () => {
      const index = await seeded();
      expect(await index.query(Float32Array.from([1, 0]), 5, 10)).toSucceedAndSatisfy(
        (hits: ReadonlyArray<IVectorQueryHit>) => {
          expect(hits).toHaveLength(3);
          expect(hits[0].target.id).toBe('doc-a');
        }
      );
    });

    test('returns empty for a non-positive topK', async () => {
      const index = await seeded();
      expect(await index.query(Float32Array.from([1, 0]), 0)).toSucceedWith([]);
      expect(await index.query(Float32Array.from([1, 0]), -1)).toSucceedWith([]);
    });

    test('returns empty when the index is empty (no dimension check)', async () => {
      const index = InMemoryFragmentCosineIndex.create().orThrow();
      expect(await index.query(Float32Array.from([1, 2, 3, 4]), 5)).toSucceedWith([]);
    });

    test('fails loudly on a query-dimension mismatch', async () => {
      const index = await seeded();
      expect(await index.query(Float32Array.from([1, 0, 0]), 3)).toFailWith(
        /query dimension 3 does not match index dimension 2/i
      );
    });

    test('scores a degenerate (zero-magnitude) stored fragment as 0 rather than NaN', async () => {
      const index = InMemoryFragmentCosineIndex.create().orThrow();
      (
        await index.addFragments(target('knowledge', 'doc'), [frag(0, 5, [0, 0]), frag(5, 10, [1, 0])])
      ).orThrow();
      expect(await index.query(Float32Array.from([1, 0]), 2)).toSucceedAndSatisfy(
        (hits: ReadonlyArray<IVectorQueryHit>) => {
          expect(hits.map((h) => h.locator)).toEqual([loc(5, 10), loc(0, 5)]);
          expect(hits[1].score).toBe(0);
        }
      );
    });

    test('scores against a degenerate (zero-magnitude) query as 0 rather than NaN', async () => {
      const index = InMemoryFragmentCosineIndex.create().orThrow();
      (await index.addFragments(target('knowledge', 'doc'), [frag(0, 5, [1, 0])])).orThrow();
      expect(await index.query(Float32Array.from([0, 0]), 1)).toSucceedAndSatisfy(
        (hits: ReadonlyArray<IVectorQueryHit>) => {
          expect(hits[0].score).toBe(0);
        }
      );
    });
  });

  describe('remove', () => {
    test('removes every fragment of a record and is reflected in subsequent queries', async () => {
      const index = InMemoryFragmentCosineIndex.create().orThrow();
      const a = target('knowledge', 'doc-a');
      const b = target('knowledge', 'doc-b');
      (await index.addFragments(a, [frag(0, 5, [1, 0]), frag(5, 10, [1, 0])])).orThrow();
      (await index.addFragments(b, [frag(0, 5, [0, 1])])).orThrow();
      expect(await index.remove(a)).toSucceedWith(a);
      expect(index.recordCount).toBe(1);
      expect(index.fragmentCount).toBe(1);
      expect(await index.query(Float32Array.from([1, 0]), 5)).toSucceedAndSatisfy(
        (hits: ReadonlyArray<IVectorQueryHit>) => {
          expect(hits.map((h) => h.target.id)).toEqual(['doc-b']);
        }
      );
    });

    test('removes only the scoped target — a same-stem record in another scope is left intact', async () => {
      const index = InMemoryFragmentCosineIndex.create().orThrow();
      const a = target('conv-a', 'turn-3');
      const b = target('conv-b', 'turn-3');
      (await index.addFragments(a, [frag(0, 5, [1, 0])])).orThrow();
      (await index.addFragments(b, [frag(0, 5, [0, 1])])).orThrow();
      expect(await index.remove(a)).toSucceedWith(a);
      expect(index.recordCount).toBe(1);
      expect(await index.query(Float32Array.from([0, 1]), 5)).toSucceedAndSatisfy(
        (hits: ReadonlyArray<IVectorQueryHit>) => {
          expect(hits).toHaveLength(1);
          expect(hits[0].target).toEqual(b);
        }
      );
    });

    test('is idempotent — removing an absent target still succeeds', async () => {
      const index = InMemoryFragmentCosineIndex.create().orThrow();
      const t = target('knowledge', 'missing');
      expect(await index.remove(t)).toSucceedWith(t);
    });
  });

  describe('rebuild', () => {
    // Deterministic: each record yields two fragments encoding the id's first char code.
    const embed = (r: IMemoryRecord<unknown>): Promise<Result<ReadonlyArray<IEmbeddedFragment>>> => {
      const code: number = (r.envelope.id as string).charCodeAt(0);
      return Promise.resolve(succeed([frag(0, 5, [code, 1]), frag(5, 10, [1, code])]));
    };

    test('re-embeds every scoped record and reports the total fragment count', async () => {
      const index = InMemoryFragmentCosineIndex.create().orThrow();
      const source = new FakeSource(succeed([scoped('knowledge', 'a'), scoped('knowledge', 'b')]));
      expect(await index.rebuild(source, embed)).toSucceedWith(4);
      expect(index.recordCount).toBe(2);
      expect(index.fragmentCount).toBe(4);
    });

    test('keeps same-stem records under different scopes distinct across a rebuild', async () => {
      const index = InMemoryFragmentCosineIndex.create().orThrow();
      const source = new FakeSource(succeed([scoped('conv-a', 'turn-3'), scoped('conv-b', 'turn-3')]));
      expect(await index.rebuild(source, embed)).toSucceedWith(4);
      expect(index.recordCount).toBe(2);
    });

    test('clears prior contents and re-establishes the dimension', async () => {
      const index = InMemoryFragmentCosineIndex.create().orThrow();
      (await index.addFragments(target('knowledge', 'old'), [frag(0, 5, [1, 2, 3])])).orThrow();
      const source = new FakeSource(succeed([scoped('knowledge', 'a')]));
      expect(await index.rebuild(source, embed)).toSucceedWith(2);
      expect(index.recordCount).toBe(1);
      expect(await index.query(Float32Array.from([97, 1]), 1)).toSucceed();
    });

    test('fails loudly when the source list fails and rolls back to empty', async () => {
      const index = InMemoryFragmentCosineIndex.create().orThrow();
      (await index.addFragments(target('knowledge', 'seed'), [frag(0, 5, [1, 1])])).orThrow();
      const source = new FakeSource(fail('disk gone'));
      expect(await index.rebuild(source, embed)).toFailWith(/failed to list records: disk gone/i);
      expect(index.recordCount).toBe(0);
    });

    test('fails loudly and rolls back to empty when an embedding fails mid-rebuild', async () => {
      const index = InMemoryFragmentCosineIndex.create().orThrow();
      (await index.addFragments(target('knowledge', 'seed'), [frag(0, 5, [1, 1])])).orThrow();
      let calls: number = 0;
      const flakyEmbed = (): Promise<Result<ReadonlyArray<IEmbeddedFragment>>> => {
        calls += 1;
        return Promise.resolve(calls === 1 ? succeed([frag(0, 5, [1, 1])]) : fail('no model'));
      };
      const source = new FakeSource(succeed([scoped('conv-a', 'turn-1'), scoped('conv-b', 'turn-1')]));
      expect(await index.rebuild(source, flakyEmbed)).toFailWith(
        /embedding 'conv-b\0turn-1' failed: no model/i
      );
      expect(index.recordCount).toBe(0);
    });

    test('fails loudly and rolls back to empty when adding an embedded fragment fails', async () => {
      const index = InMemoryFragmentCosineIndex.create().orThrow();
      const source = new FakeSource(succeed([scoped('knowledge', 'a')]));
      const emptyEmbed = (): Promise<Result<ReadonlyArray<IEmbeddedFragment>>> =>
        Promise.resolve(succeed([frag(0, 5, [])]));
      expect(await index.rebuild(source, emptyEmbed)).toFailWith(/empty fragment vector/i);
      expect(index.recordCount).toBe(0);
    });
  });
});
