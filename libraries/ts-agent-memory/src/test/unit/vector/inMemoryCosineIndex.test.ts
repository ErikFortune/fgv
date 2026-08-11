/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { Result, fail, succeed } from '@fgv/ts-utils';
import {
  IEdgeTarget,
  IMemoryRecord,
  IMemoryRecordSource,
  IScopedMemoryRecord,
  IVectorQueryHit,
  IVectorRebuildReport,
  InMemoryCosineIndex,
  MemoryId,
  MemoryScopeKey
} from '../../../index';

/** A scope-qualified target from a `(scope, id)` pair. */
function target(scope: string, id: string): IEdgeTarget {
  return { scope: scope as MemoryScopeKey, id: id as MemoryId };
}

/** A trivial record carrying just the id + a marker body, for rebuild tests. */
function record(id: string, body: string = `body-${id}`): IMemoryRecord<unknown> {
  return {
    // The cosine index only reads `envelope.id`; a minimal envelope suffices.
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

describe('InMemoryCosineIndex', () => {
  describe('add', () => {
    test('returns the scoped-target key as the embedding ref and tracks size', async () => {
      const index = InMemoryCosineIndex.create().orThrow();
      expect(index.size).toBe(0);
      const t = target('conv-a', 'turn-1');
      expect(await index.add(t, Float32Array.from([1, 0]))).toSucceedWith(`conv-a\0turn-1`);
      expect(index.size).toBe(1);
    });

    test('replaces the vector on a same-target add', async () => {
      const index = InMemoryCosineIndex.create().orThrow();
      const t = target('conv-a', 'turn-1');
      expect(await index.add(t, Float32Array.from([1, 0]))).toSucceed();
      expect(await index.add(t, Float32Array.from([0, 1]))).toSucceed();
      expect(index.size).toBe(1);
      // The query now matches the replacement vector ([0,1]) not the original.
      expect(await index.query(Float32Array.from([0, 1]), 1)).toSucceedAndSatisfy(
        (hits: ReadonlyArray<IVectorQueryHit>) => {
          expect(hits[0].score).toBeCloseTo(1);
        }
      );
    });

    test('same stem in different scopes are distinct entries — the second add does NOT clobber the first', async () => {
      const index = InMemoryCosineIndex.create().orThrow();
      const a = target('conv-a', 'turn-3');
      const b = target('conv-b', 'turn-3');
      // Two records with the identical stem, orthogonal embeddings.
      expect(await index.add(a, Float32Array.from([1, 0]))).toSucceed();
      expect(await index.add(b, Float32Array.from([0, 1]))).toSucceed();
      // The bug: a bare-id index would have collapsed these to one entry.
      expect(index.size).toBe(2);
      // A query surfaces BOTH as distinct hits carrying distinct scoped targets.
      expect(await index.query(Float32Array.from([1, 1]), 5)).toSucceedAndSatisfy(
        (hits: ReadonlyArray<IVectorQueryHit>) => {
          expect(hits).toHaveLength(2);
          expect(hits.map((h) => h.target)).toEqual(expect.arrayContaining([a, b]));
          // Each retains its OWN embedding: a matches [1,0], b matches [0,1].
          const byScope = new Map(hits.map((h) => [h.target.scope, h.score]));
          expect(byScope.get('conv-a' as MemoryScopeKey)).toBeCloseTo(1 / Math.sqrt(2));
          expect(byScope.get('conv-b' as MemoryScopeKey)).toBeCloseTo(1 / Math.sqrt(2));
        }
      );
    });

    test('fails loudly on an empty vector', async () => {
      const index = InMemoryCosineIndex.create().orThrow();
      expect(await index.add(target('conv-a', 'turn-1'), new Float32Array(0))).toFailWith(/empty vector/i);
    });

    test('stores a defensive copy — mutating the caller buffer after add does not corrupt the index', async () => {
      const index = InMemoryCosineIndex.create().orThrow();
      const buffer = Float32Array.from([1, 0]);
      (await index.add(target('conv-a', 'turn-1'), buffer)).orThrow();
      // Mutate the caller's buffer after the add; the stored vector must be unaffected.
      buffer[0] = 0;
      buffer[1] = 1;
      expect(await index.query(Float32Array.from([1, 0]), 1)).toSucceedAndSatisfy(
        (hits: ReadonlyArray<IVectorQueryHit>) => {
          // Still maximally similar to [1,0] — proves the index kept its own copy.
          expect(hits[0].score).toBeCloseTo(1);
        }
      );
    });

    test('fails loudly on a dimension mismatch against the established dimension', async () => {
      const index = InMemoryCosineIndex.create().orThrow();
      expect(await index.add(target('conv-a', 'a'), Float32Array.from([1, 0]))).toSucceed();
      expect(await index.add(target('conv-a', 'b'), Float32Array.from([1, 0, 0]))).toFailWith(
        /dimension 3 does not match index dimension 2/i
      );
    });
  });

  describe('query', () => {
    async function seeded(): Promise<InMemoryCosineIndex> {
      const index = InMemoryCosineIndex.create().orThrow();
      (await index.add(target('s', 'a'), Float32Array.from([1, 0]))).orThrow();
      (await index.add(target('s', 'b'), Float32Array.from([0, 1]))).orThrow();
      (await index.add(target('s', 'c'), Float32Array.from([1, 1]))).orThrow();
      return index;
    }

    test('returns hits in descending cosine-similarity order', async () => {
      const index = await seeded();
      expect(await index.query(Float32Array.from([1, 0]), 3)).toSucceedAndSatisfy(
        (hits: ReadonlyArray<IVectorQueryHit>) => {
          expect(hits.map((h) => h.target.id)).toEqual(['a', 'c', 'b']);
          expect(hits[0].score).toBeCloseTo(1);
          expect(hits[1].score).toBeCloseTo(1 / Math.sqrt(2));
          expect(hits[2].score).toBeCloseTo(0);
        }
      );
    });

    test('truncates to topK', async () => {
      const index = await seeded();
      expect(await index.query(Float32Array.from([1, 0]), 2)).toSucceedAndSatisfy(
        (hits: ReadonlyArray<IVectorQueryHit>) => {
          expect(hits.map((h) => h.target.id)).toEqual(['a', 'c']);
        }
      );
    });

    test('returns empty for a non-positive topK', async () => {
      const index = await seeded();
      expect(await index.query(Float32Array.from([1, 0]), 0)).toSucceedWith([]);
      expect(await index.query(Float32Array.from([1, 0]), -1)).toSucceedWith([]);
    });

    test('returns empty when the index is empty (no dimension check)', async () => {
      const index = InMemoryCosineIndex.create().orThrow();
      expect(await index.query(Float32Array.from([1, 2, 3, 4]), 5)).toSucceedWith([]);
    });

    test('fails loudly on a query-dimension mismatch', async () => {
      const index = await seeded();
      expect(await index.query(Float32Array.from([1, 0, 0]), 3)).toFailWith(
        /query dimension 3 does not match index dimension 2/i
      );
    });

    test('scores a degenerate (zero-magnitude) stored vector as 0 rather than NaN', async () => {
      const index = InMemoryCosineIndex.create().orThrow();
      (await index.add(target('s', 'zero'), Float32Array.from([0, 0]))).orThrow();
      (await index.add(target('s', 'unit'), Float32Array.from([1, 0]))).orThrow();
      expect(await index.query(Float32Array.from([1, 0]), 2)).toSucceedAndSatisfy(
        (hits: ReadonlyArray<IVectorQueryHit>) => {
          expect(hits.map((h) => h.target.id)).toEqual(['unit', 'zero']);
          expect(hits[1].score).toBe(0);
        }
      );
    });

    test('scores against a degenerate (zero-magnitude) query as 0 rather than NaN', async () => {
      const index = InMemoryCosineIndex.create().orThrow();
      (await index.add(target('s', 'unit'), Float32Array.from([1, 0]))).orThrow();
      expect(await index.query(Float32Array.from([0, 0]), 1)).toSucceedAndSatisfy(
        (hits: ReadonlyArray<IVectorQueryHit>) => {
          expect(hits[0].score).toBe(0);
        }
      );
    });
  });

  describe('remove', () => {
    test('removes a vector and is reflected in subsequent queries', async () => {
      const index = InMemoryCosineIndex.create().orThrow();
      const a = target('s', 'a');
      const b = target('s', 'b');
      (await index.add(a, Float32Array.from([1, 0]))).orThrow();
      (await index.add(b, Float32Array.from([0, 1]))).orThrow();
      expect(await index.remove(a)).toSucceedWith(a);
      expect(index.size).toBe(1);
      expect(await index.query(Float32Array.from([1, 0]), 5)).toSucceedAndSatisfy(
        (hits: ReadonlyArray<IVectorQueryHit>) => {
          expect(hits.map((h) => h.target.id)).toEqual(['b']);
        }
      );
    });

    test('removes only the scoped target — a same-stem record in another scope is left intact', async () => {
      const index = InMemoryCosineIndex.create().orThrow();
      const a = target('conv-a', 'turn-3');
      const b = target('conv-b', 'turn-3');
      (await index.add(a, Float32Array.from([1, 0]))).orThrow();
      (await index.add(b, Float32Array.from([0, 1]))).orThrow();
      expect(await index.remove(a)).toSucceedWith(a);
      expect(index.size).toBe(1);
      // conv-b's embedding survives untouched.
      expect(await index.query(Float32Array.from([0, 1]), 5)).toSucceedAndSatisfy(
        (hits: ReadonlyArray<IVectorQueryHit>) => {
          expect(hits).toHaveLength(1);
          expect(hits[0].target).toEqual(b);
          expect(hits[0].score).toBeCloseTo(1);
        }
      );
    });

    test('is idempotent — removing an absent target still succeeds', async () => {
      const index = InMemoryCosineIndex.create().orThrow();
      const t = target('s', 'missing');
      expect(await index.remove(t)).toSucceedWith(t);
    });
  });

  describe('rebuild', () => {
    const embed = (r: IMemoryRecord<unknown>): Promise<Result<Float32Array>> => {
      // Deterministic: encode the id's first char code into a 2-vector.
      const code: number = (r.envelope.id as string).charCodeAt(0);
      return Promise.resolve(succeed(Float32Array.from([code, 1])));
    };

    test('re-embeds every scoped record from the source and reports the count', async () => {
      const index = InMemoryCosineIndex.create().orThrow();
      const source = new FakeSource(succeed([scoped('s', 'a'), scoped('s', 'b'), scoped('s', 'c')]));
      expect(await index.rebuild(source, embed)).toSucceedWith({ indexed: 3, declined: 0, skipped: [] });
      expect(index.size).toBe(3);
      expect(await index.query(Float32Array.from([99, 1]), 1)).toSucceedAndSatisfy(
        (hits: ReadonlyArray<IVectorQueryHit>) => {
          // 'c' = char code 99, the closest to the query vector.
          expect(hits[0].target.id).toBe('c');
        }
      );
    });

    test('skips a declined record without failing, and reports only what it indexed', async () => {
      // The distinction this asserts: a decline must NOT take the all-or-nothing
      // path that a failure takes. Before `undefined` existed, an embedder with a
      // per-kind policy could only say `fail` here, which empties the whole index.
      const index = InMemoryCosineIndex.create().orThrow();
      const declineB = (r: IMemoryRecord<unknown>): Promise<Result<Float32Array | undefined>> =>
        (r.envelope.id as string) === 'b' ? Promise.resolve(succeed(undefined)) : embed(r);
      const source = new FakeSource(succeed([scoped('s', 'a'), scoped('s', 'b'), scoped('s', 'c')]));
      expect(await index.rebuild(source, declineB)).toSucceedWith({ indexed: 2, declined: 1, skipped: [] });
      expect(index.size).toBe(2);
      // 'a' and 'c' remain queryable; 'b' is simply absent.
      expect(await index.query(Float32Array.from([99, 1]), 5)).toSucceedAndSatisfy(
        (hits: ReadonlyArray<IVectorQueryHit>) => {
          expect(hits.map((h) => h.target.id).sort()).toEqual(['a', 'c']);
        }
      );
    });

    test('an all-declining embedder yields an empty index and still succeeds', async () => {
      const index = InMemoryCosineIndex.create().orThrow();
      const source = new FakeSource(succeed([scoped('s', 'a'), scoped('s', 'b')]));
      expect(await index.rebuild(source, () => Promise.resolve(succeed(undefined)))).toSucceedWith({
        indexed: 0,
        declined: 2,
        skipped: []
      });
      expect(index.size).toBe(0);
    });

    test('keeps same-stem records under different scopes distinct across a rebuild', async () => {
      const index = InMemoryCosineIndex.create().orThrow();
      const source = new FakeSource(succeed([scoped('conv-a', 'turn-3'), scoped('conv-b', 'turn-3')]));
      // The embedder keys only off the (shared) id, so a bare-id rebuild would
      // index just one entry; the scoped rebuild indexes both.
      expect(await index.rebuild(source, embed)).toSucceedWith({ indexed: 2, declined: 0, skipped: [] });
      expect(index.size).toBe(2);
      expect(await index.query(Float32Array.from([116, 1]), 5)).toSucceedAndSatisfy(
        (hits: ReadonlyArray<IVectorQueryHit>) => {
          expect(hits).toHaveLength(2);
          expect(hits.map((h) => h.target.scope).sort()).toEqual(['conv-a', 'conv-b']);
        }
      );
    });

    test("defaults to 'fail': one bad record empties the index, unchanged", async () => {
      // The historical contract, asserted explicitly so a future change to the
      // default cannot pass silently.
      const index = InMemoryCosineIndex.create().orThrow();
      const failB = (r: IMemoryRecord<unknown>): Promise<Result<Float32Array | undefined>> =>
        (r.envelope.id as string) === 'b' ? Promise.resolve(fail('no model')) : embed(r);
      const source = new FakeSource(succeed([scoped('s', 'a'), scoped('s', 'b'), scoped('s', 'c')]));
      expect(await index.rebuild(source, failB)).toFailWith(/embedding 's\0b' failed.*no model/);
      expect(index.size).toBe(0);
    });

    test("'skip' keeps the healthy records and reports every casualty structurally", async () => {
      const index = InMemoryCosineIndex.create().orThrow();
      const failB = (r: IMemoryRecord<unknown>): Promise<Result<Float32Array | undefined>> =>
        (r.envelope.id as string) === 'b' ? Promise.resolve(fail('no model')) : embed(r);
      const source = new FakeSource(succeed([scoped('s', 'a'), scoped('s', 'b'), scoped('s', 'c')]));
      expect(await index.rebuild(source, failB, { onRecordError: 'skip' })).toSucceedAndSatisfy(
        (report: IVectorRebuildReport) => {
          expect(report.indexed).toBe(2);
          expect(report.declined).toBe(0);
          // Structural, not just a count: the caller can name and re-drive the loss.
          expect(report.skipped).toHaveLength(1);
          expect(report.skipped[0].target.id).toBe('b');
          expect(report.skipped[0].error).toMatch(/no model/);
        }
      );
      expect(index.size).toBe(2);
    });

    test("'skip' separates a decline from a failure in the same rebuild", async () => {
      // The distinction the report exists for: declined was intentional, skipped
      // was a fault, and a bare count can express neither.
      const index = InMemoryCosineIndex.create().orThrow();
      const mixed = (r: IMemoryRecord<unknown>): Promise<Result<Float32Array | undefined>> => {
        const id: string = r.envelope.id as string;
        if (id === 'b') return Promise.resolve(fail('no model'));
        if (id === 'c') return Promise.resolve(succeed(undefined));
        return embed(r);
      };
      const source = new FakeSource(succeed([scoped('s', 'a'), scoped('s', 'b'), scoped('s', 'c')]));
      expect(await index.rebuild(source, mixed, { onRecordError: 'skip' })).toSucceedAndSatisfy(
        (report: IVectorRebuildReport) => {
          expect(report.indexed).toBe(1);
          expect(report.declined).toBe(1);
          expect(report.skipped.map((s) => s.target.id)).toEqual(['b']);
        }
      );
    });

    test("'skip' reports an add failure too, not only an embed failure", async () => {
      // A zero-length vector is rejected by `add`; under 'skip' that is a casualty
      // rather than an abort.
      const index = InMemoryCosineIndex.create().orThrow();
      const emptyForB = (r: IMemoryRecord<unknown>): Promise<Result<Float32Array | undefined>> =>
        (r.envelope.id as string) === 'b' ? Promise.resolve(succeed(Float32Array.from([]))) : embed(r);
      const source = new FakeSource(succeed([scoped('s', 'a'), scoped('s', 'b')]));
      expect(await index.rebuild(source, emptyForB, { onRecordError: 'skip' })).toSucceedAndSatisfy(
        (report: IVectorRebuildReport) => {
          expect(report.indexed).toBe(1);
          expect(report.skipped).toHaveLength(1);
          expect(report.skipped[0].error).toMatch(/empty vector/);
        }
      );
    });

    test('a list failure is fatal under both modes — there is no honest partial', async () => {
      for (const mode of ['fail', 'skip'] as const) {
        const index = InMemoryCosineIndex.create().orThrow();
        const source = new FakeSource(fail('disk gone'));
        expect(await index.rebuild(source, embed, { onRecordError: mode })).toFailWith(
          /failed to list records.*disk gone/
        );
      }
    });

    test('clears prior contents and re-establishes the dimension', async () => {
      const index = InMemoryCosineIndex.create().orThrow();
      // Seed a 3-dim vector, then rebuild with a 2-dim embedder.
      (await index.add(target('s', 'old'), Float32Array.from([1, 2, 3]))).orThrow();
      const source = new FakeSource(succeed([scoped('s', 'a')]));
      expect(await index.rebuild(source, embed)).toSucceedWith({ indexed: 1, declined: 0, skipped: [] });
      expect(index.size).toBe(1);
      // The 2-dim query now succeeds (dimension was reset by rebuild).
      expect(await index.query(Float32Array.from([97, 1]), 1)).toSucceed();
    });

    test('fails loudly when the source list fails', async () => {
      const index = InMemoryCosineIndex.create().orThrow();
      // Seed an entry so the reset-before-list rollback is observable, not just "stayed empty".
      (await index.add(target('s', 'seed'), Float32Array.from([1, 1]))).orThrow();
      const source = new FakeSource(fail('disk gone'));
      expect(await index.rebuild(source, embed)).toFailWith(/failed to list records: disk gone/i);
      expect(index.size).toBe(0);
    });

    test('fails loudly and rolls back to empty when an embedding fails mid-rebuild', async () => {
      const index = InMemoryCosineIndex.create().orThrow();
      // Seed an existing entry so the rollback (not merely "stayed empty") is observable.
      (await index.add(target('s', 'seed'), Float32Array.from([1, 1]))).orThrow();
      // First record embeds fine, the second fails — so a naive impl would leave
      // record 'a' indexed; the rollback must clear it.
      let calls: number = 0;
      const flakyEmbed = (): Promise<Result<Float32Array>> => {
        calls += 1;
        return Promise.resolve(calls === 1 ? succeed(Float32Array.from([1, 1])) : fail('no model'));
      };
      const source = new FakeSource(succeed([scoped('conv-a', 'turn-1'), scoped('conv-b', 'turn-1')]));
      // The failing record's error names its scope-qualified key.
      expect(await index.rebuild(source, flakyEmbed)).toFailWith(
        /embedding 'conv-b\0turn-1' failed: no model/i
      );
      expect(index.size).toBe(0);
    });

    test('fails loudly and rolls back to empty when adding an embedded vector fails', async () => {
      const index = InMemoryCosineIndex.create().orThrow();
      const source = new FakeSource(succeed([scoped('s', 'a')]));
      const emptyEmbed = (): Promise<Result<Float32Array>> => Promise.resolve(succeed(new Float32Array(0)));
      expect(await index.rebuild(source, emptyEmbed)).toFailWith(/empty vector/i);
      expect(index.size).toBe(0);
    });

    test('converts a throwing source into a failure rather than rejecting', async () => {
      const index = InMemoryCosineIndex.create().orThrow();
      const throwingSource: IMemoryRecordSource = {
        list: () => {
          throw new Error('source exploded');
        }
      };
      expect(await index.rebuild(throwingSource, embed)).toFailWith(
        /failed to list records:.*source exploded/i
      );
    });

    test('converts a throwing embedder into a failure and still rolls back', async () => {
      // The contract is "any failure leaves the index empty". An escaping
      // exception would break it twice over: the caller gets a rejection instead
      // of a Failure, and the rollback below never runs — so the index is left
      // half-populated with whatever embedded before the throw.
      const index = InMemoryCosineIndex.create().orThrow();
      let calls: number = 0;
      const throwingEmbed = (): Promise<Result<Float32Array>> => {
        calls += 1;
        if (calls === 1) {
          return Promise.resolve(succeed(Float32Array.from([1, 1])));
        }
        throw new Error('embedder exploded');
      };
      const source = new FakeSource(succeed([scoped('s', 'a'), scoped('s', 'b')]));
      expect(await index.rebuild(source, throwingEmbed)).toFailWith(
        /embedding 's\0b' failed:.*embedder exploded/i
      );
      expect(index.size).toBe(0);
    });

    test('converts a rejecting embedder into a failure', async () => {
      const index = InMemoryCosineIndex.create().orThrow();
      const rejectingEmbed = (): Promise<Result<Float32Array>> =>
        Promise.reject(new Error('model unreachable'));
      const source = new FakeSource(succeed([scoped('s', 'a')]));
      expect(await index.rebuild(source, rejectingEmbed)).toFailWith(
        /embedding 's\0a' failed:.*model unreachable/i
      );
      expect(index.size).toBe(0);
    });
  });
});
