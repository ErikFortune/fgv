/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { Logging } from '@fgv/ts-utils';
import { APIConnectionError, APIUserAbortError, TypeSafeError } from '@typesafe-ai/sdk';
import { classifyError } from '../../classify';
import { sdkLogging } from '../../logging';

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
    const spies = {
      detail: jest.spyOn(target, 'detail'),
      info: jest.spyOn(target, 'info'),
      warn: jest.spyOn(target, 'warn'),
      error: jest.spyOn(target, 'error')
    };
    const { logger } = sdkLogging(target);
    logger.debug('d', 1);
    logger.info('i');
    logger.warn('w');
    logger.error('e');
    expect(spies.detail).toHaveBeenCalledWith('d', 1);
    expect(spies.info).toHaveBeenCalledWith('i');
    expect(spies.warn).toHaveBeenCalledWith('w');
    expect(spies.error).toHaveBeenCalledWith('e');
    for (const spy of Object.values(spies)) {
      expect(spy).toHaveBeenCalledTimes(1);
    }
  });
});

describe('classifyError', () => {
  test('U11 anything else thrown is connection, with its message', () => {
    expect(classifyError(new Error('socket hang up'), 'connection')).toEqual({
      reason: 'connection',
      message: 'connection: socket hang up'
    });
    expect(classifyError('weird', 'invalid-response').reason).toBe('connection');
  });

  test('a base TypeSafeError takes the caller’s reason, with any response context', () => {
    expect(classifyError(new TypeSafeError('shape'), 'invalid-response', 200, 'req-3')).toEqual({
      reason: 'invalid-response',
      message: 'invalid-response (status 200) (request req-3): shape'
    });
  });

  test('the SDK error classes classify by class', () => {
    expect(classifyError(new APIUserAbortError(), 'connection').reason).toBe('aborted');
    expect(classifyError(new APIConnectionError(), 'invalid-response').reason).toBe('connection');
  });
});
