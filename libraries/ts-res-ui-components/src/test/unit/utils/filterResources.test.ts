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
import {
  hasFilterValues,
  getFilterSummary,
  createFilteredResourceManagerSimple,
  analyzeFilteredResources,
  type FilterOptions,
  type FilteredResource
} from '../../../utils/filterResources';
import { ProcessedResources } from '../../../types';

// Mock the tsResIntegration module
jest.mock('../../../utils/tsResIntegration', () => ({
  createCompiledResourceCollectionManager: jest.fn().mockReturnValue(succeed({}))
}));

describe('filterResources utilities', () => {
  describe('hasFilterValues', () => {
    test('returns false for empty object', () => {
      expect(hasFilterValues({})).toBe(false);
    });

    test('returns false for object with all undefined values', () => {
      expect(
        hasFilterValues({
          key1: undefined,
          key2: undefined
        })
      ).toBe(false);
    });

    test('returns false for object with all empty string values', () => {
      expect(
        hasFilterValues({
          key1: '',
          key2: ''
        })
      ).toBe(false);
    });

    test('returns false for object with mixed undefined and empty string values', () => {
      expect(
        hasFilterValues({
          key1: undefined,
          key2: '',
          key3: undefined
        })
      ).toBe(false);
    });

    test('returns true for object with at least one meaningful value', () => {
      expect(
        hasFilterValues({
          key1: undefined,
          key2: '',
          key3: 'value'
        })
      ).toBe(true);
    });

    test('returns true for object with multiple meaningful values', () => {
      expect(
        hasFilterValues({
          key1: 'value1',
          key2: 'value2'
        })
      ).toBe(true);
    });

    test('returns true for object with meaningful value containing spaces', () => {
      expect(
        hasFilterValues({
          key1: '  value with spaces  '
        })
      ).toBe(true);
    });

    test('returns true for object with zero as string value', () => {
      expect(
        hasFilterValues({
          key1: '0'
        })
      ).toBe(true);
    });

    test('returns true for object with boolean string values', () => {
      expect(
        hasFilterValues({
          key1: 'false'
        })
      ).toBe(true);
    });
  });

  describe('getFilterSummary', () => {
    test('returns "No filters" for empty object', () => {
      expect(getFilterSummary({})).toBe('No filters');
    });

    test('returns "No filters" for object with all undefined values', () => {
      expect(
        getFilterSummary({
          key1: undefined,
          key2: undefined
        })
      ).toBe('No filters');
    });

    test('returns "No filters" for object with all empty string values', () => {
      expect(
        getFilterSummary({
          key1: '',
          key2: ''
        })
      ).toBe('No filters');
    });

    test('returns summary for single active filter', () => {
      expect(
        getFilterSummary({
          language: 'en',
          territory: undefined
        })
      ).toBe('language=en');
    });

    test('returns summary for multiple active filters', () => {
      const result = getFilterSummary({
        language: 'en',
        territory: 'US',
        platform: undefined
      });

      // Check that it contains both filters (order may vary)
      expect(result).toMatch(/language=en/);
      expect(result).toMatch(/territory=US/);
      expect(result).toMatch(/,/); // Should contain comma separator
    });

    test('returns summary ignoring empty and undefined values', () => {
      expect(
        getFilterSummary({
          empty: '',
          undefined: undefined,
          language: 'fr',
          nullish: undefined,
          territory: 'CA'
        })
      ).toMatch(/language=fr.*territory=CA|territory=CA.*language=fr/);
    });

    test('handles special characters in values', () => {
      expect(
        getFilterSummary({
          language: 'en-US',
          territory: 'US/CA'
        })
      ).toMatch(/language=en-US.*territory=US\/CA|territory=US\/CA.*language=en-US/);
    });

    test('handles numeric string values', () => {
      expect(
        getFilterSummary({
          version: '1.0',
          level: '0'
        })
      ).toMatch(/version=1\.0.*level=0|level=0.*version=1\.0/);
    });
  });

  describe('createFilteredResourceManagerSimple', () => {
    let mockResourceManager: any;
    let mockSystem: any;

    beforeEach(() => {
      mockResourceManager = {
        getCompiledResourceCollection: jest.fn(),
        validateContext: jest.fn(),
        clone: jest.fn(),
        resources: new Map([
          ['resource1', {}],
          ['resource2', {}]
        ])
      };

      mockSystem = {
        resourceManager: mockResourceManager,
        qualifiers: {},
        qualifierTypes: {
          values: jest.fn().mockReturnValue([])
        },
        resourceTypes: {
          values: jest.fn().mockReturnValue([])
        },
        importManager: {},
        contextQualifierProvider: {
          create: jest.fn()
        }
      };
    });

    test('returns error when original system is undefined', async () => {
      const result = await createFilteredResourceManagerSimple(
        undefined as any,
        {},
        { partialContextMatch: true }
      );

      expect(result).toFail();
      expect(result.message).toBe('Original system or resourceManager is undefined');
    });

    test('returns error when resourceManager is undefined', async () => {
      const result = await createFilteredResourceManagerSimple(
        { ...mockSystem, resourceManager: undefined },
        {},
        { partialContextMatch: true }
      );

      expect(result).toFail();
      expect(result.message).toBe('Original system or resourceManager is undefined');
    });

    test('skips bundle resources and tries filtering', async () => {
      // Make getCompiledResourceCollection fail to force the filtering path
      mockResourceManager.getCompiledResourceCollection.mockReturnValue(fail('No bundle available'));

      // Mock the validation and clone steps to fail gracefully
      mockResourceManager.validateContext.mockReturnValue(fail('Context validation failed'));

      const result = await createFilteredResourceManagerSimple(
        mockSystem,
        { language: 'en' },
        { partialContextMatch: true }
      );

      expect(result).toFail();
      expect(result.message).toContain('Failed to validate context or clone');
    });

    test('filters context values before processing', async () => {
      mockResourceManager.getCompiledResourceCollection.mockReturnValue(fail('No bundle'));
      mockResourceManager.validateContext.mockReturnValue(succeed({}));
      mockResourceManager.clone.mockReturnValue(fail('Clone failed'));

      const partialContext = {
        language: 'en',
        territory: undefined,
        platform: 'web'
      };

      await createFilteredResourceManagerSimple(mockSystem, partialContext);

      expect(mockResourceManager.validateContext).toHaveBeenCalledWith({
        language: 'en',
        platform: 'web'
      });
    });

    test('handles validation context error', async () => {
      mockResourceManager.getCompiledResourceCollection.mockReturnValue(fail('No bundle'));
      mockResourceManager.validateContext.mockReturnValue(fail('Invalid context'));

      const result = await createFilteredResourceManagerSimple(mockSystem, { language: 'invalid' });

      expect(result).toFail();
      expect(result.message).toContain('Failed to validate context or clone');
    });

    test('handles clone error', async () => {
      mockResourceManager.getCompiledResourceCollection.mockReturnValue(fail('No bundle'));
      mockResourceManager.validateContext.mockReturnValue(succeed({}));
      mockResourceManager.clone.mockReturnValue(fail('Clone failed'));

      const result = await createFilteredResourceManagerSimple(mockSystem, { language: 'en' });

      expect(result).toFail();
      expect(result.message).toContain('Failed to validate context or clone');
    });

    test('passes options to clone correctly', async () => {
      mockResourceManager.getCompiledResourceCollection.mockReturnValue(fail('No bundle'));
      mockResourceManager.validateContext.mockReturnValue(succeed({ language: 'en' }));
      mockResourceManager.clone.mockReturnValue(fail('Clone failed for test'));

      const options: FilterOptions = {
        partialContextMatch: false,
        enableDebugLogging: true,
        reduceQualifiers: true
      };

      await createFilteredResourceManagerSimple(mockSystem, { language: 'en' }, options);

      expect(mockResourceManager.clone).toHaveBeenCalledWith({
        filterForContext: { language: 'en' },
        reduceQualifiers: true
      });
    });

    test('handles debug logging option', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      mockResourceManager.getCompiledResourceCollection.mockReturnValue(fail('No bundle'));
      mockResourceManager.validateContext.mockReturnValue(succeed({}));
      mockResourceManager.clone.mockReturnValue(fail('Clone failed'));

      await createFilteredResourceManagerSimple(mockSystem, { language: 'en' }, { enableDebugLogging: true });

      expect(consoleSpy).toHaveBeenCalledWith('=== SIMPLE FILTER CREATION ===');
      expect(consoleSpy).toHaveBeenCalledWith('Original system:', mockSystem);

      consoleSpy.mockRestore();
    });

    test('does not log when debug logging is disabled', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      mockResourceManager.getCompiledResourceCollection.mockReturnValue(fail('No bundle'));
      mockResourceManager.validateContext.mockReturnValue(succeed({}));
      mockResourceManager.clone.mockReturnValue(fail('Clone failed'));

      await createFilteredResourceManagerSimple(
        mockSystem,
        { language: 'en' },
        { enableDebugLogging: false }
      );

      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('analyzeFilteredResources', () => {
    let mockOriginalProcessedResources: ProcessedResources;
    let mockFilteredProcessedResources: ProcessedResources;

    beforeEach(() => {
      mockOriginalProcessedResources = {
        system: {
          resourceManager: {
            getBuiltResource: jest.fn()
          } as any,
          qualifiers: {} as any, // TODO: Fix mock types after refactoring
          qualifierTypes: {} as any,
          resourceTypes: {} as any,
          importManager: {} as any,
          contextQualifierProvider: {} as any
        },
        compiledCollection: {} as any,
        resolver: {} as any,
        resourceCount: 2,
        summary: {
          totalResources: 2,
          resourceIds: [],
          errorCount: 0,
          warnings: []
        }
      };

      mockFilteredProcessedResources = {
        system: {
          resourceManager: {
            getBuiltResource: jest.fn()
          } as any,
          qualifiers: {} as any, // TODO: Fix mock types after refactoring
          qualifierTypes: {} as any,
          resourceTypes: {} as any,
          importManager: {} as any,
          contextQualifierProvider: {} as any
        },
        compiledCollection: {} as any,
        resolver: {} as any,
        resourceCount: 1,
        summary: {
          totalResources: 1,
          resourceIds: [],
          errorCount: 0,
          warnings: []
        }
      };
    });

    test('analyzes resources with successful filtering', () => {
      const originalGetBuiltResource = mockOriginalProcessedResources.system.resourceManager
        .getBuiltResource as jest.Mock;
      const filteredGetBuiltResource = mockFilteredProcessedResources.system.resourceManager
        .getBuiltResource as jest.Mock;

      originalGetBuiltResource
        .mockReturnValueOnce(succeed({ candidates: ['c1', 'c2'] }))
        .mockReturnValueOnce(succeed({ candidates: ['c3'] }));

      filteredGetBuiltResource
        .mockReturnValueOnce(succeed({ candidates: ['c1'] }))
        .mockReturnValueOnce(succeed({ candidates: ['c3'] }));

      const result = analyzeFilteredResources(
        ['resource1', 'resource2'],
        mockFilteredProcessedResources,
        mockOriginalProcessedResources
      );

      expect(result.success).toBe(true);
      expect(result.filteredResources).toHaveLength(2);

      const resource1 = result.filteredResources[0];
      expect(resource1.id).toBe('resource1');
      expect(resource1.originalCandidateCount).toBe(2);
      expect(resource1.filteredCandidateCount).toBe(1);
      expect(resource1.hasWarning).toBe(false);

      const resource2 = result.filteredResources[1];
      expect(resource2.id).toBe('resource2');
      expect(resource2.originalCandidateCount).toBe(1);
      expect(resource2.filteredCandidateCount).toBe(1);
      expect(resource2.hasWarning).toBe(false);

      expect(result.warnings).toEqual([]);
      expect(result.processedResources).toBe(mockFilteredProcessedResources);
    });

    test('detects resources filtered out completely', () => {
      const originalGetBuiltResource = mockOriginalProcessedResources.system.resourceManager
        .getBuiltResource as jest.Mock;
      const filteredGetBuiltResource = mockFilteredProcessedResources.system.resourceManager
        .getBuiltResource as jest.Mock;

      originalGetBuiltResource.mockReturnValueOnce(succeed({ candidates: ['c1', 'c2'] }));

      filteredGetBuiltResource.mockReturnValueOnce(succeed({ candidates: [] }));

      const result = analyzeFilteredResources(
        ['resource1'],
        mockFilteredProcessedResources,
        mockOriginalProcessedResources
      );

      expect(result.success).toBe(true);
      expect(result.filteredResources).toHaveLength(1);

      const resource1 = result.filteredResources[0];
      expect(resource1.id).toBe('resource1');
      expect(resource1.originalCandidateCount).toBe(2);
      expect(resource1.filteredCandidateCount).toBe(0);
      expect(resource1.hasWarning).toBe(true);

      expect(result.warnings).toEqual(['Resource resource1 has no matching candidates after filtering']);
    });

    test('handles resources that failed to load originally', () => {
      const originalGetBuiltResource = mockOriginalProcessedResources.system.resourceManager
        .getBuiltResource as jest.Mock;
      const filteredGetBuiltResource = mockFilteredProcessedResources.system.resourceManager
        .getBuiltResource as jest.Mock;

      originalGetBuiltResource.mockReturnValueOnce(fail('Resource not found'));

      filteredGetBuiltResource.mockReturnValueOnce(fail('Resource not found'));

      const result = analyzeFilteredResources(
        ['resource1'],
        mockFilteredProcessedResources,
        mockOriginalProcessedResources
      );

      expect(result.success).toBe(true);
      expect(result.filteredResources).toHaveLength(1);

      const resource1 = result.filteredResources[0];
      expect(resource1.id).toBe('resource1');
      expect(resource1.originalCandidateCount).toBe(0);
      expect(resource1.filteredCandidateCount).toBe(0);
      expect(resource1.hasWarning).toBe(false);

      expect(result.warnings).toEqual([]);
    });

    test('handles resources that failed to load after filtering', () => {
      const originalGetBuiltResource = mockOriginalProcessedResources.system.resourceManager
        .getBuiltResource as jest.Mock;
      const filteredGetBuiltResource = mockFilteredProcessedResources.system.resourceManager
        .getBuiltResource as jest.Mock;

      originalGetBuiltResource.mockReturnValueOnce(succeed({ candidates: ['c1'] }));

      filteredGetBuiltResource.mockReturnValueOnce(fail('Resource filtered out'));

      const result = analyzeFilteredResources(
        ['resource1'],
        mockFilteredProcessedResources,
        mockOriginalProcessedResources
      );

      expect(result.success).toBe(true);
      expect(result.filteredResources).toHaveLength(1);

      const resource1 = result.filteredResources[0];
      expect(resource1.id).toBe('resource1');
      expect(resource1.originalCandidateCount).toBe(1);
      expect(resource1.filteredCandidateCount).toBe(0);
      expect(resource1.hasWarning).toBe(true);

      expect(result.warnings).toContain('Resource resource1 has no matching candidates after filtering');
    });

    test('handles empty resource list', () => {
      const result = analyzeFilteredResources(
        [],
        mockFilteredProcessedResources,
        mockOriginalProcessedResources
      );

      expect(result.success).toBe(true);
      expect(result.filteredResources).toEqual([]);
      expect(result.warnings).toEqual([]);
    });

    test('handles mixed success and failure scenarios', () => {
      const originalGetBuiltResource = mockOriginalProcessedResources.system.resourceManager
        .getBuiltResource as jest.Mock;
      const filteredGetBuiltResource = mockFilteredProcessedResources.system.resourceManager
        .getBuiltResource as jest.Mock;

      originalGetBuiltResource
        .mockReturnValueOnce(succeed({ candidates: ['c1', 'c2'] }))
        .mockReturnValueOnce(fail('Original failed'))
        .mockReturnValueOnce(succeed({ candidates: ['c3'] }));

      filteredGetBuiltResource
        .mockReturnValueOnce(succeed({ candidates: [] }))
        .mockReturnValueOnce(succeed({ candidates: ['c2'] }))
        .mockReturnValueOnce(succeed({ candidates: ['c3'] }));

      const result = analyzeFilteredResources(
        ['resource1', 'resource2', 'resource3'],
        mockFilteredProcessedResources,
        mockOriginalProcessedResources
      );

      expect(result.success).toBe(true);
      expect(result.filteredResources).toHaveLength(3);

      expect(result.filteredResources[0].hasWarning).toBe(true); // Had candidates, now none
      expect(result.filteredResources[1].hasWarning).toBe(false); // Originally failed, now has candidates
      expect(result.filteredResources[2].hasWarning).toBe(false); // Same count

      expect(result.warnings).toEqual(['Resource resource1 has no matching candidates after filtering']);
    });
  });
});
