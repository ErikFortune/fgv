/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { taskListDetails } from '../converters';
import {
  IListCompletionReport,
  IListCompletionRequest,
  IResolvedTaskCommitRecord,
  ITaskCommitRecord,
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
import { BrokerCore, revisionOf, storedOperation } from './core';
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
 * The idempotency key of an automatic completion: derived from the revision the list became
 * eligible at, so a list that has moved gets a new key.
 *
 * @remarks
 * Operation ids are caller-chosen, and an operation that changes nothing records its id without
 * moving the revision, so the derived key may already hold another operation. The key is then
 * the next free one in a fixed sequence. Each collision is a distinct stored operation, so the
 * search is bounded by the record's operations. A concurrent pump that commits under the same key
 * first is answered by the pipeline's own replay.
 */
function _completionKey(record: ITaskCommitRecord): OperationId {
  const base: string = `complete-list-r${revisionOf(record)}`;
  let key: string = base;
  for (let attempt = 1; storedOperation(record, key as OperationId) !== undefined; attempt++) {
    key = `${base}-${attempt}`;
  }
  return key as OperationId;
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
  // The continuation is opaque and bound to this view and policy: the candidate it resumes after
  // may be one this principal cannot see.
  const epoch = ctx.epoch();
  if (epoch.isFailure()) {
    return propagate(epoch);
  }
  let after: TaskId | undefined = undefined;
  if (request.after !== undefined) {
    const resolved = core.pumpCursors.resolve(request.after, ctx.view, epoch.value);
    if (resolved.isFailure()) {
      return propagate(resolved);
    }
    after = resolved.value;
  }
  const candidates = await core.repository.listCompletionCandidates({
    limit: request.limit,
    ...(after !== undefined ? { after } : {})
  });
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
  return ok({
    completed,
    ...(next !== undefined ? { next: core.pumpCursors.issue(ctx.view, epoch.value, next) } : {})
  });
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
  const operationId: OperationId = _completionKey(read.value);
  const identity = { taskId: id, operationId, expectedRevision: revision };
  return runCatalogMutation(core, ctx, {
    action: 'complete-list',
    operation: 'complete-list',
    identity,
    request: { ...identity, completion: 'all-children-succeeded' },
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
