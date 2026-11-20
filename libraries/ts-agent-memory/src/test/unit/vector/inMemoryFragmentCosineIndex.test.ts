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
  IMemoryRecordListing,
  IMemoryRecordSource,
  IScopedMemoryRecord,
  IVectorQueryHit,
  InMemoryFragmentCosineIndex,
  MemoryId,
  MemoryScopeKey,
  IFragmentVectorRebuildReport,
  Kind
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
function record(id: string, body: string = `body-${id}`, kind: string = 'knowledge'): IMemoryRecord<unknown> {
  // `kind` is load-bearing now that the rebuild report resolves every count by it:
  // before the report existed this fixture carried an id and nothing else, and a
  // bare count could not tell.
  return {
    envelope: { id: id as MemoryId, kind: kind as Kind } as IMemoryRecord<unknown>['envelope'],
    body
  };
}

/** A scope-qualified record entry for a rebuild source. */
function scoped(scope: string, id: string, body?: string, kind?: string): IScopedMemoryRecord {
  return { target: target(scope, id), record: record(id, body, kind) };
}

/** A scripted record source for `rebuild`. */
class FakeSource implements IMemoryRecordSource {
  private readonly _result: Result<ReadonlyArray<IScopedMemoryRecord>>;
  private readonly _excluded: ReadonlyMap<Kind, number> | undefined;
  public constructor(
    result: Result<ReadonlyArray<IScopedMemoryRecord>>,
    excluded?: ReadonlyMap<Kind, number>
  ) {
    this._result = result;
    this._excluded = excluded;
  }
  public list(): Promise<Result<IMemoryRecordListing>> {
    return Promise.resolve(
      this._result.onSuccess((records: ReadonlyArray<IScopedMemoryRecord>) =>
        // Absent stays absent: "cannot say" and "excluded nothing" differ.
        succeed(this._excluded === undefined ? { records } : { records, excluded: this._excluded })
      )
    );
  }
}

/** Total a per-kind tally — the reports resolve every count by kind. */
function sum(counts: ReadonlyMap<unknown, number>): number {
  let total: number = 0;
  for (const n of counts.values()) {
    total += n;
  }
  return total;
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

  describe('query narrowing (scope / id)', () => {
    /**
     * Two decoy records whose fragments all outscore the target's, plus a target
     * record with three weaker fragments. A GLOBAL top-2 returns two decoys and zero
     * target fragments — so any implementation that narrows AFTER the topK cut
     * returns an empty result here, while narrowing before it returns two.
     */
    async function seededWithDecoys(): Promise<InMemoryFragmentCosineIndex> {
      const index = InMemoryFragmentCosineIndex.create().orThrow();
      (
        await index.addFragments(target('knowledge', 'decoy-a'), [frag(0, 5, [1, 0]), frag(5, 10, [1, 0])])
      ).orThrow();
      (
        await index.addFragments(target('knowledge', 'decoy-b'), [frag(0, 5, [1, 0]), frag(5, 10, [1, 0])])
      ).orThrow();
      (
        await index.addFragments(target('knowledge', 'doc-a'), [
          frag(0, 5, [0.6, 0.8]),
          frag(5, 10, [0.5, 0.86]),
          frag(10, 15, [0.4, 0.92])
        ])
      ).orThrow();
      return index;
    }

    test('applies the record narrowing BEFORE the topK cut, not after', async () => {
      const index = await seededWithDecoys();
      const q = Float32Array.from([1, 0]);

      // Establish the premise: globally, the target owns none of the top 2.
      expect(await index.query(q, 2)).toSucceedAndSatisfy((hits: ReadonlyArray<IVectorQueryHit>) => {
        expect(hits).toHaveLength(2);
        expect(hits.every((h) => h.target.id !== 'doc-a')).toBe(true);
      });

      // Narrowed, the same topK must be filled from the target alone. A post-filter
      // would truncate to the two decoys first and return zero hits.
      expect(
        await index.query(q, 2, { scope: 'knowledge' as MemoryScopeKey, id: 'doc-a' as MemoryId })
      ).toSucceedAndSatisfy((hits: ReadonlyArray<IVectorQueryHit>) => {
        expect(hits).toHaveLength(2);
        expect(hits.every((h) => h.target.id === 'doc-a')).toBe(true);
      });
    });

    test('narrows to a whole scope when no id is supplied (the versioned-kind case)', async () => {
      const index = InMemoryFragmentCosineIndex.create().orThrow();
      // Two versions of one entity in its own subtree, plus an unrelated record.
      (await index.addFragments(target('mem/entities/e1', 'e1-v0'), [frag(0, 5, [1, 0])])).orThrow();
      (await index.addFragments(target('mem/entities/e1', 'e1-v1'), [frag(0, 5, [0.9, 0.1])])).orThrow();
      (await index.addFragments(target('knowledge', 'other'), [frag(0, 5, [1, 0])])).orThrow();

      expect(
        await index.query(Float32Array.from([1, 0]), 10, { scope: 'mem/entities/e1' as MemoryScopeKey })
      ).toSucceedAndSatisfy((hits: ReadonlyArray<IVectorQueryHit>) => {
        expect(hits).toHaveLength(2);
        expect(hits.map((h) => h.target.id).sort()).toEqual(['e1-v0', 'e1-v1']);
      });
    });

    test('a scope prefix does not leak into a longer scope that starts the same way', async () => {
      const index = InMemoryFragmentCosineIndex.create().orThrow();
      (await index.addFragments(target('mem', 'a'), [frag(0, 5, [1, 0])])).orThrow();
      (await index.addFragments(target('mem/entities/e1', 'b'), [frag(0, 5, [1, 0])])).orThrow();

      expect(
        await index.query(Float32Array.from([1, 0]), 10, { scope: 'mem' as MemoryScopeKey })
      ).toSucceedAndSatisfy((hits: ReadonlyArray<IVectorQueryHit>) => {
        expect(hits).toHaveLength(1);
        expect(hits[0].target.id).toBe('a');
      });
    });

    test('an unmatched narrowing is an empty success, not a failure', async () => {
      const index = await seededWithDecoys();
      expect(
        await index.query(Float32Array.from([1, 0]), 5, {
          scope: 'knowledge' as MemoryScopeKey,
          id: 'no-such-record' as MemoryId
        })
      ).toSucceedWith([]);
    });

    test('composes with maxPerRecord', async () => {
      const index = await seededWithDecoys();
      expect(
        await index.query(Float32Array.from([1, 0]), 5, {
          scope: 'knowledge' as MemoryScopeKey,
          id: 'doc-a' as MemoryId,
          maxPerRecord: 1
        })
      ).toSucceedAndSatisfy((hits: ReadonlyArray<IVectorQueryHit>) => {
        expect(hits).toHaveLength(1);
        expect(hits[0].target.id).toBe('doc-a');
      });
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
      expect(await index.query(Float32Array.from([1, 0]), 2, { maxPerRecord: 1 })).toSucceedAndSatisfy(
        (hits: ReadonlyArray<IVectorQueryHit>) => {
          expect(hits).toHaveLength(2);
          expect(hits.map((h) => h.target.id)).toEqual(['doc-a', 'doc-b']);
          expect(hits[0].locator).toEqual(loc(0, 5));
        }
      );
    });

    test('maxPerRecord=0 yields no hits', async () => {
      const index = await seeded();
      expect(await index.query(Float32Array.from([1, 0]), 5, { maxPerRecord: 0 })).toSucceedWith([]);
    });

    test('maxPerRecord larger than any record leaves the ranking unchanged', async () => {
      const index = await seeded();
      expect(await index.query(Float32Array.from([1, 0]), 5, { maxPerRecord: 10 })).toSucceedAndSatisfy(
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

  describe('has', () => {
    test('answers true once a record has fragments, false before and after removal', async () => {
      const index = InMemoryFragmentCosineIndex.create().orThrow();
      const t = target('knowledge', 'doc-1');
      expect(await index.has(t)).toSucceedWith(false);
      (await index.addFragments(t, [frag(0, 5, [1, 0])])).orThrow();
      expect(await index.has(t)).toSucceedWith(true);
      (await index.remove(t)).orThrow();
      expect(await index.has(t)).toSucceedWith(false);
    });

    test('answers record-granularity, not fragment-granularity', async () => {
      // Fragment writes are whole-record-replace, so "is this record represented?"
      // is the only question with a stable answer — a per-fragment membership check
      // would imply an incremental write path that does not exist.
      const index = InMemoryFragmentCosineIndex.create().orThrow();
      const t = target('knowledge', 'doc-1');
      (await index.addFragments(t, [frag(0, 5, [1, 0]), frag(5, 10, [0, 1])])).orThrow();
      expect(await index.has(t)).toSucceedWith(true);
      // Replacing with a single fragment leaves the record present, not partially so.
      (await index.addFragments(t, [frag(0, 3, [1, 1])])).orThrow();
      expect(await index.has(t)).toSucceedWith(true);
      expect(index.fragmentCount).toBe(1);
    });

    test('keys on scope as well as id', async () => {
      const index = InMemoryFragmentCosineIndex.create().orThrow();
      (await index.addFragments(target('conv-a', 'turn-3'), [frag(0, 5, [1, 0])])).orThrow();
      expect(await index.has(target('conv-a', 'turn-3'))).toSucceedWith(true);
      expect(await index.has(target('conv-b', 'turn-3'))).toSucceedWith(false);
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
      expect(await index.rebuild(source, embed)).toSucceedAndSatisfy(
        (report: IFragmentVectorRebuildReport) => {
          expect(sum(report.fragments)).toBe(4);
        }
      );
      expect(index.recordCount).toBe(2);
      expect(index.fragmentCount).toBe(4);
    });

    test('keeps same-stem records under different scopes distinct across a rebuild', async () => {
      const index = InMemoryFragmentCosineIndex.create().orThrow();
      const source = new FakeSource(succeed([scoped('conv-a', 'turn-3'), scoped('conv-b', 'turn-3')]));
      expect(await index.rebuild(source, embed)).toSucceedAndSatisfy(
        (report: IFragmentVectorRebuildReport) => {
          expect(sum(report.fragments)).toBe(4);
        }
      );
      expect(index.recordCount).toBe(2);
    });

    test('clears prior contents and re-establishes the dimension', async () => {
      const index = InMemoryFragmentCosineIndex.create().orThrow();
      (await index.addFragments(target('knowledge', 'old'), [frag(0, 5, [1, 2, 3])])).orThrow();
      const source = new FakeSource(succeed([scoped('knowledge', 'a')]));
      expect(await index.rebuild(source, embed)).toSucceedAndSatisfy(
        (report: IFragmentVectorRebuildReport) => {
          expect(sum(report.fragments)).toBe(2);
        }
      );
      expect(index.recordCount).toBe(1);
      expect(await index.query(Float32Array.from([97, 1]), 1)).toSucceed();
    });

    test('fails loudly when the source list fails, WITHOUT discarding what it holds', async () => {
      // This test previously asserted `recordCount === 0` here — it was PINNING
      // the reset-before-list behavior as intended. That behavior was wrong for
      // the same reason it was wrong on the record-granular sibling: a failed
      // list is no evidence about the fragments already held, and nothing has
      // been re-embedded, so a transient read error was quietly emptying a
      // healthy index. The seeded entry now proves the opposite property, which
      // is the one worth having.
      const index = InMemoryFragmentCosineIndex.create().orThrow();
      (await index.addFragments(target('knowledge', 'seed'), [frag(0, 5, [1, 1])])).orThrow();
      const source = new FakeSource(fail('disk gone'));
      expect(await index.rebuild(source, embed)).toFailWith(/failed to list records: disk gone/i);
      expect(index.recordCount).toBe(1);
      // And it is still queryable, not merely counted.
      expect(await index.query(Float32Array.from([1, 1]), 5)).toSucceedAndSatisfy(
        (hits: ReadonlyArray<IVectorQueryHit>) => {
          expect(hits.map((h) => h.target.id)).toEqual(['seed']);
        }
      );
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

    test('resolves indexed AND the fragment fan-out by kind', async () => {
      // `indexed` alone cannot say whether forty records cost forty embedding
      // round trips or four thousand, which is the whole difference between a
      // reconcile that finishes and one that blocks a request.
      const index = InMemoryFragmentCosineIndex.create().orThrow();
      const source = new FakeSource(
        succeed([scoped('knowledge', 'a'), scoped('conv-a', 'turn-1', undefined, 'turn')])
      );
      expect(await index.rebuild(source, embed)).toSucceedAndSatisfy(
        (report: IFragmentVectorRebuildReport) => {
          expect(report.indexed.get('knowledge' as Kind)).toBe(1);
          expect(report.indexed.get('turn' as Kind)).toBe(1);
          expect(report.fragments.get('knowledge' as Kind)).toBe(2);
          expect(report.fragments.get('turn' as Kind)).toBe(2);
          expect(report.declined.size).toBe(0);
          expect(report.skipped).toHaveLength(0);
        }
      );
    });

    test('counts an empty-array embed as declined, not indexed — and still replaces', async () => {
      // An empty array IS this lane's decline, and it is not the same mechanism as
      // a record-granular one: it still performs a real whole-record-replace, which
      // is what clears stale fragments.
      const index = InMemoryFragmentCosineIndex.create().orThrow();
      (await index.addFragments(target('knowledge', 'a'), [frag(0, 5, [1, 1])])).orThrow();
      const source = new FakeSource(succeed([scoped('knowledge', 'a')]));
      const declining = (): Promise<Result<ReadonlyArray<IEmbeddedFragment>>> => Promise.resolve(succeed([]));
      expect(await index.rebuild(source, declining)).toSucceedAndSatisfy(
        (report: IFragmentVectorRebuildReport) => {
          expect(report.declined.get('knowledge' as Kind)).toBe(1);
          expect(report.indexed.size).toBe(0);
          expect(sum(report.fragments)).toBe(0);
        }
      );
      expect(index.recordCount).toBe(0);
    });

    test("onRecordError 'skip' keeps the healthy records and reports every casualty", async () => {
      const index = InMemoryFragmentCosineIndex.create().orThrow();
      let calls: number = 0;
      const flaky = (): Promise<Result<ReadonlyArray<IEmbeddedFragment>>> => {
        calls += 1;
        return Promise.resolve(calls === 1 ? fail('no model') : succeed([frag(0, 5, [1, 1])]));
      };
      const source = new FakeSource(succeed([scoped('conv-a', 'turn-1'), scoped('knowledge', 'a')]));
      expect(await index.rebuild(source, flaky, { onRecordError: 'skip' })).toSucceedAndSatisfy(
        (report: IFragmentVectorRebuildReport) => {
          expect(report.skipped).toHaveLength(1);
          expect(report.skipped[0].target.id).toBe('turn-1');
          expect(report.skipped[0].error).toMatch(/no model/i);
          expect(report.indexed.get('knowledge' as Kind)).toBe(1);
        }
      );
      // The point of the mode: one bad record no longer empties the index.
      expect(index.recordCount).toBe(1);
    });

    test("a 'fail' abort carries what the attempt had established on the detail", async () => {
      const index = InMemoryFragmentCosineIndex.create().orThrow();
      let calls: number = 0;
      const flaky = (): Promise<Result<ReadonlyArray<IEmbeddedFragment>>> => {
        calls += 1;
        return Promise.resolve(calls === 1 ? succeed([frag(0, 5, [1, 1])]) : fail('no model'));
      };
      const source = new FakeSource(succeed([scoped('knowledge', 'a'), scoped('conv-a', 'turn-1')]));
      const result = await index.rebuild(source, flaky);
      expect(result.isFailure()).toBe(true);
      // The report describes the ATTEMPT, not the surviving index — which is empty,
      // because 'fail' still rolls back.
      expect(result.detail?.indexed.get('knowledge' as Kind)).toBe(1);
      expect(index.recordCount).toBe(0);
    });

    test("onRecordError 'skip' also survives an ADD failure, not just an embed failure", async () => {
      // Distinct path from the embed failure above: the embedder succeeded and the
      // index rejected what it produced (here, an empty vector). Under 'fail' this
      // empties the index; under 'skip' it must cost only that one record.
      const index = InMemoryFragmentCosineIndex.create().orThrow();
      let calls: number = 0;
      const embedThenBad = (): Promise<Result<ReadonlyArray<IEmbeddedFragment>>> => {
        calls += 1;
        return Promise.resolve(calls === 1 ? succeed([frag(0, 5, [])]) : succeed([frag(0, 5, [1, 1])]));
      };
      const source = new FakeSource(succeed([scoped('conv-a', 'turn-1'), scoped('knowledge', 'a')]));
      expect(await index.rebuild(source, embedThenBad, { onRecordError: 'skip' })).toSucceedAndSatisfy(
        (report: IFragmentVectorRebuildReport) => {
          expect(report.skipped).toHaveLength(1);
          expect(report.skipped[0].error).toMatch(/empty fragment vector/i);
          expect(report.indexed.get('knowledge' as Kind)).toBe(1);
        }
      );
      expect(index.recordCount).toBe(1);
    });

    test('a list failure carries no detail — nothing was attempted', async () => {
      const index = InMemoryFragmentCosineIndex.create().orThrow();
      const result = await index.rebuild(new FakeSource(fail('disk gone')), embed);
      expect(result.isFailure()).toBe(true);
      expect(result.detail).toBeUndefined();
    });

    test('propagates the source listing excluded tally rather than dropping it', async () => {
      // Before this contract existed the fragment path dropped `excluded` on the
      // floor, having a bare count and nowhere honest to put it.
      const index = InMemoryFragmentCosineIndex.create().orThrow();
      const excluded = new Map<Kind, number>([['bookkeeping' as Kind, 3]]);
      const source = new FakeSource(succeed([scoped('knowledge', 'a')]), excluded);
      expect(await index.rebuild(source, embed)).toSucceedAndSatisfy(
        (report: IFragmentVectorRebuildReport) => {
          expect(report.excluded?.get('bookkeeping' as Kind)).toBe(3);
        }
      );
    });

    test('a source that reports no exclusions leaves excluded absent, not empty', async () => {
      const index = InMemoryFragmentCosineIndex.create().orThrow();
      expect(
        await index.rebuild(new FakeSource(succeed([scoped('knowledge', 'a')])), embed)
      ).toSucceedAndSatisfy((report: IFragmentVectorRebuildReport) => {
        expect(report.excluded).toBeUndefined();
      });
    });

    test('captures a rejecting embedder rather than letting it escape mid-rebuild', async () => {
      const index = InMemoryFragmentCosineIndex.create().orThrow();
      const rejecting = (): Promise<Result<ReadonlyArray<IEmbeddedFragment>>> =>
        Promise.reject(new Error('socket hangup'));
      const source = new FakeSource(succeed([scoped('knowledge', 'a')]));
      expect(await index.rebuild(source, rejecting)).toFailWith(/socket hangup/i);
    });
  });

  describe('fragment identity', () => {
    /** A fragment identified only by an opaque id — no honest body span. */
    function idFrag(fragmentId: string, vector: number[]): IEmbeddedFragment {
      return { fragmentId, vector: Float32Array.from(vector) };
    }

    test('rejects a fragment carrying neither a locator nor a fragmentId', async () => {
      const index = InMemoryFragmentCosineIndex.create().orThrow();
      expect(
        await index.addFragments(target('knowledge', 'doc-a'), [{ vector: Float32Array.from([1, 0]) }])
      ).toFailWith(/at least one of 'locator' or 'fragmentId'/i);
      expect(index.recordCount).toBe(0);
    });

    test('carries an opaque fragmentId through to the query hit verbatim', async () => {
      const index = InMemoryFragmentCosineIndex.create().orThrow();
      const opaque = 'urn:frag:9f8e::{not-parsed}';
      (await index.addFragments(target('knowledge', 'doc-a'), [idFrag(opaque, [1, 0])])).orThrow();
      expect(await index.query(Float32Array.from([1, 0]), 1)).toSucceedAndSatisfy(
        (hits: ReadonlyArray<IVectorQueryHit>) => {
          expect(hits[0].fragmentId).toBe(opaque);
          expect(hits[0].locator).toBeUndefined();
        }
      );
    });

    test('carries both identities when a fragment supplies both', async () => {
      const index = InMemoryFragmentCosineIndex.create().orThrow();
      (
        await index.addFragments(target('knowledge', 'doc-a'), [
          { ...frag(2, 8, [1, 0]), fragmentId: 'frag-1' }
        ])
      ).orThrow();
      expect(await index.query(Float32Array.from([1, 0]), 1)).toSucceedAndSatisfy(
        (hits: ReadonlyArray<IVectorQueryHit>) => {
          expect(hits[0].locator).toEqual(loc(2, 8));
          expect(hits[0].fragmentId).toBe('frag-1');
        }
      );
    });

    test('a locator-only fragment produces a hit with no fragmentId key at all', async () => {
      // Byte-identical to what the index produced before `fragmentId` existed: the key
      // is absent, not present-and-undefined, so an existing caller's structural
      // comparisons are unaffected by the addition.
      const index = InMemoryFragmentCosineIndex.create().orThrow();
      (await index.addFragments(target('knowledge', 'doc-a'), [frag(0, 5, [1, 0])])).orThrow();
      expect(await index.query(Float32Array.from([1, 0]), 1)).toSucceedAndSatisfy(
        (hits: ReadonlyArray<IVectorQueryHit>) => {
          expect(Object.keys(hits[0]).sort()).toEqual(['locator', 'score', 'target']);
          expect(hits[0]).toStrictEqual({
            target: target('knowledge', 'doc-a'),
            score: hits[0].score,
            locator: loc(0, 5)
          });
        }
      );
    });

    test('an id-only fragment produces a hit with no locator key at all', async () => {
      const index = InMemoryFragmentCosineIndex.create().orThrow();
      (await index.addFragments(target('knowledge', 'doc-a'), [idFrag('frag-1', [1, 0])])).orThrow();
      expect(await index.query(Float32Array.from([1, 0]), 1)).toSucceedAndSatisfy(
        (hits: ReadonlyArray<IVectorQueryHit>) => {
          expect(Object.keys(hits[0]).sort()).toEqual(['fragmentId', 'score', 'target']);
        }
      );
    });

    test('mixes identity shapes within one record and within one query', async () => {
      const index = InMemoryFragmentCosineIndex.create().orThrow();
      (
        await index.addFragments(target('knowledge', 'doc-a'), [
          frag(0, 5, [1, 0]),
          idFrag('frag-rewritten', [0, 1])
        ])
      ).orThrow();
      expect(await index.query(Float32Array.from([1, 0]), 2)).toSucceedAndSatisfy(
        (hits: ReadonlyArray<IVectorQueryHit>) => {
          expect(hits[0].locator).toEqual(loc(0, 5));
          expect(hits[0].fragmentId).toBeUndefined();
          expect(hits[1].fragmentId).toBe('frag-rewritten');
          expect(hits[1].locator).toBeUndefined();
        }
      );
    });
  });
});
