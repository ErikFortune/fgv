/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Converters as JsonConverters, JsonValue } from '@fgv/ts-json-base';
import { Converter, Converters, Result, fail, succeed } from '@fgv/ts-utils';
import {
  IResponsibility,
  ISourceBinding,
  ISourceProjection,
  ISourceReplayEnvelope,
  ISourceRevision,
  ITaskFieldBounds,
  ITaskOutcome,
  ITaskProgress,
  ITaskReason,
  ITaskReference,
  ITaskScope,
  IWaitingReason,
  ObservationHealth,
  ParentStopPolicy,
  RecoveryDeclaration,
  RecoveryResult,
  SourceHistoryDeclaration,
  TaskLifecycle
} from '../types';
import { IIdentityConverters } from './identityConverters';
import {
  boundedArrayOf,
  boundedIdentifier,
  boundedSingleLine,
  boundedText,
  instant,
  nonNegativeAmount,
  nonNegativeSafeInteger,
  positiveSafeInteger
} from './primitives';

/**
 * The bounded value converters shared by the envelope, source and command surfaces.
 * @public
 */
export interface IValueConverters {
  readonly scope: Converter<ITaskScope>;
  readonly responsibility: Converter<IResponsibility>;
  readonly reference: Converter<ITaskReference>;
  readonly references: Converter<ReadonlyArray<ITaskReference>>;
  readonly scopes: Converter<ReadonlyArray<ITaskScope>>;
  readonly reason: Converter<ITaskReason>;
  readonly waitingReason: Converter<IWaitingReason>;
  readonly progress: Converter<ITaskProgress>;
  readonly outcome: Converter<ITaskOutcome>;
  readonly stopPolicy: Converter<ParentStopPolicy>;
  readonly recoveryDeclaration: Converter<RecoveryDeclaration>;
  readonly lifecycle: Converter<TaskLifecycle>;
  readonly observationHealth: Converter<ObservationHealth>;
  readonly sourceBinding: Converter<ISourceBinding>;
  readonly sourceRevision: Converter<ISourceRevision>;
  readonly sourceProjection: Converter<ISourceProjection>;
  readonly recoveryResult: Converter<RecoveryResult>;
  readonly sourceReplayEnvelope: Converter<ISourceReplayEnvelope>;
  readonly sourceHistoryDeclaration: Converter<SourceHistoryDeclaration>;
}

/**
 * Builds the {@link IValueConverters} for a set of field bounds.
 * @public
 */
export function buildValueConverters(bounds: ITaskFieldBounds, ids: IIdentityConverters): IValueConverters {
  const code: Converter<string> = boundedIdentifier(bounds.maxCodeLength, 'code');
  const label: Converter<string> = boundedSingleLine(bounds.maxCodeLength, 'label');
  const summary: Converter<string> = boundedText(bounds.maxSummaryLength, 'summary');
  const jsonValue: Converter<JsonValue> = JsonConverters.jsonValue;

  const scope: Converter<ITaskScope> = Converters.strictObject<ITaskScope>({
    namespace: boundedIdentifier(bounds.maxIdLength, 'scope namespace'),
    key: boundedSingleLine(bounds.maxIdLength, 'scope key')
  });

  const responsibility: Converter<IResponsibility> = Converters.strictObject<IResponsibility>({
    namespace: boundedIdentifier(bounds.maxIdLength, 'responsibility namespace'),
    key: boundedSingleLine(bounds.maxIdLength, 'responsibility key')
  });

  const reference: Converter<ITaskReference> = Converters.strictObject<ITaskReference>({
    namespace: boundedIdentifier(bounds.maxIdLength, 'reference namespace'),
    key: boundedSingleLine(bounds.maxIdLength, 'reference key')
  });

  const references: Converter<ReadonlyArray<ITaskReference>> = boundedArrayOf(
    reference,
    bounds.maxReferences,
    'references'
  );
  const scopes: Converter<ReadonlyArray<ITaskScope>> = boundedArrayOf(scope, bounds.maxScopes, 'scopes');

  const reason: Converter<ITaskReason> = Converters.strictObject<ITaskReason>({
    code,
    summary,
    attention: references.optional()
  });

  const waitingReason: Converter<IWaitingReason> = Converters.strictObject<IWaitingReason>({
    code,
    summary,
    attention: references.optional(),
    notBefore: instant.optional()
  });

  const progress: Converter<ITaskProgress> = Converters.strictObject<ITaskProgress>({
    phase: label.optional(),
    completed: nonNegativeAmount.optional(),
    total: nonNegativeAmount.optional(),
    unit: label.optional(),
    summary: summary.optional()
  }).withConstraint((value: ITaskProgress): Result<ITaskProgress> => {
    if (value.total !== undefined && value.completed !== undefined && value.total < value.completed) {
      return fail(`progress: total ${value.total} is less than completed ${value.completed}`);
    }
    return succeed(value);
  });

  const outcome: Converter<ITaskOutcome> = Converters.strictObject<ITaskOutcome>({
    summary,
    artifacts: boundedArrayOf(reference, bounds.maxReferences, 'artifacts')
  });

  const lifecycle: Converter<TaskLifecycle> = Converters.discriminatedObject<TaskLifecycle>('status', {
    pending: Converters.strictObject<Extract<TaskLifecycle, { status: 'pending' | 'running' }>>({
      status: Converters.literal('pending')
    }),
    running: Converters.strictObject<Extract<TaskLifecycle, { status: 'pending' | 'running' }>>({
      status: Converters.literal('running')
    }),
    waiting: Converters.strictObject<Extract<TaskLifecycle, { status: 'waiting' }>>({
      status: Converters.literal('waiting'),
      reason: waitingReason
    }),
    paused: Converters.strictObject<Extract<TaskLifecycle, { status: 'paused' }>>({
      status: Converters.literal('paused'),
      reason
    }),
    succeeded: Converters.strictObject<Extract<TaskLifecycle, { status: 'succeeded' }>>({
      status: Converters.literal('succeeded'),
      outcome
    }),
    failed: Converters.strictObject<Extract<TaskLifecycle, { status: 'failed' | 'cancelled' }>>({
      status: Converters.literal('failed'),
      reason,
      outcome: outcome.optional()
    }),
    cancelled: Converters.strictObject<Extract<TaskLifecycle, { status: 'failed' | 'cancelled' }>>({
      status: Converters.literal('cancelled'),
      reason,
      outcome: outcome.optional()
    })
  });

  const observationHealth: Converter<ObservationHealth> = Converters.discriminatedObject<ObservationHealth>(
    'state',
    {
      current: Converters.strictObject<Extract<ObservationHealth, { state: 'current' }>>({
        state: Converters.literal('current'),
        observedAt: instant
      }),
      stale: Converters.strictObject<Extract<ObservationHealth, { state: 'stale' | 'unavailable' }>>({
        state: Converters.literal('stale'),
        checkedAt: instant,
        lastObservedAt: instant.optional(),
        reason: summary
      }),
      unavailable: Converters.strictObject<Extract<ObservationHealth, { state: 'stale' | 'unavailable' }>>({
        state: Converters.literal('unavailable'),
        checkedAt: instant,
        lastObservedAt: instant.optional(),
        reason: summary
      })
    }
  );

  const sourceBinding: Converter<ISourceBinding> = Converters.strictObject<ISourceBinding>({
    sourceId: ids.sourceId,
    referenceVersion: positiveSafeInteger,
    reference: jsonValue
  });

  const sourceRevision: Converter<ISourceRevision> = Converters.strictObject<ISourceRevision>({
    epoch: boundedSingleLine(bounds.maxIdLength, 'source epoch'),
    token: boundedSingleLine(bounds.maxIdLength, 'source token')
  });

  const sourceProjection: Converter<ISourceProjection> = Converters.strictObject<ISourceProjection>({
    revision: sourceRevision,
    observedAt: instant,
    lifecycle,
    progress: progress.optional(),
    attention: references,
    details: jsonValue
  });

  const recoveryResult: Converter<RecoveryResult> = Converters.discriminatedObject<RecoveryResult>('state', {
    reattached: Converters.strictObject<Extract<RecoveryResult, { state: 'reattached' | 'completed' }>>({
      state: Converters.literal('reattached'),
      value: sourceProjection
    }),
    completed: Converters.strictObject<Extract<RecoveryResult, { state: 'reattached' | 'completed' }>>({
      state: Converters.literal('completed'),
      value: sourceProjection
    }),
    resumable: Converters.strictObject<Extract<RecoveryResult, { state: 'resumable' }>>({
      state: Converters.literal('resumable'),
      reference: jsonValue
    }),
    unrecoverable: Converters.strictObject<Extract<RecoveryResult, { state: 'unrecoverable' }>>({
      state: Converters.literal('unrecoverable'),
      reason: summary
    }),
    unavailable: Converters.strictObject<Extract<RecoveryResult, { state: 'unavailable' | 'unresolved' }>>({
      state: Converters.literal('unavailable'),
      reason: summary
    }),
    unresolved: Converters.strictObject<Extract<RecoveryResult, { state: 'unavailable' | 'unresolved' }>>({
      state: Converters.literal('unresolved'),
      reason: summary
    })
  });

  const sourceReplayEnvelope: Converter<ISourceReplayEnvelope> =
    Converters.strictObject<ISourceReplayEnvelope>({
      // Non-negative, not positive: the requirement is that the envelope be *finite*,
      // and an envelope naturally shrinks to zero as accepted work reaches its terminal
      // state. Zero remaining is "nothing further is required", which is exactly the
      // state a bounded replay is supposed to be able to reach.
      remainingRequiredUpdates: nonNegativeSafeInteger,
      remainingRequiredBytes: nonNegativeSafeInteger
    });

  const sourceHistoryDeclaration: Converter<SourceHistoryDeclaration> =
    Converters.discriminatedObject<SourceHistoryDeclaration>('history', {
      'observed-state': Converters.strictObject<
        Extract<SourceHistoryDeclaration, { history: 'observed-state' }>
      >({ history: Converters.literal('observed-state') }),
      'source-replay': Converters.strictObject<
        Extract<SourceHistoryDeclaration, { history: 'source-replay' }>
      >({
        history: Converters.literal('source-replay'),
        envelope: sourceReplayEnvelope
      })
    });

  return {
    scope,
    responsibility,
    reference,
    references,
    scopes,
    reason,
    waitingReason,
    progress,
    outcome,
    stopPolicy: Converters.enumeratedValue<ParentStopPolicy>(['none', 'cascade-pause', 'cascade-cancel']),
    recoveryDeclaration: Converters.enumeratedValue<RecoveryDeclaration>([
      'reattach',
      'host-resume',
      'not-recoverable'
    ]),
    lifecycle,
    observationHealth,
    sourceBinding,
    sourceRevision,
    sourceProjection,
    recoveryResult,
    sourceReplayEnvelope,
    sourceHistoryDeclaration
  };
}
