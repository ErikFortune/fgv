/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { taskListDetails } from '../converters';
import {
  IListCompletionReport,
  IListCompletionRequest,
  IResolvedTaskCommitRecord,
  ITaskMutationResult,
  OperationId,
  TaskFailureCode,
  TaskId,
  TaskResult,
  TaskRevision
} from '../types';
import { AccessContext } from './access';
import { readExisting, runCatalogMutation } from './catalogMutation';
import { completion, requireOpen } from './catalogOperations';
import { BrokerCore, revisionOf } from './core';
import { codeOf, ok, propagate, taskFailure } from './failures';

/**
 * Failures that mean "this candidate does not complete now" rather than "the pass cannot
 * continue": the principal may not see or complete it, it no longer qualifies, or it moved.
 */
const skippable: ReadonlySet<TaskFailureCode | undefined> = new Set<TaskFailureCode | undefined>([
  'not-found-or-denied',
  'conflict',
  'unsupported'
]);

/** Refuses a list that does not complete automatically. */
function _automatic(record: IResolvedTaskCommitRecord): TaskResult<true> {
  const automatic: boolean = taskListDetails
    .convert(record.task.details)
    .onSuccess((details) => ok(details.completion === 'all-children-succeeded'))
    .orDefault(false);
  return automatic
    ? ok(true)
    : taskFailure(
        `list ${record.task.envelope.id}: does not complete automatically`,
        'unsupported',
        'after-host-action'
      );
}

/**
 * The idempotency key of an automatic completion: the list and the revision it became eligible
 * at. A retry at the same revision replays; a list that has moved gets a new key.
 */
function _completionKey(revision: TaskRevision): OperationId {
  return `complete-list-r${revision}` as OperationId;
}

/**
 * One pass of the host-driven list-completion pump.
 *
 * @remarks
 * Candidates come from the repository's completion-candidate index, which every commit maintains
 * and every open or rebuild reconstructs from the records — so a crash between a last child's
 * success and its list's completion leaves a candidate here. Each candidate is completed through
 * the ordinary catalog pipeline: visible to this principal, authorized for `complete-list`, and
 * rechecked inside the writer against the **complete authoritative child set** as it is then. A
 * candidate that does not qualify at that moment is left alone. The pump starts no work, installs
 * no timer, and completes nothing the host did not ask it to pump.
 * @internal
 */
export async function reconcileListCompletions(
  core: BrokerCore,
  ctx: AccessContext,
  input: unknown
): Promise<TaskResult<IListCompletionReport>> {
  const converted = core.converters.broker.listCompletion.convert(input);
  if (converted.isFailure()) {
    return taskFailure(`reconcileListCompletions: ${converted.message}`, 'invalid', 'after-host-action');
  }
  const request: IListCompletionRequest = converted.value;
  const candidates = await core.repository.listCompletionCandidates(request);
  if (candidates.isFailure()) {
    return propagate(candidates);
  }
  const completed: ITaskMutationResult[] = [];
  for (const id of candidates.value) {
    const outcome = await _completeOne(core, ctx, id);
    if (outcome.isFailure()) {
      if (skippable.has(codeOf(outcome))) {
        continue;
      }
      return propagate(outcome);
    }
    completed.push(outcome.value);
  }
  const next: TaskId | undefined =
    candidates.value.length === request.limit ? candidates.value[candidates.value.length - 1] : undefined;
  return ok({ completed, ...(next !== undefined ? { next } : {}) });
}

async function _completeOne(
  core: BrokerCore,
  ctx: AccessContext,
  id: TaskId
): Promise<TaskResult<ITaskMutationResult>> {
  const read = await readExisting(core, id);
  if (read.isFailure()) {
    return propagate(read);
  }
  const revision: TaskRevision = revisionOf(read.value);
  const identity = { taskId: id, operationId: _completionKey(revision), expectedRevision: revision };
  const json = core.toJson({ ...identity, completion: 'all-children-succeeded' });
  if (json.isFailure()) {
    return propagate(json);
  }
  return runCatalogMutation(core, ctx, {
    action: 'complete-list',
    operation: 'complete-list',
    identity,
    request: json.value,
    receiptConverter: core.converters.broker.mutationResult,
    admit: (record) => requireOpen(record, 'it is already complete').onSuccess(() => _automatic(record)),
    evaluate: (current) =>
      completion(
        core,
        current,
        (count) => ({ summary: `All ${count} child task(s) succeeded.`, artifacts: [] }),
        true
      ),
    receipt: (base) => base
  });
}
