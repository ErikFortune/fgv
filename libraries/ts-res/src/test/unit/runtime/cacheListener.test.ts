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

describe('NoOpResourceResolverCacheListener', () => {
  let listener: TsRes.Runtime.NoOpResourceResolverCacheListener;

  beforeEach(() => {
    listener = new TsRes.Runtime.NoOpResourceResolverCacheListener();
  });

  describe('onCacheHit', () => {
    test('executes without throwing for condition cache', () => {
      expect(() => listener.onCacheHit('condition', 0)).not.toThrow();
    });

    test('executes without throwing for conditionSet cache', () => {
      expect(() => listener.onCacheHit('conditionSet', 1)).not.toThrow();
    });

    test('executes without throwing for decision cache', () => {
      expect(() => listener.onCacheHit('decision', 2)).not.toThrow();
    });

    test('executes without throwing for various indices', () => {
      expect(() => listener.onCacheHit('condition', 0)).not.toThrow();
      expect(() => listener.onCacheHit('condition', 100)).not.toThrow();
      expect(() => listener.onCacheHit('condition', -1)).not.toThrow();
    });
  });

  describe('onCacheMiss', () => {
    test('executes without throwing for condition cache', () => {
      expect(() => listener.onCacheMiss('condition', 0)).not.toThrow();
    });

    test('executes without throwing for conditionSet cache', () => {
      expect(() => listener.onCacheMiss('conditionSet', 1)).not.toThrow();
    });

    test('executes without throwing for decision cache', () => {
      expect(() => listener.onCacheMiss('decision', 2)).not.toThrow();
    });

    test('executes without throwing for various indices', () => {
      expect(() => listener.onCacheMiss('condition', 0)).not.toThrow();
      expect(() => listener.onCacheMiss('condition', 100)).not.toThrow();
      expect(() => listener.onCacheMiss('condition', -1)).not.toThrow();
    });
  });

  describe('onCacheError', () => {
    test('executes without throwing for condition cache', () => {
      expect(() => listener.onCacheError('condition', 0)).not.toThrow();
    });

    test('executes without throwing for conditionSet cache', () => {
      expect(() => listener.onCacheError('conditionSet', 1)).not.toThrow();
    });

    test('executes without throwing for decision cache', () => {
      expect(() => listener.onCacheError('decision', 2)).not.toThrow();
    });

    test('executes without throwing for various indices', () => {
      expect(() => listener.onCacheError('condition', 0)).not.toThrow();
      expect(() => listener.onCacheError('condition', 100)).not.toThrow();
      expect(() => listener.onCacheError('condition', -1)).not.toThrow();
    });
  });

  describe('onCacheClear', () => {
    test('executes without throwing for condition cache', () => {
      expect(() => listener.onCacheClear('condition')).not.toThrow();
    });

    test('executes without throwing for conditionSet cache', () => {
      expect(() => listener.onCacheClear('conditionSet')).not.toThrow();
    });

    test('executes without throwing for decision cache', () => {
      expect(() => listener.onCacheClear('decision')).not.toThrow();
    });
  });

  describe('interface compliance', () => {
    test('implements IResourceResolverCacheListener interface', () => {
      // TypeScript compilation ensures interface compliance
      const interfaceListener: TsRes.Runtime.IResourceResolverCacheListener = listener;
      expect(interfaceListener).toBe(listener);
    });

    test('all methods are callable', () => {
      // Verify all interface methods are present and callable
      expect(typeof listener.onCacheHit).toBe('function');
      expect(typeof listener.onCacheMiss).toBe('function');
      expect(typeof listener.onCacheError).toBe('function');
      expect(typeof listener.onCacheClear).toBe('function');
    });
  });
});
