/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Converters as JsonConverters } from '@fgv/ts-json-base';
import { Converter, Converters, Result, fail, succeed } from '@fgv/ts-utils';
import {
  IProjectedStopTarget,
  IReleaseStop,
  ISourceCapabilities,
  ISourceStopCommand,
  IStableStopEvidence,
  IStopCommandMarker,
  IStopInspectRequest,
  IStopIntent,
  IStopReconcileRequest,
  IStopRequest,
  IStopTarget,
  IStopViolation,
  ITaskFieldBounds,
  StopIntentState,
  StopMode,
  StopTargetState,
  TaskLifecycleStatus,
  allStopIntentStates,
  allStopModes,
  allStopTargetStates,
  allTaskStatuses,
  defaultMaxStopTargets,
  isLatchingStopState
} from '../types';
import { IIdentityConverters } from './identityConverters';
import { boundedSingleLine, nonNegativeSafeInteger, positiveSafeInteger, taskRevision } from './primitives';
import { IValueConverters } from './valueConverters';

/**
 * Converters for cascade stops (T9): the persisted intent, the requests that act on it, and what a
 * source declares about stopping.
 * @public
 */
export interface IStopConverters {
  readonly mode: Converter<StopMode>;
  readonly targetState: Converter<StopTargetState>;
  readonly intentState: Converter<StopIntentState>;
  readonly target: Converter<IStopTarget>;
  readonly projectedTarget: Converter<IProjectedStopTarget>;
  /** One persisted intent, with its structural invariants. */
  readonly intent: Converter<IStopIntent>;
  /** A record's intents: unique ids, one root, at most one latching intent per mode. */
  readonly intents: Converter<ReadonlyArray<IStopIntent>>;
  readonly marker: Converter<IStopCommandMarker>;
  readonly request: Converter<IStopRequest>;
  readonly release: Converter<IReleaseStop>;
  readonly reconcile: Converter<IStopReconcileRequest>;
  readonly inspect: Converter<IStopInspectRequest>;
  readonly capabilities: Converter<ISourceCapabilities>;
}

/** The largest effect budget one pump pass may be given. */
const maxStopPumpLimit: number = 1000;

/**
 * An intent's own invariants: the root is its first target; target ids and command keys each name
 * one target — a bounded array whose entries carry identities needs uniqueness, not only a length
 * cap — and the count is within the target bound.
 */
function _intentInvariants(intent: IStopIntent): Result<IStopIntent> {
  if (intent.targets.length < 1 || intent.targets[0].taskId !== intent.rootId) {
    return fail(`stop ${intent.id}: the root ${intent.rootId} must be the first target`);
  }
  if (intent.targets.length > defaultMaxStopTargets) {
    return fail(
      `stop ${intent.id}: ${intent.targets.length} targets, over the bound of ${defaultMaxStopTargets}`
    );
  }
  if (
    (intent.state === 'satisfied' || intent.state === 'settled') &&
    intent.targets.some((target) => target.state !== 'confirmed')
  ) {
    return fail(`stop ${intent.id}: a ${intent.state} stop has every target confirmed`);
  }
  const tasks: Set<string> = new Set<string>();
  const keys: Set<string> = new Set<string>();
  for (const target of intent.targets) {
    if (tasks.has(target.taskId)) {
      return fail(`stop ${intent.id}: task ${target.taskId} is a target twice`);
    }
    if (keys.has(target.operationId)) {
      return fail(`stop ${intent.id}: command key '${target.operationId}' names two targets`);
    }
    tasks.add(target.taskId);
    keys.add(target.operationId);
  }
  return succeed(intent);
}

/** A record's intents: each once, all of one root, and never two latching intents of one mode. */
function _intentsInvariants(intents: ReadonlyArray<IStopIntent>): Result<ReadonlyArray<IStopIntent>> {
  const ids: Set<string> = new Set<string>();
  const latching: Set<StopMode> = new Set<StopMode>();
  for (const intent of intents) {
    if (ids.has(intent.id)) {
      return fail(`stop ${intent.id}: recorded twice`);
    }
    ids.add(intent.id);
    if (intent.rootId !== intents[0].rootId) {
      return fail(`stop ${intent.id}: a record holds only the stops of its own task`);
    }
    if (isLatchingStopState(intent.state)) {
      if (latching.has(intent.mode)) {
        return fail(`stop ${intent.id}: a second latching ${intent.mode} of the same root`);
      }
      latching.add(intent.mode);
    }
  }
  return succeed(intents);
}

/**
 * Builds the {@link IStopConverters}.
 * @public
 */
export function buildStopConverters(
  bounds: ITaskFieldBounds,
  ids: IIdentityConverters,
  values: IValueConverters
): IStopConverters {
  const mode: Converter<StopMode> = Converters.enumeratedValue<StopMode>(allStopModes);
  const targetState: Converter<StopTargetState> =
    Converters.enumeratedValue<StopTargetState>(allStopTargetStates);
  const intentState: Converter<StopIntentState> =
    Converters.enumeratedValue<StopIntentState>(allStopIntentStates);
  const status: Converter<TaskLifecycleStatus> =
    Converters.enumeratedValue<TaskLifecycleStatus>(allTaskStatuses);
  const contractVersion: Converter<string> = boundedSingleLine(bounds.maxCodeLength, 'stop contract version');

  const evidence: Converter<IStableStopEvidence> = Converters.strictObject<IStableStopEvidence>({
    sourceId: ids.sourceId,
    contractVersion,
    sourceRevision: values.sourceRevision
  });
  const violation: Converter<IStopViolation> = Converters.strictObject<IStopViolation>({
    observedRevision: taskRevision,
    observedStatus: status
  });
  const targetFields = {
    taskId: ids.taskId,
    attempt: positiveSafeInteger,
    operationId: ids.operationId,
    state: targetState,
    confirmedRevision: taskRevision.optional(),
    violation: violation.optional()
  };
  const target: Converter<IStopTarget> = Converters.strictObject<IStopTarget>({
    ...targetFields,
    stableSourceEvidence: evidence.optional()
  });
  const projectedTarget: Converter<IProjectedStopTarget> =
    Converters.strictObject<IProjectedStopTarget>(targetFields);

  const intent: Converter<IStopIntent> = Converters.strictObject<IStopIntent>({
    id: ids.operationId,
    rootId: ids.taskId,
    mode,
    requestedBy: boundedSingleLine(bounds.maxSummaryLength, 'principal key'),
    targets: Converters.arrayOf(target),
    state: intentState,
    topologyGeneration: nonNegativeSafeInteger
  }).withConstraint(_intentInvariants);

  const intents: Converter<ReadonlyArray<IStopIntent>> = Converters.arrayOf(intent).withConstraint(
    (value: IStopIntent[]) => _intentsInvariants(value).onSuccess(() => succeed(value))
  );

  const marker: Converter<IStopCommandMarker> = Converters.strictObject<IStopCommandMarker>({
    rootId: ids.taskId,
    intentId: ids.operationId
  });

  const request: Converter<IStopRequest> = Converters.strictObject<IStopRequest>({
    taskId: ids.taskId,
    expectedRevision: taskRevision,
    operationId: ids.operationId,
    mode
  });
  const release: Converter<IReleaseStop> = Converters.strictObject<IReleaseStop>({
    taskId: ids.taskId,
    expectedRevision: taskRevision,
    operationId: ids.operationId,
    intentId: ids.operationId
  });
  const limit: Converter<number> = positiveSafeInteger.withConstraint((value: number) =>
    value <= maxStopPumpLimit
      ? succeed(value)
      : fail(`limit ${value} is over the maximum of ${maxStopPumpLimit}`)
  );
  const reconcile: Converter<IStopReconcileRequest> = Converters.strictObject<IStopReconcileRequest>({
    taskId: ids.taskId,
    intentId: ids.operationId,
    limit: limit.optional()
  });
  const inspect: Converter<IStopInspectRequest> = Converters.strictObject<IStopInspectRequest>({
    taskId: ids.taskId,
    intentId: ids.operationId
  });

  const stopCommand: Converter<ISourceStopCommand> = Converters.strictObject<ISourceStopCommand>({
    command: boundedSingleLine(bounds.maxCodeLength, 'command name'),
    parameters: JsonConverters.jsonValue
  });
  const capabilities: Converter<ISourceCapabilities> = Converters.strictObject<ISourceCapabilities>({
    contractVersion,
    pause: Converters.enumeratedValue<ISourceCapabilities['pause']>([
      'unsupported',
      'sampled',
      'stable-until-explicit-resume'
    ]),
    cancel: Converters.enumeratedValue<ISourceCapabilities['cancel']>(['unsupported', 'terminal-absorbing']),
    pauseCommand: stopCommand.optional(),
    cancelCommand: stopCommand.optional()
  });

  return {
    mode,
    targetState,
    intentState,
    target,
    projectedTarget,
    intent,
    intents,
    marker,
    request,
    release,
    reconcile,
    inspect,
    capabilities
  };
}
