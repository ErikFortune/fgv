/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { JsonValue } from '@fgv/ts-json-base';
import { Result, captureResult, succeed } from '@fgv/ts-utils';
import { IBrokerConverters } from '../converters';
import { withEnvelopeFields } from '../implementations';
import {
  IProjectedTaskEnvelope,
  IProjectedUnresolvedReference,
  ITaskEnvelope,
  ITaskProjector,
  ITaskSnapshot,
  IUnresolvedTaskReference,
  TaskLifecycle,
  TaskResult
} from '../types';
import { ok, taskFailure } from './failures';

/** A lifecycle with any outcome artifact references removed. */
function _withoutArtifacts(lifecycle: TaskLifecycle): TaskLifecycle {
  if ('outcome' in lifecycle && lifecycle.outcome !== undefined) {
    return { ...lifecycle, outcome: { ...lifecycle.outcome, artifacts: [] } };
  }
  return lifecycle;
}

/**
 * The projector a view uses when the host supplies none: the envelope without its source binding
 * and with outcome artifact references removed, and no details at all.
 * @public
 */
export const defaultTaskProjector: ITaskProjector = {
  envelope: (envelope: ITaskEnvelope): Result<IProjectedTaskEnvelope> =>
    succeed(
      withEnvelopeFields(
        { ...envelope, lifecycle: _withoutArtifacts(envelope.lifecycle) },
        { binding: undefined }
      )
    )
};

/** A projection failure: the call fails, and nothing is returned in its place. */
function _failed<T>(what: string, message: string): TaskResult<T> {
  return taskFailure<T>(
    `${what}: projection failed (${message}); no unprojected data is returned in its place`,
    'invalid',
    'after-host-action'
  );
}

/**
 * Projects an envelope the principal is already authorized to read.
 *
 * @remarks
 * The projector's output is validated, not trusted: it must convert strictly to the projected
 * shape — which has no `binding` member, so an extra property fails — and describe the same task
 * at the same revision. Any failure, including a throw, fails the call. The projector is given a
 * copy of the envelope, never the broker's own.
 * @internal
 */
export function projectEnvelope(
  projector: ITaskProjector,
  converters: IBrokerConverters,
  envelope: ITaskEnvelope
): TaskResult<IProjectedTaskEnvelope> {
  const what: string = `task ${envelope.id}`;
  // The projector is host code and the envelope may be the resident index's own: it is handed a
  // copy, so a projector that writes to its input cannot change what the broker holds.
  const projected: Result<IProjectedTaskEnvelope> = captureResult(() =>
    projector.envelope(structuredClone(envelope))
  )
    .onSuccess((inner) => inner)
    .onSuccess((value) => converters.projectedEnvelope.convert(value));
  if (projected.isFailure()) {
    return _failed(what, projected.message);
  }
  const value: IProjectedTaskEnvelope = projected.value;
  if (
    value.id !== envelope.id ||
    value.kind !== envelope.kind ||
    value.detailVersion !== envelope.detailVersion ||
    value.revision !== envelope.revision
  ) {
    return _failed(what, 'the projection describes a different task or revision');
  }
  return ok(value);
}

/**
 * Projects the details of a snapshot the principal is authorized to read — only when the host's
 * projector offers a details projection; otherwise a view exposes no details.
 * @internal
 */
export function projectDetails(
  projector: ITaskProjector,
  snapshot: ITaskSnapshot
): TaskResult<JsonValue | undefined> {
  const detailsOf = projector.details;
  if (detailsOf === undefined) {
    return ok(undefined);
  }
  const projected: Result<JsonValue> = captureResult(() =>
    detailsOf.call(projector, structuredClone(snapshot))
  ).onSuccess((inner) => inner);
  return projected.isSuccess()
    ? ok<JsonValue | undefined>(projected.value)
    : _failed(`task ${snapshot.envelope.id} details`, projected.message);
}

/**
 * Projects an unresolved registration: its binding never leaves the broker.
 * @internal
 */
export function projectReference(
  converters: IBrokerConverters,
  reference: IUnresolvedTaskReference
): TaskResult<IProjectedUnresolvedReference> {
  // Built field by field: the binding is simply not one of them.
  const projected: Result<IProjectedUnresolvedReference> = converters.projectedReference.convert({
    id: reference.id,
    revision: reference.revision,
    kind: reference.kind,
    detailVersion: reference.detailVersion,
    title: reference.title,
    ...(reference.parentId !== undefined ? { parentId: reference.parentId } : {}),
    ...(reference.responsibility !== undefined ? { responsibility: reference.responsibility } : {}),
    scopes: reference.scopes,
    reason: reference.reason
  });
  return projected.isSuccess() ? ok(projected.value) : _failed(`task ${reference.id}`, projected.message);
}
