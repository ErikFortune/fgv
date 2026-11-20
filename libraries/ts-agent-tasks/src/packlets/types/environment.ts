/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Logging, Result } from '@fgv/ts-utils';
import { Instant, OperationId, SubscriptionId, TaskId } from './ids';

/**
 * The three ambient capabilities a host injects. The library constructs none of them.
 *
 * @remarks
 * `clock` returns epoch milliseconds; `newId` is Result-valued because identity
 * generation is fallible at the boundary (an exhausted or unavailable crypto source is
 * a failure, not an exception). Nothing here opens a repository or registers global
 * state — importing this library has no side effects.
 * @public
 */
export interface ITaskEnvironmentParams {
  readonly logger: Logging.ILogger;
  readonly clock: () => number;
  readonly newId: () => Result<string>;
}

/**
 * A validated {@link ITaskEnvironmentParams} that mints branded values through the
 * library's own converters.
 * @public
 */
export interface ITaskEnvironment extends ITaskEnvironmentParams {
  /** The current instant, canonicalized and validated. */
  now(): Result<Instant>;
  newTaskId(): Result<TaskId>;
  newOperationId(): Result<OperationId>;
  newSubscriptionId(): Result<SubscriptionId>;
}
