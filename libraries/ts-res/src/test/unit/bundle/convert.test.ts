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
import { Convert } from '../../../packlets/bundle';

const { bundleMetadata, bundle, bundleCreateParams } = Convert;

describe('Bundle Convert', () => {
  describe('bundleMetadata converter', () => {
    test('should convert valid metadata with required fields', () => {
      const validMetadata = {
        dateBuilt: '2025-01-01T00:00:00.000Z',
        checksum: 'abc123def456'
      };

      expect(bundleMetadata.convert(validMetadata)).toSucceedWith(validMetadata);
    });

    test('should convert valid metadata with optional fields', () => {
      const validMetadata = {
        dateBuilt: '2025-01-01T00:00:00.000Z',
        checksum: 'abc123def456',
        version: '1.0.0',
        description: 'Test bundle metadata'
      };

      expect(bundleMetadata.convert(validMetadata)).toSucceedWith(validMetadata);
    });

    test('should fail if dateBuilt is missing', () => {
      const invalidMetadata = {
        checksum: 'abc123def456'
      };

      expect(bundleMetadata.convert(invalidMetadata)).toFailWith(/field dateBuilt not found/i);
    });

    test('should fail if checksum is missing', () => {
      const invalidMetadata = {
        dateBuilt: '2025-01-01T00:00:00.000Z'
      };

      expect(bundleMetadata.convert(invalidMetadata)).toFailWith(/field checksum not found/i);
    });

    test('should fail if dateBuilt is not a string', () => {
      const invalidMetadata = {
        dateBuilt: 123,
        checksum: 'abc123def456'
      };

      expect(bundleMetadata.convert(invalidMetadata)).toFailWith(/not a string/i);
    });

    test('should fail if version is not a string', () => {
      const invalidMetadata = {
        dateBuilt: '2025-01-01T00:00:00.000Z',
        checksum: 'abc123def456',
        version: 123
      };

      expect(bundleMetadata.convert(invalidMetadata)).toFailWith(/not a string/i);
    });
  });

  describe('bundle converter', () => {
    const validBundle = {
      metadata: {
        dateBuilt: '2025-01-01T00:00:00.000Z',
        checksum: 'abc123def456'
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
        resources: []
      }
    };

    test('should convert valid bundle', () => {
      expect(bundle.convert(validBundle)).toSucceed();
    });

    test('should fail if metadata is missing', () => {
      const invalidBundle = {
        config: validBundle.config,
        compiledCollection: validBundle.compiledCollection
      };

      expect(bundle.convert(invalidBundle)).toFailWith(/field metadata not found/i);
    });

    test('should fail if config is missing', () => {
      const invalidBundle = {
        metadata: validBundle.metadata,
        compiledCollection: validBundle.compiledCollection
      };

      expect(bundle.convert(invalidBundle)).toFailWith(/field config not found/i);
    });

    test('should fail if compiledCollection is missing', () => {
      const invalidBundle = {
        metadata: validBundle.metadata,
        config: validBundle.config
      };

      expect(bundle.convert(invalidBundle)).toFailWith(/field compiledCollection not found/i);
    });

    test('should fail if metadata is invalid', () => {
      const invalidBundle = {
        ...validBundle,
        metadata: {
          checksum: 'abc123def456'
          // missing dateBuilt
        }
      };

      expect(bundle.convert(invalidBundle)).toFailWith(/field dateBuilt not found/i);
    });
  });

  describe('bundleCreateParams converter', () => {
    test('should convert empty params', () => {
      const emptyParams = {};
      expect(bundleCreateParams.convert(emptyParams)).toSucceedWith(emptyParams);
    });

    test('should convert params with all optional fields', () => {
      const fullParams = {
        version: '1.0.0',
        description: 'Test bundle',
        dateBuilt: '2025-01-01T00:00:00.000Z'
      };

      expect(bundleCreateParams.convert(fullParams)).toSucceedWith(fullParams);
    });

    test('should convert params with some optional fields', () => {
      const partialParams = {
        version: '1.0.0'
      };

      expect(bundleCreateParams.convert(partialParams)).toSucceedWith(partialParams);
    });

    test('should fail if version is not a string', () => {
      const invalidParams = {
        version: 123
      };

      expect(bundleCreateParams.convert(invalidParams)).toFailWith(/not a string/i);
    });

    test('should fail if description is not a string', () => {
      const invalidParams = {
        description: 123
      };

      expect(bundleCreateParams.convert(invalidParams)).toFailWith(/not a string/i);
    });

    test('should fail if dateBuilt is not a string', () => {
      const invalidParams = {
        dateBuilt: 123
      };

      expect(bundleCreateParams.convert(invalidParams)).toFailWith(/not a string/i);
    });
  });
});
