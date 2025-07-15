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

/**
 * Type indicating which {@link Runtime.ResourceResolver | ResourceResolver} cache is affected.
 * @public
 */
export type ResourceResolverCacheType = 'condition' | 'conditionSet' | 'decision';

/**
 * Type indicating the action performed on a {@link Runtime.ResourceResolver | ResourceResolver} cache.
 * @public
 */
export type ResourceResolverCacheActivity = 'hit' | 'miss' | 'error' | 'clear';

/**
 * A listener for {@link Runtime.ResourceResolver | ResourceResolver} cache activity.
 * @public
 */
export interface IResourceResolverCacheListener {
  /**
   * Called when a cache hit occurs.
   * @param cache - The type of cache that was hit.
   * @param index - The index of the cache that was hit.
   */
  onCacheHit(cache: ResourceResolverCacheType, index: number): void;

  /**
   * Called when a cache miss occurs.
   * @param cache - The type of cache that was missed.
   * @param index - The index of the cache that was missed.
   */
  onCacheMiss(cache: ResourceResolverCacheType, index: number): void;

  /**
   * Called when a cache error occurs.
   * @param cache - The type of cache that had an error.
   * @param index - The index of the cache that had an error.
   */
  onCacheError(cache: ResourceResolverCacheType, index: number): void;

  /**
   * Called when a cache is cleared.
   * @param cache - The type of cache that was cleared.
   */
  onCacheClear(cache: ResourceResolverCacheType): void;
}

/**
 * A no-op implementation of {@link IResourceResolverCacheListener}.
 * @public
 */
export class NoOpResourceResolverCacheListener implements IResourceResolverCacheListener {
  /**
   * {@inheritDoc Runtime.IResourceResolverCacheListener.onCacheHit}
   */
  public onCacheHit(cache: ResourceResolverCacheType, index: number): void {
    // no-op
  }

  /**
   * {@inheritDoc Runtime.IResourceResolverCacheListener.onCacheMiss}
   */
  public onCacheMiss(cache: ResourceResolverCacheType, index: number): void {
    // no-op
  }

  /**
   * {@inheritDoc Runtime.IResourceResolverCacheListener.onCacheError}
   */
  public onCacheError(cache: ResourceResolverCacheType, index: number): void {
    // no-op
  }

  /**
   * {@inheritDoc Runtime.IResourceResolverCacheListener.onCacheClear}
   */
  public onCacheClear(cache: ResourceResolverCacheType): void {
    // no-op
  }
}
