/*
 * Copyright (c) 2025 Erik Fortune
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
import { ConsoleLogger } from '../../packlets/logging';

describe('ConsoleLogger', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleInfoSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let logger: ConsoleLogger;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleInfoSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('constructor', () => {
    test('creates logger with default log level (info)', () => {
      logger = new ConsoleLogger();
      expect(logger.logLevel).toBe('info');
    });

    test('creates logger with specified log level', () => {
      logger = new ConsoleLogger('warning');
      expect(logger.logLevel).toBe('warning');
    });
  });

  describe('logging methods', () => {
    beforeEach(() => {
      logger = new ConsoleLogger();
    });

    test('info() logs to console.info', () => {
      const result = logger.info('test info message');
      expect(result).toSucceedWith('test info message');
      expect(consoleInfoSpy).toHaveBeenCalledWith('test info message');
    });

    test('warn() logs to console.warn', () => {
      const result = logger.warn('test warning message');
      expect(result).toSucceedWith('test warning message');
      expect(consoleWarnSpy).toHaveBeenCalledWith('test warning message');
    });

    test('error() logs to console.error', () => {
      const result = logger.error('test error message');
      expect(result).toSucceedWith('test error message');
      expect(consoleErrorSpy).toHaveBeenCalledWith('test error message');
    });

    test('detail() logs to console.log', () => {
      logger = new ConsoleLogger('detail');
      const result = logger.detail('test detail message');
      expect(result).toSucceedWith('test detail message');
      expect(consoleLogSpy).toHaveBeenCalledWith('test detail message');
    });

    test('log() with quiet level logs to console.log', () => {
      logger = new ConsoleLogger('all');
      const result = logger.log('quiet', 'test quiet message');
      expect(result).toSucceedWith('test quiet message');
      expect(consoleLogSpy).toHaveBeenCalledWith('test quiet message');
    });
  });

  describe('log level filtering', () => {
    test('suppresses detail messages when log level is info', () => {
      logger = new ConsoleLogger('info');
      const result = logger.detail('test detail');
      expect(result).toSucceedWith(undefined);
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    test('suppresses info messages when log level is warning', () => {
      logger = new ConsoleLogger('warning');
      const result = logger.info('test info');
      expect(result).toSucceedWith(undefined);
      expect(consoleInfoSpy).not.toHaveBeenCalled();
    });

    test('suppresses warning messages when log level is error', () => {
      logger = new ConsoleLogger('error');
      const result = logger.warn('test warning');
      expect(result).toSucceedWith(undefined);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    test('suppresses all messages when log level is silent', () => {
      logger = new ConsoleLogger('silent');

      logger.detail('test detail');
      logger.info('test info');
      logger.warn('test warning');
      logger.error('test error');

      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(consoleInfoSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    test('logs all messages when log level is all', () => {
      logger = new ConsoleLogger('all');

      logger.detail('test detail');
      logger.info('test info');
      logger.warn('test warning');
      logger.error('test error');
      logger.log('quiet', 'test quiet');

      expect(consoleLogSpy).toHaveBeenCalledTimes(2); // detail and quiet
      expect(consoleInfoSpy).toHaveBeenCalledTimes(1);
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('message formatting', () => {
    beforeEach(() => {
      logger = new ConsoleLogger();
    });

    test('formats multiple parameters', () => {
      const result = logger.info('test', ' ', 'message', ' ', 'parts');
      expect(result).toSucceedWith('test message parts');
      expect(consoleInfoSpy).toHaveBeenCalledWith('test message parts');
    });

    test('handles undefined parameters', () => {
      const result = logger.info('test', undefined, 'message');
      expect(result).toSucceedWith('testmessage');
      expect(consoleInfoSpy).toHaveBeenCalledWith('testmessage');
    });

    test('handles complex objects', () => {
      const obj = { key: 'value' };
      const result = logger.info('Object: ', obj);
      expect(result).toSucceedWith('Object: [object Object]');
      expect(consoleInfoSpy).toHaveBeenCalledWith('Object: [object Object]');
    });
  });
});
