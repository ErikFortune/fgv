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

import { IResourceResolverCacheListener, ResourceResolverCacheType } from './cacheListener';

/**
 * Cache metrics interface for tracking cache performance.
 * @public
 */
export interface ICacheMetrics {
  hits: number;
  misses: number;
  errors: number;
  clears: number;
  totalAccesses: number;
  hitRate: number;
  onHit(index: number): void;
  onMiss(index: number): void;
  onError(index: number): void;
  onClear(): void;
  reset(): void;
}

/**
 * Aggregate cache metrics for a specific cache type.
 * @public
 */
export class AggregateCacheMetrics implements ICacheMetrics {
  private _hits: number = 0;
  private _misses: number = 0;
  private _errors: number = 0;
  private _clears: number = 0;

  public constructor() {
    this._hits = 0;
    this._misses = 0;
    this._errors = 0;
    this._clears = 0;
  }

  public onHit(__index: number): void {
    this._hits++;
  }

  public onMiss(__index: number): void {
    this._misses++;
  }

  public onError(__index: number): void {
    this._errors++;
  }

  public onClear(): void {
    this._hits = 0;
    this._misses = 0;
    this._errors = 0;
    this._clears++;
  }

  public get hits(): number {
    return this._hits;
  }

  public get misses(): number {
    return this._misses;
  }

  public get errors(): number {
    return this._errors;
  }

  public get clears(): number {
    return this._clears;
  }

  public get totalAccesses(): number {
    return this._hits + this._misses + this._errors;
  }

  public get hitRate(): number {
    return this.totalAccesses > 0 ? (this._hits / this.totalAccesses) * 100 : 0;
  }

  public get errorRate(): number {
    return this.totalAccesses > 0 ? (this._errors / this.totalAccesses) * 100 : 0;
  }

  public reset(): void {
    this._hits = 0;
    this._misses = 0;
    this._errors = 0;
    this._clears = 0;
  }
}

/**
 * Overall cache metrics across all cache types.
 * @public
 */
export type OverallCacheMetrics<TM extends ICacheMetrics = ICacheMetrics> = Record<
  ResourceResolverCacheType,
  TM
>;

/**
 * A metrics implementation of {@link Runtime.IResourceResolverCacheListener} that tracks
 * hit counts and rates across all cache types.
 * @public
 */
export class ResourceResolverCacheMetricsListener<TM extends ICacheMetrics>
  implements IResourceResolverCacheListener
{
  private readonly _metrics: OverallCacheMetrics<TM>;
  private _contextErrors: number;

  public get numContextErrors(): number {
    return this._contextErrors;
  }

  public constructor(factory: () => TM);
  public constructor(metrics: OverallCacheMetrics<TM>);
  public constructor(factoryOrMetrics: OverallCacheMetrics<TM> | (() => TM)) {
    if (typeof factoryOrMetrics === 'function') {
      this._metrics = {
        condition: factoryOrMetrics(),
        conditionSet: factoryOrMetrics(),
        decision: factoryOrMetrics()
      };
    } else {
      this._metrics = factoryOrMetrics;
    }
    this._contextErrors = 0;
  }

  /**
   * Get the metrics for all cache types.
   * @returns The metrics for all cache types.
   */
  public get metrics(): Readonly<OverallCacheMetrics> {
    return this._metrics;
  }

  /**
   * {@inheritDoc Runtime.IResourceResolverCacheListener.onCacheHit}
   */
  public onCacheHit(cache: ResourceResolverCacheType, index: number): void {
    this._metrics[cache].onHit(index);
  }

  /**
   * {@inheritDoc Runtime.IResourceResolverCacheListener.onCacheMiss}
   */
  public onCacheMiss(cache: ResourceResolverCacheType, index: number): void {
    this._metrics[cache].onMiss(index);
  }

  /**
   * {@inheritDoc Runtime.IResourceResolverCacheListener.onCacheError}
   */
  public onCacheError(cache: ResourceResolverCacheType, index: number): void {
    this._metrics[cache].onError(index);
  }

  /**
   * {@inheritDoc Runtime.IResourceResolverCacheListener.onContextError}
   */
  public onContextError(qualifier: string, error: string): void {
    this._contextErrors++;
  }

  /**
   * {@inheritDoc Runtime.IResourceResolverCacheListener.onCacheClear}
   */
  public onCacheClear(cache: ResourceResolverCacheType): void {
    this._metrics[cache].onClear();
  }

  /**
   * Reset all metrics to zero.
   */
  public reset(): void {
    this._metrics.condition.reset();
    this._metrics.conditionSet.reset();
    this._metrics.decision.reset();
    this._contextErrors = 0;
  }
}
