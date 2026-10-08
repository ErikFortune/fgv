/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { Logging } from '@fgv/ts-utils';
import { APIConnectionError, APIUserAbortError, TypeSafeError, noul } from '@typesafe-ai/sdk';
import { classifyError } from '../../classify';
import { sdkLogging } from '../../logging';
import { describeModelList, validateSystemOneBody } from '../../validate';

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

describe('response validation never throws, whatever it is handed', () => {
  // A parsed JSON body cannot hold a cycle or a bigint, so these reach the validators only through
  // a caller of the internal functions; they pin that a converter's failure formatting cannot throw.
  test('U34 validateSystemOneBody fails a circular or bigint body instead of throwing', () => {
    const body: Record<string, unknown> = {
      model: 'm',
      usage: { input_tokens: BigInt(1), output_tokens: 0 }
    };
    body.answers = { q: body };
    let result: ReturnType<typeof validateSystemOneBody> | undefined;
    expect(() => {
      result = validateSystemOneBody({ q: noul('q') }, body);
    }).not.toThrow();
    expect(result).toFailWith(/^the body is not a System-1 response: invalid \[answers, usage\]; .*\[q\]/);
    expect(validateSystemOneBody({ q: noul('q') }, BigInt(1))).toFailWith(
      /^the body is JSON but not an object$/
    );
    expect(
      validateSystemOneBody(
        { q: noul('q') },
        { model: 'm', answers: BigInt(1), usage: { input_tokens: 1, output_tokens: 0 } }
      )
    ).toFailWith(
      /invalid \[answers\]; answers that are not a noul, choice or score answer: \[\] and 0 with no question$/
    );
  });

  test('U34 describeModelList names a circular entry instead of throwing', () => {
    const entry: Record<string, unknown> = { name: 'm' };
    entry.self = entry;
    expect(describeModelList([{ name: 'a', description: 'b', release_date: 'c' }, entry])).toBe(
      'the model list is not [{ name, description, release_date }]: entries [1] are malformed'
    );
  });
});

describe('response validation is total over a Proxy whose traps throw', () => {
  // A parsed body cannot be a Proxy; this pins only that the reserved-key probe is guarded.
  test('U36 validateSystemOneBody fails a throwing answer set or distribution instead of throwing', () => {
    for (const trap of ['getOwnPropertyDescriptor', 'ownKeys', 'get'] as const) {
      const hostile = <T extends object>(target: T): T =>
        new Proxy(target, {
          [trap]: () => {
            throw new Error('trap');
          }
        });
      const usage = { input_tokens: 1, output_tokens: 0 };
      for (const body of [
        { model: 'm', answers: hostile({ q: { type: 'noul', noul: 0.5 } }), usage },
        {
          model: 'm',
          answers: { q: { type: 'choice', choice: 'a', probabilities: hostile({ a: 0.5, b: 0.5 }) } },
          usage
        }
      ]) {
        let result: ReturnType<typeof validateSystemOneBody> | undefined;
        expect(() => {
          result = validateSystemOneBody({ q: noul('q') }, body);
        }).not.toThrow();
        expect(result).toFailWith(/^the body is not a System-1 response/);
      }
    }
  });
});
