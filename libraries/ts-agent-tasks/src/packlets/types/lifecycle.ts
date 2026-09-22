/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { ITaskOutcome, ITaskReason, IWaitingReason } from './common';

/**
 * The seven lifecycle states. `succeeded`, `failed` and `cancelled` are terminal and
 * absorbing in v1.
 * @public
 */
export type TaskLifecycleStatus =
  | 'pending'
  | 'running'
  | 'waiting'
  | 'paused'
  | 'succeeded'
  | 'failed'
  | 'cancelled';

/**
 * Execution lifecycle of a task, discriminated on `status`.
 *
 * @remarks
 * The payload each state carries is what makes the state meaningful: a waiting task
 * must say what it waits for, a succeeded task must carry its outcome. Observation
 * health is deliberately *not* part of this union — a source outage cannot move a task
 * through its lifecycle.
 * @public
 */
export type TaskLifecycle =
  | { readonly status: 'pending' | 'running' }
  | { readonly status: 'waiting'; readonly reason: IWaitingReason }
  | { readonly status: 'paused'; readonly reason: ITaskReason }
  | { readonly status: 'succeeded'; readonly outcome: ITaskOutcome }
  | {
      readonly status: 'failed' | 'cancelled';
      readonly reason: ITaskReason;
      readonly outcome?: ITaskOutcome;
    };

/**
 * The lifecycle statuses that are terminal and absorbing.
 * @public
 */
export const terminalTaskStatuses: ReadonlyArray<TaskLifecycleStatus> = ['succeeded', 'failed', 'cancelled'];

/**
 * The lifecycle statuses that describe open work.
 * @public
 */
export const openTaskStatuses: ReadonlyArray<TaskLifecycleStatus> = [
  'pending',
  'running',
  'waiting',
  'paused'
];

/**
 * All seven lifecycle statuses, open first.
 * @public
 */
export const allTaskStatuses: ReadonlyArray<TaskLifecycleStatus> = [
  ...openTaskStatuses,
  ...terminalTaskStatuses
];

/**
 * Returns `true` if `status` is terminal.
 * @public
 */
export function isTerminalTaskStatus(status: TaskLifecycleStatus): boolean {
  return terminalTaskStatuses.includes(status);
}
