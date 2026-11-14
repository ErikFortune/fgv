/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { JsonValue } from '@fgv/ts-json-base';
import {
  IValueConverters,
  ParentStopPolicy,
  RecoveryDeclaration,
  TaskLifecycleStatus,
  allTaskStatuses
} from '../../../index';
import { converters } from '../../helpers/fixtures';

const values: IValueConverters = converters.values;

describe('label converters', () => {
  test('a scope is a namespace identifier plus an opaque single-line key', () => {
    expect(values.scope.convert({ namespace: 'project', key: 'alpha beta' })).toSucceedWith({
      namespace: 'project',
      key: 'alpha beta'
    });
  });

  test('a scope namespace may not be a path fragment', () => {
    expect(values.scope.convert({ namespace: '../etc', key: 'a' })).toFailWith(
      /not a valid scope namespace/i
    );
  });

  test('a scope rejects an unrecognized property', () => {
    expect(values.scope.convert({ namespace: 'project', key: 'a', weight: 3 })).toFail();
  });

  test('a responsibility and a reference share the shape but are distinct converters', () => {
    expect(values.responsibility.convert({ namespace: 'actor', key: 'worker-3' })).toSucceed();
    expect(values.reference.convert({ namespace: 'thread', key: 'msg/42' })).toSucceedWith({
      namespace: 'thread',
      key: 'msg/42'
    });
  });

  test('a reference key carries no dereference instructions — only opaque identity', () => {
    // A control character would be a framing hazard wherever the key is rendered.
    expect(values.reference.convert({ namespace: 'thread', key: 'a\u0000b' })).toFail();
  });

  test('scopes and references are bounded', () => {
    const many = (n: number): JsonValue[] =>
      Array.from({ length: n }, (__v, i) => ({ namespace: 'n', key: `k${i}` }));
    expect(values.scopes.convert(many(64))).toSucceed();
    expect(values.scopes.convert(many(65))).toFailWith(/65 entries exceeds the maximum of 64/i);
    expect(values.references.convert(many(32))).toSucceed();
    expect(values.references.convert(many(33))).toFailWith(/33 entries exceeds the maximum of 32/i);
  });
});

describe('reason and progress', () => {
  test('a waiting reason may name the earliest instant the wait can end', () => {
    expect(
      values.waitingReason.convert({
        code: 'rate-limited',
        summary: 'backing off',
        notBefore: '2026-09-22T13:00:00.000Z'
      })
    ).toSucceedAndSatisfy((reason) => {
      expect(reason.notBefore).toBe('2026-09-22T13:00:00.000Z');
    });
  });

  test('an ordinary reason has no notBefore at all', () => {
    expect(
      values.reason.convert({
        code: 'blocked',
        summary: 'waiting on a human',
        notBefore: '2026-09-22T13:00:00.000Z'
      })
    ).toFail();
  });

  test('progress accepts an unknown total as absent', () => {
    expect(values.progress.convert({ completed: 3 })).toSucceedAndSatisfy((progress) => {
      expect(progress.total).toBeUndefined();
    });
  });

  test('progress rejects a total below completed', () => {
    expect(values.progress.convert({ completed: 10, total: 3 })).toFailWith(
      /total 3 is less than completed 10/i
    );
  });

  test('progress accepts a total equal to completed, which still does not succeed a task', () => {
    expect(values.progress.convert({ completed: 3, total: 3 })).toSucceed();
  });

  test('progress rejects negative and infinite amounts', () => {
    expect(values.progress.convert({ completed: -1 })).toFail();
    expect(values.progress.convert({ total: Number.POSITIVE_INFINITY })).toFail();
  });

  test('an outcome requires a summary and an artifact list', () => {
    expect(values.outcome.convert({ summary: 'done', artifacts: [] })).toSucceed();
    expect(values.outcome.convert({ summary: 'done' })).toFail();
  });
});

describe('lifecycle', () => {
  test.each([
    ['pending', { status: 'pending' }],
    ['running', { status: 'running' }],
    ['waiting', { status: 'waiting', reason: { code: 'c', summary: 's' } }],
    ['paused', { status: 'paused', reason: { code: 'c', summary: 's' } }],
    ['succeeded', { status: 'succeeded', outcome: { summary: 's', artifacts: [] } }],
    ['failed', { status: 'failed', reason: { code: 'c', summary: 's' } }],
    ['cancelled', { status: 'cancelled', reason: { code: 'c', summary: 's' } }]
  ])('converts the %s discriminant', (status: string, value: JsonValue) => {
    expect(values.lifecycle.convert(value)).toSucceedAndSatisfy((lifecycle) => {
      expect(lifecycle.status).toBe(status);
    });
  });

  test('covers every declared status', () => {
    const covered: ReadonlyArray<TaskLifecycleStatus> = allTaskStatuses;
    expect(covered).toHaveLength(7);
    for (const status of covered) {
      const payload: Record<string, JsonValue> =
        status === 'succeeded'
          ? { status, outcome: { summary: 's', artifacts: [] } }
          : status === 'pending' || status === 'running'
          ? { status }
          : { status, reason: { code: 'c', summary: 's' } };
      expect(values.lifecycle.convert(payload)).toSucceed();
    }
  });

  test('a failed or cancelled task may carry an outcome as well as a reason', () => {
    expect(
      values.lifecycle.convert({
        status: 'failed',
        reason: { code: 'c', summary: 's' },
        outcome: { summary: 'partial', artifacts: [] }
      })
    ).toSucceed();
  });

  test('a waiting task without a reason fails — the payload is what makes the state meaningful', () => {
    expect(values.lifecycle.convert({ status: 'waiting' })).toFail();
  });

  test('a succeeded task cannot carry a reason instead of an outcome', () => {
    expect(values.lifecycle.convert({ status: 'succeeded', reason: { code: 'c', summary: 's' } })).toFail();
  });

  test('an unknown status is not converted to anything', () => {
    expect(values.lifecycle.convert({ status: 'stopped' })).toFail();
    expect(values.lifecycle.convert({})).toFail();
  });
});

describe('observation health', () => {
  test('current health carries only the observation instant', () => {
    expect(
      values.observationHealth.convert({ state: 'current', observedAt: '2026-09-22T12:00:00.000Z' })
    ).toSucceed();
  });

  test.each([['stale'], ['unavailable']])(
    '%s health requires a check instant and a reason',
    (state: string) => {
      expect(
        values.observationHealth.convert({ state, checkedAt: '2026-09-22T12:00:00.000Z', reason: 'timeout' })
      ).toSucceed();
      expect(values.observationHealth.convert({ state, reason: 'timeout' })).toFail();
    }
  );

  test('stale health may report the last successful observation', () => {
    expect(
      values.observationHealth.convert({
        state: 'stale',
        checkedAt: '2026-09-22T12:00:00.000Z',
        lastObservedAt: '2026-09-22T11:00:00.000Z',
        reason: 'timeout'
      })
    ).toSucceed();
  });

  test('current health cannot carry a failure reason — an outage is not a lifecycle change', () => {
    expect(
      values.observationHealth.convert({
        state: 'current',
        observedAt: '2026-09-22T12:00:00.000Z',
        reason: 'timeout'
      })
    ).toFail();
  });
});

describe('source values', () => {
  const projection: Record<string, JsonValue> = {
    revision: { epoch: 'e1', token: 't1' },
    observedAt: '2026-09-22T12:00:00.000Z',
    lifecycle: { status: 'running' },
    attention: [],
    details: { any: 'json' }
  };

  test('a binding versions its opaque reference independently', () => {
    expect(
      values.sourceBinding.convert({ sourceId: 'src-a', referenceVersion: 2, reference: [1, 2] })
    ).toSucceedAndSatisfy((binding) => {
      expect(binding.referenceVersion).toBe(2);
      expect(binding.reference).toEqual([1, 2]);
    });
  });

  test('a binding reference version must be a positive safe integer', () => {
    expect(
      values.sourceBinding.convert({ sourceId: 'src-a', referenceVersion: 0, reference: null })
    ).toFail();
  });

  test('a projection carries execution fields only', () => {
    expect(values.sourceProjection.convert(projection)).toSucceed();
    expect(
      values.sourceProjection.convert({ ...projection, responsibility: { namespace: 'a', key: 'b' } })
    ).toFail();
    expect(values.sourceProjection.convert({ ...projection, scopes: [] })).toFail();
  });

  test.each([
    ['reattached', { state: 'reattached', value: projection }],
    ['completed', { state: 'completed', value: projection }],
    ['resumable', { state: 'resumable', reference: { token: 'r' } }],
    ['unrecoverable', { state: 'unrecoverable', reason: 'source deleted the job', value: projection }],
    ['unavailable', { state: 'unavailable', reason: 'source down' }],
    ['unresolved', { state: 'unresolved', reason: 'source cannot say' }]
  ])('converts the %s recovery result', (state: string, value: JsonValue) => {
    expect(values.recoveryResult.convert(value)).toSucceedAndSatisfy((result) => {
      expect(result.state).toBe(state);
    });
  });

  test('an unrecoverable result without the source-confirmed projection converts to nothing', () => {
    expect(
      values.recoveryResult.convert({ state: 'unrecoverable', reason: 'source deleted the job' })
    ).toFail();
  });

  test('an unknown recovery state converts to nothing', () => {
    expect(values.recoveryResult.convert({ state: 'retrying', reason: 'x' })).toFail();
  });
});

describe('source history declaration', () => {
  test('an observed-state declaration needs no envelope', () => {
    expect(values.sourceHistoryDeclaration.convert({ history: 'observed-state' })).toSucceedWith({
      history: 'observed-state'
    });
  });

  test('a source-replay declaration without a finite envelope is not representable', () => {
    expect(values.sourceHistoryDeclaration.convert({ history: 'source-replay' })).toFail();
  });

  test('a source-replay declaration states a finite remaining envelope', () => {
    expect(
      values.sourceHistoryDeclaration.convert({
        history: 'source-replay',
        envelope: { remainingRequiredUpdates: 12, remainingRequiredBytes: 4096 }
      })
    ).toSucceed();
  });

  test('an unbounded replay envelope is rejected rather than admitted', () => {
    expect(
      values.sourceReplayEnvelope.convert({
        remainingRequiredUpdates: Number.POSITIVE_INFINITY,
        remainingRequiredBytes: 4096
      })
    ).toFail();
    expect(
      values.sourceReplayEnvelope.convert({
        remainingRequiredUpdates: 12,
        remainingRequiredBytes: Number.MAX_SAFE_INTEGER + 1
      })
    ).toFail();
  });

  test('an envelope may reach zero — a bounded replay is supposed to be able to finish', () => {
    expect(
      values.sourceReplayEnvelope.convert({ remainingRequiredUpdates: 0, remainingRequiredBytes: 0 })
    ).toSucceedWith({ remainingRequiredUpdates: 0, remainingRequiredBytes: 0 });
  });

  test('an envelope may not go negative', () => {
    expect(
      values.sourceReplayEnvelope.convert({ remainingRequiredUpdates: -1, remainingRequiredBytes: 0 })
    ).toFail();
  });

  test('an observed-state declaration may not smuggle in an envelope', () => {
    expect(
      values.sourceHistoryDeclaration.convert({
        history: 'observed-state',
        envelope: { remainingRequiredUpdates: 1, remainingRequiredBytes: 1 }
      })
    ).toFail();
  });
});

describe('enumerated metadata', () => {
  test.each<ParentStopPolicy>(['none', 'cascade-pause', 'cascade-cancel'])(
    'accepts stop policy %s',
    (value: ParentStopPolicy) => {
      expect(values.stopPolicy.convert(value)).toSucceedWith(value);
    }
  );

  test('rejects an unknown stop policy', () => {
    expect(values.stopPolicy.convert('cascade-stop')).toFail();
  });

  test.each<RecoveryDeclaration>(['reattach', 'host-resume', 'not-recoverable'])(
    'accepts recovery declaration %s',
    (value: RecoveryDeclaration) => {
      expect(values.recoveryDeclaration.convert(value)).toSucceedWith(value);
    }
  );

  test('rejects an unknown recovery declaration', () => {
    expect(values.recoveryDeclaration.convert('retry')).toFail();
  });
});
