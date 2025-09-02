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
import type { IBundleMetadata, IBundle, IBundleCreateParams } from '../../../packlets/bundle';

describe('Bundle Model', () => {
  describe('IBundleMetadata', () => {
    test('should have required dateBuilt and checksum properties', () => {
      const metadata: IBundleMetadata = {
        dateBuilt: '2025-01-01T00:00:00.000Z',
        checksum: 'abc123'
      };

      expect(metadata.dateBuilt).toBe('2025-01-01T00:00:00.000Z');
      expect(metadata.checksum).toBe('abc123');
      expect(metadata.version).toBeUndefined();
      expect(metadata.description).toBeUndefined();
    });

    test('should support optional version and description properties', () => {
      const metadata: IBundleMetadata = {
        dateBuilt: '2025-01-01T00:00:00.000Z',
        checksum: 'abc123',
        version: '1.0.0',
        description: 'Test bundle'
      };

      expect(metadata.version).toBe('1.0.0');
      expect(metadata.description).toBe('Test bundle');
    });
  });

  describe('IBundle', () => {
    test('should have required metadata, config, and compiledCollection properties', () => {
      const bundle: IBundle = {
        metadata: {
          dateBuilt: '2025-01-01T00:00:00.000Z',
          checksum: 'abc123'
        },
        config: {
          qualifierTypes: [],
          qualifiers: [],
          resourceTypes: []
        },
        compiledCollection: {
          qualifierTypes: [],
          qualifiers: [],
          resourceTypes: [],
          conditions: [],
          conditionSets: [],
          decisions: [],
          resources: [],
          candidateValues: []
        }
      };

      expect(bundle.metadata).toBeDefined();
      expect(bundle.config).toBeDefined();
      expect(bundle.compiledCollection).toBeDefined();
    });
  });

  describe('IBundleCreateParams', () => {
    test('should have all optional properties', () => {
      const params: IBundleCreateParams = {};
      expect(params.version).toBeUndefined();
      expect(params.description).toBeUndefined();
      expect(params.dateBuilt).toBeUndefined();
    });

    test('should support all optional properties when provided', () => {
      const params: IBundleCreateParams = {
        version: '1.0.0',
        description: 'Test bundle',
        dateBuilt: '2025-01-01T00:00:00.000Z'
      };

      expect(params.version).toBe('1.0.0');
      expect(params.description).toBe('Test bundle');
      expect(params.dateBuilt).toBe('2025-01-01T00:00:00.000Z');
    });
  });
});
