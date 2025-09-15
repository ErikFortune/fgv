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
import { BundleBuilder } from '../../../packlets/bundle';
import { ResourceManagerBuilder } from '../../../packlets/resources';
import { SystemConfiguration } from '../../../packlets/config';

describe('Bundle Normalization', () => {
  describe('Phase 1 behavior (order-dependent)', () => {
    test('should generate different checksums for bundles with same resources but different addition order', () => {
      // This test documents Phase 1 behavior: bundles created from the same resources
      // but added in different order will have different checksums when normalization is disabled.

      // Create first manager and add resources in order A -> B
      const manager1 = ResourceManagerBuilder.createPredefined('default').orThrow();

      manager1
        .addResource({
          id: 'resource.a',
          resourceTypeName: 'json',
          candidates: [
            {
              json: { value: 'Resource A' },
              conditions: [{ qualifierName: 'language', value: 'en' }]
            }
          ]
        })
        .orThrow();

      manager1
        .addResource({
          id: 'resource.b',
          resourceTypeName: 'json',
          candidates: [
            {
              json: { value: 'Resource B' },
              conditions: [{ qualifierName: 'language', value: 'fr' }]
            }
          ]
        })
        .orThrow();

      // Create second manager and add resources in order B -> A
      const manager2 = ResourceManagerBuilder.createPredefined('default').orThrow();

      manager2
        .addResource({
          id: 'resource.b',
          resourceTypeName: 'json',
          candidates: [
            {
              json: { value: 'Resource B' },
              conditions: [{ qualifierName: 'language', value: 'fr' }]
            }
          ]
        })
        .orThrow();

      manager2
        .addResource({
          id: 'resource.a',
          resourceTypeName: 'json',
          candidates: [
            {
              json: { value: 'Resource A' },
              conditions: [{ qualifierName: 'language', value: 'en' }]
            }
          ]
        })
        .orThrow();

      // Create bundles from both managers WITHOUT normalization
      const bundle1 = BundleBuilder.createFromPredefined(manager1, 'default', { normalize: false }).orThrow();
      const bundle2 = BundleBuilder.createFromPredefined(manager2, 'default', { normalize: false }).orThrow();

      // PHASE 1 BEHAVIOR: Different order results in different checksums
      expect(bundle1.metadata.checksum).not.toBe(bundle2.metadata.checksum);

      // Both bundles should have the same content when loaded
      expect(bundle1.compiledCollection.resources).toHaveLength(2);
      expect(bundle2.compiledCollection.resources).toHaveLength(2);

      // Resource IDs should be the same in both bundles (though potentially in different order)
      const bundle1ResourceIds = bundle1.compiledCollection.resources.map((r) => r.id).sort();
      const bundle2ResourceIds = bundle2.compiledCollection.resources.map((r) => r.id).sort();
      expect(bundle1ResourceIds).toEqual(bundle2ResourceIds);
      expect(bundle1ResourceIds).toEqual(['resource.a', 'resource.b']);
    });
  });

  describe('Phase 2 behavior (order-independent normalization)', () => {
    test('should generate same checksum for bundles with same resources but different addition order', () => {
      // This test validates Phase 2 behavior: bundles created from the same resources
      // but added in different order will have identical checksums when normalization is enabled.

      // Create first manager and add resources in order A -> B
      const manager1 = ResourceManagerBuilder.createPredefined('default').orThrow();

      manager1
        .addResource({
          id: 'resource.a',
          resourceTypeName: 'json',
          candidates: [
            {
              json: { value: 'Resource A' },
              conditions: [{ qualifierName: 'language', value: 'en' }]
            }
          ]
        })
        .orThrow();

      manager1
        .addResource({
          id: 'resource.b',
          resourceTypeName: 'json',
          candidates: [
            {
              json: { value: 'Resource B' },
              conditions: [{ qualifierName: 'language', value: 'fr' }]
            }
          ]
        })
        .orThrow();

      // Create second manager and add resources in order B -> A
      const manager2 = ResourceManagerBuilder.createPredefined('default').orThrow();

      manager2
        .addResource({
          id: 'resource.b',
          resourceTypeName: 'json',
          candidates: [
            {
              json: { value: 'Resource B' },
              conditions: [{ qualifierName: 'language', value: 'fr' }]
            }
          ]
        })
        .orThrow();

      manager2
        .addResource({
          id: 'resource.a',
          resourceTypeName: 'json',
          candidates: [
            {
              json: { value: 'Resource A' },
              conditions: [{ qualifierName: 'language', value: 'en' }]
            }
          ]
        })
        .orThrow();

      // Create bundles from both managers WITH normalization
      const bundle1 = BundleBuilder.createFromPredefined(manager1, 'default', { normalize: true }).orThrow();
      const bundle2 = BundleBuilder.createFromPredefined(manager2, 'default', { normalize: true }).orThrow();

      // PHASE 2 BEHAVIOR: Same content with normalization produces identical checksums
      expect(bundle1.metadata.checksum).toBe(bundle2.metadata.checksum);

      // Both bundles should have the same content when loaded
      expect(bundle1.compiledCollection.resources).toHaveLength(2);
      expect(bundle2.compiledCollection.resources).toHaveLength(2);

      // Resource IDs should be the same in both bundles and in canonical order
      const bundle1ResourceIds = bundle1.compiledCollection.resources.map((r) => r.id);
      const bundle2ResourceIds = bundle2.compiledCollection.resources.map((r) => r.id);
      expect(bundle1ResourceIds).toEqual(bundle2ResourceIds);
      expect(bundle1ResourceIds).toEqual(['resource.a', 'resource.b']); // Alphabetical order
    });

    test('should generate same checksum for bundles with same candidates but different addition order', () => {
      // Test with multiple candidates for the same resource added in different order

      // Create first manager and add candidates in order English -> French
      const manager1 = ResourceManagerBuilder.createPredefined('default').orThrow();

      manager1
        .addResource({
          id: 'test.resource',
          resourceTypeName: 'json',
          candidates: [
            {
              json: { value: 'English' },
              conditions: [{ qualifierName: 'language', value: 'en' }]
            },
            {
              json: { value: 'French' },
              conditions: [{ qualifierName: 'language', value: 'fr' }]
            }
          ]
        })
        .orThrow();

      // Create second manager and add candidates in order French -> English
      const manager2 = ResourceManagerBuilder.createPredefined('default').orThrow();

      manager2
        .addResource({
          id: 'test.resource',
          resourceTypeName: 'json',
          candidates: [
            {
              json: { value: 'French' },
              conditions: [{ qualifierName: 'language', value: 'fr' }]
            },
            {
              json: { value: 'English' },
              conditions: [{ qualifierName: 'language', value: 'en' }]
            }
          ]
        })
        .orThrow();

      // Create bundles from both managers WITH normalization
      const bundle1 = BundleBuilder.createFromPredefined(manager1, 'default', { normalize: true }).orThrow();
      const bundle2 = BundleBuilder.createFromPredefined(manager2, 'default', { normalize: true }).orThrow();

      // PHASE 2 BEHAVIOR: Same candidates with normalization produces identical checksums
      expect(bundle1.metadata.checksum).toBe(bundle2.metadata.checksum);

      // Both bundles should have the same number of candidates
      expect(bundle1.compiledCollection.resources[0].candidates).toHaveLength(2);
      expect(bundle2.compiledCollection.resources[0].candidates).toHaveLength(2);

      // Candidates should be in the same order in both bundles due to normalization
      const bundle1CandidateValues = bundle1.compiledCollection.resources[0].candidates.map(
        (c) => bundle1.compiledCollection.candidateValues[c.valueIndex]
      );
      const bundle2CandidateValues = bundle2.compiledCollection.resources[0].candidates.map(
        (c) => bundle2.compiledCollection.candidateValues[c.valueIndex]
      );
      expect(bundle1CandidateValues).toEqual(bundle2CandidateValues);
    });

    test('should work with custom SystemConfiguration (not just predefined)', () => {
      // Test that normalization works with any SystemConfiguration, not just predefined ones

      // Create a custom system configuration
      const customConfig = SystemConfiguration.create({
        name: 'custom-test-config',
        description: 'Custom configuration for testing normalization',
        qualifierTypes: [
          {
            name: 'language',
            systemType: 'language',
            configuration: {
              allowContextList: true
            }
          },
          {
            name: 'custom',
            systemType: 'literal',
            configuration: {
              allowContextList: false,
              caseSensitive: true,
              enumeratedValues: ['value1', 'value2', 'value3']
            }
          }
        ],
        qualifiers: [
          {
            name: 'language',
            token: 'lang',
            typeName: 'language',
            defaultPriority: 850
          },
          {
            name: 'custom',
            token: 'custom',
            typeName: 'custom',
            defaultPriority: 800
          }
        ],
        resourceTypes: [
          {
            name: 'json',
            typeName: 'json'
          }
        ]
      }).orThrow();

      // Create first manager and add resources in order A -> B
      const manager1 = ResourceManagerBuilder.create({
        qualifiers: customConfig.qualifiers,
        resourceTypes: customConfig.resourceTypes
      }).orThrow();

      manager1
        .addResource({
          id: 'resource.a',
          resourceTypeName: 'json',
          candidates: [
            {
              json: { value: 'Resource A' },
              conditions: [{ qualifierName: 'custom', value: 'value1' }]
            }
          ]
        })
        .orThrow();

      manager1
        .addResource({
          id: 'resource.b',
          resourceTypeName: 'json',
          candidates: [
            {
              json: { value: 'Resource B' },
              conditions: [{ qualifierName: 'custom', value: 'value2' }]
            }
          ]
        })
        .orThrow();

      // Create second manager and add resources in order B -> A
      const manager2 = ResourceManagerBuilder.create({
        qualifiers: customConfig.qualifiers,
        resourceTypes: customConfig.resourceTypes
      }).orThrow();

      manager2
        .addResource({
          id: 'resource.b',
          resourceTypeName: 'json',
          candidates: [
            {
              json: { value: 'Resource B' },
              conditions: [{ qualifierName: 'custom', value: 'value2' }]
            }
          ]
        })
        .orThrow();

      manager2
        .addResource({
          id: 'resource.a',
          resourceTypeName: 'json',
          candidates: [
            {
              json: { value: 'Resource A' },
              conditions: [{ qualifierName: 'custom', value: 'value1' }]
            }
          ]
        })
        .orThrow();

      // Create bundles from both managers WITH normalization using the custom config
      const bundle1 = BundleBuilder.create(manager1, customConfig, { normalize: true }).orThrow();
      const bundle2 = BundleBuilder.create(manager2, customConfig, { normalize: true }).orThrow();

      // PHASE 2 BEHAVIOR: Same content with normalization produces identical checksums
      // even when using a custom SystemConfiguration
      expect(bundle1.metadata.checksum).toBe(bundle2.metadata.checksum);

      // Both bundles should have the same content
      expect(bundle1.compiledCollection.resources).toHaveLength(2);
      expect(bundle2.compiledCollection.resources).toHaveLength(2);

      // Resource IDs should be the same in both bundles and in canonical order
      const bundle1ResourceIds = bundle1.compiledCollection.resources.map((r) => r.id);
      const bundle2ResourceIds = bundle2.compiledCollection.resources.map((r) => r.id);
      expect(bundle1ResourceIds).toEqual(bundle2ResourceIds);
      expect(bundle1ResourceIds).toEqual(['resource.a', 'resource.b']); // Alphabetical order

      // Verify the custom config is preserved in the bundle
      expect(bundle1.config.name).toBe('custom-test-config');
      expect(bundle1.config.qualifierTypes).toHaveLength(2);
      expect(bundle1.config.qualifierTypes[1].name).toBe('custom');
    });
  });
});
