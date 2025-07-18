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

import '@fgv/ts-utils-jest';
import * as TsRes from '../../../index';

describe('AggregateCacheMetrics', () => {
  let metrics: TsRes.Runtime.AggregateCacheMetrics;

  beforeEach(() => {
    metrics = new TsRes.Runtime.AggregateCacheMetrics();
  });

  describe('initialization', () => {
    test('initializes with zero values', () => {
      expect(metrics.hits).toBe(0);
      expect(metrics.misses).toBe(0);
      expect(metrics.errors).toBe(0);
      expect(metrics.clears).toBe(0);
      expect(metrics.totalAccesses).toBe(0);
      expect(metrics.hitRate).toBe(0);
      expect(metrics.errorRate).toBe(0);
    });
  });

  describe('onHit', () => {
    test('increments hit count', () => {
      metrics.onHit(0);
      expect(metrics.hits).toBe(1);
      expect(metrics.totalAccesses).toBe(1);
      expect(metrics.hitRate).toBe(100);
    });

    test('increments hit count multiple times', () => {
      metrics.onHit(0);
      metrics.onHit(1);
      metrics.onHit(2);
      expect(metrics.hits).toBe(3);
      expect(metrics.totalAccesses).toBe(3);
      expect(metrics.hitRate).toBe(100);
    });
  });

  describe('onMiss', () => {
    test('increments miss count', () => {
      metrics.onMiss(0);
      expect(metrics.misses).toBe(1);
      expect(metrics.totalAccesses).toBe(1);
      expect(metrics.hitRate).toBe(0);
    });

    test('increments miss count multiple times', () => {
      metrics.onMiss(0);
      metrics.onMiss(1);
      expect(metrics.misses).toBe(2);
      expect(metrics.totalAccesses).toBe(2);
      expect(metrics.hitRate).toBe(0);
    });
  });

  describe('onError', () => {
    test('increments error count', () => {
      metrics.onError(0);
      expect(metrics.errors).toBe(1);
      expect(metrics.totalAccesses).toBe(1);
      expect(metrics.hitRate).toBe(0);
      expect(metrics.errorRate).toBe(100);
    });

    test('increments error count multiple times', () => {
      metrics.onError(0);
      metrics.onError(1);
      expect(metrics.errors).toBe(2);
      expect(metrics.totalAccesses).toBe(2);
      expect(metrics.errorRate).toBe(100);
    });
  });

  describe('onClear', () => {
    test('resets all counts and increments clear count', () => {
      // Add some data first
      metrics.onHit(0);
      metrics.onMiss(0);
      metrics.onError(0);

      expect(metrics.hits).toBe(1);
      expect(metrics.misses).toBe(1);
      expect(metrics.errors).toBe(1);
      expect(metrics.clears).toBe(0);

      // Clear
      metrics.onClear();

      expect(metrics.hits).toBe(0);
      expect(metrics.misses).toBe(0);
      expect(metrics.errors).toBe(0);
      expect(metrics.clears).toBe(1);
    });

    test('increments clear count multiple times', () => {
      metrics.onClear();
      metrics.onClear();
      expect(metrics.clears).toBe(2);
    });
  });

  describe('calculated properties', () => {
    test('calculates hit rate correctly with mixed hits and misses', () => {
      metrics.onHit(0);
      metrics.onHit(1);
      metrics.onMiss(0);

      expect(metrics.hitRate).toBeCloseTo(66.67, 1); // 2 hits out of 3 total
    });

    test('calculates error rate correctly with mixed results', () => {
      metrics.onHit(0);
      metrics.onMiss(0);
      metrics.onError(0);
      metrics.onError(1);

      expect(metrics.errorRate).toBe(50); // 2 errors out of 4 total
    });

    test('handles zero total accesses', () => {
      expect(metrics.hitRate).toBe(0);
      expect(metrics.errorRate).toBe(0);
    });

    test('calculates total accesses correctly', () => {
      metrics.onHit(0);
      metrics.onMiss(0);
      metrics.onError(0);

      expect(metrics.totalAccesses).toBe(3);
    });
  });

  describe('reset', () => {
    test('resets all counts to zero', () => {
      // Add some data first
      metrics.onHit(0);
      metrics.onMiss(0);
      metrics.onError(0);
      metrics.onClear();

      expect(metrics.hits).toBe(0);
      expect(metrics.misses).toBe(0);
      expect(metrics.errors).toBe(0);
      expect(metrics.clears).toBe(1);

      // Reset
      metrics.reset();

      expect(metrics.hits).toBe(0);
      expect(metrics.misses).toBe(0);
      expect(metrics.errors).toBe(0);
      expect(metrics.clears).toBe(0);
    });
  });
});

describe('ResourceResolverCacheMetricsListener', () => {
  describe('constructor with factory', () => {
    test('creates metrics using factory function', () => {
      const factory = (): TsRes.Runtime.AggregateCacheMetrics => new TsRes.Runtime.AggregateCacheMetrics();
      const listener = new TsRes.Runtime.ResourceResolverCacheMetricsListener(factory);

      expect(listener.metrics.condition).toBeInstanceOf(TsRes.Runtime.AggregateCacheMetrics);
      expect(listener.metrics.conditionSet).toBeInstanceOf(TsRes.Runtime.AggregateCacheMetrics);
      expect(listener.metrics.decision).toBeInstanceOf(TsRes.Runtime.AggregateCacheMetrics);

      // Verify they are separate instances
      expect(listener.metrics.condition).not.toBe(listener.metrics.conditionSet);
      expect(listener.metrics.condition).not.toBe(listener.metrics.decision);
      expect(listener.metrics.conditionSet).not.toBe(listener.metrics.decision);
    });
  });

  describe('constructor with metrics object', () => {
    test('uses provided metrics object', () => {
      const conditionMetrics = new TsRes.Runtime.AggregateCacheMetrics();
      const conditionSetMetrics = new TsRes.Runtime.AggregateCacheMetrics();
      const decisionMetrics = new TsRes.Runtime.AggregateCacheMetrics();

      const metricsObj = {
        condition: conditionMetrics,
        conditionSet: conditionSetMetrics,
        decision: decisionMetrics
      };

      const listener = new TsRes.Runtime.ResourceResolverCacheMetricsListener(metricsObj);

      expect(listener.metrics.condition).toBe(conditionMetrics);
      expect(listener.metrics.conditionSet).toBe(conditionSetMetrics);
      expect(listener.metrics.decision).toBe(decisionMetrics);
    });
  });

  describe('cache event handling', () => {
    let listener: TsRes.Runtime.ResourceResolverCacheMetricsListener<TsRes.Runtime.AggregateCacheMetrics>;

    beforeEach(() => {
      const factory = (): TsRes.Runtime.AggregateCacheMetrics => new TsRes.Runtime.AggregateCacheMetrics();
      listener = new TsRes.Runtime.ResourceResolverCacheMetricsListener(factory);
    });

    test('onCacheHit increments hit count for correct cache type', () => {
      listener.onCacheHit('condition', 0);
      listener.onCacheHit('conditionSet', 1);
      listener.onCacheHit('decision', 2);

      expect(listener.metrics.condition.hits).toBe(1);
      expect(listener.metrics.conditionSet.hits).toBe(1);
      expect(listener.metrics.decision.hits).toBe(1);

      expect(listener.metrics.condition.misses).toBe(0);
      expect(listener.metrics.conditionSet.misses).toBe(0);
      expect(listener.metrics.decision.misses).toBe(0);
    });

    test('onCacheMiss increments miss count for correct cache type', () => {
      listener.onCacheMiss('condition', 0);
      listener.onCacheMiss('conditionSet', 1);
      listener.onCacheMiss('decision', 2);

      expect(listener.metrics.condition.misses).toBe(1);
      expect(listener.metrics.conditionSet.misses).toBe(1);
      expect(listener.metrics.decision.misses).toBe(1);

      expect(listener.metrics.condition.hits).toBe(0);
      expect(listener.metrics.conditionSet.hits).toBe(0);
      expect(listener.metrics.decision.hits).toBe(0);
    });

    test('onCacheError increments error count for correct cache type', () => {
      listener.onCacheError('condition', 0);
      listener.onCacheError('conditionSet', 1);
      listener.onCacheError('decision', 2);

      expect(listener.metrics.condition.errors).toBe(1);
      expect(listener.metrics.conditionSet.errors).toBe(1);
      expect(listener.metrics.decision.errors).toBe(1);

      expect(listener.metrics.condition.hits).toBe(0);
      expect(listener.metrics.conditionSet.hits).toBe(0);
      expect(listener.metrics.decision.hits).toBe(0);
    });

    test('onCacheClear clears metrics for correct cache type', () => {
      // Add some data first
      listener.onCacheHit('condition', 0);
      listener.onCacheMiss('condition', 1);
      listener.onCacheError('condition', 2);

      expect(listener.metrics.condition.hits).toBe(1);
      expect(listener.metrics.condition.misses).toBe(1);
      expect(listener.metrics.condition.errors).toBe(1);

      // Clear condition cache
      listener.onCacheClear('condition');

      expect(listener.metrics.condition.hits).toBe(0);
      expect(listener.metrics.condition.misses).toBe(0);
      expect(listener.metrics.condition.errors).toBe(0);
      expect(listener.metrics.condition.clears).toBe(1);
    });
  });

  describe('reset', () => {
    test('resets all cache metrics', () => {
      const factory = (): TsRes.Runtime.AggregateCacheMetrics => new TsRes.Runtime.AggregateCacheMetrics();
      const listener = new TsRes.Runtime.ResourceResolverCacheMetricsListener(factory);

      // Add some data
      listener.onCacheHit('condition', 0);
      listener.onCacheMiss('conditionSet', 1);
      listener.onCacheError('decision', 2);

      expect(listener.metrics.condition.hits).toBe(1);
      expect(listener.metrics.conditionSet.misses).toBe(1);
      expect(listener.metrics.decision.errors).toBe(1);

      // Reset
      listener.reset();

      expect(listener.metrics.condition.hits).toBe(0);
      expect(listener.metrics.conditionSet.misses).toBe(0);
      expect(listener.metrics.decision.errors).toBe(0);
    });
  });
});
