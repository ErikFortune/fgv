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
import { InMemoryLogger, MultiLogger, RetainingLogger } from '../../packlets/logging';

describe('MultiLogger', () => {
  describe('logLevel (most-verbose child)', () => {
    test('reports the most-permissive child level', () => {
      const multi = new MultiLogger([new InMemoryLogger('error'), new InMemoryLogger('detail')]);
      expect(multi.logLevel).toBe('detail');
    });

    test('treats "all" as the most permissive', () => {
      const multi = new MultiLogger([new InMemoryLogger('warning'), new InMemoryLogger('all')]);
      expect(multi.logLevel).toBe('all');
    });

    test('treats "silent" as the least permissive', () => {
      const multi = new MultiLogger([new InMemoryLogger('silent'), new InMemoryLogger('error')]);
      expect(multi.logLevel).toBe('error');
    });

    test('returns "silent" when there are no children', () => {
      const multi = new MultiLogger([]);
      expect(multi.logLevel).toBe('silent');
    });

    test('is recomputed on access when a child level changes', () => {
      const child = new InMemoryLogger('error');
      const multi = new MultiLogger([new InMemoryLogger('info'), child]);
      expect(multi.logLevel).toBe('info');
      child.logLevel = 'all';
      expect(multi.logLevel).toBe('all');
    });
  });

  describe('fan-out', () => {
    test('forwards each call to every child, which filter independently', () => {
      const verbose = new InMemoryLogger('detail');
      const quiet = new InMemoryLogger('error');
      const multi = new MultiLogger([verbose, quiet]);

      multi.detail('d');
      multi.info('i');
      multi.warn('w');
      multi.error('e');

      expect(verbose.logged).toEqual(['d', 'i', 'w', 'e']);
      expect(quiet.logged).toEqual(['e']);
      expect(quiet.suppressed).toEqual(['d', 'i', 'w']);
    });

    test('does not pre-filter on its own logLevel', () => {
      // Even though one child is silent, the verbose child still receives everything.
      const verbose = new InMemoryLogger('all');
      const silent = new InMemoryLogger('silent');
      const multi = new MultiLogger([silent, verbose]);

      multi.log('quiet', 'q');
      expect(verbose.logged).toEqual(['q']);
      expect(silent.logged).toEqual([]);
    });

    test('routes each level helper to the correct message level', () => {
      const logger = new InMemoryLogger('all');
      const multi = new MultiLogger([logger]);

      expect(multi.detail('d')).toSucceedWith('d');
      expect(multi.info('i')).toSucceedWith('i');
      expect(multi.warn('w')).toSucceedWith('w');
      expect(multi.error('e')).toSucceedWith('e');
      expect(multi.log('quiet', 'q')).toSucceedWith('q');

      expect(logger.logged).toEqual(['d', 'i', 'w', 'e', 'q']);
    });
  });

  describe('return value', () => {
    test('returns the formatted message when at least one child logged it', () => {
      const multi = new MultiLogger([new InMemoryLogger('error'), new InMemoryLogger('detail')]);
      // 'error'-level child suppresses, 'detail'-level child logs.
      expect(multi.info('hi')).toSucceedWith('hi');
    });

    test('returns undefined when every child suppressed the message', () => {
      const multi = new MultiLogger([new InMemoryLogger('error'), new InMemoryLogger('warning')]);
      expect(multi.info('hi')).toSucceedWith(undefined);
    });

    test('returns undefined when there are no children', () => {
      const multi = new MultiLogger([]);
      expect(multi.error('nobody listening')).toSucceedWith(undefined);
    });
  });

  describe('canonical composition', () => {
    test('feeds a console-style logger and a retaining buffer with independent thresholds', () => {
      const stdout = new InMemoryLogger('info');
      const retainer = new RetainingLogger('detail', 1000, () => 0);
      const multi = new MultiLogger([stdout, retainer]);

      multi.detail('verbose trace');
      multi.info('user-visible');
      multi.error('failure');

      // stdout (info) drops the detail line.
      expect(stdout.logged).toEqual(['user-visible', 'failure']);
      // retainer (detail) keeps everything for the observability buffer.
      expect(retainer.getRecords().map((r) => r.message)).toEqual([
        'verbose trace',
        'user-visible',
        'failure'
      ]);
    });
  });
});
