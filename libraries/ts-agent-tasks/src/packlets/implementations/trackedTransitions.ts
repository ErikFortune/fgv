/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Hash, Result } from '@fgv/ts-utils';
import { OptionalEnvelopeChanges, withEnvelopeFields } from './envelopeFields';
import {
  ITaskEnvelope,
  ITrackedTaskPatch,
  TaskLifecycle,
  TaskLifecycleStatus,
  TrackedCommand,
  UpdateCategory,
  isTerminalTaskStatus
} from '../types';

/**
 * What evaluating one tracked command or patch against a task's current envelope yields.
 * @remarks
 * `changed` carries the next envelope with the revision and `changedAt` left for the caller to
 * advance, and the update categories the change touches. `unchanged` is a same-state semantic
 * no-op: it advances no revision. `rejected` is a well-formed request the transition table does
 * not allow.
 * @public
 */
export type TrackedTransition =
  | {
      readonly disposition: 'changed';
      readonly envelope: ITaskEnvelope;
      readonly categories: ReadonlyArray<UpdateCategory>;
    }
  | { readonly disposition: 'unchanged' }
  | { readonly disposition: 'rejected'; readonly reason: 'invalid-transition' | 'unsupported' };

/**
 * The commands a task list refuses as `unsupported`: a list has no own work to start, suspend or
 * resume, and it succeeds only through list completion, which checks its children.
 * @public
 */
export const listRefusedCommands: ReadonlyArray<TrackedCommand['command']> = [
  'start',
  'wait',
  'pause',
  'resume',
  'succeed'
];

/** Which statuses each lifecycle command may leave. */
const sources: Readonly<Record<'start' | 'wait' | 'pause' | 'resume', ReadonlyArray<TaskLifecycleStatus>>> = {
  start: ['pending'],
  wait: ['pending', 'running', 'paused'],
  pause: ['pending', 'running', 'waiting'],
  resume: ['waiting', 'paused']
};

const normalizer: Hash.Crc32Normalizer = new Hash.Crc32Normalizer();

/**
 * Canonical equality of two converter-validated values. A value that cannot be canonicalized
 * compares unequal, which every caller treats as "a change".
 */
function _same(a: unknown, b: unknown): boolean {
  const left: Result<string> = normalizer.canonicalize(a);
  const right: Result<string> = normalizer.canonicalize(b);
  return left.isSuccess() && right.isSuccess() && left.value === right.value;
}

function _lifecycleChange(envelope: ITaskEnvelope, lifecycle: TaskLifecycle): TrackedTransition {
  const categories: UpdateCategory[] = ['lifecycle'];
  if (isTerminalTaskStatus(lifecycle.status) && 'outcome' in lifecycle && lifecycle.outcome !== undefined) {
    categories.push('result');
  }
  return { disposition: 'changed', envelope: { ...envelope, lifecycle }, categories };
}

/**
 * Applies a lifecycle move to `next`: a transition out of an allowed source status, a same-state
 * no-op, or a refusal. A changed wait or pause reason is a change; an identical one is a no-op.
 * `from` is the source statuses the command may leave; `undefined` means any open status.
 */
function _lifecycle(
  envelope: ITaskEnvelope,
  next: TaskLifecycle,
  from: ReadonlyArray<TaskLifecycleStatus> | undefined
): TrackedTransition {
  const current: TaskLifecycle = envelope.lifecycle;
  if (_same(current, next)) {
    return { disposition: 'unchanged' };
  }
  if (isTerminalTaskStatus(current.status)) {
    // Terminal is absorbing: only an identical restatement (above) is accepted.
    return { disposition: 'rejected', reason: 'invalid-transition' };
  }
  // A same-status move with a different reason (wait → wait, pause → pause) is a change.
  if (from === undefined || from.includes(current.status) || current.status === next.status) {
    return _lifecycleChange(envelope, next);
  }
  return { disposition: 'rejected', reason: 'invalid-transition' };
}

/**
 * Applies a patch of presentable fields. Permitted in open states only: a terminal task's
 * execution presentation is immutable. Fields equal to their current value do not count.
 * @public
 */
export function applyTrackedPatch(envelope: ITaskEnvelope, patch: ITrackedTaskPatch): TrackedTransition {
  if (isTerminalTaskStatus(envelope.lifecycle.status)) {
    return { disposition: 'rejected', reason: 'invalid-transition' };
  }
  const clear: ReadonlyArray<'description' | 'progress'> = patch.clear ?? [];
  const changes: OptionalEnvelopeChanges = {
    ...(patch.description !== undefined ? { description: patch.description } : {}),
    ...(patch.progress !== undefined ? { progress: patch.progress } : {}),
    ...(clear.includes('description') ? { description: undefined } : {}),
    ...(clear.includes('progress') ? { progress: undefined } : {})
  };
  const next: ITaskEnvelope = withEnvelopeFields(
    {
      ...envelope,
      ...(patch.title !== undefined ? { title: patch.title } : {}),
      ...(patch.attention !== undefined ? { attention: patch.attention } : {})
    },
    changes
  );
  const categories: UpdateCategory[] = [];
  if (
    next.title !== envelope.title ||
    !_same(next.description ?? null, envelope.description ?? null) ||
    !_same(next.progress ?? null, envelope.progress ?? null)
  ) {
    categories.push('progress');
  }
  if (!_same(next.attention, envelope.attention)) {
    categories.push('attention');
  }
  return categories.length === 0
    ? { disposition: 'unchanged' }
    : { disposition: 'changed', envelope: next, categories };
}

/**
 * Evaluates one `fgv.tracked@1` command against a task's current envelope.
 *
 * @remarks
 * The table (design §5):
 *
 * | command | from | to |
 * |---|---|---|
 * | `start` | pending | running |
 * | `wait` | pending, running, paused (or waiting, with a different reason) | waiting |
 * | `pause` | pending, running, waiting (or paused, with a different reason) | paused |
 * | `resume` | waiting, paused | running |
 * | `succeed` / `fail` / `cancel` | any open state | the terminal state |
 * | `set-*` | any open state | the same state, field changed |
 *
 * Restating the current state exactly is a no-op; terminal states are absorbing. A task list
 * (`list: true`) refuses {@link listRefusedCommands} as `unsupported`.
 * @public
 */
export function evaluateTrackedCommand(
  envelope: ITaskEnvelope,
  command: TrackedCommand,
  options: { readonly list: boolean }
): TrackedTransition {
  if (options.list && listRefusedCommands.includes(command.command)) {
    return { disposition: 'rejected', reason: 'unsupported' };
  }
  switch (command.command) {
    case 'start':
      return _lifecycle(envelope, { status: 'running' }, sources.start);
    case 'resume':
      return _lifecycle(envelope, { status: 'running' }, sources.resume);
    case 'wait':
      return _lifecycle(envelope, { status: 'waiting', reason: command.parameters.reason }, sources.wait);
    case 'pause':
      return _lifecycle(envelope, { status: 'paused', reason: command.parameters.reason }, sources.pause);
    case 'succeed':
      return _lifecycle(envelope, { status: 'succeeded', outcome: command.parameters.outcome }, undefined);
    case 'fail':
    case 'cancel':
      return _lifecycle(
        envelope,
        {
          status: command.command === 'fail' ? 'failed' : 'cancelled',
          reason: command.parameters.reason,
          ...(command.parameters.outcome !== undefined ? { outcome: command.parameters.outcome } : {})
        },
        undefined
      );
    case 'set-title':
      return applyTrackedPatch(envelope, { title: command.parameters.title });
    case 'set-description':
      return applyTrackedPatch(
        envelope,
        command.parameters.description !== undefined
          ? { description: command.parameters.description }
          : { clear: ['description'] }
      );
    case 'set-progress':
      return applyTrackedPatch(
        envelope,
        command.parameters.progress !== undefined
          ? { progress: command.parameters.progress }
          : { clear: ['progress'] }
      );
    case 'set-attention':
      return applyTrackedPatch(envelope, { attention: command.parameters.attention });
  }
}

/**
 * The commands a task in this state could run without being refused by the transition table,
 * before any authorization.
 * @public
 */
export function availableTrackedCommands(
  status: TaskLifecycleStatus,
  options: { readonly list: boolean }
): ReadonlyArray<TrackedCommand['command']> {
  if (isTerminalTaskStatus(status)) {
    return [];
  }
  // wait and pause are open from every open state: from their own state they restate a reason.
  const lifecycle: Array<TrackedCommand['command']> = [
    ...(sources.start.includes(status) ? ['start' as const] : []),
    'wait',
    'pause',
    ...(sources.resume.includes(status) ? ['resume' as const] : [])
  ];
  const all: Array<TrackedCommand['command']> = [
    ...lifecycle,
    'succeed',
    'fail',
    'cancel',
    'set-title',
    'set-description',
    'set-progress',
    'set-attention'
  ];
  return options.list ? all.filter((c) => !listRefusedCommands.includes(c)) : all;
}
