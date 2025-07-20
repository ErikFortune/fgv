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

describe('reduceQualifiers functionality', () => {
  let resourceManager: TsRes.Resources.ResourceManagerBuilder;

  beforeEach(() => {
    const qualifierTypes = TsRes.QualifierTypes.QualifierTypeCollector.create({
      qualifierTypes: [
        TsRes.QualifierTypes.LanguageQualifierType.create().orThrow(),
        TsRes.QualifierTypes.TerritoryQualifierType.create().orThrow(),
        TsRes.QualifierTypes.LiteralQualifierType.create().orThrow()
      ]
    }).orThrow();

    const qualifiers = TsRes.Qualifiers.QualifierCollector.create({
      qualifierTypes,
      qualifiers: [
        { name: 'language', typeName: 'language', defaultPriority: 100 },
        { name: 'territory', typeName: 'territory', defaultPriority: 90 },
        { name: 'variant', typeName: 'literal', defaultPriority: 80 }
      ]
    }).orThrow();

    const resourceTypes = TsRes.ResourceTypes.ResourceTypeCollector.create({
      resourceTypes: [TsRes.ResourceTypes.JsonResourceType.create({ key: 'string' }).orThrow()]
    }).orThrow();

    resourceManager = TsRes.Resources.ResourceManagerBuilder.create({
      qualifiers,
      resourceTypes
    }).orThrow();
  });

  describe('basic positive functionality', () => {
    test('reduces qualifiers that match perfectly across all candidates', () => {
      // Add a resource with candidates that all match language=en perfectly
      resourceManager
        .addResource({
          id: 'test.greeting',
          resourceTypeName: 'string',
          candidates: [
            {
              json: { message: 'Hello' },
              conditions: { language: 'en', territory: 'US' }
            },
            {
              json: { message: 'Hello' },
              conditions: { language: 'en', territory: 'GB' }
            }
          ]
        })
        .orThrow();

      const filterContext = { language: 'en' };
      const validatedContext = resourceManager.validateContext(filterContext).orThrow();

      // Get resource with reduceQualifiers enabled
      const resource = resourceManager.getBuiltResource('test.greeting').orThrow();
      const declaration = resource.toLooseResourceDecl({
        filterForContext: validatedContext,
        reduceQualifiers: true
      });

      // Language should be reduced (removed) since both candidates match language=en perfectly
      expect(declaration.candidates).toHaveLength(2);

      // Both candidates should have language removed but territory preserved
      declaration.candidates?.forEach((candidate) => {
        expect(candidate.conditions).toHaveProperty('territory');
        expect(candidate.conditions).not.toHaveProperty('language');
      });
    });

    test('preserves qualifiers that do not match perfectly across all candidates', () => {
      // Add a resource where language match is relevant
      resourceManager
        .addResource({
          id: 'test.greeting',
          resourceTypeName: 'string',
          candidates: [
            {
              json: { message: 'Hello' },
              conditions: { language: 'en-US', territory: 'US' }
            },
            {
              json: { message: 'Hello' },
              conditions: { language: 'en-GB', territory: 'GB' }
            }
          ]
        })
        .orThrow();

      // Filter with only language - for this resource, language should be preserved
      // because en-US and en-GB are imperfect matches for the context.
      const filterContext = { language: 'en' };
      const validatedContext = resourceManager.validateContext(filterContext).orThrow();

      const resource = resourceManager.getBuiltResource('test.greeting').orThrow();
      const declaration = resource.toLooseResourceDecl({
        filterForContext: validatedContext,
        reduceQualifiers: true
      });

      expect(declaration.candidates).toHaveLength(2); // Both candidates match language=en

      // Language should not be reduced because the candidates are imperfect matches
      // Territory should be preserved - not in the filter context
      declaration.candidates?.forEach((candidate) => {
        expect(candidate.conditions).toHaveProperty('territory'); // Territory preserved
        expect(candidate.conditions).toHaveProperty('language'); // Language not reduced
      });
    });
  });

  describe('basic negative functionality', () => {
    test('does not reduce qualifiers when reduceQualifiers is false', () => {
      resourceManager
        .addResource({
          id: 'test.greeting',
          resourceTypeName: 'string',
          candidates: [
            {
              json: { message: 'Hello' },
              conditions: { language: 'en', territory: 'US' }
            }
          ]
        })
        .orThrow();

      const filterContext = { language: 'en' };
      const validatedContext = resourceManager.validateContext(filterContext).orThrow();

      const resource = resourceManager.getBuiltResource('test.greeting').orThrow();
      const declaration = resource.toLooseResourceDecl({
        filterForContext: validatedContext,
        reduceQualifiers: false
      });

      // All qualifiers should be preserved when reduceQualifiers is false
      const candidate = declaration.candidates?.[0];
      expect(candidate?.conditions).toHaveProperty('language', 'en');
      expect(candidate?.conditions).toHaveProperty('territory', 'US');
    });

    test('does not reduce qualifiers when filterForContext is not provided', () => {
      resourceManager
        .addResource({
          id: 'test.greeting',
          resourceTypeName: 'string',
          candidates: [
            {
              json: { message: 'Hello' },
              conditions: { language: 'en', territory: 'US' }
            }
          ]
        })
        .orThrow();

      const resource = resourceManager.getBuiltResource('test.greeting').orThrow();
      const declaration = resource.toLooseResourceDecl({
        reduceQualifiers: true
        // No filterForContext provided
      });

      // All qualifiers should be preserved when no filterForContext
      const candidate = declaration.candidates?.[0];
      expect(candidate?.conditions).toHaveProperty('language', 'en');
      expect(candidate?.conditions).toHaveProperty('territory', 'US');
    });

    test('does not reduce qualifiers that are not in the filter context', () => {
      resourceManager
        .addResource({
          id: 'test.greeting',
          resourceTypeName: 'string',
          candidates: [
            {
              json: { message: 'Hey' },
              conditions: { language: 'en', variant: 'casual' }
            },
            {
              json: { message: 'Hello' },
              conditions: { language: 'en', variant: 'formal' }
            }
          ]
        })
        .orThrow();

      // Filter context only includes language, not variant
      const filterContext = { language: 'en' };
      const validatedContext = resourceManager.validateContext(filterContext).orThrow();

      const resource = resourceManager.getBuiltResource('test.greeting').orThrow();
      const declaration = resource.toLooseResourceDecl({
        filterForContext: validatedContext,
        reduceQualifiers: true
      });

      expect(declaration.candidates).toHaveLength(2);

      // Language should be reduced (all candidates match en)
      // Variant should be preserved (not in filter context)
      declaration.candidates?.forEach((candidate) => {
        expect(candidate.conditions).not.toHaveProperty('language');
        expect(candidate.conditions).toHaveProperty('variant');
      });
    });
  });

  describe('toChildResourceDecl with reduceQualifiers', () => {
    test('reduces qualifiers in child resource declarations', () => {
      resourceManager
        .addResource({
          id: 'test.greeting',
          resourceTypeName: 'string',
          candidates: [
            {
              json: { message: 'Hello' },
              conditions: { language: 'en', territory: 'US' }
            },
            {
              json: { message: 'Hello' },
              conditions: { language: 'en', territory: 'GB' }
            }
          ]
        })
        .orThrow();

      const filterContext = { language: 'en' };
      const validatedContext = resourceManager.validateContext(filterContext).orThrow();

      const resource = resourceManager.getBuiltResource('test.greeting').orThrow();
      const childDeclaration = resource.toChildResourceDecl({
        filterForContext: validatedContext,
        reduceQualifiers: true
      });

      // Should have resource type name in child declaration
      expect(childDeclaration.resourceTypeName).toBe('string');
      expect(childDeclaration.candidates).toHaveLength(2);

      // Language should be reduced (all candidates match 'en' perfectly)
      // Territory should be preserved (differs between candidates)
      childDeclaration.candidates?.forEach((candidate) => {
        expect(candidate.conditions).toHaveProperty('territory');
        expect(candidate.conditions).not.toHaveProperty('language');
      });
    });

    test('preserves qualifiers in child declarations when reduceQualifiers is false', () => {
      resourceManager
        .addResource({
          id: 'test.greeting',
          resourceTypeName: 'string',
          candidates: [
            {
              json: { message: 'Hello' },
              conditions: { language: 'en', territory: 'US' }
            }
          ]
        })
        .orThrow();

      const filterContext = { language: 'en' };
      const validatedContext = resourceManager.validateContext(filterContext).orThrow();

      const resource = resourceManager.getBuiltResource('test.greeting').orThrow();
      const childDeclaration = resource.toChildResourceDecl({
        filterForContext: validatedContext,
        reduceQualifiers: false
      });

      expect(childDeclaration.resourceTypeName).toBe('string');
      expect(childDeclaration.candidates).toHaveLength(1);

      // All qualifiers should be preserved when reduceQualifiers is false
      const candidate = childDeclaration.candidates?.[0];
      expect(candidate?.conditions).toHaveProperty('language', 'en');
      expect(candidate?.conditions).toHaveProperty('territory', 'US');
    });
  });

  describe('findReducibleQualifiers static method', () => {
    test('returns correct set of reducible qualifiers', () => {
      // Create candidates manually for direct testing
      const qualifiers = resourceManager.qualifiers;
      const resourceTypes = resourceManager.resourceTypes;
      const conditionSets = TsRes.Conditions.ConditionSetCollector.create({
        conditions: TsRes.Conditions.ConditionCollector.create({ qualifiers }).orThrow()
      }).orThrow();

      const decl1 = { json: { value: 'value1' }, conditions: { language: 'en', territory: 'US' } };
      const decl2 = { json: { value: 'value2' }, conditions: { language: 'en', territory: 'GB' } };

      const candidates = [
        TsRes.Resources.ResourceCandidate.create({
          id: 'candidate1',
          conditionSets,
          resourceType: resourceTypes.validating.get('string' as TsRes.ResourceTypeName).orThrow(),
          decl: decl1
        }).orThrow(),
        TsRes.Resources.ResourceCandidate.create({
          id: 'candidate2',
          conditionSets,
          resourceType: resourceTypes.validating.get('string' as TsRes.ResourceTypeName).orThrow(),
          decl: decl2
        }).orThrow()
      ];

      const filterContext = resourceManager.validateContext({ language: 'en' }).orThrow();
      const reducible = TsRes.Resources.ResourceCandidate.findReducibleQualifiers(candidates, filterContext);

      // Language should be reducible (both candidates match 'en' perfectly)
      expect(reducible).toBeDefined();
      expect(reducible?.has('language' as TsRes.QualifierName)).toBe(true);
    });

    test('returns undefined when no qualifiers are reducible', () => {
      const qualifiers = resourceManager.qualifiers;
      const resourceTypes = resourceManager.resourceTypes;
      const conditionSets = TsRes.Conditions.ConditionSetCollector.create({
        conditions: TsRes.Conditions.ConditionCollector.create({ qualifiers }).orThrow()
      }).orThrow();

      const decl1 = { json: { value: 'value1' }, conditions: { language: 'en', territory: 'US' } };
      const decl2 = { json: { value: 'value2' }, conditions: { language: 'fr', territory: 'US' } };

      const candidates = [
        TsRes.Resources.ResourceCandidate.create({
          id: 'candidate1',
          conditionSets,
          resourceType: resourceTypes.validating.get('string' as TsRes.ResourceTypeName).orThrow(),
          decl: decl1
        }).orThrow(),
        TsRes.Resources.ResourceCandidate.create({
          id: 'candidate2',
          conditionSets,
          resourceType: resourceTypes.validating.get('string' as TsRes.ResourceTypeName).orThrow(),
          decl: decl2
        }).orThrow()
      ];

      const filterContext = resourceManager.validateContext({ language: 'en' }).orThrow();
      const reducible = TsRes.Resources.ResourceCandidate.findReducibleQualifiers(candidates, filterContext);

      // No qualifiers should be reducible (language differs between candidates)
      expect(reducible).toBeUndefined();
    });
  });
});
