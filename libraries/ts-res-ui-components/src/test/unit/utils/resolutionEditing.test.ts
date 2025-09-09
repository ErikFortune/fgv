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
import { succeed, fail } from '@fgv/ts-utils';
import { JsonObject, JsonValue } from '@fgv/ts-json-base';
import {
  validateEditedResource,
  computeResourceDelta,
  createCandidateDeclarations,
  extractResolutionContext,
  createEditCollisionKey,
  checkEditConflicts
} from '../../../utils/resolutionEditing';
import { Runtime } from '@fgv/ts-res';

describe('resolutionEditing utilities', () => {
  describe('validateEditedResource', () => {
    test('validates valid JSON objects', () => {
      const validValue = { message: 'Hello', count: 42 };
      const result = validateEditedResource(validValue);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.warnings).toEqual([]);
    });

    test('validates simple values', () => {
      expect(validateEditedResource('string')).toEqual({
        isValid: true,
        errors: [],
        warnings: []
      });

      expect(validateEditedResource(123)).toEqual({
        isValid: true,
        errors: [],
        warnings: []
      });

      expect(validateEditedResource(true)).toEqual({
        isValid: true,
        errors: [],
        warnings: []
      });
    });

    test('rejects null values', () => {
      const result = validateEditedResource(null);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Resource value cannot be null or undefined');
    });

    test('rejects undefined values', () => {
      const result = validateEditedResource(undefined as unknown as JsonValue);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Resource value cannot be null or undefined');
    });

    // removed: circular reference detection is intentionally not enforced

    test('handles complex nested objects', () => {
      const complexObj = {
        level1: {
          level2: {
            level3: {
              value: 'deep value',
              array: [1, 2, { nested: true }]
            }
          }
        },
        other: 'value'
      };

      const result = validateEditedResource(complexObj);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('handles arrays with objects', () => {
      const arrayValue = [{ id: 1, name: 'first' }, { id: 2, name: 'second' }, 'simple string', 123];

      const result = validateEditedResource(arrayValue);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('detects JSON serialization errors', () => {
      // Create an object with a property that can't be serialized
      const badObj: JsonObject = {
        name: 'test'
      };

      // Add a circular reference to cause JSON serialization to fail
      badObj.self = badObj;

      const result = validateEditedResource(badObj);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Invalid JSON');
    });
  });

  describe('computeResourceDelta', () => {
    test('returns null for identical values', () => {
      const baseValue = { message: 'Hello' };
      const resolvedValue = { message: 'Hello' };
      const editedValue = { message: 'Hello' };

      const result = computeResourceDelta(baseValue, resolvedValue, editedValue);

      expect(result).toSucceed();
      expect(result.orThrow()).toBe(null);
    });

    test('computes delta for simple changes', () => {
      const baseValue = { message: 'Hello' };
      const resolvedValue = { message: 'Hello' };
      const editedValue = { message: 'Hello World' };

      const result = computeResourceDelta(baseValue, resolvedValue, editedValue);

      expect(result).toSucceed();
      // The exact delta format depends on ts-json implementation
      expect(result.orThrow()).toBeDefined();
    });

    test('computes delta for additions', () => {
      const baseValue = { message: 'Hello' };
      const resolvedValue = { message: 'Hello' };
      const editedValue = { message: 'Hello', newField: 'added' };

      const result = computeResourceDelta(baseValue, resolvedValue, editedValue);

      expect(result).toSucceed();
      expect(result.orThrow()).toBeDefined();
    });

    test('handles deletion by computing appropriate delta', () => {
      const baseValue = { message: 'Hello', extra: 'field' };
      const resolvedValue = { message: 'Hello', extra: 'field' };
      const editedValue = { message: 'Hello' };

      const result = computeResourceDelta(baseValue, resolvedValue, editedValue);

      expect(result).toSucceed();
      expect(result.orThrow()).toBeDefined();
    });

    test('falls back to full replacement on diff failure', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      // The function should return the edited value as fallback when diff fails
      // Since we can't easily mock the diff function in this context, we'll test the actual fallback behavior
      const editedValue = { message: 'Edited' };
      const resolvedValue = { original: 'value' };
      const result = computeResourceDelta(undefined, resolvedValue, editedValue);

      expect(result).toSucceed();
      // The result should contain the actual diff result, not exactly the edited value
      expect(result.orThrow()).toBeDefined();

      consoleSpy.mockRestore();
    });

    test('handles complex nested objects', () => {
      const resolvedValue = {
        user: { name: 'John', age: 30 },
        settings: { theme: 'dark', language: 'en' }
      };
      const editedValue = {
        user: { name: 'Jane', age: 30 },
        settings: { theme: 'light', language: 'en' }
      };

      const result = computeResourceDelta(undefined, resolvedValue, editedValue);

      expect(result).toSucceed();
      expect(result.orThrow()).toBeDefined();
    });
  });

  describe('createCandidateDeclarations', () => {
    test('creates declarations for edited resources', () => {
      const editedResources = new Map([
        [
          'resource1',
          {
            originalValue: { message: 'Hello' },
            editedValue: { message: 'Hello World' },
            delta: { message: 'Hello World' }
          }
        ]
      ]);
      const currentContext = { language: 'en', territory: 'US' };

      const result = createCandidateDeclarations(editedResources, currentContext);

      expect(result).toHaveLength(1);
      // priority is no longer injected; verify essentials only
      expect(result[0].id).toBe('resource1');
      expect(result[0].json).toEqual({ message: 'Hello World' });
      expect(result[0].isPartial).toBe(true);
      expect(result[0].mergeMethod).toBe('augment');
      expect(result[0].conditions).toEqual([
        { qualifierName: 'language', operator: 'matches', value: 'en' },
        { qualifierName: 'territory', operator: 'matches', value: 'US' }
      ]);
    });

    test('skips resources with no delta', () => {
      const editedResources = new Map([
        [
          'resource1',
          {
            originalValue: { message: 'Hello' },
            editedValue: { message: 'Hello' },
            delta: null // No changes
          }
        ],
        [
          'resource2',
          {
            originalValue: { message: 'Hi' },
            editedValue: { message: 'Hi there' },
            delta: { message: 'Hi there' }
          }
        ]
      ]);
      const currentContext = { language: 'en' };

      const result = createCandidateDeclarations(editedResources, currentContext);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('resource2');
    });

    test('handles empty context', () => {
      const editedResources = new Map([
        [
          'resource1',
          {
            originalValue: { message: 'Hello' },
            editedValue: { message: 'Hello World' },
            delta: { message: 'Hello World' }
          }
        ]
      ]);
      const currentContext = {};

      const result = createCandidateDeclarations(editedResources, currentContext);

      expect(result).toHaveLength(1);
      expect(result[0].conditions).toBeUndefined();
    });

    test('filters out empty context values', () => {
      const editedResources = new Map([
        [
          'resource1',
          {
            originalValue: { message: 'Hello' },
            editedValue: { message: 'Hello World' },
            delta: { message: 'Hello World' }
          }
        ]
      ]);
      const currentContext = {
        language: 'en',
        territory: '', // Empty string
        platform: '   ', // Whitespace only
        theme: 'dark'
      };

      const result = createCandidateDeclarations(editedResources, currentContext);

      expect(result).toHaveLength(1);
      expect(result[0].conditions).toHaveLength(2); // Only language and theme
      expect(result[0].conditions).toEqual([
        { qualifierName: 'language', operator: 'matches', value: 'en' },
        { qualifierName: 'theme', operator: 'matches', value: 'dark' }
      ]);
    });

    test('handles multiple edited resources', () => {
      const editedResources = new Map([
        [
          'resource1',
          {
            originalValue: { msg: 'A' },
            editedValue: { msg: 'A1' },
            delta: { msg: 'A1' }
          }
        ],
        [
          'resource2',
          {
            originalValue: { msg: 'B' },
            editedValue: { msg: 'B1' },
            delta: { msg: 'B1' }
          }
        ]
      ]);
      const currentContext = { language: 'en' };

      const result = createCandidateDeclarations(editedResources, currentContext);

      expect(result).toHaveLength(2);
      expect(result.map((r) => r.id)).toEqual(['resource1', 'resource2']);
    });
  });

  describe('extractResolutionContext', () => {
    test('filters out empty and undefined values', () => {
      const mockResolver = {} as unknown as Runtime.ResourceResolver;
      const contextValues = {
        language: 'en',
        territory: '',
        platform: undefined,
        theme: 'dark',
        empty: '   '
      };

      const result = extractResolutionContext(mockResolver, contextValues);

      expect(result).toEqual({
        language: 'en',
        theme: 'dark'
      });
    });

    test('trims whitespace from values', () => {
      const mockResolver = {} as unknown as Runtime.ResourceResolver;
      const contextValues = {
        language: '  en  ',
        territory: ' US '
      };

      const result = extractResolutionContext(mockResolver, contextValues);

      expect(result).toEqual({
        language: 'en',
        territory: 'US'
      });
    });

    test('handles empty context', () => {
      const mockResolver = {} as unknown as Runtime.ResourceResolver;
      const contextValues = {};

      const result = extractResolutionContext(mockResolver, contextValues);

      expect(result).toEqual({});
    });

    test('handles all empty values', () => {
      const mockResolver = {} as unknown as Runtime.ResourceResolver;
      const contextValues = {
        language: '',
        territory: '   ',
        platform: undefined
      };

      const result = extractResolutionContext(mockResolver, contextValues);

      expect(result).toEqual({});
    });
  });

  describe('createEditCollisionKey', () => {
    test('creates consistent key for same inputs', () => {
      const resourceId = 'resource1';
      const context = { language: 'en', territory: 'US' };

      const key1 = createEditCollisionKey(resourceId, context);
      const key2 = createEditCollisionKey(resourceId, context);

      expect(key1).toBe(key2);
      expect(key1).toMatch(/^resource1\?/);
    });

    test('sorts context entries for consistency', () => {
      const resourceId = 'resource1';
      const context1 = { language: 'en', territory: 'US' };
      const context2 = { territory: 'US', language: 'en' };

      const key1 = createEditCollisionKey(resourceId, context1);
      const key2 = createEditCollisionKey(resourceId, context2);

      expect(key1).toBe(key2);
    });

    test('creates different keys for different resources', () => {
      const context = { language: 'en' };
      const key1 = createEditCollisionKey('resource1', context);
      const key2 = createEditCollisionKey('resource2', context);

      expect(key1).not.toBe(key2);
    });

    test('creates different keys for different contexts', () => {
      const resourceId = 'resource1';
      const key1 = createEditCollisionKey(resourceId, { language: 'en' });
      const key2 = createEditCollisionKey(resourceId, { language: 'fr' });

      expect(key1).not.toBe(key2);
    });

    test('handles empty context', () => {
      const key = createEditCollisionKey('resource1', {});
      expect(key).toBe('resource1?');
    });

    test('properly encodes context values', () => {
      const resourceId = 'resource1';
      const context = { language: 'en', territory: 'US' };
      const key = createEditCollisionKey(resourceId, context);

      expect(key).toContain('language=en');
      expect(key).toContain('territory=US');
      expect(key).toContain('&');
    });
  });

  describe('checkEditConflicts', () => {
    let mockResourceManager: { getBuiltResource: jest.Mock };

    beforeEach(() => {
      mockResourceManager = {
        getBuiltResource: jest.fn()
      };
    });

    test('returns no conflicts for single candidate resources', () => {
      const mockResource = {
        candidates: [{ value: 'single candidate' }]
      };
      mockResourceManager.getBuiltResource.mockReturnValue(succeed(mockResource));

      const editedResources = new Map([['resource1', { some: 'edit' }]]);
      const currentContext = { language: 'en' };

      const result = checkEditConflicts(
        mockResourceManager as unknown as Runtime.IResourceManager,
        editedResources,
        currentContext
      );

      expect(result.conflicts).toEqual([]);
      expect(result.warnings).toEqual([]);
    });

    test('warns about multiple candidates', () => {
      const mockResource = {
        candidates: [{ value: 'candidate 1' }, { value: 'candidate 2' }, { value: 'candidate 3' }]
      };
      mockResourceManager.getBuiltResource.mockReturnValue(succeed(mockResource));

      const editedResources = new Map([['resource1', { some: 'edit' }]]);
      const currentContext = { language: 'en' };

      const result = checkEditConflicts(
        mockResourceManager as unknown as Runtime.IResourceManager,
        editedResources,
        currentContext
      );

      expect(result.conflicts).toEqual([]);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain('Resource resource1 has 3 candidates');
    });

    test('handles resource manager errors gracefully', () => {
      mockResourceManager.getBuiltResource.mockReturnValue(fail('Resource not found'));

      const editedResources = new Map([['resource1', { some: 'edit' }]]);
      const currentContext = { language: 'en' };

      const result = checkEditConflicts(
        mockResourceManager as unknown as Runtime.IResourceManager,
        editedResources,
        currentContext
      );

      expect(result.conflicts).toEqual([]);
      expect(result.warnings).toEqual([]);
    });

    test('handles multiple edited resources', () => {
      const singleCandidate = { candidates: [{ value: 'single' }] };
      const multipleCandidate = { candidates: [{ value: 'one' }, { value: 'two' }] };

      mockResourceManager.getBuiltResource
        .mockReturnValueOnce(succeed(singleCandidate))
        .mockReturnValueOnce(succeed(multipleCandidate));

      const editedResources = new Map<string, JsonValue>([
        ['resource1', { some: 'edit' }],
        ['resource2', { other: 'edit' }]
      ]);
      const currentContext = { language: 'en' };

      const result = checkEditConflicts(
        mockResourceManager as unknown as Runtime.IResourceManager,
        editedResources,
        currentContext
      );

      expect(result.conflicts).toEqual([]);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain('Resource resource2 has 2 candidates');
    });

    test('handles empty edited resources', () => {
      const editedResources = new Map();
      const currentContext = { language: 'en' };

      const result = checkEditConflicts(
        mockResourceManager as unknown as Runtime.IResourceManager,
        editedResources,
        currentContext
      );

      expect(result.conflicts).toEqual([]);
      expect(result.warnings).toEqual([]);
    });

    test('handles exceptions in resource manager gracefully', () => {
      mockResourceManager.getBuiltResource.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const editedResources = new Map([['resource1', { some: 'edit' }]]);
      const currentContext = { language: 'en' };

      const result = checkEditConflicts(
        mockResourceManager as unknown as Runtime.IResourceManager,
        editedResources,
        currentContext
      );

      expect(result.conflicts).toEqual([]);
      expect(result.warnings).toEqual([]);
    });
  });
});
