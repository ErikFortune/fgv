/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { Result, succeed } from '@fgv/ts-utils';
import { IVectorIndex, IVectorQueryHit, MemoryId } from '../../../index';

/**
 * A trivial conforming implementation, present to verify the {@link IVectorIndex}
 * seam is usable end-to-end (the in-package cosine impl is a post-v1 fast-follow).
 */
class StubVectorIndex implements IVectorIndex {
  private readonly _vectors: Map<MemoryId, ReadonlyArray<number>> = new Map();

  public add(id: MemoryId, vector: ReadonlyArray<number>): Promise<Result<string>> {
    this._vectors.set(id, vector);
    return Promise.resolve(succeed(`ref-${id}`));
  }

  public remove(id: MemoryId): Promise<Result<MemoryId>> {
    this._vectors.delete(id);
    return Promise.resolve(succeed(id));
  }

  public query(vector: ReadonlyArray<number>, topK: number): Promise<Result<ReadonlyArray<IVectorQueryHit>>> {
    const hits: IVectorQueryHit[] = Array.from(this._vectors.keys())
      .map((id) => ({ id, score: vector.length }))
      .slice(0, topK);
    return Promise.resolve(succeed(hits));
  }
}

describe('IVectorIndex seam', () => {
  test('a conforming implementation supports add / query / remove', async () => {
    const index = new StubVectorIndex();
    expect(await index.add('a' as MemoryId, [1, 2, 3])).toSucceedWith('ref-a');
    expect(await index.add('b' as MemoryId, [4, 5, 6])).toSucceedWith('ref-b');
    expect(await index.query([0.1, 0.2], 1)).toSucceedAndSatisfy((hits: ReadonlyArray<IVectorQueryHit>) => {
      expect(hits).toHaveLength(1);
      expect(hits[0].score).toBe(2);
    });
    expect(await index.remove('a' as MemoryId)).toSucceedWith('a' as MemoryId);
  });
});
