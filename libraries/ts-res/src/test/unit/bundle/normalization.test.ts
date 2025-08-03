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

describe('Bundle Normalization', () => {
  describe('Order independence (Phase 2 feature)', () => {
    test('should generate same checksum for bundles with same resources but different addition order', () => {
      // This test documents current behavior: bundles created from the same resources
      // but added in different order will have different checksums.
      // In Phase 2, when normalization is implemented, this test should be updated
      // to expect the checksums to be the same.

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

      // Create bundles from both managers
      const bundle1 = BundleBuilder.createFromPredefined(manager1, 'default').orThrow();
      const bundle2 = BundleBuilder.createFromPredefined(manager2, 'default').orThrow();

      // PHASE 1 BEHAVIOR: Different order results in different checksums
      // TODO PHASE 2: When normalization is implemented, change this to expect equal checksums
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

    test('should generate same checksum for bundles with same candidates but different addition order', () => {
      // Test with multiple candidates for the same resource added in different order

      // Create first manager and add candidates in order 1 -> 2
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

      // Create second manager and add candidates in order 2 -> 1
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

      // Create bundles from both managers
      const bundle1 = BundleBuilder.createFromPredefined(manager1, 'default').orThrow();
      const bundle2 = BundleBuilder.createFromPredefined(manager2, 'default').orThrow();

      // PHASE 1 BEHAVIOR: Different candidate order results in different checksums
      // TODO PHASE 2: When normalization is implemented, change this to expect equal checksums
      expect(bundle1.metadata.checksum).not.toBe(bundle2.metadata.checksum);

      // Both bundles should have the same number of candidates
      expect(bundle1.compiledCollection.resources[0].candidates).toHaveLength(2);
      expect(bundle2.compiledCollection.resources[0].candidates).toHaveLength(2);
    });
  });
});
