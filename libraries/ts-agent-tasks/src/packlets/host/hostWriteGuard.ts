/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Result, captureAsyncResult, fail } from '@fgv/ts-utils';

/**
 * A cooperative write gate a host gives a host helper ({@link TaskDeliveryPump},
 * {@link DeferredObligations}) — structural, so any gate with this shape fits.
 *
 * @remarks
 * A helper hands the gate **one whole helper operation** — a pump pass, an acknowledgement and its
 * follow-up, a deferral's create and wait — and the gate runs it at most once, or refuses it. That
 * is a different layer from the broker's own `writeGuard` (`ITaskWriteGuard`, given to
 * `TaskBroker.create`), which wraps **each serialized writer section** inside the broker:
 *
 * - **Helper guard only** — the gate sees helper operations whole. A pause cannot fall between a
 *   pump's release and its disposal, but it does not see broker writes made outside the helpers.
 * - **Broker `writeGuard` only** — every broker write passes the gate, the helpers' included, but a
 *   pause can fall between two sections of one helper operation. Every helper operation is written
 *   to be safe across that: each step is idempotent, or presents the work again.
 * - **Both, with one gate** — the helper's operation is in flight *at* the gate while its sections
 *   wait *behind* it. A gate that holds new writes until in-flight ones finish (a snapshot pause)
 *   then waits on an operation that is itself waiting on the gate, and only its own timeout ends
 *   the wait. Give one gate to one layer, or a gate that admits a section of an operation it has
 *   already admitted.
 * @public
 */
export interface ITaskHostWriteGuard {
  guard<T>(write: () => Promise<Result<T>>): Promise<Result<T>>;
}

/**
 * Runs `write` through `guard` when there is one. A gate that throws or rejects is a failure, never
 * an exception out of the helper.
 * @internal
 */
export async function guarded<T>(
  guard: ITaskHostWriteGuard | undefined,
  write: () => Promise<Result<T>>
): Promise<Result<T>> {
  if (guard === undefined) {
    return write();
  }
  const outcome: Result<Result<T>> = await captureAsyncResult(() => guard.guard(write));
  return outcome.isSuccess() ? outcome.value : fail(`write guard threw: ${outcome.message}`);
}
