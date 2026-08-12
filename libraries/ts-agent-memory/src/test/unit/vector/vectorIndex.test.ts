/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { Result, fail, succeed } from '@fgv/ts-utils';
import {
  IEdgeTarget,
  IMemoryRecordSource,
  IVectorIndex,
  IVectorQueryHit,
  IVectorRebuildReport,
  MemoryEmbedder,
  MemoryId,
  MemoryScopeKey,
  edgeTargetKey
} from '../../../index';

function target(scope: string, id: string): IEdgeTarget {
  return { scope: scope as MemoryScopeKey, id: id as MemoryId };
}

/**
 * A trivial conforming implementation, present to verify the {@link IVectorIndex}
 * seam is usable end-to-end with scope-qualified targets.
 */
class StubVectorIndex implements IVectorIndex {
  private readonly _vectors: Map<string, IEdgeTarget> = new Map();

  public add(t: IEdgeTarget, vector: Float32Array): Promise<Result<string>> {
    const key: string = edgeTargetKey(t);
    this._vectors.set(key, t);
    return Promise.resolve(succeed(`ref-${key}`));
  }

  public remove(t: IEdgeTarget): Promise<Result<IEdgeTarget>> {
    this._vectors.delete(edgeTargetKey(t));
    return Promise.resolve(succeed(t));
  }

  public query(vector: Float32Array, topK: number): Promise<Result<ReadonlyArray<IVectorQueryHit>>> {
    const hits: IVectorQueryHit[] = Array.from(this._vectors.values())
      .map((t) => ({ target: t, score: vector.length }))
      .slice(0, topK);
    return Promise.resolve(succeed(hits));
  }

  public get size(): number {
    return this._vectors.size;
  }

  public async rebuild(
    source: IMemoryRecordSource,
    embed: MemoryEmbedder
  ): Promise<Result<IVectorRebuildReport>> {
    const listed = await source.list();
    if (listed.isFailure()) {
      // Deliberately BEFORE the clear, mirroring the contract both shipped
      // implementations follow: a failed list is no evidence about the vectors
      // already held, so it must not destroy a healthy index.
      return fail(listed.message);
    }
    this._vectors.clear();
    let indexed: number = 0;
    let declined: number = 0;
    for (const scoped of listed.value) {
      const embedded = await embed(scoped.record);
      if (embedded.isFailure()) {
        return fail(embedded.message);
      }
      if (embedded.value === undefined) {
        declined++;
        continue;
      }
      (await this.add(scoped.target, embedded.value)).orThrow();
      indexed++;
    }
    return succeed({ indexed, declined, skipped: [] });
  }
}

describe('IVectorIndex seam', () => {
  test('a conforming implementation supports add / query / remove on scoped targets', async () => {
    const index = new StubVectorIndex();
    const a = target('conv-a', 'turn-3');
    const b = target('conv-b', 'turn-3');
    expect(await index.add(a, Float32Array.from([1, 2, 3]))).toSucceedWith(`ref-${edgeTargetKey(a)}`);
    expect(await index.add(b, Float32Array.from([4, 5, 6]))).toSucceedWith(`ref-${edgeTargetKey(b)}`);
    expect(await index.query(Float32Array.from([0.1, 0.2]), 2)).toSucceedAndSatisfy(
      (hits: ReadonlyArray<IVectorQueryHit>) => {
        // Both same-stem-different-scope targets are distinct entries.
        expect(hits).toHaveLength(2);
        expect(hits.map((h) => h.target)).toEqual(expect.arrayContaining([a, b]));
        expect(hits[0].score).toBe(2);
      }
    );
    expect(await index.remove(a)).toSucceedWith(a);
  });

  test('a conforming rebuild leaves an already-populated index intact when the source cannot list', async () => {
    // The seam-level statement of the rule both shipped implementations follow.
    // Asserted here because the stub is what a third-party implementer reads to
    // learn the contract, and it previously modelled the opposite.
    const index = new StubVectorIndex();
    (await index.add(target('conv-a', 'turn-1'), Float32Array.from([1, 2, 3]))).orThrow();
    expect(index.size).toBe(1);

    const unreadable: IMemoryRecordSource = {
      list: () => Promise.resolve(fail('disk gone'))
    };
    expect(
      await index.rebuild(unreadable, () => Promise.resolve(succeed(Float32Array.from([1]))))
    ).toFailWith(/disk gone/i);
    expect(index.size).toBe(1);
  });
});
