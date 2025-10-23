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

describe('CandidateReducer Integration Tests', () => {
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
        { name: 'environment', typeName: 'literal', defaultPriority: 80 }
      ]
    }).orThrow();

    const resourceTypes = TsRes.ResourceTypes.ResourceTypeCollector.create({
      resourceTypes: [TsRes.ResourceTypes.JsonResourceType.create({ key: 'json' }).orThrow()]
    }).orThrow();

    resourceManager = TsRes.Resources.ResourceManagerBuilder.create({
      qualifiers,
      resourceTypes
    }).orThrow();
  });

  describe('Resource.toLooseResourceDecl with candidate reduction', () => {
    test('integrates candidate reduction successfully', () => {
      resourceManager
        .addResource({
          id: 'test.message',
          resourceTypeName: 'json',
          candidates: [
            {
              json: { text: 'Hello US' },
              conditions: { language: 'en', territory: 'US' }
            },
            {
              json: { text: 'Hello GB' },
              conditions: { language: 'en', territory: 'GB' }
            }
          ]
        })
        .orThrow();

      const resource = resourceManager.getBuiltResource('test.message').orThrow();
      const filterContext = resourceManager.validateContext({ language: 'en' }).orThrow();

      const declaration = resource.toLooseResourceDecl({
        filterForContext: filterContext,
        reduceQualifiers: true
      });

      expect(declaration.candidates).toHaveLength(2);
      // Language should be reduced since both candidates match 'en' perfectly
      declaration.candidates?.forEach((candidate) => {
        expect(candidate.conditions).not.toHaveProperty('language');
        expect(candidate.conditions).toHaveProperty('territory');
      });
    });
  });

  describe('ResourceManager.clone with candidate reduction', () => {
    test('clones with reduction applied correctly', () => {
      resourceManager
        .addResource({
          id: 'test.config',
          resourceTypeName: 'json',
          candidates: [
            {
              json: { setting: 'prod-value' },
              conditions: { environment: 'production' }
            },
            {
              json: { setting: 'dev-value' },
              conditions: { environment: 'development' }
            }
          ]
        })
        .orThrow();

      const filterContext = resourceManager.validateContext({ environment: 'production' }).orThrow();

      expect(
        resourceManager.clone({
          filterForContext: filterContext,
          reduceQualifiers: true
        })
      ).toSucceedAndSatisfy((clonedManager) => {
        const clonedResource = clonedManager.getBuiltResource('test.config').orThrow();

        // Should have only the production candidate
        expect(clonedResource.candidates).toHaveLength(1);
        expect(clonedResource.candidates[0].json).toEqual({ setting: 'prod-value' });

        // Environment qualifier should be reduced since only production candidates remain
        expect(Object.keys(clonedResource.candidates[0].conditions.conditions)).toHaveLength(0);
      });
    });
  });

  describe('Smart collision resolution through public APIs', () => {
    test('demonstrates smart collision resolution via Resource.toLooseResourceDecl', () => {
      resourceManager
        .addResource({
          id: 'collision.test',
          resourceTypeName: 'json',
          candidates: [
            {
              json: { message: 'Default' }
              // No conditions - unconditional candidate
            },
            {
              json: { message: 'Specific' },
              conditions: { environment: 'prod' }
            }
          ]
        })
        .orThrow();

      const resource = resourceManager.getBuiltResource('collision.test').orThrow();
      const filterContext = resourceManager.validateContext({ environment: 'prod' }).orThrow();

      const declaration = resource.toLooseResourceDecl({
        filterForContext: filterContext,
        reduceQualifiers: true
      });

      // Smart collision resolution should result in the specific candidate winning
      expect(declaration.candidates).toHaveLength(1);
      expect(declaration.candidates?.[0]?.json).toEqual({ message: 'Specific' });
      expect(Object.keys(declaration.candidates?.[0]?.conditions || {})).toHaveLength(0);
    });
  });
});
