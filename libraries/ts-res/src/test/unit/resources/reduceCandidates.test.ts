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

describe('reduceCandidates collision detection', () => {
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
        { name: 'language', typeName: 'language', defaultPriority: 600 },
        { name: 'territory', typeName: 'territory', defaultPriority: 700 }
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

  describe('collision between reduced and existing candidates', () => {
    test('should successfully create resource with unconditional and conditional candidates', () => {
      // Add a resource with two candidates: one unconditional, one conditional
      resourceManager
        .addResource({
          id: 'test.message',
          resourceTypeName: 'json',
          candidates: [
            {
              json: { text: 'Default message' }
              // No conditions - unconditional candidate
            },
            {
              json: { text: 'US message' },
              conditions: { territory: 'US' }
            }
          ]
        })
        .orThrow();

      expect(resourceManager.build()).toSucceed();
    });

    test('should successfully clone with territory=US filter and reduce=false', () => {
      // Add the same resource with unconditional and conditional candidates
      resourceManager
        .addResource({
          id: 'test.message',
          resourceTypeName: 'json',
          candidates: [
            {
              json: { text: 'Default message' }
              // No conditions - unconditional candidate
            },
            {
              json: { text: 'US message' },
              conditions: { territory: 'US' }
            }
          ]
        })
        .orThrow();

      resourceManager.build().orThrow();

      const filterContext = resourceManager.validateContext({ territory: 'US' }).orThrow();

      // Clone with filter but no reduction should succeed
      expect(
        resourceManager.clone({
          filterForContext: filterContext,
          reduceQualifiers: false
        })
      ).toSucceedAndSatisfy((clonedManager) => {
        expect(clonedManager.build()).toSucceed();

        // Verify the built results are identical to the original
        const originalResource = resourceManager.getBuiltResource('test.message').orThrow();
        const clonedResource = clonedManager.getBuiltResource('test.message').orThrow();

        expect(clonedResource.candidates).toHaveLength(originalResource.candidates.length);
      });
    });

    test('should fail when cloning with territory=US filter and reduce=true (collision bug)', () => {
      // Add the same resource with unconditional and conditional candidates
      resourceManager
        .addResource({
          id: 'test.message',
          resourceTypeName: 'json',
          candidates: [
            {
              json: { text: 'Default message' }
              // No conditions - unconditional candidate
            },
            {
              json: { text: 'US message' },
              conditions: { territory: 'US' }
            }
          ]
        })
        .orThrow();

      resourceManager.build().orThrow();

      const filterContext = resourceManager.validateContext({ territory: 'US' }).orThrow();

      // This should fail due to collision between reduced and existing candidates
      // The bug: when reducing qualifiers, the conditional candidate { territory: 'US' }
      // becomes unconditional {}, which collides with the existing unconditional candidate
      expect(
        resourceManager.clone({
          filterForContext: filterContext,
          reduceQualifiers: true
        })
      ).toFailWith(/conflicting candidates/i);
    });
  });
});
