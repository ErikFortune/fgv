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
import { succeed } from '@fgv/ts-utils';

describe('ResourceTypeCollector', () => {
  let collector: TsRes.ResourceTypes.ResourceTypeCollector;
  let rt: TsRes.ResourceTypes.ResourceType;

  beforeEach(() => {
    collector = TsRes.ResourceTypes.ResourceTypeCollector.create().orThrow();
    rt = TsRes.ResourceTypes.JsonResourceType.create().orThrow();
  });

  describe('create static method', () => {
    test('creates a new empty ResourceTypeCollector by default', () => {
      expect(TsRes.ResourceTypes.ResourceTypeCollector.create()).toSucceedAndSatisfy((r) => {
        expect(r).toBeInstanceOf(TsRes.ResourceTypes.ResourceTypeCollector);
        expect(r.size).toBe(0);
      });
    });

    test('creates a new ResourceTypeCollector with specified values', () => {
      const resourceTypes = [
        TsRes.ResourceTypes.JsonResourceType.create().orThrow(),
        TsRes.ResourceTypes.JsonResourceType.create({ key: 'other' }).orThrow()
      ];
      expect(TsRes.ResourceTypes.ResourceTypeCollector.create({ resourceTypes })).toSucceedAndSatisfy((r) => {
        expect(r).toBeInstanceOf(TsRes.ResourceTypes.ResourceTypeCollector);
        expect(r.size).toBe(resourceTypes.length);
        resourceTypes.forEach((rt, index) => {
          expect(r.get(rt.key)).toSucceedWith(rt);
          expect(r.getAt(index)).toSucceedWith(rt);
        });
      });
    });
  });

  describe('getOrAdd', () => {
    test('adds a new resource type if it does not exist', () => {
      expect(collector.get(rt.key)).toFailWith(/not found/);
      expect(collector.getOrAdd(rt)).toSucceedWith(rt);
      expect(collector.get(rt.key)).toSucceedWith(rt);
    });

    test('returns an existing resource type if it exists', () => {
      const rt2 = TsRes.ResourceTypes.JsonResourceType.create().orThrow();
      expect(collector.getOrAdd(rt)).toSucceedWith(rt);
      expect(collector.getOrAdd(rt2)).toSucceedWith(rt);
      expect(rt2).not.toBe(rt);
    });
  });

  describe('validating add', () => {
    test('adds a new resource type if it does not exist', () => {
      expect(collector.get(rt.key)).toFailWith(/not found/);
      expect(collector.validating.add(rt)).toSucceedWith(rt);
      expect(collector.get(rt.key)).toSucceedWith(rt);
    });

    test('succeeds without adding if the resource type already exists', () => {
      expect(collector.validating.add(rt)).toSucceedWith(rt);
      expect(collector.validating.add(rt)).toSucceedWith(rt);
      expect(collector.size).toBe(1);
    });

    test('fails if another type with the same key exists', () => {
      const rt2 = TsRes.ResourceTypes.JsonResourceType.create().orThrow();
      expect(collector.validating.add(rt)).toSucceedWith(rt);
      expect(collector.validating.add(rt2)).toFailWith(/already exists/i);
      expect(collector.size).toBe(1);
    });

    test('fails if the resource type is invalid', () => {
      expect(collector.validating.add({})).toFailWith(/not a resource type/i);
    });
  });

  describe('validating getOrAdd', () => {
    test('adds a new resource type if it does not exist', () => {
      const collector = TsRes.ResourceTypes.ResourceTypeCollector.create().orThrow();
      const rt = TsRes.ResourceTypes.JsonResourceType.create().orThrow();
      expect(collector.validating.getOrAdd(rt.key, () => succeed(rt))).toSucceedWith(rt);
      expect(collector.get(rt.key)).toSucceedWith(rt);
    });
  });
});
