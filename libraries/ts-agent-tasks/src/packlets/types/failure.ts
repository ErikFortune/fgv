/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { DetailedResult } from '@fgv/ts-utils';
import { OperationId } from './ids';

/**
 * The capacity dimensions checked together at admission. Whichever fills first governs.
 * @public
 */
export type CapacityDimension =
  | 'retained-tasks'
  | 'non-archived-tasks'
  | 'subscriptions'
  | 'sources'
  | 'updates'
  | 'audience-links'
  | 'acknowledgement-ids'
  | 'operations'
  | 'record-bytes'
  | 'logical-bytes'
  | 'resident-payload-bytes';

/**
 * Every capacity dimension, in the order the profile declares them.
 * @public
 */
export const allCapacityDimensions: ReadonlyArray<CapacityDimension> = [
  'retained-tasks',
  'non-archived-tasks',
  'subscriptions',
  'sources',
  'updates',
  'audience-links',
  'acknowledgement-ids',
  'operations',
  'record-bytes',
  'logical-bytes',
  'resident-payload-bytes'
];

/**
 * Structured detail accompanying a `backpressure` failure.
 *
 * @remarks
 * `reclaimableByCleanup` is what tells a host whether draining would help or whether
 * the limiting dimension is a lifetime one — retained identities, exact acknowledgement
 * history and dedup evidence are not released by cleanup.
 * @public
 */
export interface ICapacityFailure {
  readonly reason: 'capacity-exhausted';
  readonly dimension: CapacityDimension;
  readonly recordId?: string;
  readonly used: number;
  readonly reserved: number;
  readonly requested: number;
  readonly limit: number;
  readonly reclaimableByCleanup: boolean;
}

/**
 * The classified failure codes every task operation reports.
 *
 * @remarks
 * `not-found-or-denied` is deliberately one code: a foreign identity and a hidden one
 * must be indistinguishable. `commit-indeterminate` says the durable effect may or may
 * not exist and carries the operation ID to resolve it by.
 * @public
 */
export type TaskFailureCode =
  | 'invalid'
  | 'not-found-or-denied'
  | 'conflict'
  | 'unsupported'
  | 'storage-unavailable'
  | 'storage-corrupt'
  | 'commit-indeterminate'
  | 'source-unavailable'
  | 'source-gap'
  | 'unknown-kind-version'
  | 'invalid-receipt'
  | 'cursor-stale'
  | 'retention-blocked'
  | 'backpressure';

/**
 * Every task failure code.
 * @public
 */
export const allTaskFailureCodes: ReadonlyArray<TaskFailureCode> = [
  'invalid',
  'not-found-or-denied',
  'conflict',
  'unsupported',
  'storage-unavailable',
  'storage-corrupt',
  'commit-indeterminate',
  'source-unavailable',
  'source-gap',
  'unknown-kind-version',
  'invalid-receipt',
  'cursor-stale',
  'retention-blocked',
  'backpressure'
];

/**
 * Classified detail for a failed task operation.
 *
 * @remarks
 * `capacity` accompanies `backpressure` and no other code; the converter enforces that.
 * @public
 */
export interface ITaskFailure {
  readonly code: TaskFailureCode;
  readonly operationId?: OperationId;
  readonly retry: 'safe' | 'reconcile-first' | 'after-host-action';
  readonly capacity?: ICapacityFailure;
}

/**
 * The detailed result type every fallible task operation returns.
 * @public
 */
export type TaskResult<T> = DetailedResult<T, ITaskFailure>;
