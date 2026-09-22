/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { Logging, Result, fail, succeed } from '@fgv/ts-utils';
import {
  Instant,
  OperationId,
  SubscriptionId,
  TaskConverters,
  TaskEnvironment,
  TaskId
} from '../../../index';

function environment(
  overrides: {
    clock?: () => number;
    newId?: () => Result<string>;
    converters?: TaskConverters;
  } = {}
): TaskEnvironment {
  let counter: number = 0;
  return TaskEnvironment.create({
    logger: new Logging.InMemoryLogger('all'),
    clock: overrides.clock ?? ((): number => Date.parse('2026-09-22T12:00:00.000Z')),
    newId: overrides.newId ?? ((): Result<string> => succeed(`id-${++counter}`)),
    converters: overrides.converters
  }).orThrow();
}

describe('TaskEnvironment.create', () => {
  test('keeps the injected capabilities rather than constructing its own', () => {
    const logger: Logging.InMemoryLogger = new Logging.InMemoryLogger('all');
    const clock = (): number => 0;
    const newId = (): Result<string> => succeed('id-1');
    expect(TaskEnvironment.create({ logger, clock, newId })).toSucceedAndSatisfy((env) => {
      expect(env.logger).toBe(logger);
      expect(env.clock).toBe(clock);
      expect(env.newId).toBe(newId);
    });
  });

  test('accepts an explicitly supplied converter set', () => {
    const converters: TaskConverters = TaskConverters.create({ bounds: { maxIdLength: 4 } }).orThrow();
    const env: TaskEnvironment = environment({ converters, newId: () => succeed('abcdef') });
    expect(env.newTaskId()).toFailWith(/exceeds the maximum of 4/i);
  });
});

describe('now', () => {
  test('canonicalizes the injected clock', () => {
    expect(environment().now()).toSucceedWith('2026-09-22T12:00:00.000Z' as unknown as Instant);
  });

  test('truncates sub-millisecond precision the clock may offer', () => {
    const env: TaskEnvironment = environment({
      clock: (): number => Date.parse('2026-09-22T12:00:00.000Z') + 0.7
    });
    expect(env.now()).toSucceedWith('2026-09-22T12:00:00.000Z' as unknown as Instant);
  });

  test('a clock returning a non-finite value fails rather than producing a bad instant', () => {
    expect(environment({ clock: (): number => Number.NaN }).now()).toFailWith(/now: clock returned NaN/i);
    expect(environment({ clock: (): number => Number.POSITIVE_INFINITY }).now()).toFailWith(
      /now: clock returned Infinity/i
    );
  });

  test('a clock outside the representable date range fails', () => {
    expect(environment({ clock: (): number => 1e18 }).now()).toFailWith(/now: /i);
  });

  test('a throwing clock becomes a failure, not an exception', () => {
    const env: TaskEnvironment = environment({
      clock: (): number => {
        throw new Error('clock unavailable');
      }
    });
    expect(env.now()).toFailWith(/now: clock unavailable/i);
  });
});

describe('minting identities', () => {
  test('mints task, operation and subscription ids through the library converters', () => {
    const env: TaskEnvironment = environment();
    expect(env.newTaskId()).toSucceedWith('id-1' as unknown as TaskId);
    expect(env.newOperationId()).toSucceedWith('id-2' as unknown as OperationId);
    expect(env.newSubscriptionId()).toSucceedWith('id-3' as unknown as SubscriptionId);
  });

  test('a failing id factory surfaces as a failure naming what was being minted', () => {
    const env: TaskEnvironment = environment({ newId: (): Result<string> => fail('entropy exhausted') });
    expect(env.newTaskId()).toFailWith(/new task id: entropy exhausted/i);
    expect(env.newOperationId()).toFailWith(/new operation id: entropy exhausted/i);
    expect(env.newSubscriptionId()).toFailWith(/new subscription id: entropy exhausted/i);
  });

  test('an id factory producing a path fragment is caught at the mint, not at the filename', () => {
    const env: TaskEnvironment = environment({ newId: (): Result<string> => succeed('../../etc') });
    expect(env.newTaskId()).toFailWith(/new task id: .*not a valid task id/i);
  });
});
