/*
 * Copyright (c) 2020 Erik Fortune
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
import 'jest-extended';
import '../helpers/jest';

import {
  AsyncResult,
  MessageAggregator,
  Result,
  captureAsyncResult,
  fail,
  succeed
} from '../../packlets/base';

describe('AsyncResult module', () => {
  describe('AsyncResult class', () => {
    describe('onSuccess', () => {
      test('calls the sync continuation on a wrapped success', async () => {
        const result = await AsyncResult.from(succeed('hello')).onSuccess((v) => succeed(v.length));
        expect(result).toSucceedWith(5);
      });

      test('propagates failure without calling the continuation', async () => {
        const cb = jest.fn();
        const result = await AsyncResult.from(fail<string>('oops')).onSuccess(cb);
        expect(cb).not.toHaveBeenCalled();
        expect(result).toFailWith(/oops/);
      });

      test('returns failure from the continuation', async () => {
        const result = await AsyncResult.from(succeed('hello')).onSuccess(() => fail('nope'));
        expect(result).toFailWith(/nope/);
      });
    });

    describe('thenOnSuccess', () => {
      test('calls the async continuation on a wrapped success', async () => {
        const result = await AsyncResult.from(succeed('hello')).thenOnSuccess(async (v) => succeed(v.length));
        expect(result).toSucceedWith(5);
      });

      test('propagates failure without calling the continuation', async () => {
        const cb = jest.fn();
        const result = await AsyncResult.from(fail<string>('oops')).thenOnSuccess(cb);
        expect(cb).not.toHaveBeenCalled();
        expect(result).toFailWith(/oops/);
      });

      test('returns failure from the async continuation', async () => {
        const result = await AsyncResult.from(succeed('hello')).thenOnSuccess(async () => fail('async nope'));
        expect(result).toFailWith(/async nope/);
      });

      test('catches rejected promises and converts to failure', async () => {
        const result = await AsyncResult.from(succeed('hello')).thenOnSuccess(async () => {
          throw new Error('rejected!');
        });
        expect(result).toFailWith(/rejected!/);
      });
    });

    describe('onFailure', () => {
      test('calls the sync continuation on a wrapped failure', async () => {
        const result = await AsyncResult.from(fail<string>('oops')).onFailure(() => succeed('recovered'));
        expect(result).toSucceedWith('recovered');
      });

      test('propagates success without calling the continuation', async () => {
        const cb = jest.fn();
        const result = await AsyncResult.from(succeed('hello')).onFailure(cb);
        expect(cb).not.toHaveBeenCalled();
        expect(result).toSucceedWith('hello');
      });
    });

    describe('thenOnFailure', () => {
      test('calls the async continuation on a wrapped failure', async () => {
        const result = await AsyncResult.from(fail<string>('oops')).thenOnFailure(async () =>
          succeed('recovered async')
        );
        expect(result).toSucceedWith('recovered async');
      });

      test('propagates success without calling the continuation', async () => {
        const cb = jest.fn();
        const result = await AsyncResult.from(succeed('hello')).thenOnFailure(cb);
        expect(cb).not.toHaveBeenCalled();
        expect(result).toSucceedWith('hello');
      });

      test('returns failure from the async continuation', async () => {
        const result = await AsyncResult.from(fail<string>('oops')).thenOnFailure(async () =>
          fail('still bad')
        );
        expect(result).toFailWith(/still bad/);
      });

      test('catches rejected promises and converts to failure', async () => {
        const result = await AsyncResult.from(fail<string>('oops')).thenOnFailure(async () => {
          throw new Error('recovery failed!');
        });
        expect(result).toFailWith(/recovery failed!/);
      });
    });

    describe('withErrorFormat', () => {
      test('formats error message on a wrapped failure', async () => {
        const result = await AsyncResult.from(fail<string>('oops')).withErrorFormat(
          (msg) => `wrapped: ${msg}`
        );
        expect(result).toFailWith(/wrapped: oops/);
      });

      test('propagates success without formatting', async () => {
        const result = await AsyncResult.from(succeed('hello')).withErrorFormat((msg) => `wrapped: ${msg}`);
        expect(result).toSucceedWith('hello');
      });
    });

    describe('aggregateError', () => {
      test('aggregates error message on a wrapped failure', async () => {
        const aggregator = new MessageAggregator();
        const result = await AsyncResult.from(fail<string>('oops')).aggregateError(aggregator);
        expect(result).toFailWith(/oops/);
        expect(aggregator.hasMessages).toBe(true);
        expect(aggregator.messages).toEqual(['oops']);
      });

      test('does not aggregate on a wrapped success', async () => {
        const aggregator = new MessageAggregator();
        const result = await AsyncResult.from(succeed('hello')).aggregateError(aggregator);
        expect(result).toSucceedWith('hello');
        expect(aggregator.hasMessages).toBe(false);
      });

      test('applies formatter when aggregating errors', async () => {
        const aggregator = new MessageAggregator();
        const result = await AsyncResult.from(fail<string>('oops')).aggregateError(
          aggregator,
          (msg) => `formatted: ${msg}`
        );
        expect(result).toFailWith(/oops/);
        expect(aggregator.messages).toEqual(['formatted: oops']);
      });
    });

    describe('report', () => {
      test('reports failure to the reporter', async () => {
        const reporter = {
          reportSuccess: jest.fn(),
          reportFailure: jest.fn()
        };
        const result = await AsyncResult.from(fail<string>('oops')).report(reporter);
        expect(result).toFailWith(/oops/);
        expect(reporter.reportFailure).toHaveBeenCalledWith('error', 'oops');
      });

      test('reports success to the reporter', async () => {
        const reporter = {
          reportSuccess: jest.fn(),
          reportFailure: jest.fn()
        };
        const result = await AsyncResult.from(succeed('hello')).report(reporter);
        expect(result).toSucceedWith('hello');
        expect(reporter.reportSuccess).toHaveBeenCalled();
      });

      test('handles undefined reporter', async () => {
        const result = await AsyncResult.from(succeed('hello')).report();
        expect(result).toSucceedWith('hello');
      });
    });

    describe('then (PromiseLike)', () => {
      test('can be directly awaited to get a Result', async () => {
        const result: Result<string> = await AsyncResult.from(succeed('hello'));
        expect(result).toSucceedWith('hello');
      });

      test('supports then callbacks', async () => {
        const value = await AsyncResult.from(succeed('hello')).then((r) => {
          if (r.isSuccess()) {
            return r.value.toUpperCase();
          }
          return 'failed';
        });
        expect(value).toBe('HELLO');
      });
    });

    describe('from', () => {
      test('wraps a success result', async () => {
        const result = await AsyncResult.from(succeed(42));
        expect(result).toSucceedWith(42);
      });

      test('wraps a failure result', async () => {
        const result = await AsyncResult.from(fail('oops'));
        expect(result).toFailWith(/oops/);
      });
    });

    describe('mixed chains', () => {
      test('chains sync and async success operations', async () => {
        const result = await AsyncResult.from(succeed(10))
          .onSuccess((v) => succeed(v * 2))
          .thenOnSuccess(async (v) => succeed(v + 5))
          .onSuccess((v) => succeed(v.toString()));
        expect(result).toSucceedWith('25');
      });

      test('propagates failure through mixed chains', async () => {
        const result = await AsyncResult.from(succeed(10))
          .onSuccess(() => fail<number>('step 1 failed'))
          .thenOnSuccess(async (v) => succeed(v + 5))
          .onSuccess((v) => succeed(v.toString()));
        expect(result).toFailWith(/step 1 failed/);
      });

      test('propagates async failure through mixed chains', async () => {
        const result = await AsyncResult.from(succeed(10))
          .thenOnSuccess(async () => fail<number>('async step failed'))
          .onSuccess((v) => succeed(v.toString()));
        expect(result).toFailWith(/async step failed/);
      });

      test('recovers from failure with thenOnFailure in a chain', async () => {
        const result = await AsyncResult.from(fail<number>('oops'))
          .thenOnFailure(async () => succeed(42))
          .onSuccess((v) => succeed(v.toString()));
        expect(result).toSucceedWith('42');
      });

      test('applies withErrorFormat in a chain', async () => {
        const result = await AsyncResult.from(succeed(10))
          .thenOnSuccess(async () => fail<number>('inner'))
          .withErrorFormat((msg) => `outer: ${msg}`);
        expect(result).toFailWith(/outer: inner/);
      });

      test('aggregates errors mid-chain', async () => {
        const aggregator = new MessageAggregator();
        const result = await AsyncResult.from(fail<number>('oops'))
          .aggregateError(aggregator)
          .onFailure(() => succeed(0));
        expect(result).toSucceedWith(0);
        expect(aggregator.messages).toEqual(['oops']);
      });
    });
  });

  describe('Bridge methods on Result', () => {
    describe('Success.thenOnSuccess', () => {
      test('calls the async continuation with the value', async () => {
        const result = await succeed('hello').thenOnSuccess(async (v) => succeed(v.length));
        expect(result).toSucceedWith(5);
      });

      test('returns failure from the async continuation', async () => {
        const result = await succeed('hello').thenOnSuccess(async () => fail('async fail'));
        expect(result).toFailWith(/async fail/);
      });

      test('catches rejected promises and converts to failure', async () => {
        const result = await succeed('hello').thenOnSuccess(async () => {
          throw new Error('boom');
        });
        expect(result).toFailWith(/boom/);
      });

      test('returns an AsyncResult that supports further chaining', async () => {
        const result = await succeed('hello')
          .thenOnSuccess(async (v) => succeed(v.toUpperCase()))
          .onSuccess((v) => succeed(v.length));
        expect(result).toSucceedWith(5);
      });
    });

    describe('Success.thenOnFailure', () => {
      test('skips the continuation and propagates success', async () => {
        const cb = jest.fn();
        const result = await succeed('hello').thenOnFailure(cb);
        expect(cb).not.toHaveBeenCalled();
        expect(result).toSucceedWith('hello');
      });
    });

    describe('Failure.thenOnSuccess', () => {
      test('skips the continuation and propagates failure', async () => {
        const cb = jest.fn();
        const result = await fail<string>('oops').thenOnSuccess(cb);
        expect(cb).not.toHaveBeenCalled();
        expect(result).toFailWith(/oops/);
      });
    });

    describe('Failure.thenOnFailure', () => {
      test('calls the async continuation with the message', async () => {
        const result = await fail<string>('oops').thenOnFailure(async () => succeed('recovered'));
        expect(result).toSucceedWith('recovered');
      });

      test('returns failure from the async continuation', async () => {
        const result = await fail<string>('oops').thenOnFailure(async () => fail('still bad'));
        expect(result).toFailWith(/still bad/);
      });

      test('catches rejected promises and converts to failure', async () => {
        const result = await fail<string>('oops').thenOnFailure(async () => {
          throw new Error('recovery boom');
        });
        expect(result).toFailWith(/recovery boom/);
      });

      test('returns an AsyncResult that supports further chaining', async () => {
        const result = await fail<string>('oops')
          .thenOnFailure(async () => succeed('recovered'))
          .onSuccess((v) => succeed(v.length));
        expect(result).toSucceedWith(9);
      });
    });

    describe('end-to-end async chain from sync Result', () => {
      test('chains from sync through async and back', async () => {
        const result = await succeed('input')
          .onSuccess((v) => succeed(v.toUpperCase()))
          .thenOnSuccess(async (v) => succeed(`${v}!`))
          .onSuccess((v) => succeed(v.length))
          .thenOnSuccess(async (v) => succeed(v * 2));
        expect(result).toSucceedWith(12);
      });

      test('failure at sync step propagates through async chain', async () => {
        const result = await succeed('input')
          .onSuccess(() => fail<string>('early fail'))
          .thenOnSuccess(async (v) => succeed(v.length));
        expect(result).toFailWith(/early fail/);
      });

      test('withErrorFormat works after async step', async () => {
        const result = await succeed('input')
          .thenOnSuccess(async () => fail<string>('inner error'))
          .withErrorFormat((msg) => `context: ${msg}`);
        expect(result).toFailWith(/context: inner error/);
      });
    });
  });

  describe('captureAsyncResult', () => {
    test('returns success for a resolved promise', async () => {
      const result = await captureAsyncResult(async () => 42);
      expect(result).toSucceedWith(42);
    });

    test('returns failure for a rejected promise', async () => {
      const result = await captureAsyncResult(async () => {
        throw new Error('async error');
      });
      expect(result).toFailWith(/async error/);
    });

    test('returns failure for a function that rejects', async () => {
      const result = await captureAsyncResult(async () => {
        throw new Error('something went wrong');
      });
      expect(result).toFailWith(/something went wrong/);
    });
  });
});
