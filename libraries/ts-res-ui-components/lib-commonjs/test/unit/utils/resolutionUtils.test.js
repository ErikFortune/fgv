'use strict';
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
Object.defineProperty(exports, '__esModule', { value: true });
require('@fgv/ts-utils-jest');
const ts_utils_1 = require('@fgv/ts-utils');
const resolutionUtils_1 = require('../../../utils/resolutionUtils');
describe('resolutionUtils', () => {
  let mockProcessedResources;
  let mockResolver;
  beforeEach(() => {
    mockProcessedResources = {
      system: {
        resourceManager: {
          getBuiltResource: jest.fn()
        },
        qualifiers: {
          validating: {
            get: jest.fn()
          }
        },
        qualifierTypes: {},
        resourceTypes: {},
        importManager: {},
        contextQualifierProvider: {}
      },
      compiledCollection: {
        resources: [
          {
            id: 'resource1',
            decision: 0,
            type: {},
            candidates: []
          },
          {
            id: 'resource2',
            decision: 1,
            type: {},
            candidates: []
          }
        ],
        qualifiers: [
          { name: 'language', type: {}, defaultPriority: 100 },
          { name: 'territory', type: {}, defaultPriority: 90 }
        ],
        qualifierTypes: [],
        resourceTypes: [],
        conditions: [
          {
            qualifierIndex: 0,
            value: 'en',
            operator: 'matches',
            priority: 100
          }
        ],
        conditionSets: [{ conditions: [0] }],
        decisions: [{ conditionSets: [0] }],
        candidateValues: []
      },
      resolver: {},
      resourceCount: 2,
      summary: {
        totalResources: 2,
        resourceIds: ['resource1', 'resource2'],
        errorCount: 0,
        warnings: []
      }
    };
    mockResolver = {
      contextQualifierProvider: {
        get: jest.fn().mockReturnValue((0, ts_utils_1.succeed)('en'))
      },
      resolveResource: jest.fn(),
      resolveAllResourceCandidates: jest.fn(),
      resolveComposedResourceValue: jest.fn(),
      resolveDecision: jest.fn(),
      conditionCache: {
        0: { score: 1.0, matchType: 'match' }
      }
    };
  });
  describe('getAvailableQualifiers', () => {
    test('returns qualifier names from compiled collection', () => {
      const result = (0, resolutionUtils_1.getAvailableQualifiers)(mockProcessedResources);
      expect(result).toEqual(['language', 'territory']);
    });
    test('returns empty array when no qualifiers', () => {
      const resourcesWithoutQualifiers = {
        ...mockProcessedResources,
        compiledCollection: {
          ...mockProcessedResources.compiledCollection,
          qualifiers: undefined
        }
      };
      const result = (0, resolutionUtils_1.getAvailableQualifiers)(resourcesWithoutQualifiers);
      expect(result).toEqual([]);
    });
    test('handles empty qualifiers array', () => {
      const resourcesWithEmptyQualifiers = {
        ...mockProcessedResources,
        compiledCollection: {
          ...mockProcessedResources.compiledCollection,
          qualifiers: []
        }
      };
      const result = (0, resolutionUtils_1.getAvailableQualifiers)(resourcesWithEmptyQualifiers);
      expect(result).toEqual([]);
    });
    test('extracts names from qualifier objects', () => {
      const resourcesWithComplexQualifiers = {
        ...mockProcessedResources,
        compiledCollection: {
          ...mockProcessedResources.compiledCollection,
          qualifiers: [
            {
              name: 'language',
              type: {},
              typeName: 'language',
              defaultPriority: 100
            },
            {
              name: 'territory',
              type: {},
              typeName: 'territory',
              defaultPriority: 90
            },
            {
              name: 'platform',
              type: {},
              typeName: 'literal',
              defaultPriority: 80
            }
          ]
        }
      };
      const result = (0, resolutionUtils_1.getAvailableQualifiers)(resourcesWithComplexQualifiers);
      expect(result).toEqual(['language', 'territory', 'platform']);
    });
  });
  describe('hasPendingContextChanges', () => {
    test('returns false when contexts are identical', () => {
      const context = { language: 'en', territory: 'US' };
      const pendingContext = { language: 'en', territory: 'US' };
      expect((0, resolutionUtils_1.hasPendingContextChanges)(context, pendingContext)).toBe(false);
    });
    test('returns true when contexts differ', () => {
      const context = { language: 'en', territory: 'US' };
      const pendingContext = { language: 'fr', territory: 'US' };
      expect((0, resolutionUtils_1.hasPendingContextChanges)(context, pendingContext)).toBe(true);
    });
    test('returns true when pending has additional values', () => {
      const context = { language: 'en' };
      const pendingContext = { language: 'en', territory: 'US' };
      expect((0, resolutionUtils_1.hasPendingContextChanges)(context, pendingContext)).toBe(true);
    });
    test('returns true when pending has fewer values', () => {
      const context = { language: 'en', territory: 'US' };
      const pendingContext = { language: 'en' };
      expect((0, resolutionUtils_1.hasPendingContextChanges)(context, pendingContext)).toBe(true);
    });
    test('handles undefined values', () => {
      const context = { language: 'en', territory: undefined };
      const pendingContext = { language: 'en', territory: undefined };
      expect((0, resolutionUtils_1.hasPendingContextChanges)(context, pendingContext)).toBe(false);
    });
    test('detects undefined to string changes', () => {
      const context = { language: 'en', territory: undefined };
      const pendingContext = { language: 'en', territory: 'US' };
      expect((0, resolutionUtils_1.hasPendingContextChanges)(context, pendingContext)).toBe(true);
    });
    test('handles empty objects', () => {
      expect((0, resolutionUtils_1.hasPendingContextChanges)({}, {})).toBe(false);
    });
    test('detects changes in empty vs non-empty', () => {
      expect((0, resolutionUtils_1.hasPendingContextChanges)({}, { language: 'en' })).toBe(true);
      expect((0, resolutionUtils_1.hasPendingContextChanges)({ language: 'en' }, {})).toBe(true);
    });
  });
  describe('evaluateConditionsForCandidate', () => {
    test('returns empty array when decision is missing', () => {
      const invalidCompiled = { decision: 999 }; // Non-existent decision
      const result = (0, resolutionUtils_1.evaluateConditionsForCandidate)(
        mockResolver,
        0,
        invalidCompiled,
        mockProcessedResources.compiledCollection
      );
      expect(result).toEqual([]);
    });
    test('returns empty array when candidate index is out of range', () => {
      const compiled = { decision: 0 };
      const result = (0, resolutionUtils_1.evaluateConditionsForCandidate)(
        mockResolver,
        999, // Out of range
        compiled,
        mockProcessedResources.compiledCollection
      );
      expect(result).toEqual([]);
    });
    test('evaluates conditions successfully', () => {
      const compiled = { decision: 0 };
      const result = (0, resolutionUtils_1.evaluateConditionsForCandidate)(
        mockResolver,
        0,
        compiled,
        mockProcessedResources.compiledCollection
      );
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        qualifierName: 'language',
        qualifierValue: 'en',
        conditionValue: 'en',
        operator: 'matches',
        score: 1.0,
        matched: true,
        matchType: 'match',
        scoreAsDefault: undefined,
        conditionIndex: 0
      });
    });
    test('handles missing condition sets', () => {
      const compiledCollectionWithoutConditionSets = {
        ...mockProcessedResources.compiledCollection,
        decisions: [{ conditionSets: undefined }]
      };
      const compiled = { decision: 0 };
      const result = (0, resolutionUtils_1.evaluateConditionsForCandidate)(
        mockResolver,
        0,
        compiled,
        compiledCollectionWithoutConditionSets
      );
      expect(result).toEqual([]);
    });
    test('handles resolver errors gracefully', () => {
      const errorResolver = {
        ...mockResolver,
        contextQualifierProvider: {
          get: jest.fn().mockImplementation(() => {
            throw new Error('Context error');
          })
        }
      };
      const compiled = { decision: 0 };
      const result = (0, resolutionUtils_1.evaluateConditionsForCandidate)(
        errorResolver,
        0,
        compiled,
        mockProcessedResources.compiledCollection
      );
      expect(result).toEqual([]);
    });
    test('handles missing cache entries', () => {
      const resolverWithoutCache = {
        ...mockResolver,
        conditionCache: {}
      };
      const compiled = { decision: 0 };
      const result = (0, resolutionUtils_1.evaluateConditionsForCandidate)(
        resolverWithoutCache,
        0,
        compiled,
        mockProcessedResources.compiledCollection
      );
      expect(result).toHaveLength(1);
      expect(result[0].score).toBe(0);
      expect(result[0].matchType).toBe('noMatch');
      expect(result[0].matched).toBe(false);
    });
  });
  describe('resolveResourceDetailed', () => {
    beforeEach(() => {
      const mockResource = {
        id: 'resource1',
        candidates: [{ value: 'candidate1' }, { value: 'candidate2' }],
        decision: {
          baseDecision: {}
        }
      };
      mockProcessedResources.system.resourceManager.getBuiltResource = jest
        .fn()
        .mockReturnValue((0, ts_utils_1.succeed)(mockResource));
      mockResolver.resolveResource = jest
        .fn()
        .mockReturnValue((0, ts_utils_1.succeed)(mockResource.candidates[0]));
      mockResolver.resolveAllResourceCandidates = jest
        .fn()
        .mockReturnValue((0, ts_utils_1.succeed)([mockResource.candidates[0]]));
      mockResolver.resolveComposedResourceValue = jest
        .fn()
        .mockReturnValue((0, ts_utils_1.succeed)('composed value'));
      mockResolver.resolveDecision = jest.fn().mockReturnValue(
        (0, ts_utils_1.succeed)({
          success: true,
          instanceIndices: [0],
          defaultInstanceIndices: []
        })
      );
    });
    test('resolves resource successfully', () => {
      const result = (0, resolutionUtils_1.resolveResourceDetailed)(
        mockResolver,
        'resource1',
        mockProcessedResources
      );
      expect(result).toSucceedAndSatisfy((resolution) => {
        expect(resolution.success).toBe(true);
        expect(resolution.resourceId).toBe('resource1');
        expect(resolution.resource).toBeDefined();
        expect(resolution.bestCandidate).toBeDefined();
        expect(resolution.allCandidates).toBeDefined();
        expect(resolution.candidateDetails).toBeInstanceOf(Array);
        expect(resolution.candidateDetails).toBeDefined();
        expect(resolution.composedValue).toBe('composed value');
      });
    });
    test('handles resource not found', () => {
      mockProcessedResources.system.resourceManager.getBuiltResource = jest
        .fn()
        .mockReturnValue((0, ts_utils_1.fail)('Resource not found'));
      const result = (0, resolutionUtils_1.resolveResourceDetailed)(
        mockResolver,
        'nonexistent',
        mockProcessedResources
      );
      expect(result).toSucceedAndSatisfy((resolution) => {
        expect(resolution.success).toBe(false);
        expect(resolution.resourceId).toBe('nonexistent');
        expect(resolution.error).toBe('Failed to get resource: Resource not found');
      });
    });
    test('handles missing compiled resource', () => {
      const resourcesWithoutCompiledResource = {
        ...mockProcessedResources,
        compiledCollection: {
          ...mockProcessedResources.compiledCollection,
          resources: [] // Empty resources array
        }
      };
      const result = (0, resolutionUtils_1.resolveResourceDetailed)(
        mockResolver,
        'resource1',
        resourcesWithoutCompiledResource
      );
      expect(result).toSucceedAndSatisfy((resolution) => {
        expect(resolution.success).toBe(false);
        expect(resolution.resourceId).toBe('resource1');
        expect(resolution.error).toBe('Failed to find compiled resource');
      });
    });
    test('handles decision resolution failure', () => {
      mockResolver.resolveDecision = jest.fn().mockReturnValue((0, ts_utils_1.fail)('Decision failed'));
      const result = (0, resolutionUtils_1.resolveResourceDetailed)(
        mockResolver,
        'resource1',
        mockProcessedResources
      );
      expect(result).toSucceedAndSatisfy((resolution) => {
        expect(resolution.success).toBe(false);
        expect(resolution.resourceId).toBe('resource1');
        expect(resolution.error).toBe('Failed to resolve decision: Decision failed');
      });
    });
    test('handles resolution options with debug logging', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      const result = (0, resolutionUtils_1.resolveResourceDetailed)(
        mockResolver,
        'resource1',
        mockProcessedResources,
        {
          enableDebugLogging: true
        }
      );
      expect(result).toSucceed();
      expect(consoleSpy).toHaveBeenCalledWith('=== RESOLVING RESOURCE ===');
      expect(consoleSpy).toHaveBeenCalledWith('Resource ID:', 'resource1');
      consoleSpy.mockRestore();
    });
    test('builds candidate details with match information', () => {
      const result = (0, resolutionUtils_1.resolveResourceDetailed)(
        mockResolver,
        'resource1',
        mockProcessedResources
      );
      expect(result).toSucceedAndSatisfy((resolution) => {
        expect(resolution.candidateDetails).toBeDefined();
        if (resolution.candidateDetails) {
          expect(resolution.candidateDetails).toHaveLength(2);
          // First candidate should be matched
          const matchedCandidate = resolution.candidateDetails.find((c) => c.matched);
          expect(matchedCandidate).toBeDefined();
          expect(matchedCandidate.matchType).toBe('match');
          expect(matchedCandidate.isDefaultMatch).toBe(false);
          // Second candidate should be non-matched
          const nonMatchedCandidate = resolution.candidateDetails.find((c) => !c.matched);
          expect(nonMatchedCandidate).toBeDefined();
          expect(nonMatchedCandidate.matchType).toBe('noMatch');
          expect(nonMatchedCandidate.isDefaultMatch).toBe(false);
        }
      });
    });
    test('handles resolver failures gracefully', () => {
      mockResolver.resolveResource = jest.fn().mockReturnValue((0, ts_utils_1.fail)('Resolution failed'));
      const result = (0, resolutionUtils_1.resolveResourceDetailed)(
        mockResolver,
        'resource1',
        mockProcessedResources
      );
      expect(result).toSucceedAndSatisfy((resolution) => {
        expect(resolution.success).toBe(true); // Still succeeds but with error info
        expect(resolution.error).toBe('Resolution failed');
        expect(resolution.bestCandidate).toBeUndefined();
      });
    });
  });
  describe('createResolverWithContext', () => {
    test('filters undefined context values', () => {
      const contextValues = {
        language: 'en',
        territory: undefined,
        platform: 'web'
      };
      // We can't easily test the internal filtering without complex mocking,
      // so we test that the function doesn't throw with undefined values
      expect(() =>
        (0, resolutionUtils_1.createResolverWithContext)(mockProcessedResources, contextValues)
      ).not.toThrow();
    });
    test('handles empty context', () => {
      const result = (0, resolutionUtils_1.createResolverWithContext)(mockProcessedResources, {});
      // Should attempt to create resolver even with empty context
      expect(result).toBeDefined();
    });
    test('applies debug logging option', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      (0, resolutionUtils_1.createResolverWithContext)(
        mockProcessedResources,
        { language: 'en' },
        { enableDebugLogging: true }
      );
      expect(consoleSpy).toHaveBeenCalledWith('=== CREATING RESOLVER WITH CONTEXT ===');
      consoleSpy.mockRestore();
    });
    test('applies caching option', () => {
      // Test that caching option is processed without errors
      const result = (0, resolutionUtils_1.createResolverWithContext)(
        mockProcessedResources,
        { language: 'en' },
        { enableCaching: true }
      );
      expect(result).toBeDefined();
    });
  });
});
//# sourceMappingURL=resolutionUtils.test.js.map
