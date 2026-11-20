/*
 * Copyright (c) 2026 Erik Fortune
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

import '../../helpers/jest';
import { RetainingRingBuffer } from '../../../packlets/collections';

interface ITestRecord {
  readonly seq: number;
  readonly value: string;
}

function rec(seq: number, value: string = `v${seq}`): ITestRecord {
  return { seq, value };
}

describe('RetainingRingBuffer', () => {
  describe('construction', () => {
    test('starts empty with lastSeq 0', () => {
      const buffer = new RetainingRingBuffer<ITestRecord>();
      expect(buffer.size).toBe(0);
      expect(buffer.lastSeq).toBe(0);
      expect(buffer.records).toEqual([]);
    });

    test('defaults to a capacity of 1000', () => {
      const buffer = new RetainingRingBuffer<ITestRecord>();
      for (let i = 1; i <= 1500; i++) {
        buffer.push(rec(i));
      }
      expect(buffer.size).toBe(1000);
      expect(buffer.records[0].seq).toBe(501);
      expect(buffer.records[999].seq).toBe(1500);
    });

    test('accepts a custom maxRecords', () => {
      const buffer = new RetainingRingBuffer<ITestRecord>({ maxRecords: 3 });
      [1, 2, 3, 4, 5].forEach((s) => buffer.push(rec(s)));
      expect(buffer.size).toBe(3);
      expect(buffer.records.map((r) => r.seq)).toEqual([3, 4, 5]);
    });

    test.each([
      ['zero', 0],
      ['negative', -5],
      ['fractional below one', 0.4],
      ['NaN', Number.NaN],
      ['Infinity', Number.POSITIVE_INFINITY]
    ])('floors a degenerate maxRecords (%s) to 1', (__label, maxRecords) => {
      const buffer = new RetainingRingBuffer<ITestRecord>({ maxRecords });
      buffer.push(rec(1));
      buffer.push(rec(2));
      expect(buffer.size).toBe(1);
      expect(buffer.records.map((r) => r.seq)).toEqual([2]);
    });

    test('floors a fractional capacity toward the integer below', () => {
      const buffer = new RetainingRingBuffer<ITestRecord>({ maxRecords: 2.9 });
      [1, 2, 3].forEach((s) => buffer.push(rec(s)));
      expect(buffer.size).toBe(2);
      expect(buffer.records.map((r) => r.seq)).toEqual([2, 3]);
    });
  });

  describe('push', () => {
    test('retains records oldest-first and returns the pushed record', () => {
      const buffer = new RetainingRingBuffer<ITestRecord>();
      const pushed = buffer.push(rec(1, 'first'));
      expect(pushed).toEqual({ seq: 1, value: 'first' });
      buffer.push(rec(2, 'second'));
      expect(buffer.records).toEqual([
        { seq: 1, value: 'first' },
        { seq: 2, value: 'second' }
      ]);
    });

    test('tracks lastSeq as the highest seq pushed', () => {
      const buffer = new RetainingRingBuffer<ITestRecord>();
      expect(buffer.push(rec(1)).seq).toBe(1);
      buffer.push(rec(2));
      buffer.push(rec(7));
      expect(buffer.lastSeq).toBe(7);
    });

    test('does not lower lastSeq when a record with a smaller seq is pushed', () => {
      const buffer = new RetainingRingBuffer<ITestRecord>();
      buffer.push(rec(5));
      buffer.push(rec(3));
      expect(buffer.lastSeq).toBe(5);
    });

    test('lastSeq survives eviction (stays the highest ever seen)', () => {
      const buffer = new RetainingRingBuffer<ITestRecord>({ maxRecords: 2 });
      [1, 2, 3, 4].forEach((s) => buffer.push(rec(s)));
      expect(buffer.records.map((r) => r.seq)).toEqual([3, 4]);
      expect(buffer.lastSeq).toBe(4);
    });
  });

  describe('query', () => {
    function seeded(): RetainingRingBuffer<ITestRecord> {
      const buffer = new RetainingRingBuffer<ITestRecord>();
      [1, 2, 3, 4, 5].forEach((s) => buffer.push(rec(s)));
      return buffer;
    }

    test('returns all records oldest-first with no options', () => {
      expect(
        seeded()
          .query()
          .map((r) => r.seq)
      ).toEqual([1, 2, 3, 4, 5]);
    });

    test('returns all records oldest-first with an empty options object', () => {
      expect(
        seeded()
          .query({})
          .map((r) => r.seq)
      ).toEqual([1, 2, 3, 4, 5]);
    });

    test('sinceSeq pages records strictly after the cursor', () => {
      expect(
        seeded()
          .query({ sinceSeq: 3 })
          .map((r) => r.seq)
      ).toEqual([4, 5]);
    });

    test('sinceSeq at or beyond the last seq returns nothing', () => {
      expect(seeded().query({ sinceSeq: 5 })).toEqual([]);
      expect(seeded().query({ sinceSeq: 99 })).toEqual([]);
    });

    test('filter keeps only matching records', () => {
      const matched = seeded().query({ filter: (r) => r.seq % 2 === 0 });
      expect(matched.map((r) => r.seq)).toEqual([2, 4]);
    });

    test('limit returns the most-recent N, still oldest-first', () => {
      expect(
        seeded()
          .query({ limit: 2 })
          .map((r) => r.seq)
      ).toEqual([4, 5]);
    });

    test('limit larger than the retained count returns everything', () => {
      expect(
        seeded()
          .query({ limit: 50 })
          .map((r) => r.seq)
      ).toEqual([1, 2, 3, 4, 5]);
    });

    test('filter is applied before limit (limit bounds the filtered tail)', () => {
      const matched = seeded().query({ filter: (r) => r.seq % 2 === 1, limit: 2 });
      // odd seqs are [1, 3, 5]; the most-recent 2 are [3, 5]
      expect(matched.map((r) => r.seq)).toEqual([3, 5]);
    });

    test('combines sinceSeq, filter, and limit', () => {
      const matched = seeded().query({ sinceSeq: 1, filter: (r) => r.seq !== 3, limit: 2 });
      // after seq>1: [2,3,4,5]; drop 3: [2,4,5]; last 2: [4,5]
      expect(matched.map((r) => r.seq)).toEqual([4, 5]);
    });
  });

  describe('clear', () => {
    test('empties the ring but preserves lastSeq', () => {
      const buffer = new RetainingRingBuffer<ITestRecord>();
      [1, 2, 3].forEach((s) => buffer.push(rec(s)));
      buffer.clear();
      expect(buffer.size).toBe(0);
      expect(buffer.records).toEqual([]);
      expect(buffer.lastSeq).toBe(3);
    });

    test('a sinceSeq cursor held across clear never re-sees a sequence number', () => {
      const buffer = new RetainingRingBuffer<ITestRecord>();
      [1, 2, 3].forEach((s) => buffer.push(rec(s)));
      const cursor = buffer.lastSeq;
      buffer.clear();
      buffer.push(rec(4));
      buffer.push(rec(5));
      expect(buffer.query({ sinceSeq: cursor }).map((r) => r.seq)).toEqual([4, 5]);
    });

    test('the ring is reusable after clear and still evicts correctly', () => {
      const buffer = new RetainingRingBuffer<ITestRecord>({ maxRecords: 2 });
      [1, 2, 3].forEach((s) => buffer.push(rec(s)));
      buffer.clear();
      [4, 5, 6].forEach((s) => buffer.push(rec(s)));
      expect(buffer.records.map((r) => r.seq)).toEqual([5, 6]);
    });
  });
});
