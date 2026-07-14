/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { Result, succeed } from '@fgv/ts-utils';
import {
  IEdgeTarget,
  IVectorIndex,
  IVectorQueryHit,
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
});
