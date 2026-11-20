/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Result, captureAsyncResult } from '@fgv/ts-utils';
import { Kind } from '../types';

/**
 * Invoke a consumer-supplied hook that already returns a `Result`, converting a
 * synchronous throw or a promise rejection into a `Failure` rather than letting
 * it escape. `captureAsyncResult` wraps the hook's own `Result`, so the outcome
 * is flattened back to one level.
 *
 * @remarks
 * Package-internal, and deliberately not exported from the package surface: both
 * shipped index implementations need it, which is what moved it out of
 * `inMemoryCosineIndex.ts`, but publishing it would invite treating the
 * invocation shape as part of the `IVectorIndex` contract when only the report
 * is.
 */
export async function invokeHook<T>(hook: () => Promise<Result<T>>): Promise<Result<T>> {
  return (await captureAsyncResult(hook)).onSuccess((inner) => inner);
}

/**
 * Increment `kind`'s tally by `by` (default one).
 *
 * @remarks
 * Package-internal for the same reason as {@link invokeHook}: publishing a
 * mutation primitive would buy nothing a caller could not write, and would invite
 * treating the accumulation shape as contractual.
 *
 * The `by` parameter exists for the fragment lane, whose `fragments` count
 * accumulates a fan-out rather than a record count — the one place a rebuild adds
 * more than one per record.
 */
export function tally(counts: Map<Kind, number>, kind: Kind, by: number = 1): void {
  counts.set(kind, (counts.get(kind) ?? 0) + by);
}
