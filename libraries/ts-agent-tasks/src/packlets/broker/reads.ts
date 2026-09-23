/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { JsonValue } from '@fgv/ts-json-base';
import { availableTrackedCommands } from '../implementations';
import {
  IBoundTaskPage,
  IBoundTaskQuery,
  IProjectedTaskSummary,
  IProjectedUnresolvedReference,
  ITaskPage,
  ITaskSelection,
  PageCursor,
  TaskInspection,
  TaskResult,
  taskListKind
} from '../types';
import { AccessContext, AccessSubject, subjectOf } from './access';
import { readExisting } from './catalogMutation';
import { isNativeKind } from './catalogOperations';
import { BrokerCore } from './core';
import { changedSinceAuthorized, notFound, ok, propagate, taskFailure } from './failures';
import { projectDetails, projectEnvelope, projectReference } from './projection';

/** The one issue a view reports when the repository could not present some candidates. */
const unreadableIssue: string = 'some tasks within this view could not be read; the page may be incomplete';

/**
 * A bound view's query.
 *
 * @remarks
 * The repository selects by the **view's** scopes — a caller supplies only narrowing filters —
 * and every candidate is then authorized and projected before inclusion. Denied candidates are
 * dropped and never counted; repository issues (which name tasks) are reduced to one generic
 * line; the page carries no repository generation. The cursor is a view handle bound to this
 * view and to the policy epoch the page was answered under, and a policy change during the page
 * fails it rather than mixing two policies.
 * @internal
 */
export async function queryView(
  core: BrokerCore,
  ctx: AccessContext,
  input: unknown
): Promise<TaskResult<IBoundTaskPage>> {
  const converted = core.converters.broker.boundQuery.convert(input);
  if (converted.isFailure()) {
    return taskFailure(`query: ${converted.message}`, 'invalid', 'after-host-action');
  }
  const request: IBoundTaskQuery = converted.value;
  const epoch = ctx.epoch();
  if (epoch.isFailure()) {
    return propagate(epoch);
  }
  let inner: PageCursor | undefined = undefined;
  if (request.cursor !== undefined) {
    const resolved = core.cursors.resolve(request.cursor, ctx.view, epoch.value);
    if (resolved.isFailure()) {
      return propagate(resolved);
    }
    inner = resolved.value;
  }
  const filter = request.filter ?? {};
  const selection: ITaskSelection = {
    scopes: ctx.scopes,
    lifecycleClass: filter.lifecycleClass ?? 'all',
    ...(filter.statuses !== undefined ? { statuses: filter.statuses } : {}),
    ...(filter.responsibility !== undefined ? { responsibility: filter.responsibility } : {}),
    ...(filter.parentId !== undefined ? { parentId: filter.parentId } : {})
  };
  const answered = await core.repository.query({
    selection,
    ...(request.limit !== undefined ? { limit: request.limit } : {}),
    ...(inner !== undefined ? { cursor: inner } : {})
  });
  if (answered.isFailure()) {
    return propagate(answered);
  }
  const page: ITaskPage = answered.value;

  const items: IProjectedTaskSummary[] = [];
  let external: boolean = false;
  for (const summary of page.items) {
    if (await ctx.sees({ task: summary })) {
      const projected = projectEnvelope(ctx.projector, core.converters.broker, summary.envelope);
      if (projected.isFailure()) {
        return propagate(projected);
      }
      items.push({ envelope: projected.value });
      external = external || summary.envelope.binding !== undefined;
    }
  }
  const unresolved: IProjectedUnresolvedReference[] = [];
  for (const reference of page.unresolved) {
    if (await ctx.sees({ reference })) {
      const projected = projectReference(core.converters.broker, reference);
      if (projected.isFailure()) {
        return propagate(projected);
      }
      unresolved.push(projected.value);
    }
  }
  const after = ctx.epoch();
  if (after.isFailure() || after.value !== epoch.value) {
    return changedSinceAuthorized('the authorization policy');
  }
  const issues: ReadonlyArray<string> = page.issues.length > 0 ? [unreadableIssue] : [];
  return ok({
    items,
    unresolved,
    ...(page.nextCursor !== undefined
      ? { nextCursor: core.cursors.issue(ctx.view, epoch.value, page.nextCursor) }
      : {}),
    completeness: unresolved.length > 0 || issues.length > 0 ? 'partial' : 'complete',
    freshness: external || unresolved.length > 0 ? 'source-projection' : 'native-current',
    issues
  });
}

/**
 * A bound view's inspection of one task, archived ones included.
 *
 * @remarks
 * Visibility is decided before anything else is read: a hidden task and a foreign id fail
 * identically. An unregistered kind then fails rather than being presented as a typed task.
 * Details appear only through the host's details projection, and the command list is evaluated
 * against the current lifecycle and the current policy for this call.
 * @internal
 */
export async function inspectView(
  core: BrokerCore,
  ctx: AccessContext,
  input: unknown
): Promise<TaskResult<TaskInspection>> {
  const id = core.converters.ids.taskId.convert(input);
  if (id.isFailure()) {
    return taskFailure(`inspect: ${id.message}`, 'invalid', 'after-host-action');
  }
  const record = await readExisting(core, id.value);
  if (record.isFailure()) {
    return propagate(record);
  }
  const subject: AccessSubject = subjectOf(record.value);
  if (!(await ctx.sees(subject))) {
    return notFound(id.value);
  }
  const read = await core.repository.read(id.value);
  if (read.isFailure()) {
    return propagate(read);
  }
  const found = read.value;
  if (found === undefined) {
    return notFound(id.value);
  }
  if (found.state === 'unresolved') {
    return projectReference(core.converters.broker, found.reference).onSuccess((reference) =>
      ok<TaskInspection>({ state: 'unresolved', reference })
    );
  }
  const envelope = projectEnvelope(ctx.projector, core.converters.broker, found.task.envelope);
  if (envelope.isFailure()) {
    return propagate(envelope);
  }
  const details = projectDetails(ctx.projector, found.task);
  if (details.isFailure()) {
    return propagate(details);
  }
  const commands: string[] = [];
  if (isNativeKind(found.task.envelope) && !found.archived) {
    const candidates = availableTrackedCommands(found.task.envelope.lifecycle.status, {
      list: found.task.envelope.kind === taskListKind
    });
    for (const command of candidates) {
      if (await ctx.may('command', subject, 'subject', { command })) {
        commands.push(command);
      }
    }
  }
  const detailValue: JsonValue | undefined = details.value;
  return ok({
    state: 'resolved',
    envelope: envelope.value,
    ...(detailValue !== undefined ? { details: detailValue } : {}),
    archived: found.archived,
    commands
  });
}
