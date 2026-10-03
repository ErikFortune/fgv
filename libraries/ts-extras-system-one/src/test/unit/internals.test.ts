/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { Logging } from '@fgv/ts-utils';
import { APIConnectionError, APIUserAbortError, TypeSafeError } from '@typesafe-ai/sdk';
import { classifyError } from '../../classify';
import { sdkLogging } from '../../logging';
import { checkAnswer } from '../../validate';

describe('sdkLogging', () => {
  test.each([
    ['all', 'info'],
    ['detail', 'info'],
    ['info', 'info'],
    ['warning', 'warn'],
    ['error', 'error'],
    ['silent', 'off']
  ] as const)('an ILogger at %s gives the SDK %s, never debug', (level, expected) => {
    expect(sdkLogging(new Logging.InMemoryLogger(level)).logLevel).toBe(expected);
  });

  test('no logger turns SDK logging off with a sink that discards', () => {
    const { logLevel, logger } = sdkLogging(undefined);
    expect(logLevel).toBe('off');
    for (const method of ['debug', 'info', 'warn', 'error'] as const) {
      expect(() => logger[method]('dropped')).not.toThrow();
    }
  });

  test('each SDK method maps to its ILogger method', () => {
    const target = new Logging.InMemoryLogger('all');
    const { logger } = sdkLogging(target);
    logger.debug('d', 1);
    logger.info('i');
    logger.warn('w');
    logger.error('e');
    expect(target.logged).toHaveLength(4);
    expect(target.logged[0]).toContain('d');
  });
});

describe('classifyError', () => {
  test('a thrown value that is no SDK error is connection, with its message', () => {
    expect(classifyError(new Error('socket hang up'), 'connection')).toEqual({
      reason: 'connection',
      message: 'connection: socket hang up'
    });
    expect(classifyError('weird', 'invalid-response').reason).toBe('connection');
  });

  test('a base TypeSafeError takes the caller’s reason', () => {
    expect(classifyError(new TypeSafeError('shape'), 'invalid-response').reason).toBe('invalid-response');
  });

  test('the SDK error classes classify by class', () => {
    expect(classifyError(new APIUserAbortError(), 'connection').reason).toBe('aborted');
    expect(classifyError(new APIConnectionError(), 'invalid-response').reason).toBe('connection');
  });
});

describe('checkAnswer', () => {
  test('a choice or score answer to a question of another type fails', () => {
    const noulQuestion = { type: 'noul' } as const;
    expect(
      checkAnswer('a', noulQuestion, { type: 'choice', choice: 'x', probabilities: { x: 1 } })
    ).toFailWith(/a: noul is not/);
    expect(
      checkAnswer('a', noulQuestion, { type: 'score', score: 0, legend: {}, probabilities: [1] })
    ).toFailWith(/a: noul is not/);
  });
});
