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
import { DeltaGenerator } from '../../../packlets/resources';
import { createCompleteTestSetup, ITestSetup } from './deltaGenerator.helpers';

// TODO: Delete merge type tests - these are placeholders for future functionality
// Delete merge type is not yet implemented in ts-res, so these tests are expected to fail
describe('DeltaGenerator - Delete merge type placeholder tests (expected to fail)', () => {
  let testSetup: ITestSetup;

  beforeEach(() => {
    testSetup = createCompleteTestSetup();
  });

  test.failing('should use delete merge type for deleted resources when implemented', () => {
    // This test is a placeholder for when delete merge type is implemented
    // Currently, deletions are handled using 'augment' with null values

    const deletedResourceData: TsRes.ResourceJson.Json.ILooseResourceCandidateDecl[] = [
      {
        id: 'greeting.hello',
        json: { message: 'Hello' },
        conditions: { language: 'en' },
        resourceTypeName: 'json'
      }
    ];

    // Create manager with a resource that will be "deleted" in delta context
    const managerWithResourceResult = testSetup.resourceManager.clone({ candidates: deletedResourceData });
    expect(managerWithResourceResult).toSucceed();

    const managerWithResource = managerWithResourceResult.orThrow();

    // Create baseline resolver (has the resource)
    const baselineResolverResult = TsRes.Runtime.ResourceResolver.create({
      resourceManager: managerWithResource.build().orThrow(),
      qualifierTypes: testSetup.qualifierTypes,
      contextQualifierProvider: testSetup.contextProvider
    });
    expect(baselineResolverResult).toSucceed();

    const baselineResolver = baselineResolverResult.orThrow();

    // Create delta resolver (resource should be "deleted" - not resolvable)
    // In the future, this should create a candidate with mergeMethod: 'delete'
    const deltaResolver = baselineResolver; // Placeholder - would be different in real scenario

    const generatorResult = DeltaGenerator.create({
      resourceManager: managerWithResource,
      baselineResolver,
      deltaResolver,
      logger: testSetup.mockLogger
    });
    expect(generatorResult).toSucceed();

    const generator = generatorResult.orThrow();
    const deltaResult = generator.generate();
    expect(deltaResult).toSucceed();

    const deltaManager = deltaResult.orThrow();

    // In the future, this should verify that a candidate was created with mergeMethod: 'delete'
    // For now, this test will fail because delete merge type is not implemented
    const resource = deltaManager.getBuiltResource('greeting.hello');
    expect(resource).toSucceedAndSatisfy((builtResource) => {
      // This would check for a candidate with mergeMethod: 'delete' when implemented
      const deleteCandidates = builtResource.candidates.filter(
        (c) => c.mergeMethod === ('delete' as unknown as 'replace') // Cast needed since 'delete' is invalid merge method yet
      );
      expect(deleteCandidates).toHaveLength(1); // This will fail - delete merge type not implemented
    });
  });

  test.failing('should properly handle resource deletion with delete merge type', () => {
    // Another placeholder test for delete merge type functionality

    // Create a scenario where a resource exists in baseline but should be deleted in delta
    const resourceData: TsRes.ResourceJson.Json.ILooseResourceCandidateDecl[] = [
      {
        id: 'temp.resource',
        json: { value: 'temporary' },
        conditions: { language: 'en' },
        resourceTypeName: 'json'
      }
    ];

    const managerWithTempResource = testSetup.resourceManager.clone({ candidates: resourceData }).orThrow();

    const baselineResolver = TsRes.Runtime.ResourceResolver.create({
      resourceManager: managerWithTempResource.build().orThrow(),
      qualifierTypes: testSetup.qualifierTypes,
      contextQualifierProvider: testSetup.contextProvider
    }).orThrow();

    // In a real deletion scenario, delta resolver would not have this resource
    // or would have explicit deletion instructions
    const deltaResolver = TsRes.Runtime.ResourceResolver.create({
      resourceManager: testSetup.resourceManager.build().orThrow(), // No temp.resource here
      qualifierTypes: testSetup.qualifierTypes,
      contextQualifierProvider: testSetup.contextProvider
    }).orThrow();

    const generator = DeltaGenerator.create({
      resourceManager: managerWithTempResource,
      baselineResolver,
      deltaResolver,
      logger: testSetup.mockLogger
    }).orThrow();

    const deltaManager = generator.generate().orThrow();

    // When delete merge type is implemented, we should be able to verify
    // that the generated manager contains proper deletion candidates
    const deletedResource = deltaManager.getBuiltResource('temp.resource');
    expect(deletedResource).toSucceedAndSatisfy((resource) => {
      // This check will fail until delete merge type is implemented
      const hasDeleteCandidate = resource.candidates.some(
        (c) => (c as unknown as { mergeMethod: string }).mergeMethod === 'delete'
      );
      expect(hasDeleteCandidate).toBe(true); // Will fail - not implemented yet
    });
  });

  test.failing('should generate proper conditions for delete candidates', () => {
    // Placeholder test for verifying that delete candidates get proper conditions
    // derived from the delta resolver context

    const baselineData: TsRes.ResourceJson.Json.ILooseResourceCandidateDecl[] = [
      {
        id: 'conditional.resource',
        json: { message: 'Exists in baseline' },
        conditions: { language: 'en', territory: 'US' },
        resourceTypeName: 'json'
      }
    ];

    const baselineManager = testSetup.resourceManager.clone({ candidates: baselineData }).orThrow();
    const baselineResolver = TsRes.Runtime.ResourceResolver.create({
      resourceManager: baselineManager.build().orThrow(),
      qualifierTypes: testSetup.qualifierTypes,
      contextQualifierProvider: testSetup.contextProvider
    }).orThrow();

    // Delta context where this resource should be deleted
    const deltaResolver = TsRes.Runtime.ResourceResolver.create({
      resourceManager: testSetup.resourceManager.build().orThrow(), // Resource not present
      qualifierTypes: testSetup.qualifierTypes,
      contextQualifierProvider: testSetup.contextProvider
    }).orThrow();

    const generator = DeltaGenerator.create({
      resourceManager: baselineManager,
      baselineResolver,
      deltaResolver,
      logger: testSetup.mockLogger
    }).orThrow();

    const deltaManager = generator.generate().orThrow();

    // When implemented, delete candidates should have conditions matching delta context
    const resource = deltaManager.getBuiltResource('conditional.resource');
    expect(resource).toSucceedAndSatisfy((builtResource) => {
      const deleteCandidate = builtResource.candidates.find(
        (c) => (c as unknown as { mergeMethod: string }).mergeMethod === 'delete'
      );
      expect(deleteCandidate).toBeDefined(); // Will fail - delete not implemented

      // When implemented, should verify conditions are extracted from delta context
      if (deleteCandidate) {
        expect(deleteCandidate.conditions).toBeDefined();
        // Would check specific condition values extracted from delta resolver context
      }
    });
  });
});
