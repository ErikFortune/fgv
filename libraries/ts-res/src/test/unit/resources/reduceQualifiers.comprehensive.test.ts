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

describe('reduceQualifiers comprehensive functionality', () => {
  let resourceManager: TsRes.Resources.ResourceManagerBuilder;

  beforeEach(() => {
    // Create a comprehensive qualifier system for testing
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
        { name: 'environment', typeName: 'literal', defaultPriority: 200 },
        { name: 'language', typeName: 'language', defaultPriority: 100 },
        { name: 'territory', typeName: 'territory', defaultPriority: 90 },
        { name: 'variant', typeName: 'literal', defaultPriority: 80 }
      ]
    }).orThrow();

    const resourceTypes = TsRes.ResourceTypes.ResourceTypeCollector.create({
      resourceTypes: [TsRes.ResourceTypes.JsonResourceType.create({ key: 'featureFlags' }).orThrow()]
    }).orThrow();

    resourceManager = TsRes.Resources.ResourceManagerBuilder.create({
      qualifiers,
      resourceTypes
    }).orThrow();
  });

  describe('feature flag environment scenario', () => {
    beforeEach(() => {
      // Simulate feature flags across different environments
      resourceManager
        .addResource({
          id: 'features.newDashboard',
          resourceTypeName: 'featureFlags',
          candidates: [
            {
              json: { enabled: false, rolloutPercent: 0 },
              conditions: { environment: 'production' }
            },
            {
              json: { enabled: true, rolloutPercent: 50 },
              conditions: { environment: 'integration' }
            },
            {
              json: { enabled: true, rolloutPercent: 100 },
              conditions: { environment: 'development' }
            }
          ]
        })
        .orThrow();

      resourceManager
        .addResource({
          id: 'features.betaAPI',
          resourceTypeName: 'featureFlags',
          candidates: [
            {
              json: { enabled: false, version: 'v1' },
              conditions: { environment: 'production' }
            },
            {
              json: { enabled: true, version: 'v2' },
              conditions: { environment: 'integration' }
            },
            {
              json: { enabled: true, version: 'v2-beta' },
              conditions: { environment: 'development' }
            }
          ]
        })
        .orThrow();

      resourceManager
        .addResource({
          id: 'features.debugMode',
          resourceTypeName: 'featureFlags',
          candidates: [
            {
              json: { enabled: false, logLevel: 'error' },
              conditions: { environment: 'production' }
            },
            {
              json: { enabled: true, logLevel: 'warn' },
              conditions: { environment: 'integration' }
            },
            {
              json: { enabled: true, logLevel: 'debug' },
              conditions: { environment: 'development' }
            }
          ]
        })
        .orThrow();
    });

    test('produces clean environment-specific bundles with reduced qualifiers', () => {
      const environmentFilter = { environment: 'production' };
      const validatedContext = resourceManager.validateContext(environmentFilter).orThrow();

      // Get production bundle with reduced qualifiers
      const productionResources = resourceManager
        .getAllResources()
        .map((builder) => builder.build().orThrow())
        .map((resource) =>
          resource.toLooseResourceDecl({
            filterForContext: validatedContext,
            reduceQualifiers: true
          })
        );

      // All resources should have exactly one candidate (production)
      productionResources.forEach((resource) => {
        expect(resource.candidates).toHaveLength(1);

        // Environment qualifier should be removed since all candidates match production perfectly
        const candidate = resource.candidates?.[0];
        expect(candidate?.conditions).not.toHaveProperty('environment');

        // The resulting bundle should be clean without environment noise
        expect(Object.keys(candidate?.conditions || {})).toHaveLength(0);
      });

      // Verify the feature values are correct for production
      const newDashboard = productionResources.find((r) => r.id === 'features.newDashboard');
      expect(newDashboard?.candidates?.[0]?.json).toEqual({ enabled: false, rolloutPercent: 0 });

      const betaAPI = productionResources.find((r) => r.id === 'features.betaAPI');
      expect(betaAPI?.candidates?.[0]?.json).toEqual({ enabled: false, version: 'v1' });

      const debugMode = productionResources.find((r) => r.id === 'features.debugMode');
      expect(debugMode?.candidates?.[0]?.json).toEqual({ enabled: false, logLevel: 'error' });
    });

    test('enables easy comparison between environment bundles', () => {
      // Get clean bundles for different environments
      const prodContext = resourceManager.validateContext({ environment: 'production' }).orThrow();
      const devContext = resourceManager.validateContext({ environment: 'development' }).orThrow();

      const prodBundle = resourceManager
        .getAllResources()
        .map((builder) => builder.build().orThrow())
        .map((resource) =>
          resource.toLooseResourceDecl({
            filterForContext: prodContext,
            reduceQualifiers: true
          })
        );

      const devBundle = resourceManager
        .getAllResources()
        .map((builder) => builder.build().orThrow())
        .map((resource) =>
          resource.toLooseResourceDecl({
            filterForContext: devContext,
            reduceQualifiers: true
          })
        );

      // Both bundles should have the same structure (no environment conditions)
      // making comparison of actual differences easy
      prodBundle.forEach((prodResource, index) => {
        const devResource = devBundle[index];

        expect(prodResource.id).toBe(devResource.id);
        expect(prodResource.candidates).toHaveLength(1);
        expect(devResource.candidates).toHaveLength(1);

        // Both should have no conditions (environment reduced)
        const prodCandidate = prodResource.candidates?.[0];
        const devCandidate = devResource.candidates?.[0];
        expect(Object.keys(prodCandidate?.conditions || {})).toHaveLength(0);
        expect(Object.keys(devCandidate?.conditions || {})).toHaveLength(0);

        // Only the JSON values should differ
        expect(prodCandidate?.json).not.toEqual(devCandidate?.json);
      });
    });

    test('preserves non-environment qualifiers when present', () => {
      // Add a resource with multiple qualifiers
      resourceManager
        .addResource({
          id: 'features.localized',
          resourceTypeName: 'featureFlags',
          candidates: [
            {
              json: { enabled: true, locale: 'en-US' },
              conditions: { environment: 'production', language: 'en', territory: 'US' }
            },
            {
              json: { enabled: true, locale: 'en-GB' },
              conditions: { environment: 'production', language: 'en', territory: 'GB' }
            },
            {
              json: { enabled: true, locale: 'fr-FR' },
              conditions: { environment: 'production', language: 'fr', territory: 'FR' }
            }
          ]
        })
        .orThrow();

      const environmentFilter = { environment: 'production' };
      const validatedContext = resourceManager.validateContext(environmentFilter).orThrow();

      const resource = resourceManager.getBuiltResource('features.localized').orThrow();
      const declaration = resource.toLooseResourceDecl({
        filterForContext: validatedContext,
        reduceQualifiers: true
      });

      expect(declaration.candidates).toHaveLength(3);

      // Environment should be reduced (all match production)
      // Language and territory should be preserved (they differ between candidates)
      declaration.candidates?.forEach((candidate) => {
        expect(candidate.conditions).not.toHaveProperty('environment');
        expect(candidate.conditions).toHaveProperty('language');
        expect(candidate.conditions).toHaveProperty('territory');
      });
    });
  });

  describe('complex multi-qualifier scenarios', () => {
    test('handles mixed perfect and imperfect matches correctly', () => {
      resourceManager
        .addResource({
          id: 'complex.resource',
          resourceTypeName: 'featureFlags',
          candidates: [
            {
              json: { value: 'A' },
              conditions: { environment: 'prod', language: 'en', territory: 'US' }
            },
            {
              json: { value: 'B' },
              conditions: { environment: 'prod', language: 'en', territory: 'GB' }
            },
            {
              json: { value: 'C' },
              conditions: { environment: 'prod', language: 'fr', territory: 'FR' }
            }
          ]
        })
        .orThrow();

      // Filter with environment and language
      const filterContext = { environment: 'prod', language: 'en' };
      const validatedContext = resourceManager.validateContext(filterContext).orThrow();

      const resource = resourceManager.getBuiltResource('complex.resource').orThrow();
      const declaration = resource.toLooseResourceDecl({
        filterForContext: validatedContext,
        reduceQualifiers: true
      });

      // Should filter to only en candidates (2 candidates)
      expect(declaration.candidates).toHaveLength(2);

      declaration.candidates?.forEach((candidate) => {
        // Environment should be reduced (all filtered candidates match 'prod' perfectly)
        expect(candidate.conditions).not.toHaveProperty('environment');

        // Language should be reduced (all filtered candidates match 'en' perfectly)
        expect(candidate.conditions).not.toHaveProperty('language');

        // Territory should be preserved (differs between filtered candidates: US vs GB)
        expect(candidate.conditions).toHaveProperty('territory');
      });
    });

    test('handles hierarchical language matching with reduction', () => {
      resourceManager
        .addResource({
          id: 'hierarchical.resource',
          resourceTypeName: 'featureFlags',
          candidates: [
            {
              json: { message: 'Hello US' },
              conditions: { language: 'en-US', territory: 'US' }
            },
            {
              json: { message: 'Hello Canada' },
              conditions: { language: 'en-CA', territory: 'CA' }
            },
            {
              json: { message: 'Hello Generic' },
              conditions: { language: 'en' }
            }
          ]
        })
        .orThrow();

      // Filter with broad language context
      const filterContext = { language: 'en' };
      const validatedContext = resourceManager.validateContext(filterContext).orThrow();

      const resource = resourceManager.getBuiltResource('hierarchical.resource').orThrow();
      const declaration = resource.toLooseResourceDecl({
        filterForContext: validatedContext,
        reduceQualifiers: true
      });

      // All candidates should match the broad 'en' filter
      expect(declaration.candidates).toHaveLength(3);

      declaration.candidates?.forEach((candidate) => {
        // Language should NOT be reduced because en-US, en-CA, and en are imperfect matches for 'en'
        expect(candidate.conditions).toHaveProperty('language');

        // Territory should be preserved where present
        if ('territory' in (candidate.conditions || {})) {
          expect(candidate.conditions).toHaveProperty('territory');
        }
      });
    });
  });

  describe('edge cases and boundary conditions', () => {
    test('handles resources with no matching candidates gracefully', () => {
      resourceManager
        .addResource({
          id: 'nomatch.resource',
          resourceTypeName: 'featureFlags',
          candidates: [
            {
              json: { value: 'test' },
              conditions: { environment: 'staging' }
            }
          ]
        })
        .orThrow();

      // Filter for production, but resource only has staging
      const filterContext = { environment: 'production' };
      const validatedContext = resourceManager.validateContext(filterContext).orThrow();

      const resource = resourceManager.getBuiltResource('nomatch.resource').orThrow();
      const declaration = resource.toLooseResourceDecl({
        filterForContext: validatedContext,
        reduceQualifiers: true
      });

      // No candidates should match the filter
      expect(declaration.candidates || []).toHaveLength(0);
    });

    test('handles single candidate resources', () => {
      resourceManager
        .addResource({
          id: 'single.resource',
          resourceTypeName: 'featureFlags',
          candidates: [
            {
              json: { value: 'only one' },
              conditions: { environment: 'prod', language: 'en' }
            }
          ]
        })
        .orThrow();

      const filterContext = { environment: 'prod', language: 'en' };
      const validatedContext = resourceManager.validateContext(filterContext).orThrow();

      const resource = resourceManager.getBuiltResource('single.resource').orThrow();
      const declaration = resource.toLooseResourceDecl({
        filterForContext: validatedContext,
        reduceQualifiers: true
      });

      expect(declaration.candidates).toHaveLength(1);

      // Both qualifiers should be reduced since the single candidate matches perfectly
      const candidate = declaration.candidates?.[0];
      expect(candidate?.conditions).not.toHaveProperty('environment');
      expect(candidate?.conditions).not.toHaveProperty('language');
      expect(Object.keys(candidate?.conditions || {})).toHaveLength(0);
    });

    test('handles candidates with no conditions (default candidates)', () => {
      resourceManager
        .addResource({
          id: 'default.resource',
          resourceTypeName: 'featureFlags',
          candidates: [
            {
              json: { value: 'default' }
              // No conditions - this is a default candidate
            },
            {
              json: { value: 'specific' },
              conditions: { environment: 'prod' }
            }
          ]
        })
        .orThrow();

      const filterContext = { environment: 'prod' };
      const validatedContext = resourceManager.validateContext(filterContext).orThrow();

      const resource = resourceManager.getBuiltResource('default.resource').orThrow();
      const declaration = resource.toLooseResourceDecl({
        filterForContext: validatedContext,
        reduceQualifiers: true
      });

      // Both candidates should match (default matches everything, specific matches prod)
      expect(declaration.candidates).toHaveLength(2);

      // Find the candidates
      const defaultCandidate = declaration.candidates?.find(
        (c) => (c.json as { value: string }).value === 'default'
      );
      const specificCandidate = declaration.candidates?.find(
        (c) => (c.json as { value: string }).value === 'specific'
      );

      // Default candidate should have no conditions
      expect(Object.keys(defaultCandidate?.conditions || {})).toHaveLength(0);

      // Specific candidate should have environment reduced
      expect(specificCandidate?.conditions).not.toHaveProperty('environment');
      expect(Object.keys(specificCandidate?.conditions || {})).toHaveLength(0);
    });

    test('handles filter context with qualifiers not present in candidates', () => {
      resourceManager
        .addResource({
          id: 'missing.qualifier.resource',
          resourceTypeName: 'featureFlags',
          candidates: [
            {
              json: { value: 'A' },
              conditions: { language: 'en' }
            },
            {
              json: { value: 'B' },
              conditions: { language: 'fr' }
            }
          ]
        })
        .orThrow();

      // Filter includes territory which isn't in any candidate
      const filterContext = { language: 'en', territory: 'US' };
      const validatedContext = resourceManager.validateContext(filterContext).orThrow();

      const resource = resourceManager.getBuiltResource('missing.qualifier.resource').orThrow();
      const declaration = resource.toLooseResourceDecl({
        filterForContext: validatedContext,
        reduceQualifiers: true
      });

      // Only the 'en' candidate should match
      expect(declaration.candidates).toHaveLength(1);

      const candidate = declaration.candidates?.[0];
      // Language should be reduced (single candidate matches 'en' perfectly)
      expect(candidate?.conditions).not.toHaveProperty('language');
      // Territory was never present in candidates, so it's not relevant
      expect(candidate?.conditions).not.toHaveProperty('territory');
    });

    test('handles malformed or corrupted filter context gracefully', () => {
      resourceManager
        .addResource({
          id: 'test.resource',
          resourceTypeName: 'featureFlags',
          candidates: [
            {
              json: { value: 'test' },
              conditions: { language: 'en' }
            }
          ]
        })
        .orThrow();

      // Try with empty filter context
      const emptyContext = resourceManager.validateContext({}).orThrow();

      const resource = resourceManager.getBuiltResource('test.resource').orThrow();
      const declaration = resource.toLooseResourceDecl({
        filterForContext: emptyContext,
        reduceQualifiers: true
      });

      // Should still work - no qualifiers to reduce
      expect(declaration.candidates).toHaveLength(1);
      const candidate = declaration.candidates?.[0];
      expect(candidate?.conditions).toHaveProperty('language', 'en');
    });
  });

  describe('integration with compilation and normalization', () => {
    beforeEach(() => {
      // Add diverse resources for integration testing
      resourceManager
        .addResource({
          id: 'integration.test1',
          resourceTypeName: 'featureFlags',
          candidates: [
            {
              json: { flag: 'value1' },
              conditions: { environment: 'prod', language: 'en' }
            }
          ]
        })
        .orThrow();

      resourceManager
        .addResource({
          id: 'integration.test2',
          resourceTypeName: 'featureFlags',
          candidates: [
            {
              json: { flag: 'value2' },
              conditions: { environment: 'prod', territory: 'US' }
            }
          ]
        })
        .orThrow();
    });

    test('works correctly with getResourceCollectionDecl', () => {
      const filterContext = { environment: 'prod' };
      const validatedContext = resourceManager.validateContext(filterContext).orThrow();

      const collection = resourceManager
        .getResourceCollectionDecl({
          filterForContext: validatedContext,
          reduceQualifiers: true
        })
        .orThrow();

      expect(collection.resources).toHaveLength(2);

      collection.resources?.forEach((resource) => {
        expect(resource.candidates).toHaveLength(1);
        const candidate = resource.candidates?.[0];

        // Environment should be reduced from all candidates
        expect(candidate?.conditions).not.toHaveProperty('environment');
      });
    });

    test('maintains consistent behavior with clone() method', () => {
      const filterContext = { environment: 'prod' };
      const validatedContext = resourceManager.validateContext(filterContext).orThrow();

      const clonedManager = resourceManager
        .clone({
          filterForContext: validatedContext,
          reduceQualifiers: true
        })
        .orThrow();

      const clonedCollection = clonedManager.getResourceCollectionDecl().orThrow();

      expect(clonedCollection.resources).toHaveLength(2);

      clonedCollection.resources?.forEach((resource) => {
        expect(resource.candidates).toHaveLength(1);
        const candidate = resource.candidates?.[0];

        // Environment should be reduced in the cloned manager
        expect(candidate?.conditions).not.toHaveProperty('environment');
      });
    });
  });

  describe('error conditions and validation', () => {
    test('handles invalid filter context gracefully', () => {
      resourceManager
        .addResource({
          id: 'test.resource',
          resourceTypeName: 'featureFlags',
          candidates: [
            {
              json: { value: 'test' },
              conditions: { language: 'en' }
            }
          ]
        })
        .orThrow();

      // Try with invalid language
      expect(resourceManager.validateContext({ language: 'invalid-lang-code' })).toFail();
    });

    test('preserves behavior when candidates have mixed condition types', () => {
      resourceManager
        .addResource({
          id: 'mixed.resource',
          resourceTypeName: 'featureFlags',
          candidates: [
            {
              json: { value: 'A' },
              conditions: { environment: 'prod' }
            },
            {
              json: { value: 'B' },
              conditions: { language: 'en', territory: 'US' }
            },
            {
              json: { value: 'C' },
              conditions: { environment: 'prod', variant: 'test' }
            }
          ]
        })
        .orThrow();

      const filterContext = { environment: 'prod' };
      const validatedContext = resourceManager.validateContext(filterContext).orThrow();

      const resource = resourceManager.getBuiltResource('mixed.resource').orThrow();
      const declaration = resource.toLooseResourceDecl({
        filterForContext: validatedContext,
        reduceQualifiers: true
      });

      // Should get candidates A, C (both match environment: prod) plus B (no environment condition, so matches by default)
      expect(declaration.candidates).toHaveLength(3);

      // Find the specific candidates
      const candidateA = declaration.candidates?.find((c) => (c.json as { value: string }).value === 'A');
      const candidateB = declaration.candidates?.find((c) => (c.json as { value: string }).value === 'B');
      const candidateC = declaration.candidates?.find((c) => (c.json as { value: string }).value === 'C');

      // Candidate A: environment should be reduced
      expect(candidateA?.conditions).not.toHaveProperty('environment');
      expect(Object.keys(candidateA?.conditions || {})).toHaveLength(0);

      // Candidate B: should preserve language and territory (no environment to reduce)
      expect(candidateB?.conditions).toHaveProperty('language', 'en');
      expect(candidateB?.conditions).toHaveProperty('territory', 'US');

      // Candidate C: environment should be reduced, variant preserved
      expect(candidateC?.conditions).not.toHaveProperty('environment');
      expect(candidateC?.conditions).toHaveProperty('variant', 'test');
    });
  });
});
