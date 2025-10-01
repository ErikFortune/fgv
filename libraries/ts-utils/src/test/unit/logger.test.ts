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

import '../helpers/jest';

import { InMemoryLogger, ILogger, LogReporter, NoOpLogger } from '../../packlets/logging';

import { fail, MessageLogLevel, Result, succeed } from '../../packlets/base';

describe('Logger class', () => {
  const messages: Record<MessageLogLevel, string | undefined> = {
    quiet: 'This is a quiet message',
    detail: 'This is a detail message',
    info: 'This is an info message',
    warning: 'This is a warning message',
    error: 'This is an error message'
  };

  type LogResults = Partial<Record<MessageLogLevel, Result<string | undefined>>>;
  function logEverything(logger: ILogger): LogResults {
    return {
      quiet: logger.log('quiet', messages.quiet),
      detail: logger.detail(messages.detail),
      info: logger.info(messages.info),
      warning: logger.warn(messages.warning),
      error: logger.error(messages.error)
    };
  }

  describe('shouldLog function', () => {
    test('should log everything including quiet for "all" reporter level', () => {
      const logger = new InMemoryLogger('all');
      const results = logEverything(logger);

      expect(logger.logged).toEqual([
        messages.quiet,
        messages.detail,
        messages.info,
        messages.warning,
        messages.error
      ]);

      expect(results.quiet).toSucceedWith(messages.quiet);
      expect(results.detail).toSucceedWith(messages.detail);
      expect(results.info).toSucceedWith(messages.info);
      expect(results.warning).toSucceedWith(messages.warning);
      expect(results.error).toSucceedWith(messages.error);

      expect(logger.suppressed).toEqual([]);
    });
  });

  describe('InMemoryLogger class', () => {
    test('logs everything except quiet for logLevel "detail"', () => {
      const logger = new InMemoryLogger('detail');
      const results = logEverything(logger);
      expect(logger.logged).toEqual([messages.detail, messages.info, messages.warning, messages.error]);

      expect(results.quiet).toSucceedWith(undefined);
      expect(results.detail).toSucceedWith(messages.detail);
      expect(results.info).toSucceedWith(messages.info);
      expect(results.warning).toSucceedWith(messages.warning);
      expect(results.error).toSucceedWith(messages.error);

      expect(logger.suppressed).toEqual([messages.quiet]);
    });

    test('omits "detail" for logLevel "info"', () => {
      const logger = new InMemoryLogger('info');
      const results = logEverything(logger);
      expect(logger.logged).toEqual([messages.info, messages.warning, messages.error]);

      expect(results.quiet).toSucceedWith(undefined);
      expect(results.detail).toSucceedWith(undefined);
      expect(results.info).toSucceedWith(messages.info);
      expect(results.warning).toSucceedWith(messages.warning);
      expect(results.error).toSucceedWith(messages.error);

      expect(logger.suppressed).toEqual([messages.quiet, messages.detail]);
    });

    test('omits "detail" and "info" for logLevel "warning"', () => {
      const logger = new InMemoryLogger('warning');
      const results = logEverything(logger);
      expect(logger.logged).toEqual([messages.warning, messages.error]);

      expect(results.quiet).toSucceedWith(undefined);
      expect(results.detail).toSucceedWith(undefined);
      expect(results.info).toSucceedWith(undefined);
      expect(results.warning).toSucceedWith(messages.warning);
      expect(results.error).toSucceedWith(messages.error);

      expect(logger.suppressed).toEqual([messages.quiet, messages.detail, messages.info]);
    });

    test('displays only errors for logLevel "error"', () => {
      const logger = new InMemoryLogger('error');
      const results = logEverything(logger);
      expect(logger.logged).toEqual([messages.error]);

      expect(results.quiet).toSucceedWith(undefined);
      expect(results.detail).toSucceedWith(undefined);
      expect(results.info).toSucceedWith(undefined);
      expect(results.warning).toSucceedWith(undefined);
      expect(results.error).toSucceedWith(messages.error);

      expect(logger.suppressed).toEqual([messages.quiet, messages.detail, messages.info, messages.warning]);
    });

    test('suppresses all message levels for logLevel "silent"', () => {
      const logger = new InMemoryLogger('silent');
      const results = logEverything(logger);

      expect(results.quiet).toSucceedWith(undefined);
      expect(results.detail).toSucceedWith(undefined);
      expect(results.info).toSucceedWith(undefined);
      expect(results.warning).toSucceedWith(undefined);
      expect(results.error).toSucceedWith(undefined);

      expect(logger.logged).toEqual([]);
      expect(logger.suppressed).toEqual([
        messages.quiet,
        messages.detail,
        messages.info,
        messages.warning,
        messages.error
      ]);
    });

    test('concatenates parameters as strings', () => {
      const logger = new InMemoryLogger();
      logger.log('info', 'This is a string with an embedded ', 2, ' and a boolean ', true);
      expect(logger.logged).toEqual(['This is a string with an embedded 2 and a boolean true']);
    });

    describe('stringifyLogValue integration in _format method', () => {
      test('should format objects using stringifyLogValue', () => {
        const logger = new InMemoryLogger();
        const obj = { key: 'value', num: 42 };

        logger.info('Object: ', obj);

        expect(logger.logged).toEqual(['Object: {"key":"value","num":42}']);
      });

      test('should handle mixed parameters with objects and primitives', () => {
        const logger = new InMemoryLogger();
        const obj = { id: 1, name: 'test' };

        logger.info('Processing ', obj, ' with count ', 5);

        expect(logger.logged).toEqual(['Processing {"id":1,"name":"test"} with count 5']);
      });

      test('should truncate long object representations', () => {
        const logger = new InMemoryLogger();
        const longObj = {
          veryLongPropertyNameThatExceedsFortyCharacters: 'valueWithVeryLongContent'
        };

        logger.info('Long object: ', longObj);

        const result = logger.logged[0];
        expect(result).toMatch(/^Long object: /);
        expect(result.length).toBeLessThanOrEqual(53); // "Long object: " (13) + max 40 for object
        expect(result).toMatch(/\.\.\.$/); // Should end with ...
      });

      test('should handle circular references using fallback', () => {
        const logger = new InMemoryLogger();
        const obj: Record<string, unknown> = { name: 'test' };
        obj.self = obj; // Create circular reference

        logger.info('Circular: ', obj);

        expect(logger.logged).toEqual(['Circular: [object Object]']);
      });

      test('should handle arrays in log messages', () => {
        const logger = new InMemoryLogger();
        const arr = [1, 2, 3, 'text'];

        logger.info('Array: ', arr);

        expect(logger.logged).toEqual(['Array: 1,2,3,text']);
      });

      test('should handle null and undefined parameters', () => {
        const logger = new InMemoryLogger();

        logger.info('Values: ', null, ' and ', undefined, ' end');

        // undefined parameters are filtered out by _format
        expect(logger.logged).toEqual(['Values: null and  end']);
      });

      test('should handle Date objects', () => {
        const logger = new InMemoryLogger();
        const date = new Date('2023-01-01T00:00:00.000Z');

        logger.info('Date: ', date);

        expect(logger.logged).toEqual([`Date: ${date.toString()}`]);
      });

      test('should filter out undefined parameters', () => {
        const logger = new InMemoryLogger();

        // undefined parameters should be filtered out
        logger.info('Start', undefined, 'middle', undefined, 'end');

        expect(logger.logged).toEqual(['Startmiddleend']);
      });

      test('should handle objects with functions (functions omitted)', () => {
        const logger = new InMemoryLogger();
        const obj = {
          data: 'value',
          method: function () {
            return 'test';
          }
        };

        logger.info('Object with function: ', obj);

        expect(logger.logged).toEqual(['Object with function: {"data":"value"}']);
      });

      test('should handle empty objects and arrays', () => {
        const logger = new InMemoryLogger();

        logger.info('Empty object: ', {}, ' and empty array: ', []);

        // Empty arrays stringify to empty string via String()
        expect(logger.logged).toEqual(['Empty object: {} and empty array: ']);
      });
    });

    describe('clear method', () => {
      test('clears both logged and suppressed messages', () => {
        const logger = new InMemoryLogger();
        logger.log('info', 'message');
        logger.logLevel = 'silent';
        logger.log('error', 'suppressed');
        expect(logger.logged).toEqual(['message']);
        expect(logger.suppressed).toEqual(['suppressed']);
        logger.clear();
        expect(logger.logged).toEqual([]);
        expect(logger.suppressed).toEqual([]);
      });
    });
  });

  describe('NoOpLogger class', () => {
    test('returns successfully when logging', () => {
      const logger = new NoOpLogger('detail');
      expect(() => logEverything(logger)).not.toThrow();
    });

    test('returns successfully when silent', () => {
      const logger = new NoOpLogger('silent');
      expect(() => logEverything(logger)).not.toThrow();
    });
  });

  describe('LogReporter class', () => {
    interface ITestValue {
      id: number;
      name: string;
    }

    interface ITestDetail {
      context: string;
      timestamp: number;
    }

    describe('constructor and basic properties', () => {
      test('should create LogReporter with default formatters', () => {
        const logger = new InMemoryLogger();
        const reporter = new LogReporter<string>({
          logger
        });

        expect(reporter.logLevel).toBe('info');
        expect(reporter).toBeInstanceOf(LogReporter);
      });

      test('should create LogReporter with custom value formatter', () => {
        const logger = new InMemoryLogger();
        const valueFormatter = (value: ITestValue): string => `Value: ${value.name} (${value.id})`;
        const reporter = new LogReporter<ITestValue>({
          logger,
          valueFormatter
        });

        expect(reporter.logLevel).toBe('info');
      });

      test('should create LogReporter with custom message formatter', () => {
        const logger = new InMemoryLogger();
        const messageFormatter = (message: string, detail?: ITestDetail): string =>
          detail ? `[${detail.context}] ${message}` : message;

        const reporter = new LogReporter<ITestValue, ITestDetail>({
          logger,
          messageFormatter
        });

        expect(reporter.logLevel).toBe('info');
      });

      test('should create LogReporter with all defaults', () => {
        const reporter = new LogReporter<ITestValue>();
        expect(reporter.logLevel).toBe('info');
      });

      test('should create LogReporter with undefined logger and all defaults', () => {
        const logger: ILogger | undefined = undefined;
        const reporter = new LogReporter<ITestValue>({ logger });
        expect(reporter.logLevel).toBe('info');
      });

      test('should create LogReporter with both custom formatters', () => {
        const logger = new InMemoryLogger();
        const valueFormatter = (value: ITestValue, detail?: ITestDetail): string =>
          detail ? `[${detail.context}] ${value.name}` : value.name;
        const messageFormatter = (message: string, detail?: ITestDetail): string =>
          detail ? `${detail.timestamp}: ${message}` : message;

        const reporter = new LogReporter<ITestValue, ITestDetail>({
          logger,
          valueFormatter,
          messageFormatter
        });

        expect(reporter.logLevel).toBe('info');
      });

      test('should handle optional messageFormatter parameter with undefined params', () => {
        const logger = new InMemoryLogger();
        const params = {
          logger,
          valueFormatter: undefined,
          messageFormatter: undefined
        };
        const reporter = new LogReporter<string>(params);

        // Test that default formatters work
        reporter.reportSuccess('info', 'test');
        reporter.reportFailure('info', 'error');

        expect(logger.logged).toEqual(['test', 'error']);
      });
    });

    describe('ILogger interface implementation', () => {
      let logger: InMemoryLogger;
      let reporter: LogReporter<string>;

      beforeEach(() => {
        logger = new InMemoryLogger('detail'); // Set to detail level to allow all messages
        reporter = new LogReporter<string>({ logger });
      });

      test('should delegate detail logging to underlying logger', () => {
        const result = reporter.detail('test detail message');
        expect(result).toSucceedWith('test detail message');
        expect(logger.logged).toEqual(['test detail message']);
      });

      test('should delegate info logging to underlying logger', () => {
        const result = reporter.info('test info message');
        expect(result).toSucceedWith('test info message');
        expect(logger.logged).toEqual(['test info message']);
      });

      test('should delegate warn logging to underlying logger', () => {
        const result = reporter.warn('test warning message');
        expect(result).toSucceedWith('test warning message');
        expect(logger.logged).toEqual(['test warning message']);
      });

      test('should delegate error logging to underlying logger', () => {
        const result = reporter.error('test error message');
        expect(result).toSucceedWith('test error message');
        expect(logger.logged).toEqual(['test error message']);
      });

      test('should delegate log method to underlying logger', () => {
        const result = reporter.log('warning', 'test log message');
        expect(result).toSucceedWith('test log message');
        expect(logger.logged).toEqual(['test log message']);
      });

      test('should respect log level from underlying logger', () => {
        logger.logLevel = 'error';

        const infoResult = reporter.info('info message');
        const errorResult = reporter.error('error message');

        expect(infoResult).toSucceedWith(undefined);
        expect(errorResult).toSucceedWith('error message');
        expect(logger.logged).toEqual(['error message']);
        expect(logger.suppressed).toEqual(['info message']);
      });

      test('should pass through multiple parameters', () => {
        const result = reporter.info('Message:', ' value:', 42, ' end');
        expect(result).toSucceedWith('Message: value:42 end');
        expect(logger.logged).toEqual(['Message: value:42 end']);
      });
    });

    describe('IResultReporter interface implementation', () => {
      describe('reportSuccess method', () => {
        test('should report success with default value formatter', () => {
          const logger = new InMemoryLogger();
          const reporter = new LogReporter<ITestValue>({ logger });
          const value = { id: 1, name: 'test' };

          reporter.reportSuccess('info', value);

          expect(logger.logged).toEqual([JSON.stringify(value)]);
        });

        test('should use tryFormatObject for plain objects and pass through strings/numbers', () => {
          const logger = new InMemoryLogger();
          const reporter = new LogReporter<unknown>({ logger });

          reporter.reportSuccess('info', { a: 1, b: 'two' });
          reporter.reportSuccess('info', 'plain string');
          reporter.reportSuccess('info', 123);

          expect(logger.logged[0]).toBe(JSON.stringify({ a: 1, b: 'two' }));
          expect(logger.logged[1]).toBe('plain string');
          expect(logger.logged[2]).toBe('123');
        });

        test('should fall back to [object Object] when JSON.stringify throws (circular)', () => {
          const logger = new InMemoryLogger();
          const reporter = new LogReporter<unknown>({ logger });
          // create circular object
          const obj: Record<string, unknown> = { a: 1 };
          obj.self = obj;

          reporter.reportSuccess('info', obj);

          expect(logger.logged).toEqual(['[object Object]']);
        });

        test('should use stringifyLogValue for object truncation with default formatter', () => {
          const logger = new InMemoryLogger();
          const reporter = new LogReporter<unknown>({ logger });
          const longObj = {
            veryLongPropertyNameThatExceedsFortyCharacters: 'valueWithVeryLongContent'
          };

          reporter.reportSuccess('info', longObj);

          const result = logger.logged[0];
          expect(result.length).toBeLessThanOrEqual(40);
          expect(result).toMatch(/\.\.\.$/); // Should end with ...
        });

        test('should handle arrays in default value formatter', () => {
          const logger = new InMemoryLogger();
          const reporter = new LogReporter<unknown>({ logger });

          reporter.reportSuccess('info', [1, 2, 3, 'text']);

          expect(logger.logged).toEqual(['1,2,3,text']);
        });

        test('should handle nested objects in default value formatter', () => {
          const logger = new InMemoryLogger();
          const reporter = new LogReporter<unknown>({ logger });
          const nestedObj = {
            user: { id: 1, name: 'John' },
            settings: { theme: 'dark', notifications: true }
          };

          reporter.reportSuccess('info', nestedObj);

          // This will be truncated due to length > 40 chars
          const result = logger.logged[0];
          expect(result.length).toBeLessThanOrEqual(40);
          expect(result).toMatch(/\.\.\.$/);
        });

        test('should handle Date objects in default value formatter', () => {
          const logger = new InMemoryLogger();
          const reporter = new LogReporter<unknown>({ logger });
          const date = new Date('2023-01-01T00:00:00.000Z');

          reporter.reportSuccess('info', date);

          expect(logger.logged).toEqual([date.toString()]);
        });

        test('should handle null and undefined in default value formatter', () => {
          const logger = new InMemoryLogger();
          const reporter = new LogReporter<unknown>({ logger });

          reporter.reportSuccess('info', null);
          reporter.reportSuccess('info', undefined);

          expect(logger.logged).toEqual(['null', 'undefined']);
        });

        test('should handle objects with function properties (functions omitted)', () => {
          const logger = new InMemoryLogger();
          const reporter = new LogReporter<unknown>({ logger });
          const objWithFunc = {
            data: 'important',
            method: function () {
              return 'test';
            },
            calculate: () => 42
          };

          reporter.reportSuccess('info', objWithFunc);

          expect(logger.logged).toEqual(['{"data":"important"}']);
        });

        test('should handle objects that throw in getters', () => {
          const logger = new InMemoryLogger();
          const reporter = new LogReporter<unknown>({ logger });
          const objWithThrowingGetter = {
            normal: 'value',
            get problematic() {
              throw new Error('Cannot access');
            }
          };

          reporter.reportSuccess('info', objWithThrowingGetter);

          expect(logger.logged).toEqual(['[object Object]']);
        });

        test('should handle empty objects and arrays', () => {
          const logger = new InMemoryLogger();
          const reporter = new LogReporter<unknown>({ logger });

          reporter.reportSuccess('info', {});
          reporter.reportSuccess('info', []);

          // Empty arrays stringify to empty string via String()
          expect(logger.logged).toEqual(['{}', '']);
        });

        test('should handle complex object types that stringify to [object Object]', () => {
          const logger = new InMemoryLogger();
          const reporter = new LogReporter<unknown>({ logger });

          // Test various object types - Set/Map don't stringify to [object Object]
          reporter.reportSuccess('info', new Set([1, 2, 3]));
          reporter.reportSuccess('info', new Map([['key', 'value']]));
          reporter.reportSuccess('info', /regex/gi);

          expect(logger.logged).toEqual(['[object Set]', '[object Map]', '/regex/gi']);
        });

        test('should respect custom maxLength parameter through stringifyLogValue', () => {
          const logger = new InMemoryLogger();
          const reporter = new LogReporter<unknown>({ logger });

          // Create object that will be longer than default 40 chars
          const obj = { key: 'This is a long value that exceeds forty characters easily' };

          reporter.reportSuccess('info', obj);

          const result = logger.logged[0];
          expect(result.length).toBeLessThanOrEqual(40);
          expect(result).toMatch(/\.\.\.$/);
        });

        test('should report success with custom value formatter', () => {
          const logger = new InMemoryLogger();
          const valueFormatter = (value: ITestValue): string => `${value.name}-${value.id}`;
          const reporter = new LogReporter<ITestValue>({ logger, valueFormatter });
          const value = { id: 42, name: 'testValue' };

          reporter.reportSuccess('info', value);

          expect(logger.logged).toEqual(['testValue-42']);
        });

        test('should report success with detail using custom formatter', () => {
          const logger = new InMemoryLogger();
          const valueFormatter = (value: ITestValue, detail?: ITestDetail): string =>
            detail ? `[${detail.context}] ${value.name}` : value.name;
          const reporter = new LogReporter<ITestValue, ITestDetail>({ logger, valueFormatter });
          const value = { id: 1, name: 'testValue' };
          const detail = { context: 'TEST', timestamp: 123456 };

          reporter.reportSuccess('info', value, detail);

          expect(logger.logged).toEqual(['[TEST] testValue']);
        });

        test('should respect log levels when reporting success', () => {
          const logger = new InMemoryLogger('error');
          const reporter = new LogReporter<string>({ logger });

          reporter.reportSuccess('info', 'success message');
          reporter.reportSuccess('error', 'error success message');

          expect(logger.logged).toEqual(['error success message']);
          expect(logger.suppressed).toEqual(['success message']);
        });

        test('should handle different log levels', () => {
          const logger = new InMemoryLogger('detail');
          const reporter = new LogReporter<string>({ logger });

          reporter.reportSuccess('detail', 'detail success');
          reporter.reportSuccess('info', 'info success');
          reporter.reportSuccess('warning', 'warning success');
          reporter.reportSuccess('error', 'error success');

          expect(logger.logged).toEqual([
            'detail success',
            'info success',
            'warning success',
            'error success'
          ]);
        });
      });

      describe('reportFailure method', () => {
        test('should report failure with default message formatter', () => {
          const logger = new InMemoryLogger();
          const reporter = new LogReporter<string>({ logger });

          reporter.reportFailure('error', 'failure message');

          expect(logger.logged).toEqual(['failure message']);
        });

        test('should report failure with custom message formatter', () => {
          const logger = new InMemoryLogger();
          const messageFormatter = (message: string, detail?: ITestDetail): string =>
            detail ? `[${detail.context}:${detail.timestamp}] ${message}` : `ERROR: ${message}`;
          const reporter = new LogReporter<string, ITestDetail>({ logger, messageFormatter });

          reporter.reportFailure('error', 'failure message');

          expect(logger.logged).toEqual(['ERROR: failure message']);
        });

        test('should report failure with detail using custom formatter', () => {
          const logger = new InMemoryLogger();
          const messageFormatter = (message: string, detail?: ITestDetail): string =>
            detail ? `[${detail.context}:${detail.timestamp}] ${message}` : message;
          const reporter = new LogReporter<string, ITestDetail>({ logger, messageFormatter });
          const detail = { context: 'FAIL', timestamp: 789012 };

          reporter.reportFailure('error', 'operation failed', detail);

          expect(logger.logged).toEqual(['[FAIL:789012] operation failed']);
        });

        test('should respect log levels when reporting failure', () => {
          const logger = new InMemoryLogger('error');
          const reporter = new LogReporter<string>({ logger });

          reporter.reportFailure('warning', 'warning failure');
          reporter.reportFailure('error', 'error failure');

          expect(logger.logged).toEqual(['error failure']);
          expect(logger.suppressed).toEqual(['warning failure']);
        });

        test('should handle different log levels for failures', () => {
          const logger = new InMemoryLogger('detail');
          const reporter = new LogReporter<string>({ logger });

          reporter.reportFailure('detail', 'detail failure');
          reporter.reportFailure('info', 'info failure');
          reporter.reportFailure('warning', 'warning failure');
          reporter.reportFailure('error', 'error failure');

          expect(logger.logged).toEqual([
            'detail failure',
            'info failure',
            'warning failure',
            'error failure'
          ]);
        });
      });
    });

    describe('integration with Result.report method', () => {
      test('should work with successful Result reporting', () => {
        const logger = new InMemoryLogger();
        const valueFormatter = (value: ITestValue): string => `SUCCESS: ${value.name}`;
        const reporter = new LogReporter<ITestValue>({ logger, valueFormatter });
        const value = { id: 1, name: 'testResult' };

        const result = succeed(value);
        result.report(reporter, { success: 'info' });

        expect(logger.logged).toEqual(['SUCCESS: testResult']);
      });

      test('should work with failed Result reporting', () => {
        const logger = new InMemoryLogger();
        const messageFormatter = (message: string): string => `FAILURE: ${message}`;
        const reporter = new LogReporter<string>({ logger, messageFormatter });

        const result = fail<string>('operation failed');
        result.report(reporter, { failure: 'error' });

        expect(logger.logged).toEqual(['FAILURE: operation failed']);
      });

      test('should work with default reporting options', () => {
        const logger = new InMemoryLogger();
        const reporter = new LogReporter<string>({ logger });

        const successResult = succeed('success value');
        const failResult = fail<string>('failure message');

        successResult.report(reporter); // default success level is 'suppressed' (not logged)
        failResult.report(reporter); // default failure level is 'error' (logged)

        expect(logger.logged).toEqual(['failure message']);
        expect(logger.suppressed).toEqual(['success value']);
      });
    });

    describe('edge cases and error handling', () => {
      test('should handle undefined values in formatters', () => {
        const logger = new InMemoryLogger();
        const valueFormatter = (value: unknown): string =>
          value === undefined ? 'UNDEFINED' : String(value);
        const reporter = new LogReporter<unknown>({ logger, valueFormatter });

        reporter.reportSuccess('info', undefined);

        expect(logger.logged).toEqual(['UNDEFINED']);
      });

      test('should handle null values in formatters', () => {
        const logger = new InMemoryLogger();
        const valueFormatter = (value: unknown): string => (value === null ? 'NULL' : String(value));
        const reporter = new LogReporter<unknown>({ logger, valueFormatter });

        reporter.reportSuccess('info', null);

        expect(logger.logged).toEqual(['NULL']);
      });

      test('should handle complex object formatting', () => {
        const logger = new InMemoryLogger();
        const valueFormatter = (value: Record<string, unknown>): string => JSON.stringify(value);
        const reporter = new LogReporter<Record<string, unknown>>({ logger, valueFormatter });
        const complexValue = { nested: { data: [1, 2, 3] }, flag: true };

        reporter.reportSuccess('info', complexValue);

        expect(logger.logged).toEqual([JSON.stringify(complexValue)]);
      });

      test('should handle formatter exceptions gracefully', () => {
        const logger = new InMemoryLogger();
        const valueFormatter = (__value: unknown): string => {
          throw new Error('Formatter error');
        };
        const reporter = new LogReporter<string>({ logger, valueFormatter });

        // This should not throw, but the underlying logger might handle the error
        expect(() => reporter.reportSuccess('info', 'test')).toThrow('Formatter error');
      });
    });

    describe('withValueFormatter method', () => {
      describe('basic functionality', () => {
        test('should create new LogReporter with different value formatter', () => {
          const logger = new InMemoryLogger();
          const originalFormatter = (value: string): string => `Original: ${value}`;
          const newFormatter = (value: string): string => `New: ${value}`;

          const originalReporter = new LogReporter<string>({ logger, valueFormatter: originalFormatter });
          const newReporter = originalReporter.withValueFormatter(newFormatter);

          // Test that they are different instances
          expect(newReporter).not.toBe(originalReporter);

          // Test that formatters work differently
          originalReporter.reportSuccess('info', 'test');
          expect(logger.logged[logger.logged.length - 1]).toBe('Original: test');

          newReporter.reportSuccess('info', 'test');
          expect(logger.logged[logger.logged.length - 1]).toBe('New: test');
        });

        test('should preserve the same logger instance', () => {
          const logger = new InMemoryLogger();
          const originalReporter = new LogReporter<string>({ logger });
          const newReporter = originalReporter.withValueFormatter((v) => `formatted: ${v}`);

          // Both reporters should write to the same logger
          originalReporter.reportSuccess('info', 'first');
          newReporter.reportSuccess('info', 'second');

          expect(logger.logged).toContain('first');
          expect(logger.logged).toContain('formatted: second');
        });

        test('should preserve the original message formatter', () => {
          const logger = new InMemoryLogger();
          const messageFormatter = (msg: string): string => `[MSG] ${msg}`;
          const valueFormatter = (value: string): string => `value=${value}`;
          const newValueFormatter = (value: number): string => `num=${value}`;

          const originalReporter = new LogReporter<string>({
            logger,
            valueFormatter,
            messageFormatter
          });
          const newReporter = originalReporter.withValueFormatter(newValueFormatter);

          // Test message formatter is preserved by reporting a failure
          newReporter.reportFailure('info', 'test message');
          expect(logger.logged[logger.logged.length - 1]).toBe('[MSG] test message');
        });

        test('should work with default value formatter', () => {
          const logger = new InMemoryLogger();
          const originalReporter = new LogReporter<string>({ logger });
          const newFormatter = (value: string): string => `custom: ${value}`;

          const newReporter = originalReporter.withValueFormatter(newFormatter);

          newReporter.reportSuccess('info', 'test');
          expect(logger.logged[logger.logged.length - 1]).toBe('custom: test');
        });
      });

      describe('type parameter changes', () => {
        test('should support changing value type from string to number', () => {
          const logger = new InMemoryLogger();
          const stringReporter = new LogReporter<string>({ logger });
          const numberFormatter = (value: number): string => `Number: ${value.toFixed(2)}`;

          const numberReporter = stringReporter.withValueFormatter(numberFormatter);

          numberReporter.reportSuccess('info', 42.123);
          expect(logger.logged[logger.logged.length - 1]).toBe('Number: 42.12');
        });

        test('should support changing value type to complex object', () => {
          interface Person {
            name: string;
            age: number;
          }

          const logger = new InMemoryLogger();
          const stringReporter = new LogReporter<string>({ logger });
          const personFormatter = (person: Person): string => `${person.name} (${person.age})`;

          const personReporter = stringReporter.withValueFormatter(personFormatter);

          personReporter.reportSuccess('info', { name: 'Alice', age: 30 });
          expect(logger.logged[logger.logged.length - 1]).toBe('Alice (30)');
        });

        test('should maintain type safety with changed types', () => {
          const logger = new InMemoryLogger();
          const stringReporter = new LogReporter<string>({ logger });
          const numberFormatter = (value: number): string => String(value);

          const numberReporter = stringReporter.withValueFormatter(numberFormatter);

          // TypeScript should enforce that we pass numbers now
          numberReporter.reportSuccess('info', 123);

          // This would be a TypeScript error if uncommented:
          // numberReporter.reportSuccess('info', 'not a number');

          expect(logger.logged[logger.logged.length - 1]).toBe('123');
        });
      });

      describe('formatter chaining', () => {
        test('should support multiple withValueFormatter calls', () => {
          const logger = new InMemoryLogger();
          const originalReporter = new LogReporter<string>({ logger });

          const reporter1 = originalReporter.withValueFormatter((v: string) => `[1] ${v}`);
          const reporter2 = reporter1.withValueFormatter((v: number) => `[2] ${v}`);
          const reporter3 = reporter2.withValueFormatter((v: boolean) => `[3] ${v}`);

          originalReporter.reportSuccess('info', 'original');
          reporter1.reportSuccess('info', 'first');
          reporter2.reportSuccess('info', 42);
          reporter3.reportSuccess('info', true);

          expect(logger.logged).toContain('original');
          expect(logger.logged).toContain('[1] first');
          expect(logger.logged).toContain('[2] 42');
          expect(logger.logged).toContain('[3] true');
        });

        test('should maintain logger instance across chain', () => {
          const logger = new InMemoryLogger();
          const originalReporter = new LogReporter<string>({ logger });

          const reporter1 = originalReporter.withValueFormatter((v: number) => String(v));
          const reporter2 = reporter1.withValueFormatter((v: boolean) => String(v));

          // All should write to the same logger
          originalReporter.reportSuccess('info', 'test');
          reporter1.reportSuccess('info', 123);
          reporter2.reportSuccess('info', false);

          expect(logger.logged).toEqual(['test', '123', 'false']);
        });

        test('should maintain message formatter across chain', () => {
          const logger = new InMemoryLogger();
          const messageFormatter = (msg: string): string => `>>>${msg}<<<`;

          const originalReporter = new LogReporter<string>({
            logger,
            messageFormatter
          });

          const reporter1 = originalReporter.withValueFormatter((v: number) => `num:${v}`);
          const reporter2 = reporter1.withValueFormatter((v: boolean) => `bool:${v}`);

          // Test message formatter is preserved
          reporter1.reportFailure('info', 'test1');
          reporter2.reportFailure('info', 'test2');

          expect(logger.logged).toContain('>>>test1<<<');
          expect(logger.logged).toContain('>>>test2<<<');
        });
      });

      describe('integration with Result.report()', () => {
        test('should work with Success.report() and transformed reporter', () => {
          const logger = new InMemoryLogger();
          const stringReporter = new LogReporter<string>({ logger });
          const numberReporter = stringReporter.withValueFormatter(
            (value: number) => `Result value: ${value}`
          );

          const result = succeed(42);
          result.report(numberReporter, { success: 'info' });

          expect(logger.logged).toContain('Result value: 42');
        });

        test('should work with Failure.report() and transformed reporter', () => {
          const logger = new InMemoryLogger();
          const stringReporter = new LogReporter<string>({ logger });
          const numberReporter = stringReporter.withValueFormatter((value: number) => `Value: ${value}`);

          const result = fail<number>('Something went wrong');
          result.report(numberReporter, { failure: 'error' });

          expect(logger.logged).toContain('Something went wrong');
        });

        test('should work with DetailedSuccess.report()', () => {
          const logger = new InMemoryLogger();
          const stringReporter = new LogReporter<string, { extra: string }>({ logger });
          const numberReporter = stringReporter.withValueFormatter((value: number) => `Number: ${value}`);

          const result = succeed(42);
          result.report(numberReporter, { success: 'info' });

          expect(logger.logged).toContain('Number: 42');
        });

        test('should work with DetailedFailure.report()', () => {
          const logger = new InMemoryLogger();
          const stringReporter = new LogReporter<string, { code: number }>({ logger });
          const numberReporter = stringReporter.withValueFormatter((value: number) => `Value: ${value}`);

          const result = fail<number>('Error occurred');
          result.report(numberReporter, { failure: 'error' });

          expect(logger.logged).toContain('Error occurred');
        });

        test('should handle Result.report() with custom options', () => {
          const logger = new InMemoryLogger();
          const originalReporter = new LogReporter<string>({ logger });
          const transformedReporter = originalReporter.withValueFormatter(
            (value: { id: number; name: string }) => `ID: ${value.id}, Name: ${value.name}`
          );

          const result = succeed({ id: 1, name: 'Test' });
          result.report(transformedReporter, {
            success: 'info'
          });

          expect(logger.logged).toContain('ID: 1, Name: Test');
        });
      });

      describe('edge cases', () => {
        test('should handle formatter that returns empty string', () => {
          const logger = new InMemoryLogger();
          const reporter = new LogReporter<string>({ logger });
          const emptyReporter = reporter.withValueFormatter(() => '');

          emptyReporter.reportSuccess('info', 'anything');
          expect(logger.logged).toContain('');
        });

        test('should handle formatter that throws exception', () => {
          const logger = new InMemoryLogger();
          const reporter = new LogReporter<string>({ logger });
          const errorReporter = reporter.withValueFormatter((): string => {
            throw new Error('Formatter failed');
          });

          expect(() => errorReporter.reportSuccess('info', 'test')).toThrow('Formatter failed');
        });

        test('should handle formatter returning special values', () => {
          const logger = new InMemoryLogger();
          const reporter = new LogReporter<string>({ logger });

          const undefinedReporter = reporter.withValueFormatter(() => undefined as unknown as string);
          undefinedReporter.reportSuccess('info', 'test');
          // When formatter returns undefined, it gets converted to empty string
          expect(logger.logged).toContain('');

          const nullReporter = reporter.withValueFormatter(() => null as unknown as string);
          nullReporter.reportSuccess('info', 'test');
          // When formatter returns null, it gets converted to string "null"
          expect(logger.logged[logger.logged.length - 1]).toBe('null');
        });

        test('should work with NoOpLogger', () => {
          const logger = new NoOpLogger();
          const reporter = new LogReporter<string>({ logger });
          const newReporter = reporter.withValueFormatter((v: number) => `num:${v}`);

          // Should not throw
          expect(() => newReporter.reportSuccess('info', 42)).not.toThrow();
        });

        test('should preserve detail type parameter', () => {
          interface CustomDetail {
            timestamp: number;
            userId: string;
          }

          const logger = new InMemoryLogger();
          const originalReporter = new LogReporter<string, CustomDetail>({ logger });
          const newReporter = originalReporter.withValueFormatter((value: number) => `Value: ${value}`);

          // The detail type should still be CustomDetail
          const result = succeed<number>(42);

          // This should compile and work correctly
          result.report(newReporter, { success: 'info' });
          expect(logger.logged[logger.logged.length - 1]).toBe('Value: 42');
        });
      });

      describe('log level interaction', () => {
        test('should respect logger log level in derived reporter', () => {
          const logger = new InMemoryLogger('warning'); // Only warning and error
          const originalReporter = new LogReporter<string>({ logger });
          const derivedReporter = originalReporter.withValueFormatter((v: number) => `Number: ${v}`);

          derivedReporter.reportSuccess('info', 123); // Should be suppressed
          derivedReporter.reportSuccess('warning', 456); // Should log
          derivedReporter.reportSuccess('error', 789); // Should log

          expect(logger.logged).not.toContain('Number: 123');
          expect(logger.logged).toContain('Number: 456');
          expect(logger.logged).toContain('Number: 789');
        });

        test('should log messages at correct levels through derived reporter', () => {
          const logger = new InMemoryLogger('detail');
          const originalReporter = new LogReporter<string>({ logger });
          const derivedReporter = originalReporter.withValueFormatter((v: boolean) => (v ? 'TRUE' : 'FALSE'));

          derivedReporter.reportSuccess('quiet', true); // Suppressed
          derivedReporter.reportSuccess('detail', true); // Logged
          derivedReporter.reportFailure('info', 'info message'); // Logged
          derivedReporter.reportFailure('error', 'error message'); // Logged

          expect(logger.suppressed).toContain('TRUE');
          expect(logger.logged).toContain('TRUE');
          expect(logger.logged).toContain('info message');
          expect(logger.logged).toContain('error message');
        });
      });
    });
  });
});
