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
  DetailedFailure,
  DetailedResult,
  DetailedSuccess,
  Failure,
  MessageAggregator,
  MessageLogLevel,
  Result,
  Success,
  captureResult,
  fail,
  failWithDetail,
  fails,
  failsWithDetail,
  propagateWithDetail,
  succeed,
  succeedWithDetail,
  succeeds,
  succeedsWithDetail,
  useOrInitialize
} from '../../packlets/base';
import * as Logging from '../../packlets/logging';

describe('Result module', () => {
  describe('Result type', () => {
    describe('properties', () => {
      function testResult(ok: boolean): Result<boolean> {
        return ok ? succeed(true) : fail('oops');
      }

      test('isSuccess and isFailure return correctly for success', () => {
        expect(testResult(true).isSuccess()).toBe(true);
        expect(testResult(true).isFailure()).toBe(false);
      });

      test('isSuccess and isFailure return correctly for failure', () => {
        expect(testResult(false).isSuccess()).toBe(false);
        expect(testResult(false).isFailure()).toBe(true);
      });

      test('value and message return correctly for success', () => {
        expect(testResult(true).value).toBe(true);
        expect(testResult(true).message).toBeUndefined();
      });

      test('value and message return correctly for failure', () => {
        expect(testResult(false).value).toBeUndefined();
        expect(testResult(false).message).toBe('oops');
      });

      test('can destructure into value and message for success with inference', () => {
        const { value, message } = testResult(true);
        expect(value).toBe(true);
        expect(message).toBeUndefined();
        if (value === undefined) {
          // note that compiler inferred that message is defined, so no '!' or '?' needed.
          expect(message[0]).toBe('o');
        }
      });

      test('can destructure into value and message for failure with inference', () => {
        const { value, message } = testResult(false);
        expect(value).toBeUndefined();
        expect(message).toBe('oops');
        if (value === undefined) {
          // note that compiler inferred that message is defined, so no '!' or '?' needed.
          // cast testResult to IResult<boolean> and inference is no longer possible
          expect(message[0]).toBe('o');
        }
      });
    });
  });

  describe('Success class', () => {
    describe('properties', () => {
      test('isSuccess is true', () => {
        expect(succeed('hello').isSuccess()).toBe(true);
      });

      test('isFailure is false', () => {
        expect(succeed('hello').isFailure()).toBe(false);
      });

      test('value is the value', () => {
        expect(succeed('hello').value).toBe('hello');
      });

      test('message is undefined', () => {
        expect(succeed('hello').message).toBeUndefined();
      });

      test('can destructure into value and message', () => {
        const { value, message } = succeed('hello');
        expect(value).toBe('hello');
        expect(message).toBeUndefined();
      });
    });

    describe('orThrow method', () => {
      test('returns the value and not throw', () => {
        const value = 'hello';
        const s = new Success(value);
        let gotValue: string | undefined;

        expect(() => {
          gotValue = s.orThrow();
        }).not.toThrow();
        expect(gotValue).toEqual(value);

        expect(() => {
          gotValue = s.getValueOrThrow();
        }).not.toThrow();
        expect(gotValue).toEqual(value);
      });

      test('does not invoke a logger if supplied', () => {
        const logger = { error: jest.fn() };
        expect(() => {
          succeed('hello').orThrow(logger);
        }).not.toThrow();
        expect(logger.error).not.toHaveBeenCalled();

        expect(() => {
          succeed('hello').getValueOrThrow(logger);
        }).not.toThrow();
        expect(logger.error).not.toHaveBeenCalled();
      });

      test('does not invoke a callback if supplied', () => {
        const cb = jest.fn();
        const s = new Success('hello');
        expect(() => {
          s.orThrow(cb);
        }).not.toThrow();
        expect(cb).not.toHaveBeenCalled();
      });
    });

    describe('orDefault method', () => {
      test('returns the value and not throw', () => {
        const value = 'hello';
        const s = new Success(value);
        let gotValue: string | undefined;

        expect(() => {
          gotValue = s.orDefault();
        }).not.toThrow();
        expect(gotValue).toEqual(value);

        expect(() => {
          gotValue = s.getValueOrDefault();
        }).not.toThrow();
        expect(gotValue).toEqual(value);
      });

      describe('with an undefined value', () => {
        test('returns the supplied default and not throw', () => {
          const dflt = 'default value';
          const s = new Success<string | undefined>(undefined);
          let gotValue: string | undefined;

          expect(() => {
            gotValue = s.orDefault(dflt);
          }).not.toThrow();
          expect(gotValue).toEqual(dflt);

          expect(() => {
            gotValue = s.getValueOrDefault(dflt);
          }).not.toThrow();
          expect(gotValue).toEqual(dflt);
        });
      });

      describe('type checks', () => {
        const dflt = { prop: 'value' };
        const s: Result<typeof dflt> = fail<typeof dflt>('oops');
        // '?' is required because return can be undefined
        expect(s.orDefault()?.prop).toBeUndefined();
        // No '?' needed because 'undefined' is not possible
        expect(s.orDefault(dflt).prop).toEqual('value');
      });
    });

    describe('onSuccess method', () => {
      test('calls the continuation', () => {
        const cb = jest.fn();
        succeed('hello').onSuccess(cb);
        expect(cb).toHaveBeenCalled();
      });

      test('returns any result from the continuation', () => {
        let result = succeed('hello').onSuccess(() => succeed('goodbye'));
        expect(result.isSuccess()).toBe(true);
        if (result.isSuccess()) {
          expect(result.value).toBe('goodbye');
        }

        result = succeed('hello').onSuccess(() => fail('oops'));
        expect(result.isFailure()).toBe(true);
        if (result.isFailure()) {
          expect(result.message).toBe('oops');
        }
      });
    });

    describe('onFailure method', () => {
      test('calls the continuation and returns the original result', () => {
        const cb = jest.fn((__: string): Result<string> => fail('oops'));
        const result = succeed('hello').onFailure(cb);
        expect(cb).not.toHaveBeenCalled();
        expect(result.isSuccess()).toBe(true);
        if (result.isSuccess()) {
          expect(result.value).toBe('hello');
        }
      });
    });

    describe('withErrorFormat method', () => {
      test('propagates an incoming success result', () => {
        expect(succeed('yaay!').withErrorFormat((msg) => `failed with ${msg}`)).toSucceedWith('yaay!');
      });

      test('formats an incoming error', () => {
        expect(fail('oops').withErrorFormat((msg) => `failed with ${msg}`)).toFailWith('failed with oops');
      });
    });
    describe('withFailureDetail method', () => {
      test('reports success with no detail', () => {
        expect(succeed('hello').withFailureDetail('fred')).toSucceedWithDetail('hello', undefined);
      });
    });

    describe('withDetail method', () => {
      test('reports success with the supplied detail', () => {
        expect(succeed('hello').withDetail('fred')).toSucceedWithDetail('hello', 'fred');
      });

      test('reports success with the success detail if supplied', () => {
        expect(succeed('hello').withDetail('fred', 'wilma')).toSucceedWithDetail('hello', 'wilma');
      });
    });

    describe('aggregateError method', () => {
      test('does not update errors array', () => {
        const aggregatedErrors = new MessageAggregator(['earlier error']);
        const success = succeed('hello');
        const aggregated = success.aggregateError(aggregatedErrors);
        expect(aggregated).toBe(success); // explicit test for identity
        expect(aggregatedErrors.messages).toEqual(['earlier error']);
      });

      describe('with formatter parameter', () => {
        test('ignores formatter and does not update aggregator', () => {
          const aggregatedErrors = new MessageAggregator(['earlier error']);
          const success = succeed('hello');
          const mockFormatter = jest.fn((msg: string) => `formatted: ${msg}`);

          const aggregated = success.aggregateError(aggregatedErrors, mockFormatter);

          expect(aggregated).toBe(success); // explicit test for identity
          expect(aggregatedErrors.messages).toEqual(['earlier error']); // unchanged
          expect(mockFormatter).not.toHaveBeenCalled(); // formatter not called for success
        });

        test('preserves success value regardless of formatter', () => {
          const aggregatedErrors = new MessageAggregator();
          const successValue = 'success value';
          const success = succeed(successValue);
          const formatter = (): string => 'this should not matter';

          const result = success.aggregateError(aggregatedErrors, formatter);

          expect(result).toSucceedWith(successValue);
          expect(aggregatedErrors.messages).toEqual([]); // no messages added
        });
      });
    });

    describe('report method', () => {
      test('calls reportSuccess with default quiet level when no options provided', () => {
        const reporter = {
          reportSuccess: jest.fn(),
          reportFailure: jest.fn()
        };
        const success = succeed('test value');

        const result = success.report(reporter);

        expect(result).toBe(success); // should return self for chaining
        expect(reporter.reportSuccess).toHaveBeenCalledWith('quiet', 'test value', undefined, undefined);
        expect(reporter.reportFailure).not.toHaveBeenCalled();
      });

      test('calls reportSuccess with custom success level from options', () => {
        const reporter = {
          reportSuccess: jest.fn(),
          reportFailure: jest.fn()
        };
        const success = succeed(42);

        success.report(reporter, { success: 'info' });

        expect(reporter.reportSuccess).toHaveBeenCalledWith('info', 42, undefined, undefined);
        expect(reporter.reportFailure).not.toHaveBeenCalled();
      });

      test('ignores failure level option and uses success level', () => {
        const reporter = {
          reportSuccess: jest.fn(),
          reportFailure: jest.fn()
        };
        const success = succeed('test');

        success.report(reporter, { success: 'warning', failure: 'error' });

        expect(reporter.reportSuccess).toHaveBeenCalledWith('warning', 'test', undefined, undefined);
        expect(reporter.reportFailure).not.toHaveBeenCalled();
      });

      test('uses default quiet level when success option is undefined', () => {
        const reporter = {
          reportSuccess: jest.fn(),
          reportFailure: jest.fn()
        };
        const success = succeed('test');

        success.report(reporter, { success: undefined, failure: 'error' });

        expect(reporter.reportSuccess).toHaveBeenCalledWith('quiet', 'test', undefined, undefined);
        expect(reporter.reportFailure).not.toHaveBeenCalled();
      });

      test('works with all valid MessageLogLevel values', () => {
        const reporter = {
          reportSuccess: jest.fn(),
          reportFailure: jest.fn()
        };
        const success = succeed('test');
        const levels: Array<'quiet' | 'detail' | 'info' | 'warning' | 'error'> = [
          'quiet',
          'detail',
          'info',
          'warning',
          'error'
        ];

        levels.forEach((level) => {
          reporter.reportSuccess.mockClear();
          success.report(reporter, { success: level });
          expect(reporter.reportSuccess).toHaveBeenCalledWith(level, 'test', undefined, undefined);
        });
      });

      test('does nothing when reporter is not provided', () => {
        const success = succeed('test value');

        // Should not throw and return self for chaining
        const result = success.report();

        expect(result).toBe(success);
      });

      test('does nothing when reporter is undefined', () => {
        const success = succeed('test value');

        // Should not throw and return self for chaining
        const result = success.report(undefined);

        expect(result).toBe(success);
      });

      test('does nothing with options when reporter is not provided', () => {
        const success = succeed('test value');

        // Should not throw and return self for chaining even with options
        const result = success.report(undefined, { success: 'info' });

        expect(result).toBe(success);
      });

      test('passes message formatter to reporter for success', () => {
        const reporter = {
          reportSuccess: jest.fn(),
          reportFailure: jest.fn()
        };
        const formatter = jest.fn((msg: string) => `formatted: ${msg}`);
        const success = succeed('test value');

        success.report(reporter, { success: { level: 'info', message: formatter } });

        expect(reporter.reportSuccess).toHaveBeenCalledWith('info', 'test value', undefined, formatter);
        expect(reporter.reportFailure).not.toHaveBeenCalled();
        expect(formatter).not.toHaveBeenCalled(); // The formatter is passed but not called by Result itself
      });

      test('supports success options with detail', () => {
        const reporter = {
          reportSuccess: jest.fn(),
          reportFailure: jest.fn()
        };
        const success = succeed('test value');

        success.report(reporter, {
          success: {
            level: 'detail',
            detail: 'test detail' as unknown
          }
        });

        expect(reporter.reportSuccess).toHaveBeenCalledWith('detail', 'test value', undefined, undefined);
        expect(reporter.reportFailure).not.toHaveBeenCalled();
      });

      test('supports shorthand success option', () => {
        const reporter = {
          reportSuccess: jest.fn(),
          reportFailure: jest.fn()
        };
        const success = succeed('test value');

        success.report(reporter, { success: 'warning' });

        expect(reporter.reportSuccess).toHaveBeenCalledWith('warning', 'test value', undefined, undefined);
        expect(reporter.reportFailure).not.toHaveBeenCalled();
      });
    });
  });

  describe('Failure class', () => {
    describe('properties', () => {
      test('isSuccess is false', () => {
        expect(fail('oops').isSuccess()).toBe(false);
      });

      test('isFailure is true', () => {
        expect(fail('oops').isFailure()).toBe(true);
      });

      test('message is the message', () => {
        expect(fail('oops').message).toBe('oops');
      });

      test('value is undefined', () => {
        expect(fail('oops').value).toBeUndefined();
      });

      test('can destructure into value and message', () => {
        const { value, message } = fail('oops');
        expect(value).toBeUndefined();
        expect(message).toBe('oops');
      });
    });

    describe('orThrow method', () => {
      test('throws the message', () => {
        const errorMessage = 'this is an error message';
        const f = new Failure(errorMessage);

        expect(() => f.orThrow()).toThrow(errorMessage);
      });

      test('calls logger if supplied', () => {
        const logger = { error: jest.fn() };
        const errorMessage = 'this is an error message';
        const f = new Failure(errorMessage);

        expect(() => f.orThrow(logger)).toThrow(errorMessage);
        expect(logger.error).toHaveBeenCalledWith(errorMessage);
      });

      test('calls callback if supplied', () => {
        const cb = jest.fn((s) => `got: ${s}`);
        const errorMessage = 'this is an error message';
        const f = new Failure(errorMessage);
        expect(() => f.orThrow(cb)).toThrow(`got: ${errorMessage}`);
        expect(cb).toHaveBeenCalledWith(errorMessage);
      });

      test('getValueOrThrow calls logger if supplied', () => {
        const logger = { error: jest.fn() };
        const errorMessage = 'this is an error message';
        const f = new Failure(errorMessage);

        expect(() => f.getValueOrThrow(logger)).toThrow(errorMessage);
        expect(logger.error).toHaveBeenCalledWith(errorMessage);
      });

      test('works with the utility logger class', () => {
        const logger = new Logging.InMemoryLogger();
        const errorMessage = 'this is an error message';
        const f = new Failure(errorMessage);

        expect(() => f.orThrow(logger)).toThrow(errorMessage);
        expect(logger.logged).toEqual([errorMessage]);
      });
    });

    describe('orDefault method', () => {
      test('returns undefined if default is omitted', () => {
        const f = new Failure<string>('this is an error message');
        let gotValue: string | undefined;

        expect(() => {
          gotValue = f.orDefault();
        }).not.toThrow();
        expect(gotValue).toBeUndefined();

        expect(() => {
          gotValue = f.getValueOrDefault();
        }).not.toThrow();
        expect(gotValue).toBeUndefined();
      });

      test('returns the supplied default and does not throw', () => {
        const dflt = 'default value';
        const f = new Failure<string>('this is an error message');
        let gotValue: string | undefined;
        expect(() => {
          gotValue = f.orDefault(dflt);
        }).not.toThrow();
        expect(gotValue).toEqual(dflt);
      });

      describe('aggregateError method', () => {
        test('appends the error to the supplied aggregated error array', () => {
          const aggregatedErrors = new MessageAggregator(['earlier error']);
          const failure = fail('new error');
          const aggregated = failure.aggregateError(aggregatedErrors);
          expect(aggregated).toBe(failure); // explicit test for identity
          expect(aggregated).toFailWith('new error');
          expect(aggregatedErrors.messages).toEqual(['earlier error', 'new error']);
        });

        describe('with formatter parameter', () => {
          test('applies formatter to error message before adding to aggregator', () => {
            const aggregatedErrors = new MessageAggregator(['earlier error']);
            const failure = fail('test error');
            const formatter = (msg: string): string => `[ERROR] ${msg.toUpperCase()}`;

            const aggregated = failure.aggregateError(aggregatedErrors, formatter);

            expect(aggregated).toBe(failure); // explicit test for identity
            expect(aggregated).toFailWith('test error'); // original message unchanged
            expect(aggregatedErrors.messages).toEqual(['earlier error', '[ERROR] TEST ERROR']);
          });

          test('works with complex formatter functions', () => {
            const aggregatedErrors = new MessageAggregator();
            const failure = fail('validation failed');
            const formatter = (msg: string): string => `Component: ${msg} (timestamp: ${Date.now()})`;

            failure.aggregateError(aggregatedErrors, formatter);

            expect(aggregatedErrors.messages).toHaveLength(1);
            expect(aggregatedErrors.messages[0]).toMatch(/^Component: validation failed \(timestamp: \d+\)$/);
          });

          test('handles formatter that returns empty string', () => {
            const aggregatedErrors = new MessageAggregator(['existing']);
            const failure = fail('some error');
            const formatter = (): string => '';

            failure.aggregateError(aggregatedErrors, formatter);

            // Empty string should not be added to messages (MessageAggregator ignores empty strings)
            expect(aggregatedErrors.messages).toEqual(['existing']);
          });

          test('handles formatter that returns undefined', () => {
            const aggregatedErrors = new MessageAggregator(['existing']);
            const failure = fail('some error');
            const formatter = (): string => undefined as unknown as string;

            failure.aggregateError(aggregatedErrors, formatter);

            // undefined should not be added to messages
            expect(aggregatedErrors.messages).toEqual(['existing']);
          });

          test('preserves original error message in failure result', () => {
            const aggregatedErrors = new MessageAggregator();
            const originalMessage = 'original error';
            const failure = fail(originalMessage);
            const formatter = (msg: string): string => `formatted: ${msg}`;

            const result = failure.aggregateError(aggregatedErrors, formatter);

            expect(result.message).toBe(originalMessage);
            expect(aggregatedErrors.messages).toEqual(['formatted: original error']);
          });

          test('allows method chaining', () => {
            const aggregatedErrors = new MessageAggregator();
            const failure = fail('error');
            const formatter = (msg: string): string => `prefix: ${msg}`;

            const result = failure
              .aggregateError(aggregatedErrors, formatter)
              .onFailure(() => succeed('recovered'));

            expect(result).toSucceedWith('recovered');
            expect(aggregatedErrors.messages).toEqual(['prefix: error']);
          });

          test('works with multiple failures and different formatters', () => {
            const aggregatedErrors = new MessageAggregator();
            const failure1 = fail('first error');
            const failure2 = fail('second error');
            const upperFormatter = (msg: string): string => msg.toUpperCase();
            const prefixFormatter = (msg: string): string => `[WARN] ${msg}`;

            failure1.aggregateError(aggregatedErrors, upperFormatter);
            failure2.aggregateError(aggregatedErrors, prefixFormatter);

            expect(aggregatedErrors.messages).toEqual(['FIRST ERROR', '[WARN] second error']);
          });

          test('formatter is called with exact message string', () => {
            const aggregatedErrors = new MessageAggregator();
            const testMessage = 'precise test message';
            const failure = fail(testMessage);
            const mockFormatter = jest.fn((msg: string): string => `formatted: ${msg}`);

            failure.aggregateError(aggregatedErrors, mockFormatter);

            expect(mockFormatter).toHaveBeenCalledTimes(1);
            expect(mockFormatter).toHaveBeenCalledWith(testMessage);
            expect(aggregatedErrors.messages).toEqual(['formatted: precise test message']);
          });
        });
      });
    });

    describe('report method', () => {
      test('calls reportFailure with default error level when no options provided', () => {
        const reporter = {
          reportSuccess: jest.fn(),
          reportFailure: jest.fn()
        };
        const failure = fail('test error');

        const result = failure.report(reporter);

        expect(result).toBe(failure); // should return self for chaining
        expect(reporter.reportFailure).toHaveBeenCalledWith('error', 'test error');
        expect(reporter.reportSuccess).not.toHaveBeenCalled();
      });

      test('calls reportFailure with custom failure level from options', () => {
        const reporter = {
          reportSuccess: jest.fn(),
          reportFailure: jest.fn()
        };
        const failure = fail('custom error');

        failure.report(reporter, { failure: 'warning' });

        expect(reporter.reportFailure).toHaveBeenCalledWith('warning', 'custom error');
        expect(reporter.reportSuccess).not.toHaveBeenCalled();
      });

      test('ignores success level option and uses failure level', () => {
        const reporter = {
          reportSuccess: jest.fn(),
          reportFailure: jest.fn()
        };
        const failure = fail('test error');

        failure.report(reporter, { success: 'info', failure: 'detail' });

        expect(reporter.reportFailure).toHaveBeenCalledWith('detail', 'test error');
        expect(reporter.reportSuccess).not.toHaveBeenCalled();
      });

      test('uses default error level when failure option is undefined', () => {
        const reporter = {
          reportSuccess: jest.fn(),
          reportFailure: jest.fn()
        };
        const failure = fail('test error');

        failure.report(reporter, { success: 'info', failure: undefined });

        expect(reporter.reportFailure).toHaveBeenCalledWith('error', 'test error');
        expect(reporter.reportSuccess).not.toHaveBeenCalled();
      });

      test('works with all valid MessageLogLevel values', () => {
        const reporter = {
          reportSuccess: jest.fn(),
          reportFailure: jest.fn()
        };
        const failure = fail('test error');
        const levels: Array<'quiet' | 'detail' | 'info' | 'warning' | 'error'> = [
          'quiet',
          'detail',
          'info',
          'warning',
          'error'
        ];

        levels.forEach((level) => {
          reporter.reportFailure.mockClear();
          failure.report(reporter, { failure: level });
          expect(reporter.reportFailure).toHaveBeenCalledWith(level, 'test error');
        });
      });

      test('does nothing when reporter is not provided', () => {
        const failure = fail('test error');

        // Should not throw and return self for chaining
        const result = failure.report();

        expect(result).toBe(failure);
      });

      test('does nothing when reporter is undefined', () => {
        const failure = fail('test error');

        // Should not throw and return self for chaining
        const result = failure.report(undefined);

        expect(result).toBe(failure);
      });

      test('does nothing with options when reporter is not provided', () => {
        const failure = fail('test error');

        // Should not throw and return self for chaining even with options
        const result = failure.report(undefined, { failure: 'warning' });

        expect(result).toBe(failure);
      });

      test('applies message formatter to failure message', () => {
        const reporter = {
          reportSuccess: jest.fn(),
          reportFailure: jest.fn()
        };
        const formatter = jest.fn((msg: string) => `formatted: ${msg}`);
        const failure = fail('test error');

        failure.report(reporter, { failure: { message: formatter } });

        expect(formatter).toHaveBeenCalledWith('test error');
        expect(reporter.reportFailure).toHaveBeenCalledWith('error', 'formatted: test error');
        expect(reporter.reportSuccess).not.toHaveBeenCalled();
      });

      test('supports failure options with detail', () => {
        const reporter = {
          reportSuccess: jest.fn(),
          reportFailure: jest.fn()
        };
        const failure = fail('test error');

        failure.report(reporter, {
          failure: {
            level: 'warning',
            detail: 'test detail' as unknown
          }
        });

        expect(reporter.reportFailure).toHaveBeenCalledWith('warning', 'test error');
        expect(reporter.reportSuccess).not.toHaveBeenCalled();
      });

      test('supports shorthand failure option', () => {
        const reporter = {
          reportSuccess: jest.fn(),
          reportFailure: jest.fn()
        };
        const failure = fail('test error');

        failure.report(reporter, { failure: 'info' });

        expect(reporter.reportFailure).toHaveBeenCalledWith('info', 'test error');
        expect(reporter.reportSuccess).not.toHaveBeenCalled();
      });
    });

    describe('onSuccess method', () => {
      test('does not call the continuation and returns the original result', () => {
        const cb = jest.fn((__: unknown): Result<string> => fail('oops'));
        const result = fail('oops').onSuccess(cb);
        expect(cb).not.toHaveBeenCalled();
        expect(result.isFailure()).toBe(true);
        if (result.isFailure()) {
          expect(result.message).toBe('oops');
        }
      });
    });

    describe('onFailure method', () => {
      test('calls the continuation', () => {
        const cb = jest.fn();
        fail('oops').onFailure(cb);
        expect(cb).toHaveBeenCalled();
      });

      test('returns any result from the continuation', () => {
        let result = fail('bad').onFailure(() => fail('double bad'));
        expect(result.isFailure()).toBe(true);
        if (result.isFailure()) {
          expect(result.message).toBe('double bad');
        }

        result = fail('hello').onFailure(() => succeed('nice save'));
        expect(result.isSuccess()).toBe(true);
        if (result.isSuccess()) {
          expect(result.value).toBe('nice save');
        }
      });
    });

    describe('withFailureDetail method', () => {
      test('reports failure with the supplied detail', () => {
        expect(fail('oops').withFailureDetail('fred')).toFailWithDetail('oops', 'fred');
      });
    });

    describe('withDetail method', () => {
      test('reports failure with the supplied detail', () => {
        expect(fail('oops').withDetail('fred')).toFailWithDetail('oops', 'fred');
      });

      test('reports failure with the default detail even if success detail is supplied', () => {
        expect(fail('oops').withDetail('fred', 'wilma')).toFailWithDetail('oops', 'fred');
      });
    });

    describe('toString method', () => {
      test('returns the message', () => {
        expect(new Failure('oops').toString()).toBe('oops');
      });
    });
  });

  describe('detailedSuccess class', () => {
    test('reports value', () => {
      const result = succeedWithDetail('message');
      expect(result).toSucceedWith('message');
    });

    test('reports detail', () => {
      const result = succeedWithDetail('message', 'detail');
      expect(result).toSucceedWith('message');
      expect(result.detail).toBe('detail');
    });

    test('isSuccess indicates detailed success', () => {
      const result = succeedWithDetail<string, string>('original message') as DetailedResult<string, string>;
      // The only difference between Success and DetailedSuccess is the call signature for
      // onFailure and onSuccess
      expect(
        result.onFailure((__message, detail) => {
          expect(typeof detail).toBe('never');
          return succeedWithDetail('hello');
        })
      ).toSucceedWith('original message');
    });

    test('onSuccess passes value', () => {
      expect(
        succeedWithDetail('value').onSuccess((v) => {
          expect(v).toEqual('value');
          return succeedWithDetail('it worked!');
        })
      ).toSucceedWith('it worked!');
    });

    test('onSuccess propagates detail', () => {
      expect(
        succeedWithDetail('value', 'detail').onSuccess((v, d) => {
          expect(v).toEqual('value');
          expect(d).toEqual('detail');
          return succeedWithDetail('it worked!');
        })
      ).toSucceedWith('it worked!');
    });

    test('onFailure propagates success value', () => {
      expect(
        succeedWithDetail<string, string>('pass through').onFailure((__message, detail) => {
          expect(typeof detail).toBe('never');
          return failWithDetail('failed', 'should not happen');
        })
      ).toSucceedWith('pass through');
    });

    describe('withErrorFormat method', () => {
      test('propagates incoming success', () => {
        expect(
          succeedWithDetail('yaay!', 'blarg').withErrorFormat((msg) => `failed with ${msg}`)
        ).toSucceedWithDetail('yaay!', 'blarg');
      });
    });

    describe('withFailureDetail method', () => {
      test('reports success with detail undefined', () => {
        expect(succeedWithDetail('hello', 10).withFailureDetail('fred')).toSucceedWithDetail(
          'hello',
          undefined
        );
      });
    });

    describe('withDetail method', () => {
      test('reports success with the supplied detail, overriding original detail', () => {
        expect(succeedWithDetail('hello', 10).withDetail('fred')).toSucceedWithDetail('hello', 'fred');
      });

      test('reports success with the success detail if supplied, overriding original detail', () => {
        expect(succeedWithDetail('hello', 10).withDetail('fred', 'wilma')).toSucceedWithDetail(
          'hello',
          'wilma'
        );
      });
    });

    describe('report method', () => {
      test('calls reportSuccess with default quiet level and includes detail when no options provided', () => {
        const reporter = {
          reportSuccess: jest.fn(),
          reportFailure: jest.fn()
        };
        const detailedSuccess = succeedWithDetail('test value', 'test detail');

        const result = detailedSuccess.report(reporter);

        expect(result).toBe(detailedSuccess); // should return self for chaining
        expect(reporter.reportSuccess).toHaveBeenCalledWith('quiet', 'test value', 'test detail', undefined);
        expect(reporter.reportFailure).not.toHaveBeenCalled();
      });

      test('calls reportSuccess with custom success level from options and includes detail', () => {
        const reporter = {
          reportSuccess: jest.fn(),
          reportFailure: jest.fn()
        };
        const detailedSuccess = succeedWithDetail(42, { key: 'value' });

        detailedSuccess.report(reporter, { success: 'info' });

        expect(reporter.reportSuccess).toHaveBeenCalledWith('info', 42, { key: 'value' }, undefined);
        expect(reporter.reportFailure).not.toHaveBeenCalled();
      });

      test('works with undefined detail', () => {
        const reporter = {
          reportSuccess: jest.fn(),
          reportFailure: jest.fn()
        };
        const detailedSuccess = succeedWithDetail('test value', undefined);

        detailedSuccess.report(reporter, { success: 'warning' });

        expect(reporter.reportSuccess).toHaveBeenCalledWith('warning', 'test value', undefined, undefined);
        expect(reporter.reportFailure).not.toHaveBeenCalled();
      });

      test('ignores failure level option and uses success level', () => {
        const reporter = {
          reportSuccess: jest.fn(),
          reportFailure: jest.fn()
        };
        const detailedSuccess = succeedWithDetail('test', 'detail');

        detailedSuccess.report(reporter, { success: 'warning', failure: 'error' });

        expect(reporter.reportSuccess).toHaveBeenCalledWith('warning', 'test', 'detail', undefined);
        expect(reporter.reportFailure).not.toHaveBeenCalled();
      });

      test('works with all valid MessageLogLevel values', () => {
        const reporter = {
          reportSuccess: jest.fn(),
          reportFailure: jest.fn()
        };
        const detailedSuccess = succeedWithDetail('test', 'detail');
        const levels: Array<'quiet' | 'detail' | 'info' | 'warning' | 'error'> = [
          'quiet',
          'detail',
          'info',
          'warning',
          'error'
        ];

        levels.forEach((level) => {
          reporter.reportSuccess.mockClear();
          detailedSuccess.report(reporter, { success: level });
          expect(reporter.reportSuccess).toHaveBeenCalledWith(level, 'test', 'detail', undefined);
        });
      });

      test('does nothing when reporter is not provided', () => {
        const detailedSuccess = succeedWithDetail('test value', 'test detail');

        // Should not throw and return self for chaining
        const result = detailedSuccess.report();

        expect(result).toBe(detailedSuccess);
      });

      test('does nothing when reporter is undefined', () => {
        const detailedSuccess = succeedWithDetail('test value', 'test detail');

        // Should not throw and return self for chaining
        const result = detailedSuccess.report(undefined);

        expect(result).toBe(detailedSuccess);
      });

      test('does nothing with options when reporter is not provided', () => {
        const detailedSuccess = succeedWithDetail('test value', 'test detail');

        // Should not throw and return self for chaining even with options
        const result = detailedSuccess.report(undefined, { success: 'info' });

        expect(result).toBe(detailedSuccess);
      });

      test('ignores message formatter option and does not call it', () => {
        const reporter = {
          reportSuccess: jest.fn(),
          reportFailure: jest.fn()
        };
        const formatter = jest.fn((msg: string) => `formatted: ${msg}`);
        const detailedSuccess = succeedWithDetail('test', 'detail');

        detailedSuccess.report(reporter, { success: { level: 'detail', message: formatter } });

        expect(reporter.reportSuccess).toHaveBeenCalledWith('detail', 'test', 'detail', formatter);
        expect(reporter.reportFailure).not.toHaveBeenCalled();
        expect(formatter).not.toHaveBeenCalled(); // The formatter is passed but not called by Result itself
      });
    });

    describe('asResult getter', () => {
      test('returns itself as a Result', () => {
        const detailedSuccess = succeedWithDetail('test value', 'test detail');
        const asResult = detailedSuccess.asResult;

        expect(asResult).toBe(detailedSuccess);
        expect(asResult).toSucceedWith('test value');
      });
    });
  });

  describe('detailedFailure class', () => {
    test('reports detail in addition to message', () => {
      const result = failWithDetail('message', 'detail');
      expect(result).toFailWith('message');
      expect(result.detail).toBe('detail');
    });

    test('isFailure indicates detailed failure', () => {
      const result = failWithDetail('message', 'detail') as DetailedResult<string, string>;
      if (result.isFailure()) {
        expect(result.detail).toBe('detail');
      }
    });

    test('onSuccess propagates detail', () => {
      const detail = { detail: 'detail' };
      expect(
        failWithDetail('error', detail).onSuccess((__v) => {
          expect(typeof __v).toBe('never');
          return succeedWithDetail('weird');
        })
      ).toFailWithDetail('error', detail);
    });

    test('onFailure passes detail', () => {
      const detail = { detail: 'detail' };
      expect(
        failWithDetail('error', detail).onFailure((message, detail) => {
          expect(message).toBe('error');
          expect(detail).toEqual(detail);
          return succeedWithDetail('it worked');
        })
      ).toSucceedWith('it worked');
    });

    describe('withErrorFormat', () => {
      test('propagates incoming failure', () => {
        expect(failWithDetail('oops', 10).withErrorFormat((msg) => `failed with ${msg}`)).toFailWithDetail(
          'failed with oops',
          10
        );
      });
    });

    describe('withFailureDetail method', () => {
      test('reports failure with the supplied detail, overriding any original detail', () => {
        expect(failWithDetail('oops', 10).withFailureDetail('fred')).toFailWithDetail('oops', 'fred');
      });
    });

    describe('withDetail method', () => {
      test('reports failure with the supplied detail, overriding any original detail', () => {
        expect(failWithDetail('oops', 10).withDetail('fred')).toFailWithDetail('oops', 'fred');
      });

      test('reports failure with the default detail, overriding any original detail, even if success detail is supplied', () => {
        expect(failWithDetail('oops', 10).withDetail('fred', 'wilma')).toFailWithDetail('oops', 'fred');
      });
    });

    describe('aggregateError method', () => {
      test('appends the error to the supplied aggregated error array without formatter', () => {
        const aggregatedErrors = new MessageAggregator(['earlier error']);
        const detailedFailure = failWithDetail('new error', 'error detail');
        const aggregated = detailedFailure.aggregateError(aggregatedErrors);
        expect(aggregated).toBe(detailedFailure); // explicit test for identity
        expect(aggregated).toFailWith('new error');
        expect(aggregatedErrors.messages).toEqual(['earlier error', 'new error']);
      });

      describe('with formatter parameter', () => {
        test('applies formatter with both message and detail before adding to aggregator', () => {
          const aggregatedErrors = new MessageAggregator(['earlier error']);
          const detailedFailure = failWithDetail('test error', 'error context');
          const formatter = (msg: string, detail?: string): string => `[${detail}] ${msg.toUpperCase()}`;

          const aggregated = detailedFailure.aggregateError(aggregatedErrors, formatter);

          expect(aggregated).toBe(detailedFailure); // explicit test for identity
          expect(aggregated).toFailWith('test error'); // original message unchanged
          expect(aggregatedErrors.messages).toEqual(['earlier error', '[error context] TEST ERROR']);
        });

        test('works with complex formatter functions using detail', () => {
          const aggregatedErrors = new MessageAggregator();
          const detailedFailure = failWithDetail('validation failed', { code: 400, field: 'email' });
          const formatter = (msg: string, detail?: { code: number; field: string }): string =>
            `${detail?.field}: ${msg} (HTTP ${detail?.code})`;

          detailedFailure.aggregateError(aggregatedErrors, formatter);

          expect(aggregatedErrors.messages).toEqual(['email: validation failed (HTTP 400)']);
        });

        test('handles formatter when detail is undefined', () => {
          const aggregatedErrors = new MessageAggregator();
          const detailedFailure = failWithDetail('error message', undefined);
          const formatter = (msg: string, detail?: string): string =>
            detail ? `${detail}: ${msg}` : `no detail: ${msg}`;

          detailedFailure.aggregateError(aggregatedErrors, formatter);

          expect(aggregatedErrors.messages).toEqual(['no detail: error message']);
        });

        test('handles formatter that returns empty string', () => {
          const aggregatedErrors = new MessageAggregator(['existing']);
          const detailedFailure = failWithDetail('some error', 'some detail');
          const formatter = (): string => '';

          detailedFailure.aggregateError(aggregatedErrors, formatter);

          // Empty string should not be added to messages
          expect(aggregatedErrors.messages).toEqual(['existing']);
        });

        test('handles formatter that returns undefined', () => {
          const aggregatedErrors = new MessageAggregator(['existing']);
          const detailedFailure = failWithDetail('some error', 'some detail');
          const formatter = (): string => undefined as unknown as string;

          detailedFailure.aggregateError(aggregatedErrors, formatter);

          // undefined should not be added to messages
          expect(aggregatedErrors.messages).toEqual(['existing']);
        });

        test('preserves original error message and detail in failure result', () => {
          const aggregatedErrors = new MessageAggregator();
          const originalMessage = 'original error';
          const originalDetail = 'original detail';
          const detailedFailure = failWithDetail(originalMessage, originalDetail);
          const formatter = (msg: string, detail?: string): string => `formatted: ${msg} with ${detail}`;

          const result = detailedFailure.aggregateError(aggregatedErrors, formatter);

          expect(result.message).toBe(originalMessage);
          expect(result.detail).toBe(originalDetail);
          expect(aggregatedErrors.messages).toEqual(['formatted: original error with original detail']);
        });

        test('allows method chaining', () => {
          const aggregatedErrors = new MessageAggregator();
          const detailedFailure = failWithDetail('error', 'detail');
          const formatter = (msg: string, detail?: string): string => `${detail}: ${msg}`;

          const result = detailedFailure
            .aggregateError(aggregatedErrors, formatter)
            .onFailure(() => succeedWithDetail('recovered', 'recovery detail'));

          expect(result).toSucceedWith('recovered');
          expect(aggregatedErrors.messages).toEqual(['detail: error']);
        });

        test('works with multiple detailed failures and different formatters', () => {
          const aggregatedErrors = new MessageAggregator();
          const failure1 = failWithDetail('first error', 'context1');
          const failure2 = failWithDetail('second error', { type: 'validation' });
          const upperFormatter = (msg: string, detail?: string): string => `${detail?.toUpperCase()}: ${msg}`;
          const prefixFormatter = (msg: string, detail?: { type: string }): string =>
            `[${detail?.type}] ${msg}`;

          failure1.aggregateError(aggregatedErrors, upperFormatter);
          failure2.aggregateError(aggregatedErrors, prefixFormatter);

          expect(aggregatedErrors.messages).toEqual(['CONTEXT1: first error', '[validation] second error']);
        });

        test('formatter is called with exact message and detail', () => {
          const aggregatedErrors = new MessageAggregator();
          const testMessage = 'precise test message';
          const testDetail = { id: 123, type: 'test' };
          const detailedFailure = failWithDetail(testMessage, testDetail);
          const mockFormatter = jest.fn(
            (msg: string, detail?: typeof testDetail): string => `${detail?.type}-${detail?.id}: ${msg}`
          );

          detailedFailure.aggregateError(aggregatedErrors, mockFormatter);

          expect(mockFormatter).toHaveBeenCalledTimes(1);
          expect(mockFormatter).toHaveBeenCalledWith(testMessage, testDetail);
          expect(aggregatedErrors.messages).toEqual(['test-123: precise test message']);
        });

        test('formatter receives detail as second parameter with proper typing', () => {
          const aggregatedErrors = new MessageAggregator();
          interface ErrorDetail {
            code: number;
            severity: 'low' | 'medium' | 'high';
          }
          const detail: ErrorDetail = { code: 500, severity: 'high' };
          const detailedFailure = failWithDetail('server error', detail);

          const formatter = (msg: string, detail?: ErrorDetail): string => {
            if (detail) {
              return `[${detail.severity.toUpperCase()}-${detail.code}] ${msg}`;
            }
            return msg;
          };

          detailedFailure.aggregateError(aggregatedErrors, formatter);

          expect(aggregatedErrors.messages).toEqual(['[HIGH-500] server error']);
        });
      });
    });

    describe('report method', () => {
      test('calls reportFailure with default error level and includes detail when no options provided', () => {
        const reporter = {
          reportSuccess: jest.fn(),
          reportFailure: jest.fn()
        };
        const detailedFailure = failWithDetail('test error', 'test detail');

        const result = detailedFailure.report(reporter);

        expect(result).toBe(detailedFailure); // should return self for chaining
        expect(reporter.reportFailure).toHaveBeenCalledWith('error', 'test error', 'test detail');
        expect(reporter.reportSuccess).not.toHaveBeenCalled();
      });

      test('calls reportFailure with custom failure level from options and includes detail', () => {
        const reporter = {
          reportSuccess: jest.fn(),
          reportFailure: jest.fn()
        };
        const detailedFailure = failWithDetail('custom error', { code: 404 });

        detailedFailure.report(reporter, { failure: 'warning' });

        expect(reporter.reportFailure).toHaveBeenCalledWith('warning', 'custom error', { code: 404 });
        expect(reporter.reportSuccess).not.toHaveBeenCalled();
      });

      test('works with undefined detail', () => {
        const reporter = {
          reportSuccess: jest.fn(),
          reportFailure: jest.fn()
        };
        const detailedFailure = failWithDetail('test error', undefined);

        detailedFailure.report(reporter, { failure: 'detail' });

        expect(reporter.reportFailure).toHaveBeenCalledWith('detail', 'test error', undefined);
        expect(reporter.reportSuccess).not.toHaveBeenCalled();
      });

      test('ignores success level option and uses failure level', () => {
        const reporter = {
          reportSuccess: jest.fn(),
          reportFailure: jest.fn()
        };
        const detailedFailure = failWithDetail('test error', 'error detail');

        detailedFailure.report(reporter, { success: 'info', failure: 'detail' });

        expect(reporter.reportFailure).toHaveBeenCalledWith('detail', 'test error', 'error detail');
        expect(reporter.reportSuccess).not.toHaveBeenCalled();
      });

      test('uses default error level when failure option is undefined', () => {
        const reporter = {
          reportSuccess: jest.fn(),
          reportFailure: jest.fn()
        };
        const detailedFailure = failWithDetail('test error', 'detail');

        detailedFailure.report(reporter, { success: 'info', failure: undefined });

        expect(reporter.reportFailure).toHaveBeenCalledWith('error', 'test error', 'detail');
        expect(reporter.reportSuccess).not.toHaveBeenCalled();
      });

      test('works with all valid MessageLogLevel values', () => {
        const reporter = {
          reportSuccess: jest.fn(),
          reportFailure: jest.fn()
        };
        const detailedFailure = failWithDetail('test error', 'detail');
        const levels: Array<'quiet' | 'detail' | 'info' | 'warning' | 'error'> = [
          'quiet',
          'detail',
          'info',
          'warning',
          'error'
        ];

        levels.forEach((level) => {
          reporter.reportFailure.mockClear();
          detailedFailure.report(reporter, { failure: level });
          expect(reporter.reportFailure).toHaveBeenCalledWith(level, 'test error', 'detail');
        });
      });

      test('does nothing when reporter is not provided', () => {
        const detailedFailure = failWithDetail('test error', 'test detail');

        // Should not throw and return self for chaining
        const result = detailedFailure.report();

        expect(result).toBe(detailedFailure);
      });

      test('does nothing when reporter is undefined', () => {
        const detailedFailure = failWithDetail('test error', 'test detail');

        // Should not throw and return self for chaining
        const result = detailedFailure.report(undefined);

        expect(result).toBe(detailedFailure);
      });

      test('does nothing with options when reporter is not provided', () => {
        const detailedFailure = failWithDetail('test error', 'test detail');

        // Should not throw and return self for chaining even with options
        const result = detailedFailure.report(undefined, { failure: 'warning' });

        expect(result).toBe(detailedFailure);
      });

      test('applies message formatter including detail to failure message', () => {
        const reporter = {
          reportSuccess: jest.fn(),
          reportFailure: jest.fn()
        };
        const formatter = jest.fn((msg: string, detail?: unknown) => `${detail as string}: ${msg}!`);
        const detailedFailure = failWithDetail('test error', 'error detail');

        detailedFailure.report(reporter, { failure: { message: formatter } });

        expect(formatter).toHaveBeenCalledWith('test error', 'error detail');
        expect(reporter.reportFailure).toHaveBeenCalledWith(
          'error',
          'error detail: test error!',
          'error detail'
        );
        expect(reporter.reportSuccess).not.toHaveBeenCalled();
      });
    });

    describe('asResult getter', () => {
      test('returns itself as a Result', () => {
        const detailedFailure = failWithDetail('test error', 'test detail');
        const asResult = detailedFailure.asResult;

        expect(asResult).toBe(detailedFailure);
        expect(asResult).toFailWith('test error');
      });
    });
  });

  describe('orThrow method', () => {
    test('throws the message', () => {
      const errorMessage = 'this is an error message';
      const f = failWithDetail(errorMessage, 'detail');

      expect(() => f.orThrow()).toThrow(errorMessage);
    });

    test('calls logger with detail if supplied', () => {
      const logger = { error: jest.fn((m, d) => `${d}: ${m}`) };
      const errorMessage = 'this is an error message';
      const f = failWithDetail(errorMessage, 'detail');

      expect(() => f.orThrow(logger)).toThrow(errorMessage);
      expect(logger.error).toHaveBeenCalledWith(errorMessage, 'detail');
    });

    test('calls callback if supplied', () => {
      const cb = jest.fn((s, d) => `${d}: ${s}`);
      const errorMessage = 'this is an error message';
      const f = failWithDetail(errorMessage, 'detail');
      expect(() => f.orThrow(cb)).toThrow(`detail: ${errorMessage}`);
      expect(cb).toHaveBeenCalledWith(errorMessage, 'detail');
    });
  });

  describe('propagateWithDetail function', () => {
    test('propagates value and success detail on success if defined', () => {
      expect(propagateWithDetail(succeed('hello'), 'e', 's')).toSucceedWithDetail('hello', 's');
    });

    test('propagates value and default detail on success if success detail is not defined', () => {
      expect(propagateWithDetail(succeed('hello'), 'detail')).toSucceedWithDetail('hello', 'detail');
    });

    test('propagates message and failure detail if success detail is not defined', () => {
      expect(propagateWithDetail(fail('oops'), 'detail')).toFailWithDetail('oops', 'detail');
    });

    test('propagates message and failure detail if success detail is defined', () => {
      expect(propagateWithDetail(fail('oops'), 'e', 's')).toFailWithDetail('oops', 'e');
    });
  });

  describe('captureResult function', () => {
    test('returns success and the value if the method does not throw', () => {
      const successfulReturn = 'This is a successful return';
      const result = captureResult(() => {
        return successfulReturn;
      });
      expect(result.isSuccess()).toBe(true);
      if (result.isSuccess()) {
        expect(result.value).toBe(successfulReturn);
      }
    });

    test('returns failure and the thrown message if the method throws', () => {
      const failedReturn = 'This is a successful return';
      const result = captureResult(() => {
        throw new Error(failedReturn);
      });
      expect(result.isFailure()).toBe(true);
      if (result.isFailure()) {
        expect(result.message).toBe(failedReturn);
      }
    });
  });

  describe('helpers', () => {
    test('success helpers return expected Success result', () => {
      expect(succeed('hello')).toSucceedWith('hello');
      expect(succeeds('hello')).toSucceedWith('hello');
      expect(Success.with('hello')).toSucceedWith('hello');
      expect(succeedWithDetail('hello', 'detail')).toSucceedWithDetail('hello', 'detail');
      expect(succeedsWithDetail('hello', 'detail')).toSucceedWithDetail('hello', 'detail');
      expect(DetailedSuccess.with('hello', 'detail')).toSucceedWithDetail('hello', 'detail');
    });

    test('failure helpers return expected Failure result', () => {
      expect(fail('oops')).toFailWith('oops');
      expect(fails('oops')).toFailWith('oops');
      expect(Failure.with('oops')).toFailWith('oops');
      expect(failWithDetail('oops', 'detail')).toFailWithDetail('oops', 'detail');
      expect(failsWithDetail('oops', 'detail')).toFailWithDetail('oops', 'detail');
      expect(DetailedFailure.with('oops', 'detail')).toFailWithDetail('oops', 'detail');
    });
  });
  describe('useOrInitialize', () => {
    test('returns Success with value if value is defined', () => {
      const result = useOrInitialize(42, () => fail('should not be called'));
      expect(result.isSuccess()).toBe(true);
      if (result.isSuccess()) {
        expect(result.value).toBe(42);
      }
    });

    test('calls initializer and returns its result if value is undefined', () => {
      const result = useOrInitialize(undefined, () => succeed('initialized'));
      expect(result.isSuccess()).toBe(true);
      if (result.isSuccess()) {
        expect(result.value).toBe('initialized');
      }
    });

    test('returns Failure if initializer returns Failure', () => {
      const result = useOrInitialize(undefined, () => fail('init failed'));
      expect(result.isFailure()).toBe(true);
      if (result.isFailure()) {
        expect(result.message).toBe('init failed');
      }
    });

    test('initializer is not called if value is defined', () => {
      const initializer = jest.fn(() => succeed('should not be called'));
      const result = useOrInitialize('present', initializer);
      expect(result.isSuccess()).toBe(true);
      expect(initializer).not.toHaveBeenCalled();
      if (result.isSuccess()) {
        expect(result.value).toBe('present');
      }
    });
  });

  describe('report method integration tests', () => {
    describe('method chaining', () => {
      test('Success.report() enables method chaining', () => {
        const reporter = {
          reportSuccess: jest.fn(),
          reportFailure: jest.fn()
        };

        const result = succeed('test')
          .report(reporter)
          .onSuccess(() => succeed('chained'));

        expect(result).toSucceedWith('chained');
        expect(reporter.reportSuccess).toHaveBeenCalledWith('quiet', 'test', undefined, undefined);
      });

      test('Failure.report() enables method chaining', () => {
        const reporter = {
          reportSuccess: jest.fn(),
          reportFailure: jest.fn()
        };

        const result = fail('test error')
          .report(reporter)
          .onFailure(() => succeed('recovered'));

        expect(result).toSucceedWith('recovered');
        expect(reporter.reportFailure).toHaveBeenCalledWith('error', 'test error');
      });

      test('DetailedSuccess.report() enables method chaining', () => {
        const reporter = {
          reportSuccess: jest.fn(),
          reportFailure: jest.fn()
        };

        const result = succeedWithDetail('test', 'detail')
          .report(reporter)
          .onSuccess((value, detail) => succeedWithDetail(`${value}-${detail}`));

        expect(result).toSucceedWith('test-detail');
        expect(reporter.reportSuccess).toHaveBeenCalledWith('quiet', 'test', 'detail', undefined);
      });

      test('DetailedFailure.report() enables method chaining', () => {
        const reporter = {
          reportSuccess: jest.fn(),
          reportFailure: jest.fn()
        };

        const result = failWithDetail('test error', 'error detail')
          .report(reporter)
          .onFailure((message, detail) => succeedWithDetail(`recovered: ${message} (${detail})`));

        expect(result).toSucceedWith('recovered: test error (error detail)');
        expect(reporter.reportFailure).toHaveBeenCalledWith('error', 'test error', 'error detail');
      });
    });

    describe('type compatibility', () => {
      test('Success.report() works with typed reporters', () => {
        interface ITypedReporter<T, TD = unknown> {
          reportSuccess(level: MessageLogLevel, value: T, detail?: TD): void;
          reportFailure(level: MessageLogLevel, message: string, detail?: TD): void;
        }

        const reporter: ITypedReporter<string> = {
          reportSuccess: jest.fn(),
          reportFailure: jest.fn()
        };

        succeed('typed value').report(reporter, { success: 'info' });

        expect(reporter.reportSuccess).toHaveBeenCalledWith('info', 'typed value', undefined, undefined);
      });

      test('DetailedResult.report() works with typed reporters including detail', () => {
        interface IDetailedReporter<T, TD> {
          reportSuccess(level: MessageLogLevel, value: T, detail?: TD): void;
          reportFailure(level: MessageLogLevel, message: string, detail?: TD): void;
        }

        const reporter: IDetailedReporter<number, string> = {
          reportSuccess: jest.fn(),
          reportFailure: jest.fn()
        };

        succeedWithDetail(42, 'number detail').report(reporter, { success: 'detail' });
        failWithDetail<number, string>('error', 'error detail').report(reporter, { failure: 'warning' });

        expect(reporter.reportSuccess).toHaveBeenCalledWith('detail', 42, 'number detail', undefined);
        expect(reporter.reportFailure).toHaveBeenCalledWith('warning', 'error', 'error detail');
      });
    });

    describe('edge cases and boundary conditions', () => {
      test('works with empty strings and null/undefined values', () => {
        const reporter = {
          reportSuccess: jest.fn(),
          reportFailure: jest.fn()
        };

        succeed('').report(reporter);
        fail('').report(reporter);
        succeedWithDetail('', null as unknown as string).report(reporter);
        failWithDetail<string, string>('', undefined).report(reporter);

        expect(reporter.reportSuccess).toHaveBeenCalledWith('quiet', '', undefined, undefined);
        expect(reporter.reportSuccess).toHaveBeenCalledWith('quiet', '', null, undefined);
        expect(reporter.reportFailure).toHaveBeenCalledWith('error', '');
        expect(reporter.reportFailure).toHaveBeenCalledWith('error', '', undefined);
      });

      test('works with complex object values and details', () => {
        const reporter = {
          reportSuccess: jest.fn(),
          reportFailure: jest.fn()
        };

        const complexValue = { data: [1, 2, 3], nested: { prop: 'value' } };
        const complexDetail = { timestamp: Date.now(), context: { user: 'test' } };

        succeedWithDetail(complexValue, complexDetail).report(reporter, { success: 'info' });
        failWithDetail<typeof complexValue, typeof complexDetail>('complex error', complexDetail).report(
          reporter,
          { failure: 'warning' }
        );

        expect(reporter.reportSuccess).toHaveBeenCalledWith('info', complexValue, complexDetail, undefined);
        expect(reporter.reportFailure).toHaveBeenCalledWith('warning', 'complex error', complexDetail);
      });

      test('empty options object uses default levels', () => {
        const reporter = {
          reportSuccess: jest.fn(),
          reportFailure: jest.fn()
        };

        succeed('test').report(reporter, {});
        fail('test').report(reporter, {});

        expect(reporter.reportSuccess).toHaveBeenCalledWith('quiet', 'test', undefined, undefined);
        expect(reporter.reportFailure).toHaveBeenCalledWith('error', 'test');
      });
    });
  });

  describe('aggregateError formatter integration tests', () => {
    describe('mixed Result types with formatters', () => {
      test('Success, Failure, and DetailedFailure with different formatters', () => {
        const aggregator = new MessageAggregator(['initial error']);
        const success = succeed('success value');
        const failure = fail('simple error');
        const detailedFailure = failWithDetail('detailed error', { context: 'test', id: 42 });

        const successFormatter = (): string => 'this should not be called';
        const failureFormatter = (msg: string): string => `[SIMPLE] ${msg}`;
        const detailedFormatter = (msg: string, detail?: { context: string; id: number }): string =>
          `[${detail?.context?.toUpperCase()}-${detail?.id}] ${msg}`;

        // Apply aggregateError with formatters
        success.aggregateError(aggregator, successFormatter);
        failure.aggregateError(aggregator, failureFormatter);
        detailedFailure.aggregateError(aggregator, detailedFormatter);

        expect(aggregator.messages).toEqual([
          'initial error',
          '[SIMPLE] simple error',
          '[TEST-42] detailed error'
        ]);
      });

      test('multiple failures with consistent formatting pattern', () => {
        const aggregator = new MessageAggregator();
        const errors = [
          fail('authentication failed'),
          fail('authorization denied'),
          fail('resource not found')
        ];

        const timestampFormatter = (msg: string): string => `[${new Date().getFullYear()}] ${msg}`;

        errors.forEach((error) => error.aggregateError(aggregator, timestampFormatter));

        expect(aggregator.messages).toHaveLength(3);
        aggregator.messages.forEach((message) => {
          expect(message).toMatch(/^\[\d{4}\] .+/);
        });
      });

      test('conditional formatting based on error content', () => {
        const aggregator = new MessageAggregator();
        const errors = [
          fail('validation error: email required'),
          fail('network error: timeout'),
          fail('unknown error')
        ];

        const categoryFormatter = (msg: string): string => {
          if (msg.includes('validation')) return `[VALIDATION] ${msg}`;
          if (msg.includes('network')) return `[NETWORK] ${msg}`;
          return `[GENERAL] ${msg}`;
        };

        errors.forEach((error) => error.aggregateError(aggregator, categoryFormatter));

        expect(aggregator.messages).toEqual([
          '[VALIDATION] validation error: email required',
          '[NETWORK] network error: timeout',
          '[GENERAL] unknown error'
        ]);
      });
    });

    describe('MessageAggregator interaction', () => {
      test('aggregator toString works with formatted messages', () => {
        const aggregator = new MessageAggregator();
        const failures = [fail('error 1'), fail('error 2'), fail('error 3')];

        // const indexFormatter = (msg: string, index = failures.findIndex(f => f.message === msg) + 1): string =>
        //   `${index}. ${msg}`;

        let index = 1;
        failures.forEach((failure) => {
          failure.aggregateError(aggregator, (msg): string => `${index++}. ${msg}`);
        });

        expect(aggregator.toString()).toBe('1. error 1\n2. error 2\n3. error 3');
        expect(aggregator.toString(' | ')).toBe('1. error 1 | 2. error 2 | 3. error 3');
      });

      test('aggregator returnOrReport with formatted errors', () => {
        const aggregator = new MessageAggregator();
        const failure1 = fail('first error');
        const failure2 = fail('second error');
        const formatter = (msg: string): string => `FORMATTED: ${msg}`;

        failure1.aggregateError(aggregator, formatter);
        failure2.aggregateError(aggregator, formatter);

        const finalResult = aggregator.returnOrReport(succeed('should not be used'));
        expect(finalResult).toFailWith('FORMATTED: first error\nFORMATTED: second error');
      });

      test('empty string and undefined handling by MessageAggregator', () => {
        const aggregator = new MessageAggregator(['valid error']);
        const failure1 = fail('error 1');
        const failure2 = fail('error 2');
        const failure3 = fail('error 3');

        // These formatters return empty/undefined
        failure1.aggregateError(aggregator, () => '');
        failure2.aggregateError(aggregator, () => undefined as unknown as string);
        failure3.aggregateError(aggregator, (msg) => (msg ? `valid: ${msg}` : ''));

        expect(aggregator.messages).toEqual(['valid error', 'valid: error 3']);
        expect(aggregator.numMessages).toBe(2);
      });
    });

    describe('real-world scenarios', () => {
      test('validation error aggregation with field-specific formatting', () => {
        const validationErrors = new MessageAggregator();

        interface ValidationDetail {
          field: string;
          rule: string;
          value?: unknown;
        }

        const emailError = failWithDetail('Invalid email format', { field: 'email', rule: 'format' });
        const passwordError = failWithDetail('Password too weak', { field: 'password', rule: 'strength' });
        const ageError = failWithDetail('Must be 18 or older', { field: 'age', rule: 'minimum', value: 16 });

        const validationFormatter = (msg: string, detail?: ValidationDetail): string =>
          `${detail?.field}: ${msg} (rule: ${detail?.rule})${
            detail?.value !== undefined ? ` (got: ${detail.value})` : ''
          }`;

        emailError.aggregateError(validationErrors, validationFormatter);
        passwordError.aggregateError(validationErrors, validationFormatter);
        ageError.aggregateError(validationErrors, validationFormatter);

        expect(validationErrors.messages).toEqual([
          'email: Invalid email format (rule: format)',
          'password: Password too weak (rule: strength)',
          'age: Must be 18 or older (rule: minimum) (got: 16)'
        ]);

        const summary = validationErrors.toString('; ');
        expect(summary).toContain('email:');
        expect(summary).toContain('password:');
        expect(summary).toContain('age:');
      });

      test('error processing pipeline with transformation', () => {
        const processingErrors = new MessageAggregator();

        // Simulate a processing pipeline with different error types
        const parseError = fail('JSON parse error at line 5');
        const validationError = failWithDetail('Required field missing', {
          stage: 'validation',
          field: 'name'
        });
        const businessError = failWithDetail('Insufficient funds', {
          stage: 'business',
          code: 'INSUFFICIENT_FUNDS'
        });

        const pipelineFormatter = (
          msg: string,
          detail?: { stage: string; [key: string]: unknown }
        ): string => {
          const stage = detail?.stage || 'parsing';
          return `[${stage.toUpperCase()}] ${msg}`;
        };

        parseError.aggregateError(processingErrors, (msg): string => `[PARSING] ${msg}`);
        validationError.aggregateError(processingErrors, pipelineFormatter);
        businessError.aggregateError(processingErrors, pipelineFormatter);

        expect(processingErrors.messages).toEqual([
          '[PARSING] JSON parse error at line 5',
          '[VALIDATION] Required field missing',
          '[BUSINESS] Insufficient funds'
        ]);

        expect(processingErrors.numMessages).toBe(3);
        expect(processingErrors.hasMessages).toBe(true);
      });

      test('method chaining with aggregateError in complex flow', () => {
        const errors = new MessageAggregator();
        const formatter = (msg: string): string => `PROCESSED: ${msg}`;

        const result = fail('initial error')
          .aggregateError(errors, formatter)
          .onFailure((msg) => fail(`cascade: ${msg}`))
          .aggregateError(errors, (msg): string => `CASCADED: ${msg}`)
          .onFailure(() => succeed('recovery successful'));

        expect(result).toSucceedWith('recovery successful');
        expect(errors.messages).toEqual(['PROCESSED: initial error', 'CASCADED: cascade: initial error']);
      });
    });
  });
});
