/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Result, captureAsyncResult } from '@fgv/ts-utils';
import { Kind } from '@fgv/ts-agent-memory';

/**
 * Invoke a consumer-supplied hook that already returns a `Result`, converting a
 * synchronous throw or a promise rejection into a `Failure` rather than letting
 * it escape.
 *
 * @remarks
 * Package-internal. `@fgv/ts-agent-memory` carries an identical private copy for
 * its in-memory indexes. Exporting a single `AsyncDeferredResult`-invoking
 * primitive from `ts-utils` is the right home and is recorded in
 * `docs/TECH_DEBT.md`; this module exists because *both* index classes in *this*
 * package now need it, which is the point at which a second in-package copy stops
 * being the cheaper thing.
 */
export async function invokeHook<T>(hook: () => Promise<Result<T>>): Promise<Result<T>> {
  return (await captureAsyncResult(hook)).onSuccess((inner) => inner);
}

/**
 * Compose the failure that aborted a rebuild with the outcome of the rollback
 * that followed it.
 *
 * @remarks
 * A rollback that ALSO fails is worth saying out loud: the `'fail'` path promises
 * an empty index, and a caller that retries against a table which is neither the
 * old index nor empty is working from a state the contract never described. This
 * matters more here than in the in-memory package — these tables are **durable**,
 * so a botched rollback survives the process.
 */
export function withRollbackNote(error: string, rollback: Result<true>): string {
  return rollback.isFailure() ? `${error} (rollback also failed: ${rollback.message})` : error;
}

/**
 * Increment `kind`'s tally by `by` (default one).
 *
 * @remarks
 * The `by` parameter exists for the fragment lane, whose `fragments` count
 * accumulates a fan-out rather than a record count — the one place a rebuild adds
 * more than one per record.
 */
export function tally(counts: Map<Kind, number>, kind: Kind, by: number = 1): void {
  counts.set(kind, (counts.get(kind) ?? 0) + by);
}
