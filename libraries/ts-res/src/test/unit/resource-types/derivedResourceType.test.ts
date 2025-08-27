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
import { JsonValue } from '@fgv/ts-json-base';
import { succeed, fail, Result } from '@fgv/ts-utils';
import * as TsRes from '../../../index';
import { TestDerivedResourceType } from './testDerivedResourceType';

// Mock resource resolver for testing
class MockResourceResolver implements TsRes.IResourceResolver {
  private _resources: Map<string, JsonValue> = new Map();
  private _context: Record<string, string> = {};

  public constructor(resources?: Record<string, JsonValue>, context?: Record<string, string>) {
    if (resources) {
      Object.entries(resources).forEach(([key, value]) => {
        this._resources.set(key, value);
      });
    }
    this._context = context ?? {};
  }

  public resolveComposedResourceValue(resource: string): Result<JsonValue> {
    const value = this._resources.get(resource);
    if (value === undefined) {
      return fail(`Resource '${resource}' not found`);
    }
    return succeed(value);
  }

  public withContext(context: Record<string, string>): Result<TsRes.IResourceResolver> {
    return succeed(new MockResourceResolver(Object.fromEntries(this._resources.entries()), context));
  }

  public addResource(id: string, value: JsonValue): void {
    this._resources.set(id, value);
  }
}

describe('TestDerivedResourceType', () => {
  describe('creation and basic functionality', () => {
    test('creates with default parameters', () => {
      expect(TestDerivedResourceType.create()).toSucceedAndSatisfy((type) => {
        expect(type.key).toBe('test-derived');
        expect(type.index).toBeUndefined();
      });
    });

    test('creates with custom parameters', () => {
      const template = { title: 'Default Title', description: 'Default description' };
      expect(
        TestDerivedResourceType.create({
          key: 'custom-derived',
          index: 5,
          template,
          templateResourceId: 'base.template'
        })
      ).toSucceedAndSatisfy((type) => {
        expect(type.key).toBe('custom-derived');
        expect(type.index).toBe(5);
      });
    });

    test('fails for invalid key', () => {
      expect(TestDerivedResourceType.create({ key: 'invalid key' })).toFailWith(/invalid key/i);
    });
  });

  describe('validation functionality', () => {
    let resourceType: TestDerivedResourceType;

    beforeEach(() => {
      resourceType = TestDerivedResourceType.create().orThrow();
    });

    describe('validate method', () => {
      test('succeeds for valid full resource', () => {
        const validData = {
          title: 'Test Title',
          description: 'Test description',
          metadata: { version: 1, tags: ['test'] }
        };

        expect(resourceType.validate(validData, 'full')).toSucceedAndSatisfy((result) => {
          expect(result).toEqual(validData);
        });
      });

      test('succeeds for valid partial resource with only title', () => {
        const partialData = { title: 'Just Title' };

        expect(resourceType.validate(partialData, 'partial')).toSucceedAndSatisfy((result) => {
          expect(result).toEqual(partialData);
        });
      });

      test('succeeds for partial resource with optional fields', () => {
        const partialData = { description: 'Just description', metadata: { key: 'value' } };

        expect(resourceType.validate(partialData, 'partial')).toSucceedAndSatisfy((result) => {
          expect(result).toEqual(partialData);
        });
      });

      test('fails for full resource without title', () => {
        const invalidData = { description: 'No title' };

        expect(resourceType.validate(invalidData, 'full')).toFailWith(
          /title.*field is required.*non-empty string/
        );
      });

      test('fails for full resource with empty title', () => {
        const invalidData = { title: '   ', description: 'Empty title' };

        expect(resourceType.validate(invalidData, 'full')).toFailWith(
          /title.*field is required.*non-empty string/
        );
      });

      test('fails for non-object input', () => {
        expect(resourceType.validate('not an object', 'full')).toFailWith(/Expected JSON object.*got string/);
        expect(resourceType.validate(null, 'full')).toFailWith(/Expected JSON object.*got object/);
        expect(resourceType.validate(['array'], 'full')).toFailWith(/Expected JSON object.*got object/);
      });

      test('fails for invalid description type', () => {
        const invalidData = { title: 'Valid Title', description: 123 };

        expect(resourceType.validate(invalidData, 'full')).toFailWith(/description.*field must be a string/);
      });

      test('fails for invalid metadata type', () => {
        const invalidData = { title: 'Valid Title', metadata: 'not an object' };

        expect(resourceType.validate(invalidData, 'full')).toFailWith(/metadata.*field must be an object/);
      });

      test('fails for array metadata', () => {
        const invalidData = { title: 'Valid Title', metadata: ['array'] };

        expect(resourceType.validate(invalidData, 'full')).toFailWith(/metadata.*field must be an object/);
      });

      test('fails for null metadata', () => {
        const invalidData = { title: 'Valid Title', metadata: null };

        expect(resourceType.validate(invalidData, 'full')).toFailWith(/metadata.*field must be an object/);
      });
    });

    describe('validateDeclaration method', () => {
      test('succeeds for valid full declaration with replace merge method', () => {
        const props = {
          id: 'test.resource' as TsRes.ResourceId,
          json: { title: 'Test Title', description: 'Test description' },
          completeness: 'full' as const,
          mergeMethod: 'replace' as const
        };

        expect(resourceType.validateDeclaration(props)).toSucceedAndSatisfy((result) => {
          expect(result).toEqual({
            title: 'Test Title',
            description: 'Test description'
          });
        });
      });

      test('fails for full declaration with non-replace merge method', () => {
        const props = {
          id: 'test.resource' as TsRes.ResourceId,
          json: { title: 'Test Title' },
          completeness: 'full' as const,
          mergeMethod: 'augment' as const
        };

        expect(resourceType.validateDeclaration(props)).toFailWith(
          /Full candidates must use 'replace' merge method.*got 'augment'/
        );
      });

      test('succeeds for partial declaration with any merge method', () => {
        const props = {
          id: 'test.resource' as TsRes.ResourceId,
          json: { description: 'Partial description' },
          completeness: 'partial' as const,
          mergeMethod: 'augment' as const
        };

        expect(resourceType.validateDeclaration(props)).toSucceedAndSatisfy((result) => {
          expect(result).toEqual({ description: 'Partial description' });
        });
      });
    });
  });

  describe('template functionality', () => {
    describe('default template behavior', () => {
      test('creates template with empty object when no constructor template', () => {
        const resourceType = TestDerivedResourceType.create().orThrow();
        const resourceId = 'test.resource' as TsRes.ResourceId;

        expect(resourceType.createTemplate(resourceId)).toSucceedAndSatisfy((template) => {
          expect(template.id).toBe(resourceId);
          expect(template.resourceTypeName).toBe('test-derived');
          expect(template.candidates).toHaveLength(1);

          const candidate = template.candidates![0];
          expect(candidate.json).toEqual({}); // Default is empty object
          expect(candidate.mergeMethod).toBe('replace');
          expect(candidate.isPartial).toBe(true); // Empty object is considered partial
        });
      });

      test('creates template with provided init value', () => {
        const resourceType = TestDerivedResourceType.create().orThrow();
        const resourceId = 'test.resource' as TsRes.ResourceId;
        const init = { title: 'Custom Title', description: 'Custom description' };

        expect(resourceType.createTemplate(resourceId, init)).toSucceedAndSatisfy((template) => {
          expect(template.candidates![0].json).toEqual(init);
        });
      });

      test('creates template with conditions', () => {
        const resourceType = TestDerivedResourceType.create().orThrow();
        const resourceId = 'test.resource' as TsRes.ResourceId;
        const conditions = { language: 'en', region: 'US' };

        expect(resourceType.createTemplate(resourceId, undefined, conditions)).toSucceedAndSatisfy(
          (template) => {
            expect(template.candidates![0].conditions).toEqual(conditions);
          }
        );
      });
    });

    describe('constructor template behavior', () => {
      test('uses constructor template when no init provided and no template resource ID', () => {
        const template = { title: 'Constructor Template', metadata: { source: 'constructor' } };
        const resourceType = TestDerivedResourceType.create({ template }).orThrow();
        const resourceId = 'test.resource' as TsRes.ResourceId;

        expect(resourceType.createTemplate(resourceId)).toSucceedAndSatisfy((result) => {
          expect(result.candidates![0].json).toEqual(template);
        });
      });

      test('init value overrides constructor template', () => {
        const template = { title: 'Constructor Template', metadata: { source: 'constructor' } };
        const init = { title: 'Init Override', description: 'From init' };
        const resourceType = TestDerivedResourceType.create({ template }).orThrow();
        const resourceId = 'test.resource' as TsRes.ResourceId;

        expect(resourceType.createTemplate(resourceId, init)).toSucceedAndSatisfy((result) => {
          expect(result.candidates![0].json).toEqual(init);
        });
      });
    });

    describe('resource resolver template behavior', () => {
      test('resolves template from another resource when resolver provided', () => {
        const templateResourceValue = {
          title: 'Resolved Template',
          description: 'From another resource',
          metadata: { source: 'resolver' }
        };

        const resolver = new MockResourceResolver({
          'base.template': templateResourceValue
        });

        const resourceType = TestDerivedResourceType.create({
          templateResourceId: 'base.template'
        }).orThrow();
        const resourceId = 'test.resource' as TsRes.ResourceId;

        expect(resourceType.createTemplate(resourceId, undefined, undefined, resolver)).toSucceedAndSatisfy(
          (template) => {
            expect(template.candidates![0].json).toEqual(templateResourceValue);
          }
        );
      });

      test('fails when template resource cannot be resolved', () => {
        const resolver = new MockResourceResolver(); // Empty resolver
        const resourceType = TestDerivedResourceType.create({
          templateResourceId: 'missing.template'
        }).orThrow();
        const resourceId = 'test.resource' as TsRes.ResourceId;

        expect(resourceType.createTemplate(resourceId, undefined, undefined, resolver)).toFailWith(
          /Failed to resolve template resource 'missing.template'.*not found/
        );
      });

      test('fails when template resource ID configured but no resolver provided', () => {
        const resourceType = TestDerivedResourceType.create({
          templateResourceId: 'base.template'
        }).orThrow();
        const resourceId = 'test.resource' as TsRes.ResourceId;

        expect(resourceType.createTemplate(resourceId)).toFailWith(
          /Template resource ID 'base.template' is configured but no resolver provided/
        );
      });

      test('init value overrides resolved template', () => {
        const templateResourceValue = { title: 'Resolved Template', description: 'From resolver' };
        const init = { title: 'Init Override' };

        const resolver = new MockResourceResolver({
          'base.template': templateResourceValue
        });

        const resourceType = TestDerivedResourceType.create({
          templateResourceId: 'base.template'
        }).orThrow();
        const resourceId = 'test.resource' as TsRes.ResourceId;

        expect(resourceType.createTemplate(resourceId, init, undefined, resolver)).toSucceedAndSatisfy(
          (template) => {
            expect(template.candidates![0].json).toEqual(init);
          }
        );
      });

      test('resolver template works with conditions', () => {
        const templateResourceValue = { title: 'Localized Template', description: 'Localized content' };
        const conditions = { language: 'fr', region: 'CA' };

        const resolver = new MockResourceResolver({
          'localized.template': templateResourceValue
        });

        const resourceType = TestDerivedResourceType.create({
          templateResourceId: 'localized.template'
        }).orThrow();
        const resourceId = 'test.resource' as TsRes.ResourceId;

        expect(resourceType.createTemplate(resourceId, undefined, conditions, resolver)).toSucceedAndSatisfy(
          (template) => {
            expect(template.candidates![0].json).toEqual(templateResourceValue);
            expect(template.candidates![0].conditions).toEqual(conditions);
          }
        );
      });
    });

    describe('edge cases and error conditions', () => {
      test('creates partial resource when resolved template fails full validation', () => {
        // Resolver returns data that fails full validation but succeeds as partial
        const partialTemplateValue = { description: 'Missing title' }; // Full resource needs title

        const resolver = new MockResourceResolver({
          'partial.template': partialTemplateValue
        });

        const resourceType = TestDerivedResourceType.create({
          templateResourceId: 'partial.template'
        }).orThrow();
        const resourceId = 'test.resource' as TsRes.ResourceId;

        expect(resourceType.createTemplate(resourceId, undefined, undefined, resolver)).toSucceedAndSatisfy(
          (template) => {
            expect(template.candidates![0].json).toEqual(partialTemplateValue);
            expect(template.candidates![0].isPartial).toBe(true);
          }
        );
      });

      test('fails when resolved template is not a JSON object', () => {
        const nonObjectTemplate = 'not an object';

        const resolver = new MockResourceResolver({
          'invalid.template': nonObjectTemplate
        });

        const resourceType = TestDerivedResourceType.create({
          templateResourceId: 'invalid.template'
        }).orThrow();
        const resourceId = 'test.resource' as TsRes.ResourceId;

        expect(resourceType.createTemplate(resourceId, undefined, undefined, resolver)).toFailWith(
          /Invalid initial value.*must be JSON object/
        );
      });

      test('fails when resolved template has completely invalid data', () => {
        // This template will fail both full and partial validation
        const invalidTemplateValue = { description: 123, metadata: 'not an object' }; // Invalid types

        const resolver = new MockResourceResolver({
          'invalid.template': invalidTemplateValue
        });

        const resourceType = TestDerivedResourceType.create({
          templateResourceId: 'invalid.template'
        }).orThrow();
        const resourceId = 'test.resource' as TsRes.ResourceId;

        expect(resourceType.createTemplate(resourceId, undefined, undefined, resolver)).toFailWith(
          /description.*field must be a string/
        );
      });

      test('complex integration test with multiple template sources', () => {
        // Test scenario: constructor template, resolved template, and init override
        const constructorTemplate = { title: 'Constructor', metadata: { source: 'constructor' } };
        const resolvedTemplate = {
          title: 'Resolved',
          description: 'From resolver',
          metadata: { source: 'resolver' }
        };
        const initOverride = { title: 'Init Override', metadata: { source: 'init' } };

        const resolver = new MockResourceResolver({
          'base.template': resolvedTemplate
        });

        const resourceType = TestDerivedResourceType.create({
          template: constructorTemplate,
          templateResourceId: 'base.template'
        }).orThrow();
        const resourceId = 'test.resource' as TsRes.ResourceId;

        // Without init - should use resolved template
        expect(resourceType.createTemplate(resourceId, undefined, undefined, resolver)).toSucceedAndSatisfy(
          (template) => {
            expect(template.candidates![0].json).toEqual(resolvedTemplate);
          }
        );

        // With init - should use init override
        expect(
          resourceType.createTemplate(resourceId, initOverride, undefined, resolver)
        ).toSucceedAndSatisfy((template) => {
          expect(template.candidates![0].json).toEqual(initOverride);
        });

        // Without resolver - should fail (since templateResourceId is configured)
        expect(resourceType.createTemplate(resourceId)).toFailWith(
          /Template resource ID.*is configured but no resolver provided/
        );
      });
    });
  });
});
