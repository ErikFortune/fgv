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
import { JsonObject } from '@fgv/ts-json-base';

describe('JsonResourceType', () => {
  describe('static create method', () => {
    test('creates a new JsonResourceType with default values', () => {
      expect(TsRes.ResourceTypes.JsonResourceType.create()).toSucceedAndSatisfy((type) => {
        expect(type).toBeInstanceOf(TsRes.ResourceTypes.JsonResourceType);
        expect(type.key).toBe('json');
        expect(type.index).toBeUndefined();
      });
    });

    test('creates a new JsonResourceType with specified values', () => {
      const key = 'test';
      const index = 12;
      expect(TsRes.ResourceTypes.JsonResourceType.create({ key, index })).toSucceedAndSatisfy((type) => {
        expect(type).toBeInstanceOf(TsRes.ResourceTypes.JsonResourceType);
        expect(type.key).toBe(key);
        expect(type.index).toBe(index);
      });
    });

    test('fails for invalid keys', () => {
      expect(TsRes.ResourceTypes.JsonResourceType.create({ key: 'invalid key' })).toFailWith(/invalid key/i);
    });

    test('fails for invalid indexes', () => {
      expect(TsRes.ResourceTypes.JsonResourceType.create({ index: -1 })).toFailWith(/not a valid/i);
    });
  });

  describe('validateDeclaration method', () => {
    test('succeeds for valid json regardless of completeness or merge method', () => {
      const id = 'some.resource' as TsRes.ResourceId;
      const json = { someProperty: 'someValue' };
      const rt = TsRes.ResourceTypes.JsonResourceType.create().orThrow();
      expect(rt.validateDeclaration({ id, json, isPartial: false, mergeMethod: 'augment' })).toSucceedWith(
        json
      );
      expect(rt.validateDeclaration({ id, json, isPartial: true, mergeMethod: 'augment' })).toSucceedWith(
        json
      );
      expect(rt.validateDeclaration({ id, json, isPartial: false, mergeMethod: 'delete' })).toSucceedWith(
        json
      );
      expect(rt.validateDeclaration({ id, json, isPartial: true, mergeMethod: 'delete' })).toSucceedWith(
        json
      );
      expect(rt.validateDeclaration({ id, json, isPartial: false, mergeMethod: 'replace' })).toSucceedWith(
        json
      );
      expect(rt.validateDeclaration({ id, json, isPartial: true, mergeMethod: 'replace' })).toSucceedWith(
        json
      );
    });
  });

  describe('validate method', () => {
    test('succeeds for valid json regardless of completeness', () => {
      const value = { someProperty: 'someValue' };
      const rt = TsRes.ResourceTypes.JsonResourceType.create().orThrow();
      expect(rt.validate(value, 'full')).toSucceedWith(value);
      expect(rt.validate(value, 'partial')).toSucceedWith(value);
    });

    test('fails for non-json values', () => {
      const value = { foo: () => true } as unknown as JsonObject;
      const rt = TsRes.ResourceTypes.JsonResourceType.create().orThrow();
      expect(rt.validate(value, 'full')).toFailWith(/not a valid JSON object/);
    });
  });

  describe('index methods', () => {
    test('index can be set in create', () => {
      expect(TsRes.ResourceTypes.JsonResourceType.create({ index: 1 })).toSucceedAndSatisfy((rt) => {
        expect(rt.index).toBe(1);
      });
    });

    test('setIndex sets the index on a resource type with undefined index', () => {
      const rt = TsRes.ResourceTypes.JsonResourceType.create().orThrow();
      expect(rt.setIndex(1)).toSucceedWith(1 as TsRes.ResourceTypeIndex);
      expect(rt.index).toBe(1);
    });

    test('setIndex fails if the index is out-of-range', () => {
      const rt = TsRes.ResourceTypes.JsonResourceType.create().orThrow();
      expect(rt.setIndex(-1)).toFailWith(/index/);
    });

    test('setIndex fails if the index is already set', () => {
      const rt = TsRes.ResourceTypes.JsonResourceType.create({ index: 1 }).orThrow();
      expect(rt.setIndex(2)).toFailWith(/index/);
    });

    test('setIndex succeeds if the index is already set to the same value', () => {
      const rt = TsRes.ResourceTypes.JsonResourceType.create({ index: 1 }).orThrow();
      expect(rt.setIndex(1)).toSucceedWith(1 as TsRes.ResourceTypeIndex);
    });
  });
});
