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
import { ConsoleLogger, InMemoryLogger, LogReporter } from '../../packlets/logging';

/**
 * The `_logStructured` hook is an additive change to the foundational `LoggerBase`.
 * These tests pin the acceptance criterion that existing subclasses — which do NOT
 * override the hook — are behaviorally unaffected by its addition (the default no-op
 * guarantees it).
 */
describe('LoggerBase._logStructured hook — existing subclasses unaffected', () => {
  test('InMemoryLogger emits the same logged/suppressed output as before the hook', () => {
    const logger = new InMemoryLogger('info');
    logger.detail('dropped');
    logger.info('kept info');
    logger.warn('kept warning');
    logger.error('kept error');

    expect(logger.logged).toEqual(['kept info', 'kept warning', 'kept error']);
    expect(logger.suppressed).toEqual(['dropped']);
  });

  test('ConsoleLogger routes to the same console methods with the same formatting', () => {
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    const consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation();
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    try {
      const logger = new ConsoleLogger('all');
      logger.detail('a ', 'detail');
      logger.info('an info');
      logger.warn('a warning');
      logger.error('an error');

      expect(consoleLogSpy).toHaveBeenCalledWith('a detail');
      expect(consoleInfoSpy).toHaveBeenCalledWith('an info');
      expect(consoleWarnSpy).toHaveBeenCalledWith('a warning');
      expect(consoleErrorSpy).toHaveBeenCalledWith('an error');
    } finally {
      consoleLogSpy.mockRestore();
      consoleInfoSpy.mockRestore();
      consoleWarnSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    }
  });

  test("LogReporter's underlying logger logs exactly as before", () => {
    const logger = new InMemoryLogger('detail');
    const reporter = new LogReporter<string>({ logger });

    reporter.reportSuccess('info', 'value');
    reporter.reportFailure('error', 'failure');

    expect(logger.logged).toEqual(['value', 'failure']);
    expect(logger.suppressed).toEqual([]);
  });

  test('the default hook is a no-op — return values are identical to the pre-hook contract', () => {
    const logger = new InMemoryLogger('info');
    expect(logger.info('shown')).toSucceedWith('shown');
    expect(logger.detail('hidden')).toSucceedWith(undefined);
  });
});
