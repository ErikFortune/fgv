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
import { RetainingLogger } from '../../packlets/logging';

describe('RetainingLogger', () => {
  describe('constructor defaults', () => {
    test('defaults to detail log level (more verbose than LoggerBase info default)', () => {
      const logger = new RetainingLogger();
      expect(logger.logLevel).toBe('detail');
    });

    test('accepts a custom log level', () => {
      const logger = new RetainingLogger('warning');
      expect(logger.logLevel).toBe('warning');
    });

    test('starts with no records and lastSeq 0', () => {
      const logger = new RetainingLogger();
      expect(logger.records).toEqual([]);
      expect(logger.lastSeq).toBe(0);
    });
  });

  describe('record capture', () => {
    test('retains a structured record per logged message', () => {
      let clock = 1000;
      const logger = new RetainingLogger('detail', 1000, () => clock);
      expect(logger.info('hello')).toSucceedWith('hello');
      clock = 2000;
      expect(logger.warn('caution')).toSucceedWith('caution');

      expect(logger.records).toEqual([
        { seq: 1, timestamp: 1000, level: 'info', message: 'hello', args: ['hello'] },
        { seq: 2, timestamp: 2000, level: 'warning', message: 'caution', args: ['caution'] }
      ]);
      expect(logger.lastSeq).toBe(2);
    });

    test('message is the formatted form, args is the raw [message, ...parameters]', () => {
      const logger = new RetainingLogger('detail', 1000, () => 0);
      logger.info('count: ', 42, ' items');
      expect(logger.records).toEqual([
        {
          seq: 1,
          timestamp: 0,
          level: 'info',
          message: 'count: 42 items',
          args: ['count: ', 42, ' items']
        }
      ]);
    });

    test('captures args as [message] when no parameters are supplied', () => {
      const logger = new RetainingLogger('detail', 1000, () => 0);
      logger.error('boom');
      expect(logger.records[0].args).toEqual(['boom']);
    });

    test('assigns 1-based monotonic sequence numbers', () => {
      const logger = new RetainingLogger('all');
      logger.info('a');
      logger.info('b');
      logger.info('c');
      expect(logger.records.map((r) => r.seq)).toEqual([1, 2, 3]);
    });

    test('uses Date.now by default when no clock is injected', () => {
      const before = Date.now();
      const logger = new RetainingLogger();
      logger.info('now');
      const after = Date.now();
      const ts = logger.records[0].timestamp;
      expect(ts).toBeGreaterThanOrEqual(before);
      expect(ts).toBeLessThanOrEqual(after);
    });
  });

  describe('log level filtering on retention', () => {
    test('does not retain records below the configured threshold', () => {
      const logger = new RetainingLogger('info');
      logger.detail('suppressed detail');
      logger.info('kept info');
      logger.error('kept error');

      expect(logger.records.map((r) => r.message)).toEqual(['kept info', 'kept error']);
      // Suppressed messages do not consume a sequence number.
      expect(logger.lastSeq).toBe(2);
    });
  });

  describe('ring eviction', () => {
    test('evicts the oldest record once maxRecords is exceeded', () => {
      const logger = new RetainingLogger('all', 3);
      logger.info('1');
      logger.info('2');
      logger.info('3');
      logger.info('4');

      expect(logger.records).toHaveLength(3);
      expect(logger.records.map((r) => r.message)).toEqual(['2', '3', '4']);
    });

    test('seq is stable across eviction — a client holding sinceSeq never repeats or skips', () => {
      const logger = new RetainingLogger('all', 3);
      logger.info('1');
      logger.info('2');

      // Client reads up to here and remembers the cursor.
      let cursor = logger.lastSeq;
      expect(cursor).toBe(2);

      logger.info('3');
      logger.info('4'); // evicts seq 1
      logger.info('5'); // evicts seq 2

      // The buffer now holds seq 3,4,5 — seq 1,2 scrolled off, never renumbered.
      expect(logger.records.map((r) => r.seq)).toEqual([3, 4, 5]);

      const since = logger.getRecords({ sinceSeq: cursor });
      expect(since.map((r) => r.seq)).toEqual([3, 4, 5]);

      // Advance the cursor and confirm no record is re-delivered.
      cursor = logger.lastSeq;
      expect(logger.getRecords({ sinceSeq: cursor })).toEqual([]);
    });
  });

  describe('getRecords filtering', () => {
    function seeded(): RetainingLogger {
      const logger = new RetainingLogger('all', 100, () => 0);
      logger.detail('d1');
      logger.info('i1');
      logger.warn('w1');
      logger.error('e1');
      return logger;
    }

    test('returns all records oldest-first with no options', () => {
      expect(
        seeded()
          .getRecords()
          .map((r) => r.message)
      ).toEqual(['d1', 'i1', 'w1', 'e1']);
    });

    test('filters by minLevel using shouldLog semantics', () => {
      const logger = seeded();
      expect(logger.getRecords({ minLevel: 'warning' }).map((r) => r.message)).toEqual(['w1', 'e1']);
      expect(logger.getRecords({ minLevel: 'info' }).map((r) => r.message)).toEqual(['i1', 'w1', 'e1']);
      expect(logger.getRecords({ minLevel: 'error' }).map((r) => r.message)).toEqual(['e1']);
    });

    test('filters by sinceSeq (strictly greater)', () => {
      const logger = seeded();
      expect(logger.getRecords({ sinceSeq: 2 }).map((r) => r.seq)).toEqual([3, 4]);
      expect(logger.getRecords({ sinceSeq: 4 })).toEqual([]);
    });

    test('limit returns the most-recent N, still oldest-first', () => {
      const logger = seeded();
      expect(logger.getRecords({ limit: 2 }).map((r) => r.message)).toEqual(['w1', 'e1']);
    });

    test('limit larger than the record count returns all records', () => {
      const logger = seeded();
      expect(logger.getRecords({ limit: 99 }).map((r) => r.message)).toEqual(['d1', 'i1', 'w1', 'e1']);
    });

    test('combines minLevel, sinceSeq and limit', () => {
      const logger = seeded();
      // minLevel info → [i1(2), w1(3), e1(4)]; sinceSeq 2 → [w1(3), e1(4)]; limit 1 → [e1(4)]
      const result = logger.getRecords({ minLevel: 'info', sinceSeq: 2, limit: 1 });
      expect(result.map((r) => r.message)).toEqual(['e1']);
    });
  });

  describe('clear', () => {
    test('empties records but does NOT reset the sequence counter', () => {
      const logger = new RetainingLogger('all');
      logger.info('a');
      logger.info('b');
      expect(logger.lastSeq).toBe(2);

      logger.clear();
      expect(logger.records).toEqual([]);
      expect(logger.lastSeq).toBe(2);

      logger.info('c');
      expect(logger.records.map((r) => r.seq)).toEqual([3]);
      expect(logger.lastSeq).toBe(3);
    });
  });
});
