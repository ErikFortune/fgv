/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Result } from '@fgv/ts-utils';
import { IMemoryRecord } from './envelope';
import { MemoryId, MemoryScopeKey } from './ids';

/**
 * Materializes one record's body from its scope-qualified address — the other
 * half of the partial-read split, and the narrowest seam that can be.
 *
 * @remarks
 * The index holds `IIndexedMemoryEntry` (scope + envelope, no body), so anything
 * that *selects* works from envelopes and anything that must *return records*
 * resolves the survivors through this. `FileTreeMemoryStore` implements it over
 * the same read path `getById` uses, so a resolved record is byte-identical to a
 * keyed read, verification included.
 *
 * **Deliberately one method, and deliberately not the store.** A retriever needs
 * exactly this capability; handing it an `IMemoryStore` would hand it `put` and
 * `delete` as well, and would invert the construction direction (the store builds
 * retrievers today, not the reverse). One method also keeps a test double
 * trivial.
 *
 * Synchronous `Result` rather than `Promise<Result>` because every shipped
 * `FileTree` backend resolves without awaiting, and an async signature here would
 * have rippled through retrievers that are otherwise synchronous over the index.
 * A future backend that genuinely needs I/O should be adapted at its own boundary
 * rather than by making this contract async for everyone.
 *
 * Resolving an address the vault does not hold is `succeed(undefined)`, not a
 * failure — an entry can legitimately vanish between selection and
 * materialization (a concurrent delete), and that is a miss rather than a fault.
 * A failure means the record is there and could not be read.
 * @public
 */
export interface IMemoryRecordResolver {
  /**
   * The record at `(scope, id)`, or `undefined` if the vault does not hold one.
   */
  resolveRecord(scope: MemoryScopeKey, id: MemoryId): Result<IMemoryRecord<unknown> | undefined>;
}
