/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { Result, fail, succeed } from '@fgv/ts-utils';
import {
  IMemoryRecord,
  IMemoryRecordSource,
  IVectorQueryHit,
  InMemoryCosineIndex,
  MemoryId
} from '../../../index';

/** A trivial record carrying just the id + a marker body, for rebuild tests. */
function record(id: string, body: string = `body-${id}`): IMemoryRecord<unknown> {
  return {
    // The cosine index only reads `envelope.id`; a minimal envelope suffices.
    envelope: { id: id as MemoryId } as IMemoryRecord<unknown>['envelope'],
    body
  };
}

/** A scripted record source for `rebuild`. */
class FakeSource implements IMemoryRecordSource {
  private readonly _result: Result<ReadonlyArray<IMemoryRecord<unknown>>>;
  public constructor(result: Result<ReadonlyArray<IMemoryRecord<unknown>>>) {
    this._result = result;
  }
  public list(): Promise<Result<ReadonlyArray<IMemoryRecord<unknown>>>> {
    return Promise.resolve(this._result);
  }
}

describe('InMemoryCosineIndex', () => {
  describe('add', () => {
    test('returns the id as the embedding ref and tracks size', async () => {
      const index = InMemoryCosineIndex.create().orThrow();
      expect(index.size).toBe(0);
      expect(await index.add('a' as MemoryId, Float32Array.from([1, 0]))).toSucceedWith('a');
      expect(index.size).toBe(1);
    });

    test('replaces the vector on a same-id add', async () => {
      const index = InMemoryCosineIndex.create().orThrow();
      expect(await index.add('a' as MemoryId, Float32Array.from([1, 0]))).toSucceed();
      expect(await index.add('a' as MemoryId, Float32Array.from([0, 1]))).toSucceed();
      expect(index.size).toBe(1);
      // The query now matches the replacement vector ([0,1]) not the original.
      expect(await index.query(Float32Array.from([0, 1]), 1)).toSucceedAndSatisfy(
        (hits: ReadonlyArray<IVectorQueryHit>) => {
          expect(hits[0].score).toBeCloseTo(1);
        }
      );
    });

    test('fails loudly on an empty vector', async () => {
      const index = InMemoryCosineIndex.create().orThrow();
      expect(await index.add('a' as MemoryId, new Float32Array(0))).toFailWith(/empty vector/i);
    });

    test('fails loudly on a dimension mismatch against the established dimension', async () => {
      const index = InMemoryCosineIndex.create().orThrow();
      expect(await index.add('a' as MemoryId, Float32Array.from([1, 0]))).toSucceed();
      expect(await index.add('b' as MemoryId, Float32Array.from([1, 0, 0]))).toFailWith(
        /dimension 3 does not match index dimension 2/i
      );
    });
  });

  describe('query', () => {
    async function seeded(): Promise<InMemoryCosineIndex> {
      const index = InMemoryCosineIndex.create().orThrow();
      (await index.add('a' as MemoryId, Float32Array.from([1, 0]))).orThrow();
      (await index.add('b' as MemoryId, Float32Array.from([0, 1]))).orThrow();
      (await index.add('c' as MemoryId, Float32Array.from([1, 1]))).orThrow();
      return index;
    }

    test('returns hits in descending cosine-similarity order', async () => {
      const index = await seeded();
      expect(await index.query(Float32Array.from([1, 0]), 3)).toSucceedAndSatisfy(
        (hits: ReadonlyArray<IVectorQueryHit>) => {
          expect(hits.map((h) => h.id)).toEqual(['a', 'c', 'b']);
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
          expect(hits.map((h) => h.id)).toEqual(['a', 'c']);
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
      (await index.add('zero' as MemoryId, Float32Array.from([0, 0]))).orThrow();
      (await index.add('unit' as MemoryId, Float32Array.from([1, 0]))).orThrow();
      expect(await index.query(Float32Array.from([1, 0]), 2)).toSucceedAndSatisfy(
        (hits: ReadonlyArray<IVectorQueryHit>) => {
          expect(hits.map((h) => h.id)).toEqual(['unit', 'zero']);
          expect(hits[1].score).toBe(0);
        }
      );
    });

    test('scores against a degenerate (zero-magnitude) query as 0 rather than NaN', async () => {
      const index = InMemoryCosineIndex.create().orThrow();
      (await index.add('unit' as MemoryId, Float32Array.from([1, 0]))).orThrow();
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
      (await index.add('a' as MemoryId, Float32Array.from([1, 0]))).orThrow();
      (await index.add('b' as MemoryId, Float32Array.from([0, 1]))).orThrow();
      expect(await index.remove('a' as MemoryId)).toSucceedWith('a' as MemoryId);
      expect(index.size).toBe(1);
      expect(await index.query(Float32Array.from([1, 0]), 5)).toSucceedAndSatisfy(
        (hits: ReadonlyArray<IVectorQueryHit>) => {
          expect(hits.map((h) => h.id)).toEqual(['b']);
        }
      );
    });

    test('is idempotent — removing an absent id still succeeds', async () => {
      const index = InMemoryCosineIndex.create().orThrow();
      expect(await index.remove('missing' as MemoryId)).toSucceedWith('missing' as MemoryId);
    });
  });

  describe('rebuild', () => {
    const embed = (r: IMemoryRecord<unknown>): Promise<Result<Float32Array>> => {
      // Deterministic: encode the id's first char code into a 2-vector.
      const code: number = (r.envelope.id as string).charCodeAt(0);
      return Promise.resolve(succeed(Float32Array.from([code, 1])));
    };

    test('re-embeds every record from the source and reports the count', async () => {
      const index = InMemoryCosineIndex.create().orThrow();
      const source = new FakeSource(succeed([record('a'), record('b'), record('c')]));
      expect(await index.rebuild(source, embed)).toSucceedWith(3);
      expect(index.size).toBe(3);
      expect(await index.query(Float32Array.from([99, 1]), 1)).toSucceedAndSatisfy(
        (hits: ReadonlyArray<IVectorQueryHit>) => {
          // 'c' = char code 99, the closest to the query vector.
          expect(hits[0].id).toBe('c');
        }
      );
    });

    test('clears prior contents and re-establishes the dimension', async () => {
      const index = InMemoryCosineIndex.create().orThrow();
      // Seed a 3-dim vector, then rebuild with a 2-dim embedder.
      (await index.add('old' as MemoryId, Float32Array.from([1, 2, 3]))).orThrow();
      const source = new FakeSource(succeed([record('a')]));
      expect(await index.rebuild(source, embed)).toSucceedWith(1);
      expect(index.size).toBe(1);
      // The 2-dim query now succeeds (dimension was reset by rebuild).
      expect(await index.query(Float32Array.from([97, 1]), 1)).toSucceed();
    });

    test('fails loudly when the source list fails', async () => {
      const index = InMemoryCosineIndex.create().orThrow();
      const source = new FakeSource(fail('disk gone'));
      expect(await index.rebuild(source, embed)).toFailWith(/failed to list records: disk gone/i);
    });

    test('fails loudly and rolls back to empty when an embedding fails mid-rebuild', async () => {
      const index = InMemoryCosineIndex.create().orThrow();
      // Seed an existing entry so the rollback (not merely "stayed empty") is observable.
      (await index.add('seed' as MemoryId, Float32Array.from([1, 1]))).orThrow();
      // First record embeds fine, the second fails — so a naive impl would leave
      // record 'a' indexed; the rollback must clear it.
      let calls: number = 0;
      const flakyEmbed = (r: IMemoryRecord<unknown>): Promise<Result<Float32Array>> => {
        calls += 1;
        return Promise.resolve(calls === 1 ? succeed(Float32Array.from([1, 1])) : fail('no model'));
      };
      const source = new FakeSource(succeed([record('a'), record('b')]));
      expect(await index.rebuild(source, flakyEmbed)).toFailWith(/embedding 'b' failed: no model/i);
      expect(index.size).toBe(0);
    });

    test('fails loudly and rolls back to empty when adding an embedded vector fails', async () => {
      const index = InMemoryCosineIndex.create().orThrow();
      const source = new FakeSource(succeed([record('a')]));
      const emptyEmbed = (): Promise<Result<Float32Array>> => Promise.resolve(succeed(new Float32Array(0)));
      expect(await index.rebuild(source, emptyEmbed)).toFailWith(/empty vector/i);
      expect(index.size).toBe(0);
    });
  });
});
