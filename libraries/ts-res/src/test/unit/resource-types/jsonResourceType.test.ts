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
      expect(TsRes.ResourceTypes.JsonResourceType.create({ index: -1 })).toFailWith(/invalid/i);
    });
  });

  describe('validateDeclaration method', () => {
    test('succeeds for valid json regardless of completeness or merge method', () => {
      const id = 'some.resource' as TsRes.ResourceId;
      const json = { someProperty: 'someValue' };
      const rt = TsRes.ResourceTypes.JsonResourceType.create().orThrow();
      expect(
        rt.validateDeclaration({ id, json, completeness: 'full', mergeMethod: 'augment' })
      ).toSucceedWith(json);
      expect(
        rt.validateDeclaration({ id, json, completeness: 'partial', mergeMethod: 'augment' })
      ).toSucceedWith(json);
      expect(rt.validateDeclaration({ id, json, completeness: 'full', mergeMethod: 'delete' })).toSucceedWith(
        json
      );
      expect(
        rt.validateDeclaration({ id, json, completeness: 'partial', mergeMethod: 'delete' })
      ).toSucceedWith(json);
      expect(
        rt.validateDeclaration({ id, json, completeness: 'full', mergeMethod: 'replace' })
      ).toSucceedWith(json);
      expect(
        rt.validateDeclaration({ id, json, completeness: 'partial', mergeMethod: 'replace' })
      ).toSucceedWith(json);
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
      expect(rt.validate(value, 'full')).toFailWith(/invalid JSON object/);
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

  describe('createTemplate method', () => {
    const resourceId = 'test.resource' as TsRes.ResourceId;

    test('creates a template with default empty object when no parameters are provided', () => {
      const rt = TsRes.ResourceTypes.JsonResourceType.create().orThrow();
      expect(rt.createTemplate(resourceId)).toSucceedAndSatisfy((template) => {
        expect(template).toEqual({
          id: resourceId,
          resourceTypeName: 'json',
          candidates: [
            {
              json: {},
              mergeMethod: 'replace',
              isPartial: false
            }
          ]
        });
      });
    });

    test('creates a template with provided JSON init value', () => {
      const rt = TsRes.ResourceTypes.JsonResourceType.create().orThrow();
      const init = { title: 'Test Resource', value: 42 };

      expect(rt.createTemplate(resourceId, init)).toSucceedAndSatisfy((template) => {
        expect(template).toEqual({
          id: resourceId,
          resourceTypeName: 'json',
          candidates: [
            {
              json: init,
              mergeMethod: 'replace',
              isPartial: false
            }
          ]
        });
      });
    });

    test('creates a template with conditions', () => {
      const rt = TsRes.ResourceTypes.JsonResourceType.create().orThrow();
      const init = { content: 'localized content' };
      const conditions = { language: 'en-US', territory: 'US' };

      expect(rt.createTemplate(resourceId, init, conditions)).toSucceedAndSatisfy((template) => {
        expect(template).toEqual({
          id: resourceId,
          resourceTypeName: 'json',
          candidates: [
            {
              json: init,
              conditions,
              mergeMethod: 'replace',
              isPartial: false
            }
          ]
        });
      });
    });

    test('creates a template with array-style conditions', () => {
      const rt = TsRes.ResourceTypes.JsonResourceType.create().orThrow();
      const init = { message: 'Hello' };
      const conditions = [
        { qualifierName: 'language', value: 'en' },
        { qualifierName: 'territory', value: 'US', operator: 'matches' as TsRes.ConditionOperator }
      ];

      expect(rt.createTemplate(resourceId, init, conditions)).toSucceedAndSatisfy((template) => {
        expect(template).toEqual({
          id: resourceId,
          resourceTypeName: 'json',
          candidates: [
            {
              json: init,
              conditions,
              mergeMethod: 'replace',
              isPartial: false
            }
          ]
        });
      });
    });

    test('fails when init value is not a JSON object', () => {
      const rt = TsRes.ResourceTypes.JsonResourceType.create().orThrow();
      const invalidInit = 'not an object';

      expect(rt.createTemplate(resourceId, invalidInit)).toFailWith(
        /Invalid initial value.*must be JSON object/
      );
    });

    test('uses default template when init value is null', () => {
      const rt = TsRes.ResourceTypes.JsonResourceType.create().orThrow();
      const invalidInit = null;

      expect(rt.createTemplate(resourceId, invalidInit)).toSucceedAndSatisfy((template) => {
        expect(template.candidates![0].json).toEqual({}); // Should use default empty object
      });
    });

    test('uses default template when init value is undefined', () => {
      const rt = TsRes.ResourceTypes.JsonResourceType.create().orThrow();
      const invalidInit = undefined;

      expect(rt.createTemplate(resourceId, invalidInit)).toSucceedAndSatisfy((template) => {
        expect(template.candidates![0].json).toEqual({}); // Should use default empty object
      });
    });

    test('fails when init value is an array', () => {
      const rt = TsRes.ResourceTypes.JsonResourceType.create().orThrow();
      const invalidInit = ['not', 'an', 'object'];

      expect(rt.createTemplate(resourceId, invalidInit)).toFailWith(
        /Invalid initial value.*must be JSON object/
      );
    });

    test('fails when init value contains non-JSON-serializable content', () => {
      const rt = TsRes.ResourceTypes.JsonResourceType.create().orThrow();
      const invalidInit = { func: () => 'test' } as unknown as JsonObject;

      expect(rt.createTemplate(resourceId, invalidInit)).toFailWith(/invalid JSON object/);
    });
  });

  describe('template parameter in create method', () => {
    test('uses provided template as default for createTemplate calls', () => {
      const template = { defaultTitle: 'Default Template', version: 1 };
      const rt = TsRes.ResourceTypes.JsonResourceType.create({ template }).orThrow();
      const resourceId = 'test.resource' as TsRes.ResourceId;

      expect(rt.createTemplate(resourceId)).toSucceedAndSatisfy((result) => {
        expect(result).toEqual({
          id: resourceId,
          resourceTypeName: 'json',
          candidates: [
            {
              json: template,
              mergeMethod: 'replace',
              isPartial: false
            }
          ]
        });
      });
    });

    test('init value overrides template when provided', () => {
      const template = { defaultTitle: 'Default Template', version: 1 };
      const init = { title: 'Custom Title', data: 'test' };
      const rt = TsRes.ResourceTypes.JsonResourceType.create({ template }).orThrow();
      const resourceId = 'test.resource' as TsRes.ResourceId;

      expect(rt.createTemplate(resourceId, init)).toSucceedAndSatisfy((result) => {
        expect(result).toEqual({
          id: resourceId,
          resourceTypeName: 'json',
          candidates: [
            {
              json: init,
              mergeMethod: 'replace',
              isPartial: false
            }
          ]
        });
      });
    });

    test('works with custom key and template', () => {
      const template = { schema: 'v2', config: { enabled: true } };
      const rt = TsRes.ResourceTypes.JsonResourceType.create({ key: 'custom-json', template }).orThrow();
      const resourceId = 'test.resource' as TsRes.ResourceId;

      expect(rt.createTemplate(resourceId)).toSucceedAndSatisfy((result) => {
        expect(result).toEqual({
          id: resourceId,
          resourceTypeName: 'custom-json',
          candidates: [
            {
              json: template,
              mergeMethod: 'replace',
              isPartial: false
            }
          ]
        });
      });
    });
  });

  describe('getDefaultTemplateCandidate method', () => {
    test('returns default template candidate with empty object when no parameters', () => {
      const rt = TsRes.ResourceTypes.JsonResourceType.create().orThrow();

      expect(rt.getDefaultTemplateCandidate()).toSucceedAndSatisfy((candidate) => {
        expect(candidate).toEqual({
          json: {},
          mergeMethod: 'replace',
          isPartial: false
        });
      });
    });

    test('returns candidate with provided JSON', () => {
      const rt = TsRes.ResourceTypes.JsonResourceType.create().orThrow();
      const json = { test: 'value', number: 123 };

      expect(rt.getDefaultTemplateCandidate(json)).toSucceedAndSatisfy((candidate) => {
        expect(candidate).toEqual({
          json,
          mergeMethod: 'replace',
          isPartial: false
        });
      });
    });

    test('returns candidate with conditions when provided', () => {
      const rt = TsRes.ResourceTypes.JsonResourceType.create().orThrow();
      const json = { localized: true };
      const conditions = { language: 'fr', region: 'CA' };

      expect(rt.getDefaultTemplateCandidate(json, conditions)).toSucceedAndSatisfy((candidate) => {
        expect(candidate).toEqual({
          json,
          conditions,
          mergeMethod: 'replace',
          isPartial: false
        });
      });
    });

    test('uses constructor template when no JSON provided', () => {
      const template = { fromConstructor: true, id: 'default' };
      const rt = TsRes.ResourceTypes.JsonResourceType.create({ template }).orThrow();

      expect(rt.getDefaultTemplateCandidate()).toSucceedAndSatisfy((candidate) => {
        expect(candidate).toEqual({
          json: template,
          mergeMethod: 'replace',
          isPartial: false
        });
      });
    });

    test('fails for invalid JSON values', () => {
      const rt = TsRes.ResourceTypes.JsonResourceType.create().orThrow();
      const invalidJson = 'not an object';

      expect(rt.getDefaultTemplateCandidate(invalidJson)).toFailWith(
        /Invalid initial value.*must be JSON object/
      );
    });
  });
});
