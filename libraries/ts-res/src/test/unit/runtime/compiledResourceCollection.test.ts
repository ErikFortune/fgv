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
import { Collections } from '@fgv/ts-utils';
import * as TsRes from '../../../index';
describe('CompiledResourceCollection class', () => {
  let languageQualifierType: TsRes.QualifierTypes.LanguageQualifierType;
  let territoryQualifierType: TsRes.QualifierTypes.TerritoryQualifierType;
  let qualifierTypes: TsRes.QualifierTypes.QualifierTypeCollector;
  let languageQualifier: TsRes.Qualifiers.Qualifier;
  let territoryQualifier: TsRes.Qualifiers.Qualifier;
  let qualifiers: TsRes.Qualifiers.QualifierCollector;
  let resourceTypes: TsRes.ResourceTypes.ResourceTypeCollector;
  let resourceManager: TsRes.Resources.ResourceManagerBuilder;
  let validCompiledCollection: TsRes.ResourceJson.Compiled.ICompiledResourceCollection;
  let createParams: TsRes.Runtime.ICompiledResourceCollectionCreateParams;

  beforeEach(() => {
    // Set up qualifier types
    languageQualifierType = TsRes.QualifierTypes.LanguageQualifierType.create().orThrow();
    territoryQualifierType = TsRes.QualifierTypes.TerritoryQualifierType.create().orThrow();
    qualifierTypes = TsRes.QualifierTypes.QualifierTypeCollector.create({
      qualifierTypes: [languageQualifierType, territoryQualifierType]
    }).orThrow();

    // Set up qualifiers
    qualifiers = TsRes.Qualifiers.QualifierCollector.create({
      qualifierTypes,
      qualifiers: [
        { name: 'language', typeName: 'language', defaultPriority: 100 },
        { name: 'territory', typeName: 'territory', defaultPriority: 200 }
      ]
    }).orThrow();
    languageQualifier = qualifiers.validating.get('language').orThrow();
    territoryQualifier = qualifiers.validating.get('territory').orThrow();

    // Set up resource types
    resourceTypes = TsRes.ResourceTypes.ResourceTypeCollector.create({
      resourceTypes: [TsRes.ResourceTypes.JsonResourceType.create().orThrow()]
    }).orThrow();

    // Create a resource manager with some test data
    resourceManager = TsRes.Resources.ResourceManagerBuilder.create({
      qualifiers,
      resourceTypes
    }).orThrow();

    // Add a test resource
    resourceManager
      .addLooseCandidate({
        id: 'greeting',
        json: { text: 'Hello' },
        conditions: {
          language: 'en'
        },
        resourceTypeName: 'json'
      })
      .orThrow();

    // Get the compiled collection from the resource manager
    validCompiledCollection = resourceManager.getCompiledResourceCollection().orThrow();

    // Create maps for the constructor parameters based on the compiled collection's name references
    const qualifierTypesEntries: [string, TsRes.QualifierTypes.QualifierType][] = [];
    const resourceTypesEntries: [string, TsRes.ResourceTypes.ResourceType][] = [];

    // Map compiled collection qualifier type names to actual qualifier type objects
    for (const compiledQt of validCompiledCollection.qualifierTypes) {
      const actualQt = Array.from(qualifierTypes.values()).find((qt) => qt.key === compiledQt.name)!;
      qualifierTypesEntries.push([compiledQt.name, actualQt]);
    }

    // Map compiled collection resource type names to actual resource type objects
    for (const compiledRt of validCompiledCollection.resourceTypes) {
      const actualRt = Array.from(resourceTypes.values()).find((rt) => rt.key === compiledRt.name)!;
      resourceTypesEntries.push([compiledRt.name, actualRt]);
    }

    const qualifierTypesMap = new Collections.ResultMap<string, TsRes.QualifierTypes.QualifierType>(
      qualifierTypesEntries
    );
    const resourceTypesMap = new Collections.ResultMap<string, TsRes.ResourceTypes.ResourceType>(
      resourceTypesEntries
    );

    createParams = {
      compiledCollection: validCompiledCollection,
      qualifierTypes: qualifierTypesMap,
      resourceTypes: resourceTypesMap
    };
  });

  describe('create method', () => {
    test('should create a CompiledResourceCollection with valid parameters', () => {
      expect(TsRes.Runtime.CompiledResourceCollection.create(createParams)).toSucceedAndSatisfy(
        (collection) => {
          expect(collection).toBeInstanceOf(TsRes.Runtime.CompiledResourceCollection);
        }
      );
    });

    test('should fail if constructor throws', () => {
      const invalidParams = {
        ...createParams,
        qualifierTypes: new Collections.ResultMap<string, TsRes.QualifierTypes.QualifierType>([
          ['nonexistent', Array.from(qualifierTypes.values()).find((qt) => qt.key === 'language')!]
        ])
      };

      expect(TsRes.Runtime.CompiledResourceCollection.create(invalidParams)).toFail();
    });
  });

  describe('constructor success cases', () => {
    test('should initialize all properties correctly', () => {
      expect(TsRes.Runtime.CompiledResourceCollection.create(createParams)).toSucceedAndSatisfy(
        (collection) => {
          expect(collection).toBeInstanceOf(TsRes.Runtime.CompiledResourceCollection);

          expect(collection.qualifierTypes).toBeInstanceOf(TsRes.QualifierTypes.QualifierTypeCollector);
          expect(collection.qualifiers).toBeInstanceOf(TsRes.Qualifiers.QualifierCollector);
          expect(collection.resourceTypes).toBeInstanceOf(TsRes.ResourceTypes.ResourceTypeCollector);
          expect(collection.conditions).toBeInstanceOf(TsRes.Conditions.ConditionCollector);
          expect(collection.conditionSets).toBeInstanceOf(TsRes.Conditions.ConditionSetCollector);
          expect(collection.decisions).toBeInstanceOf(TsRes.Decisions.AbstractDecisionCollector);
          expect(collection.builtResources).toBeInstanceOf(Collections.ValidatingResultMap);
        }
      );
    });

    test('should create collectors with correct sizes', () => {
      expect(TsRes.Runtime.CompiledResourceCollection.create(createParams)).toSucceedAndSatisfy(
        (collection) => {
          expect(collection.qualifierTypes.size).toBe(2);
          expect(collection.qualifiers.size).toBe(2);
          expect(collection.resourceTypes.size).toBe(1);
          expect(collection.conditions.size).toBeGreaterThan(0);
          expect(collection.conditionSets.size).toBeGreaterThan(0);
          expect(collection.decisions.size).toBeGreaterThan(0);
          expect(collection.builtResources.size).toBe(1);
        }
      );
    });
  });

  describe('constructor error cases', () => {
    test('should fail with invalid qualifier type reference', () => {
      const invalidQualifierTypesMap = new Collections.ResultMap<string, TsRes.QualifierTypes.QualifierType>([
        ['nonexistent', Array.from(qualifierTypes.values()).find((qt) => qt.key === 'language')!]
      ]);

      const invalidParams = {
        ...createParams,
        qualifierTypes: invalidQualifierTypesMap
      };

      expect(TsRes.Runtime.CompiledResourceCollection.create(invalidParams)).toFailWith(/language/i);
    });

    test('should fail with invalid resource type reference', () => {
      const invalidResourceTypesMap = new Collections.ResultMap<string, TsRes.ResourceTypes.ResourceType>([
        ['nonexistent', Array.from(resourceTypes.values()).find((rt) => rt.key === 'json')!]
      ]);

      const invalidParams = {
        ...createParams,
        resourceTypes: invalidResourceTypesMap
      };

      expect(TsRes.Runtime.CompiledResourceCollection.create(invalidParams)).toFailWith(/json/i);
    });

    test('should fail with corrupted compiled data - invalid condition qualifier index', () => {
      // Create a corrupted collection by manually creating one with invalid qualifier index
      const corruptedCollection = {
        ...validCompiledCollection,
        conditions: [
          {
            qualifierIndex: 999 as TsRes.QualifierIndex,
            value: 'en',
            priority: 100 as TsRes.ConditionPriority,
            scoreAsDefault: undefined
          }
        ]
      };

      const corruptedParams = {
        ...createParams,
        compiledCollection: corruptedCollection
      };

      expect(TsRes.Runtime.CompiledResourceCollection.create(corruptedParams)).toFailWith(
        /Invalid qualifier index/
      );
    });

    test('should fail with corrupted compiled data - invalid condition set condition index', () => {
      // Create a corrupted collection by manually creating one with invalid condition index
      const corruptedCollection = {
        ...validCompiledCollection,
        conditionSets: [
          {
            conditions: [999 as TsRes.ConditionIndex]
          }
        ]
      };

      const corruptedParams = {
        ...createParams,
        compiledCollection: corruptedCollection
      };

      expect(TsRes.Runtime.CompiledResourceCollection.create(corruptedParams)).toFailWith(
        /Failed to resolve conditions/
      );
    });

    test('should fail with corrupted compiled data - invalid decision condition set index', () => {
      // Create a corrupted collection by manually creating one with invalid condition set index
      const corruptedCollection = {
        ...validCompiledCollection,
        decisions: [
          {
            conditionSets: [999 as TsRes.ConditionSetIndex]
          }
        ]
      };

      const corruptedParams = {
        ...createParams,
        compiledCollection: corruptedCollection
      };

      expect(TsRes.Runtime.CompiledResourceCollection.create(corruptedParams)).toFailWith(
        /Failed to resolve condition sets/
      );
    });

    test('should fail with corrupted compiled data - invalid resource type index', () => {
      // Create a corrupted collection by manually creating one with invalid resource type index
      const corruptedCollection = {
        ...validCompiledCollection,
        resources: [
          {
            id: 'test' as TsRes.ResourceId,
            type: 999 as TsRes.ResourceTypeIndex,
            decision: 0 as TsRes.DecisionIndex,
            candidates: []
          }
        ]
      };

      const corruptedParams = {
        ...createParams,
        compiledCollection: corruptedCollection
      };

      expect(TsRes.Runtime.CompiledResourceCollection.create(corruptedParams)).toFailWith(
        /Invalid resource type index/
      );
    });

    test('should fail with corrupted compiled data - invalid resource decision index', () => {
      // Create a corrupted collection by manually creating one with invalid decision index
      const corruptedCollection = {
        ...validCompiledCollection,
        resources: [
          {
            id: 'test' as TsRes.ResourceId,
            type: 0 as TsRes.ResourceTypeIndex,
            decision: 999 as TsRes.DecisionIndex,
            candidates: []
          }
        ]
      };

      const corruptedParams = {
        ...createParams,
        compiledCollection: corruptedCollection
      };

      expect(TsRes.Runtime.CompiledResourceCollection.create(corruptedParams)).toFailWith(
        /Invalid decision index/
      );
    });

    test('should fail with corrupted compiled data - invalid candidate JSON', () => {
      // Create a corrupted collection by manually creating one with invalid candidate JSON
      const corruptedCollection = {
        ...validCompiledCollection,
        resources: [
          {
            id: 'test' as TsRes.ResourceId,
            type: 0 as TsRes.ResourceTypeIndex,
            decision: 0 as TsRes.DecisionIndex,
            candidates: [
              {
                valueIndex: 0 as TsRes.CandidateValueIndex,
                isPartial: false,
                mergeMethod: 'replace' as TsRes.ResourceValueMergeMethod
              }
            ]
          }
        ],
        candidateValues: [null] // Invalid JSON value at index 0
      };

      const corruptedParams = {
        ...createParams,
        compiledCollection: corruptedCollection
      };

      expect(TsRes.Runtime.CompiledResourceCollection.create(corruptedParams)).toFailWith(
        /Failed to convert candidate JSON/
      );
    });

    test('should fail with corrupted compiled data - out of bounds candidate value index', () => {
      // Create a corrupted collection with candidate referencing non-existent value index
      const corruptedCollection = {
        ...validCompiledCollection,
        resources: [
          {
            id: 'test' as TsRes.ResourceId,
            type: 0 as TsRes.ResourceTypeIndex,
            decision: 0 as TsRes.DecisionIndex,
            candidates: [
              {
                valueIndex: 999 as TsRes.CandidateValueIndex, // Out of bounds index
                isPartial: false,
                mergeMethod: 'replace' as TsRes.ResourceValueMergeMethod
              }
            ]
          }
        ]
      };

      const corruptedParams = {
        ...createParams,
        compiledCollection: corruptedCollection
      };

      expect(TsRes.Runtime.CompiledResourceCollection.create(corruptedParams)).toFailWith(
        /Invalid candidate value index/
      );
    });

    test('should fail with corrupted compiled data - non-JSON object candidate value', () => {
      // Create a corrupted collection with candidate value that is not a JSON object
      const corruptedCollection = {
        ...validCompiledCollection,
        resources: [
          {
            id: 'test' as TsRes.ResourceId,
            type: 0 as TsRes.ResourceTypeIndex,
            decision: 0 as TsRes.DecisionIndex,
            candidates: [
              {
                valueIndex: 0 as TsRes.CandidateValueIndex,
                isPartial: false,
                mergeMethod: 'replace' as TsRes.ResourceValueMergeMethod
              }
            ]
          }
        ],
        candidateValues: ['not an object'] // String instead of object
      };

      const corruptedParams = {
        ...createParams,
        compiledCollection: corruptedCollection
      };

      expect(TsRes.Runtime.CompiledResourceCollection.create(corruptedParams)).toFailWith(
        /candidate value not a JSON object/
      );
    });

    test('should fail when condition collector creation fails', () => {
      // This test is designed to cover the condition collector failure path
      // Create a collection with no qualifiers to make condition collector fail
      const emptyQualifierTypesMap = new Collections.ResultMap<string, TsRes.QualifierTypes.QualifierType>(
        []
      );
      const emptyResourceTypesMap = new Collections.ResultMap<string, TsRes.ResourceTypes.ResourceType>([]);

      const emptyParams = {
        compiledCollection: {
          ...validCompiledCollection,
          conditions: []
        },
        qualifierTypes: emptyQualifierTypesMap,
        resourceTypes: emptyResourceTypesMap
      };

      expect(TsRes.Runtime.CompiledResourceCollection.create(emptyParams)).toFail();
    });

    test('should fail when condition set collector creation fails', () => {
      // This test is designed to cover the condition set collector failure path
      const emptyQualifierTypesMap = new Collections.ResultMap<string, TsRes.QualifierTypes.QualifierType>(
        []
      );
      const emptyResourceTypesMap = new Collections.ResultMap<string, TsRes.ResourceTypes.ResourceType>([]);

      const emptyParams = {
        compiledCollection: {
          ...validCompiledCollection,
          conditions: [],
          conditionSets: []
        },
        qualifierTypes: emptyQualifierTypesMap,
        resourceTypes: emptyResourceTypesMap
      };

      expect(TsRes.Runtime.CompiledResourceCollection.create(emptyParams)).toFail();
    });

    test('should fail when decision collector creation fails', () => {
      // This test is designed to cover the decision collector failure path
      const emptyQualifierTypesMap = new Collections.ResultMap<string, TsRes.QualifierTypes.QualifierType>(
        []
      );
      const emptyResourceTypesMap = new Collections.ResultMap<string, TsRes.ResourceTypes.ResourceType>([]);

      const emptyParams: TsRes.Runtime.ICompiledResourceCollectionCreateParams = {
        compiledCollection: {
          ...validCompiledCollection,
          conditions: [],
          conditionSets: [],
          decisions: []
        },
        qualifierTypes: emptyQualifierTypesMap,
        resourceTypes: emptyResourceTypesMap
      };

      expect(TsRes.Runtime.CompiledResourceCollection.create(emptyParams)).toFail();
    });

    test('should succeed when concrete decision creation works', () => {
      // Create a valid collection to ensure the concrete decision creation works
      const validCollection: TsRes.ResourceJson.Compiled.ICompiledResourceCollection = {
        ...validCompiledCollection,
        resources: [
          {
            id: 'test' as TsRes.ResourceId,
            type: 0 as TsRes.ResourceTypeIndex,
            decision: 0 as TsRes.DecisionIndex,
            candidates: [
              {
                valueIndex: 0 as TsRes.CandidateValueIndex,
                isPartial: false,
                mergeMethod: 'replace'
              }
            ]
          }
        ],
        candidateValues: [{ test: 'value' }]
      };

      const validParams = {
        ...createParams,
        compiledCollection: validCollection
      };

      expect(TsRes.Runtime.CompiledResourceCollection.create(validParams)).toSucceed();
    });
  });

  describe('getBuiltResource method', () => {
    test('should return existing resource', () => {
      expect(TsRes.Runtime.CompiledResourceCollection.create(createParams)).toSucceedAndSatisfy(
        (collection) => {
          expect(collection.getBuiltResource('greeting')).toSucceedAndSatisfy((resource) => {
            expect(resource.id).toBe(TsRes.Convert.resourceId.convert('greeting').orThrow());
            expect(resource.resourceType).toBe(
              Array.from(resourceTypes.values()).find((rt) => rt.key === 'json')!
            );
          });
        }
      );
    });

    test('should fail for non-existent resource', () => {
      expect(TsRes.Runtime.CompiledResourceCollection.create(createParams)).toSucceedAndSatisfy(
        (collection) => {
          expect(collection.getBuiltResource('nonexistent')).toFail();
        }
      );
    });
  });

  describe('property getters', () => {
    test('should return correct candidateValues', () => {
      expect(TsRes.Runtime.CompiledResourceCollection.create(createParams)).toSucceedAndSatisfy(
        (collection) => {
          expect(collection.candidateValues).toBeDefined();
          expect(Array.isArray(collection.candidateValues)).toBe(true);
          expect(collection.candidateValues.length).toBeGreaterThan(0);
        }
      );
    });

    test('should return correct qualifierTypes', () => {
      expect(TsRes.Runtime.CompiledResourceCollection.create(createParams)).toSucceedAndSatisfy(
        (collection) => {
          expect(collection.qualifierTypes.size).toBe(2);
          expect(collection.qualifierTypes.has(languageQualifierType.name)).toBe(true);
          expect(collection.qualifierTypes.has(territoryQualifierType.name)).toBe(true);
        }
      );
    });

    test('should return correct qualifiers', () => {
      expect(TsRes.Runtime.CompiledResourceCollection.create(createParams)).toSucceedAndSatisfy(
        (collection) => {
          expect(collection.qualifiers.size).toBe(2);
          expect(collection.qualifiers.has(languageQualifier.name)).toBe(true);
          expect(collection.qualifiers.has(territoryQualifier.name)).toBe(true);
        }
      );
    });

    test('should return correct resourceTypes', () => {
      expect(TsRes.Runtime.CompiledResourceCollection.create(createParams)).toSucceedAndSatisfy(
        (collection) => {
          expect(collection.resourceTypes.size).toBe(1);
          expect(collection.resourceTypes.has(TsRes.Convert.resourceTypeName.convert('json').orThrow())).toBe(
            true
          );
        }
      );
    });

    test('should return correct builtResources', () => {
      expect(TsRes.Runtime.CompiledResourceCollection.create(createParams)).toSucceedAndSatisfy(
        (collection) => {
          expect(
            collection.builtResources.get(TsRes.Convert.resourceId.convert('greeting').orThrow())
          ).toSucceed();
        }
      );
    });

    test('numResources property returns correct count', () => {
      expect(TsRes.Runtime.CompiledResourceCollection.create(createParams)).toSucceedAndSatisfy(
        (collection) => {
          expect(collection.numResources).toBe(1);
        }
      );
    });

    test('numCandidates property returns correct count', () => {
      expect(TsRes.Runtime.CompiledResourceCollection.create(createParams)).toSucceedAndSatisfy(
        (collection) => {
          expect(collection.numCandidates).toBe(1);
        }
      );
    });

    test('numResources and numCandidates return zero for empty collection', () => {
      // Create an empty resource manager to get an empty compiled collection
      const emptyManager = TsRes.Resources.ResourceManagerBuilder.create({
        qualifiers,
        resourceTypes
      }).orThrow();

      const emptyCompiledCollection = emptyManager.getCompiledResourceCollection().orThrow();
      const emptyParams = {
        ...createParams,
        compiledCollection: emptyCompiledCollection
      };

      expect(TsRes.Runtime.CompiledResourceCollection.create(emptyParams)).toSucceedAndSatisfy(
        (collection) => {
          expect(collection.numResources).toBe(0);
          expect(collection.numCandidates).toBe(0);
        }
      );
    });

    test('numCandidates accurately counts across multiple resources', () => {
      // Create a more complex test with multiple resources and candidates
      const multiManager = TsRes.Resources.ResourceManagerBuilder.create({
        qualifiers,
        resourceTypes
      }).orThrow();

      // Add multiple resources with different numbers of candidates
      multiManager
        .addLooseCandidate({
          id: 'greeting',
          json: { text: 'Hello' },
          conditions: { language: 'en' },
          resourceTypeName: 'json'
        })
        .orThrow();

      multiManager
        .addLooseCandidate({
          id: 'greeting',
          json: { text: 'Hola' },
          conditions: { language: 'es' },
          resourceTypeName: 'json'
        })
        .orThrow();

      multiManager
        .addLooseCandidate({
          id: 'farewell',
          json: { text: 'Goodbye' },
          conditions: { language: 'en' },
          resourceTypeName: 'json'
        })
        .orThrow();

      multiManager
        .addLooseCandidate({
          id: 'farewell',
          json: { text: 'Adiós' },
          conditions: { language: 'es' },
          resourceTypeName: 'json'
        })
        .orThrow();

      const multiCompiledCollection = multiManager.getCompiledResourceCollection().orThrow();
      const multiParams = {
        ...createParams,
        compiledCollection: multiCompiledCollection
      };

      expect(TsRes.Runtime.CompiledResourceCollection.create(multiParams)).toSucceedAndSatisfy(
        (collection) => {
          expect(collection.numResources).toBe(2);
          expect(collection.numCandidates).toBe(4); // 2 + 2 candidates
        }
      );
    });

    test('numCandidates cache behavior (immutable collection)', () => {
      expect(TsRes.Runtime.CompiledResourceCollection.create(createParams)).toSucceedAndSatisfy(
        (collection) => {
          // Access numCandidates multiple times to test caching
          const firstAccess = collection.numCandidates;
          const secondAccess = collection.numCandidates;
          const thirdAccess = collection.numCandidates;

          expect(firstAccess).toBe(1);
          expect(secondAccess).toBe(1);
          expect(thirdAccess).toBe(1);

          // Since CompiledResourceCollection is immutable,
          // the cache should remain consistent
          expect(firstAccess).toBe(secondAccess);
          expect(secondAccess).toBe(thirdAccess);
        }
      );
    });
  });

  describe('resource validation', () => {
    test('should fail when compiled collection contains invalid resource objects', () => {
      // Create corrupted compiled collection by adding invalid resource
      createParams.compiledCollection = {
        ...createParams.compiledCollection,
        resources: [
          ...createParams.compiledCollection.resources,
          { notAResource: true } as unknown as TsRes.ResourceJson.Compiled.ICompiledResource
        ]
      };

      // Should fail during construction when trying to validate/convert the invalid resource
      expect(TsRes.Runtime.CompiledResourceCollection.create(createParams)).toFailWith(
        /Cannot read properties of undefined|Field not found|Invalid.*resource|source is not an object/
      );
    });

    test('should fail when compiled collection contains null resource', () => {
      // Create corrupted compiled collection by adding null resource
      createParams.compiledCollection = {
        ...createParams.compiledCollection,
        resources: [
          ...createParams.compiledCollection.resources,
          null as unknown as TsRes.ResourceJson.Compiled.ICompiledResource
        ]
      };

      // Should fail during construction when trying to process null resource
      expect(TsRes.Runtime.CompiledResourceCollection.create(createParams)).toFailWith(
        /source is not an object|Cannot read.*null|Invalid.*resource/
      );
    });

    test('should fail when compiled collection contains resource with incomplete structure', () => {
      // Create corrupted compiled collection by adding incomplete resource
      createParams.compiledCollection = {
        ...createParams.compiledCollection,
        resources: [
          ...createParams.compiledCollection.resources,
          {
            id: 'incomplete-resource',
            resourceType: 'json'
            // Missing required fields like 'decision', 'candidates', etc.
          } as unknown as TsRes.ResourceJson.Compiled.ICompiledResource
        ]
      };

      // Should fail during construction when validating the incomplete resource
      expect(TsRes.Runtime.CompiledResourceCollection.create(createParams)).toFailWith(
        /Invalid resource type index undefined for resource incomplete-resource: undefined: collector index must be a number/i
      );
    });
  });

  describe('complex scenarios', () => {
    test('should handle multiple resources with different conditions', () => {
      const complexManager = TsRes.Resources.ResourceManagerBuilder.create({
        qualifiers,
        resourceTypes
      }).orThrow();

      complexManager
        .addLooseCandidate({
          id: 'greeting-en',
          json: { text: 'Hello' },
          conditions: { language: 'en' },
          resourceTypeName: 'json'
        })
        .orThrow();

      complexManager
        .addLooseCandidate({
          id: 'greeting-us',
          json: { text: 'Howdy' },
          conditions: { territory: 'US' },
          resourceTypeName: 'json'
        })
        .orThrow();

      complexManager
        .addLooseCandidate({
          id: 'greeting-en-us',
          json: { text: 'Hey there' },
          conditions: { language: 'en', territory: 'US' },
          resourceTypeName: 'json'
        })
        .orThrow();

      const complexCompiledCollection = complexManager.getCompiledResourceCollection().orThrow();
      const complexParams = {
        ...createParams,
        compiledCollection: complexCompiledCollection
      };

      expect(TsRes.Runtime.CompiledResourceCollection.create(complexParams)).toSucceedAndSatisfy(
        (collection) => {
          expect(collection.builtResources.size).toBe(3);
          expect(collection.getBuiltResource('greeting-en')).toSucceed();
          expect(collection.getBuiltResource('greeting-us')).toSucceed();
          expect(collection.getBuiltResource('greeting-en-us')).toSucceed();
        }
      );
    });

    test('should handle resources with multiple candidates', () => {
      const multiCandidateManager = TsRes.Resources.ResourceManagerBuilder.create({
        qualifiers,
        resourceTypes
      }).orThrow();

      multiCandidateManager
        .addLooseCandidate({
          id: 'greeting',
          json: { text: 'Hello' },
          conditions: { language: 'en' },
          resourceTypeName: 'json'
        })
        .orThrow();

      multiCandidateManager
        .addLooseCandidate({
          id: 'greeting',
          json: { text: 'Hi' },
          conditions: { language: 'en-US' }
        })
        .orThrow();

      const multiCandidateCompiledCollection = multiCandidateManager
        .getCompiledResourceCollection()
        .orThrow();
      const multiCandidateParams = {
        ...createParams,
        compiledCollection: multiCandidateCompiledCollection
      };

      expect(TsRes.Runtime.CompiledResourceCollection.create(multiCandidateParams)).toSucceedAndSatisfy(
        (collection) => {
          expect(collection.getBuiltResource('greeting')).toSucceedAndSatisfy((resource) => {
            expect(resource.candidates.length).toBeGreaterThan(1);
            expect(
              resource.candidates.some(
                (c) => c.json && typeof c.json === 'object' && 'text' in c.json && c.json.text === 'Hello'
              )
            ).toBe(true);
            expect(
              resource.candidates.some(
                (c) => c.json && typeof c.json === 'object' && 'text' in c.json && c.json.text === 'Hi'
              )
            ).toBe(true);
          });
        }
      );
    });

    test('should handle empty collections', () => {
      const emptyManager = TsRes.Resources.ResourceManagerBuilder.create({
        qualifiers,
        resourceTypes
      }).orThrow();

      const emptyCompiledCollection = emptyManager.getCompiledResourceCollection().orThrow();
      const emptyParams = {
        ...createParams,
        compiledCollection: emptyCompiledCollection
      };

      expect(TsRes.Runtime.CompiledResourceCollection.create(emptyParams)).toSucceedAndSatisfy(
        (collection) => {
          expect(collection.qualifierTypes.size).toBe(2);
          expect(collection.qualifiers.size).toBe(2);
          expect(collection.resourceTypes.size).toBe(1);
          expect(collection.builtResources.size).toBe(0);
        }
      );
    });
  });

  describe('validateContext method', () => {
    test('should validate a context with valid qualifier values', () => {
      expect(TsRes.Runtime.CompiledResourceCollection.create(createParams)).toSucceedAndSatisfy(
        (collection) => {
          const context = { language: 'en', territory: 'US' };
          expect(collection.validateContext(context)).toSucceedAndSatisfy((validatedContext) => {
            expect(validatedContext[languageQualifier.name]).toBe('en');
            expect(validatedContext[territoryQualifier.name]).toBe('US');
          });
        }
      );
    });

    test('should validate a context with only some qualifiers', () => {
      expect(TsRes.Runtime.CompiledResourceCollection.create(createParams)).toSucceedAndSatisfy(
        (collection) => {
          const context = { language: 'en' };
          expect(collection.validateContext(context)).toSucceedAndSatisfy((validatedContext) => {
            expect(validatedContext[languageQualifier.name]).toBe('en');
            expect(validatedContext[territoryQualifier.name]).toBeUndefined();
          });
        }
      );
    });

    test('should validate a context with BCP47 language tags', () => {
      expect(TsRes.Runtime.CompiledResourceCollection.create(createParams)).toSucceedAndSatisfy(
        (collection) => {
          const context = { language: 'en-US' };
          expect(collection.validateContext(context)).toSucceedAndSatisfy((validatedContext) => {
            expect(validatedContext[languageQualifier.name]).toBe('en-US');
          });
        }
      );
    });

    test('should validate an empty context', () => {
      expect(TsRes.Runtime.CompiledResourceCollection.create(createParams)).toSucceedAndSatisfy(
        (collection) => {
          const context = {};
          expect(collection.validateContext(context)).toSucceedAndSatisfy((validatedContext) => {
            expect(Object.keys(validatedContext)).toHaveLength(0);
          });
        }
      );
    });

    test('should fail with unknown qualifier name', () => {
      expect(TsRes.Runtime.CompiledResourceCollection.create(createParams)).toSucceedAndSatisfy(
        (collection) => {
          const context = { language: 'en', unknown: 'value' };
          expect(collection.validateContext(context)).toFailWith(/not found/i);
        }
      );
    });

    test('should fail with invalid language value', () => {
      expect(TsRes.Runtime.CompiledResourceCollection.create(createParams)).toSucceedAndSatisfy(
        (collection) => {
          const context = { language: 'invalid-language-tag' };
          expect(collection.validateContext(context)).toFailWith(/invalid/i);
        }
      );
    });

    test('should fail with invalid territory value', () => {
      expect(TsRes.Runtime.CompiledResourceCollection.create(createParams)).toSucceedAndSatisfy(
        (collection) => {
          const context = { territory: 'INVALID' };
          expect(collection.validateContext(context)).toFailWith(/invalid/i);
        }
      );
    });

    test('should aggregate multiple validation errors', () => {
      expect(TsRes.Runtime.CompiledResourceCollection.create(createParams)).toSucceedAndSatisfy(
        (collection) => {
          const context = { language: 'invalid-lang', territory: 'INVALID', unknown: 'value' };
          expect(collection.validateContext(context)).toFailWith(/invalid|not found/i);
        }
      );
    });

    test('should fail with null context', () => {
      expect(TsRes.Runtime.CompiledResourceCollection.create(createParams)).toSucceedAndSatisfy(
        (collection) => {
          expect(collection.validateContext(null as unknown as TsRes.Context.IContextDecl)).toFailWith(
            /not a string-keyed object/i
          );
        }
      );
    });

    test('should fail with non-object context', () => {
      expect(TsRes.Runtime.CompiledResourceCollection.create(createParams)).toSucceedAndSatisfy(
        (collection) => {
          expect(
            collection.validateContext('not an object' as unknown as TsRes.Context.IContextDecl)
          ).toFailWith(/not a string-keyed object/i);
        }
      );
    });

    test('should handle complex territory values', () => {
      expect(TsRes.Runtime.CompiledResourceCollection.create(createParams)).toSucceedAndSatisfy(
        (collection) => {
          const context = { territory: 'GB' };
          expect(collection.validateContext(context)).toSucceedAndSatisfy((validatedContext) => {
            expect(validatedContext[territoryQualifier.name]).toBe('GB');
          });
        }
      );
    });

    test('should handle multiple valid qualifiers', () => {
      expect(TsRes.Runtime.CompiledResourceCollection.create(createParams)).toSucceedAndSatisfy(
        (collection) => {
          const context = { language: 'es-ES', territory: 'ES' };
          expect(collection.validateContext(context)).toSucceedAndSatisfy((validatedContext) => {
            expect(validatedContext[languageQualifier.name]).toBe('es-ES');
            expect(validatedContext[territoryQualifier.name]).toBe('ES');
          });
        }
      );
    });
  });

  describe('getBuiltResourceTree', () => {
    test('should create validating resource tree from built resources', () => {
      expect(TsRes.Runtime.CompiledResourceCollection.create(createParams)).toSucceedAndSatisfy(
        (collection) => {
          expect(collection.getBuiltResourceTree()).toSucceedAndSatisfy((tree) => {
            // Test basic tree functionality
            expect(tree.children).toBeDefined();
            expect(tree.isRoot).toBe(true);

            // Test string-based access works with actual test resource via validating interface
            expect(tree.children.validating.getById('greeting')).toSucceedAndSatisfy((node) => {
              expect(node.isLeaf).toBe(true);
              expect(node.id).toBe('greeting');
            });

            // Test validation works
            expect(tree.children.validating.getById('invalid..id')).toFail();

            // Test resource access with actual test resource
            expect(tree.children.validating.getResourceById('greeting')).toSucceedAndSatisfy((leaf) => {
              expect(leaf.resource).toBeDefined();
              expect(leaf.resource.id).toBe('greeting' as TsRes.ResourceId);
            });

            // Test nonexistent resource access fails
            expect(tree.children.validating.getResourceById('nonexistent')).toFail();
          });
        }
      );
    });

    test('should cache tree after first creation', () => {
      expect(TsRes.Runtime.CompiledResourceCollection.create(createParams)).toSucceedAndSatisfy(
        (collection) => {
          // First call creates the tree
          const firstTreeResult = collection.getBuiltResourceTree();
          expect(firstTreeResult).toSucceed();
          const firstTree = firstTreeResult.orThrow();

          // Second call should return the same cached tree
          const secondTreeResult = collection.getBuiltResourceTree();
          expect(secondTreeResult).toSucceed();
          const secondTree = secondTreeResult.orThrow();

          // Should be the same cached root instance
          expect(firstTree).toBe(secondTree);
        }
      );
    });

    test('should handle empty resource collection tree', () => {
      const emptyManager = TsRes.Resources.ResourceManagerBuilder.create({
        qualifiers,
        resourceTypes
      }).orThrow();

      const emptyCompiledCollection = emptyManager.getCompiledResourceCollection().orThrow();
      const emptyParams = {
        ...createParams,
        compiledCollection: emptyCompiledCollection
      };

      expect(TsRes.Runtime.CompiledResourceCollection.create(emptyParams)).toSucceedAndSatisfy(
        (collection) => {
          expect(collection.getBuiltResourceTree()).toSucceedAndSatisfy((tree) => {
            expect(tree.children.size).toBe(0);
            expect(tree.children.validating.has('anything')).toBe(false);
            expect(tree.children.validating.has('nonexistent')).toBe(false);
          });
        }
      );
    });

    test('should provide hierarchical access to flat resource structure', () => {
      // Create a test setup with hierarchical resources
      const hierarchicalManager = TsRes.Resources.ResourceManagerBuilder.create({
        qualifiers,
        resourceTypes
      }).orThrow();

      hierarchicalManager
        .addLooseCandidate({
          id: 'app.messages.welcome',
          json: { text: 'Welcome!' },
          conditions: { language: 'en' },
          resourceTypeName: 'json'
        })
        .orThrow();

      hierarchicalManager
        .addLooseCandidate({
          id: 'app.errors.notFound',
          json: { text: 'Not Found' },
          conditions: { language: 'en' },
          resourceTypeName: 'json'
        })
        .orThrow();

      const hierarchicalCompiledCollection = hierarchicalManager.getCompiledResourceCollection().orThrow();
      const hierarchicalParams = {
        ...createParams,
        compiledCollection: hierarchicalCompiledCollection
      };

      expect(TsRes.Runtime.CompiledResourceCollection.create(hierarchicalParams)).toSucceedAndSatisfy(
        (collection) => {
          expect(collection.getBuiltResourceTree()).toSucceedAndSatisfy((tree) => {
            // Test that we can navigate the hierarchy built from flat resource ids via validating interface
            expect(tree.children.validating.getBranchById('app')).toSucceed();
            expect(tree.children.validating.getBranchById('app.messages')).toSucceed();
            expect(tree.children.validating.getResourceById('app.messages.welcome')).toSucceed();

            // Test that branches don't have resources (following tree semantics)
            expect(tree.children.validating.getResourceById('app')).toFail();
            expect(tree.children.validating.getResourceById('app.messages')).toFail();

            // Test branch children access
            expect(tree.children.validating.getBranchById('app.messages')).toSucceedAndSatisfy(
              (messagesNode) => {
                expect(messagesNode.children.validating.getResource('welcome')).toSucceed();
                expect(messagesNode.children.validating.getResource('welcome')).toSucceed();
              }
            );

            // Test errors branch access
            expect(tree.children.validating.getBranchById('app.errors')).toSucceedAndSatisfy((errorsNode) => {
              expect(errorsNode.children.validating.getResource('notFound')).toSucceed();
              expect(errorsNode.children.validating.getResource('notFound')).toSucceed();
            });
          });
        }
      );
    });
  });
});
