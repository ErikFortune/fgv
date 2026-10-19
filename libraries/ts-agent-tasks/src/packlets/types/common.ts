/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Instant } from './ids';

/**
 * A `(namespace, key)` label used to select tasks. A scope is a label only: it
 * grants no permission and confers no access.
 * @public
 */
export interface ITaskScope {
  readonly namespace: string;
  readonly key: string;
}

/**
 * A `(namespace, key)` reference to whoever is currently responsible for a task.
 * Independent of scopes, and likewise not a grant of permission.
 * @public
 */
export interface IResponsibility {
  readonly namespace: string;
  readonly key: string;
}

/**
 * An opaque host-owned reference carried alongside a task — an artifact, or something
 * wanting attention.
 *
 * @remarks
 * A reference carries identity only. It is never automatic permission to dereference
 * whatever it names, and the library never dereferences one. Waiting state carries
 * exactly these and nothing more: there is no input-request or answer protocol.
 * @public
 */
export interface ITaskReference {
  readonly namespace: string;
  readonly key: string;
}

/**
 * What a parent asks of its subtree when it is stopped. Broker-owned envelope metadata,
 * chosen at creation and immutable in v1.
 * @public
 */
export type ParentStopPolicy = 'none' | 'cascade-pause' | 'cascade-cancel';

/**
 * A coded, human-readable explanation attached to a non-running lifecycle state.
 * @public
 */
export interface ITaskReason {
  readonly code: string;
  readonly summary: string;
  readonly attention?: ReadonlyArray<ITaskReference>;
}

/**
 * A {@link ITaskReason} for a waiting task, optionally naming the earliest instant at
 * which the wait could end.
 * @public
 */
export interface IWaitingReason extends ITaskReason {
  readonly notBefore?: Instant;
}

/**
 * Optional, advisory progress. Numeric completion never auto-succeeds a task, and an
 * unknown total is absent rather than zero.
 * @public
 */
export interface ITaskProgress {
  readonly phase?: string;
  readonly completed?: number;
  readonly total?: number;
  readonly unit?: string;
  readonly summary?: string;
}

/**
 * The immutable execution outcome of a task that reached a terminal state.
 * @public
 */
export interface ITaskOutcome {
  readonly summary: string;
  readonly artifacts: ReadonlyArray<ITaskReference>;
}
