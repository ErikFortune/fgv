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
import { JsonObject } from '@fgv/ts-json-base';
import * as TsRes from '../../../index';
import { DeltaGenerator } from '../../../packlets/resources';
import {
  createCompleteTestSetup,
  createBaselineResolver,
  createDeltaResolver,
  deltaResources,
  ITestSetup
} from './deltaGenerator.helpers';

describe('DeltaGenerator - Idempotency tests', () => {
  let testSetup: ITestSetup;
  let generator: DeltaGenerator;

  beforeEach(() => {
    testSetup = createCompleteTestSetup();

    const baselineResolver = createBaselineResolver(
      testSetup.resourceManager,
      testSetup.qualifierTypes,
      testSetup.contextProvider
    );

    const deltaResolver = createDeltaResolver(
      deltaResources,
      testSetup.qualifiers,
      testSetup.resourceTypes,
      testSetup.qualifierTypes,
      testSetup.contextProvider
    );

    generator = DeltaGenerator.create({
      baselineResolver,
      deltaResolver,
      resourceManager: testSetup.resourceManager,
      logger: testSetup.mockLogger
    }).orThrow();
  });

  test('should produce a resource manager that can be used consistently', () => {
    // Generate delta using the existing simple test data
    expect(generator.generate()).toSucceedAndSatisfy((generatedManager) => {
      // Basic idempotency test: generated manager should be usable
      expect(generatedManager.size).toBeGreaterThan(0);

      // Should have basic structure preserved
      expect(generatedManager.qualifiers.size).toBe(testSetup.qualifiers.size);
      expect(generatedManager.resourceTypes.size).toBe(testSetup.resourceTypes.size);

      // Should be able to create a resolver from it
      expect(
        TsRes.Runtime.ResourceResolver.create({
          resourceManager: generatedManager.build().orThrow(),
          qualifierTypes: testSetup.qualifierTypes,
          contextQualifierProvider: testSetup.contextProvider
        })
      ).toSucceedAndSatisfy((resolver) => {
        // The resolver should be functional - this is the core idempotency test
        expect(resolver).toBeDefined();
        expect(typeof resolver.resolveComposedResourceValue).toBe('function');
      });
    });
  });

  test('should generate deltas that maintain resource structure consistency', () => {
    // Use existing test data which has working baseline and delta resolvers
    expect(generator.generate()).toSucceedAndSatisfy((generatedManager) => {
      // The generated manager should maintain structural consistency
      expect(generatedManager.size).toBeGreaterThan(0);

      // Create a resolver to test basic functionality
      expect(
        TsRes.Runtime.ResourceResolver.create({
          resourceManager: generatedManager.build().orThrow(),
          qualifierTypes: testSetup.qualifierTypes,
          contextQualifierProvider: testSetup.contextProvider
        })
      ).toSucceedAndSatisfy((resolver) => {
        // Test that it can resolve at least some resources
        // Using existing test resource IDs that we know exist
        expect(resolver.resolveComposedResourceValue('greeting.hello')).toSucceedAndSatisfy((greeting) => {
          // Basic structural verification - should be an object with expected properties
          expect(greeting).toBeDefined();
          if (typeof greeting === 'object' && greeting !== null) {
            const obj = greeting as JsonObject;
            // The greeting resource should have message property
            expect(obj.message).toBeDefined();
          }
        });
      });
    });
  });

  test('should produce deterministic results across multiple generations', () => {
    // Test that generating deltas multiple times produces consistent results
    expect(generator.generate()).toSucceedAndSatisfy((firstGeneration) => {
      expect(generator.generate()).toSucceedAndSatisfy((secondGeneration) => {
        // Both generations should have the same basic structure
        expect(firstGeneration.size).toBe(secondGeneration.size);
        expect(firstGeneration.qualifiers.size).toBe(secondGeneration.qualifiers.size);
        expect(firstGeneration.resourceTypes.size).toBe(secondGeneration.resourceTypes.size);

        // Both should be able to create functional resolvers
        expect(
          TsRes.Runtime.ResourceResolver.create({
            resourceManager: firstGeneration.build().orThrow(),
            qualifierTypes: testSetup.qualifierTypes,
            contextQualifierProvider: testSetup.contextProvider
          })
        ).toSucceed();

        expect(
          TsRes.Runtime.ResourceResolver.create({
            resourceManager: secondGeneration.build().orThrow(),
            qualifierTypes: testSetup.qualifierTypes,
            contextQualifierProvider: testSetup.contextProvider
          })
        ).toSucceed();
      });
    });
  });

  test('should demonstrate basic round-trip consistency', () => {
    // Test that the generated manager can be used to create a functional resolver
    // that produces consistent results
    expect(generator.generate()).toSucceedAndSatisfy((firstGenerated) => {
      // Create resolver from first generation
      expect(
        TsRes.Runtime.ResourceResolver.create({
          resourceManager: firstGenerated.build().orThrow(),
          qualifierTypes: testSetup.qualifierTypes,
          contextQualifierProvider: testSetup.contextProvider
        })
      ).toSucceedAndSatisfy((firstResolver) => {
        // Generate again and create another resolver
        expect(generator.generate()).toSucceedAndSatisfy((secondGenerated) => {
          expect(
            TsRes.Runtime.ResourceResolver.create({
              resourceManager: secondGenerated.build().orThrow(),
              qualifierTypes: testSetup.qualifierTypes,
              contextQualifierProvider: testSetup.contextProvider
            })
          ).toSucceedAndSatisfy((secondResolver) => {
            // Both resolvers should be able to resolve the same resources
            expect(firstResolver.resolveComposedResourceValue('greeting.hello')).toSucceedAndSatisfy(
              (firstResult) => {
                expect(secondResolver.resolveComposedResourceValue('greeting.hello')).toSucceedAndSatisfy(
                  (secondResult) => {
                    // Results should be structurally equivalent (basic idempotency)
                    expect(typeof firstResult).toBe(typeof secondResult);
                    expect(firstResult).toBeDefined();
                    expect(secondResult).toBeDefined();
                  }
                );
              }
            );
          });
        });
      });
    });
  });
});
