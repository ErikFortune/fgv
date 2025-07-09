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
  let qualifierTypes: TsRes.QualifierTypes.QualifierTypeCollector;
  let qualifiers: TsRes.Qualifiers.QualifierCollector;
  let resourceTypes: TsRes.ResourceTypes.ResourceTypeCollector;
  let resourceManager: TsRes.Resources.ResourceManagerBuilder;
  let validCompiledCollection: TsRes.ResourceJson.Compiled.ICompiledResourceCollection;
  let createParams: TsRes.Runtime.ICompiledResourceCollectionCreateParams;

  beforeEach(() => {
    // Set up qualifier types
    qualifierTypes = TsRes.QualifierTypes.QualifierTypeCollector.create({
      qualifierTypes: [
        TsRes.QualifierTypes.LanguageQualifierType.create().orThrow(),
        TsRes.QualifierTypes.TerritoryQualifierType.create().orThrow()
      ]
    }).orThrow();

    // Set up qualifiers
    qualifiers = TsRes.Qualifiers.QualifierCollector.create({
      qualifierTypes,
      qualifiers: [
        { name: 'language', typeName: 'language', defaultPriority: 100 },
        { name: 'territory', typeName: 'territory', defaultPriority: 200 }
      ]
    }).orThrow();

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
      const result = TsRes.Runtime.CompiledResourceCollection.create(createParams);

      expect(result).toSucceed();
      expect(result.value).toBeInstanceOf(TsRes.Runtime.CompiledResourceCollection);
    });

    test('should fail if constructor throws', () => {
      const invalidParams = {
        ...createParams,
        qualifierTypes: new Collections.ResultMap<string, TsRes.QualifierTypes.QualifierType>([
          ['nonexistent', Array.from(qualifierTypes.values()).find((qt) => qt.key === 'language')!]
        ])
      };

      const result = TsRes.Runtime.CompiledResourceCollection.create(invalidParams);

      expect(result).toFail();
    });
  });

  describe('constructor success cases', () => {
    test('should initialize all properties correctly', () => {
      const collection = TsRes.Runtime.CompiledResourceCollection.create(createParams).orThrow();

      expect(collection.qualifierTypes).toBeInstanceOf(TsRes.QualifierTypes.QualifierTypeCollector);
      expect(collection.qualifiers).toBeInstanceOf(TsRes.Qualifiers.QualifierCollector);
      expect(collection.resourceTypes).toBeInstanceOf(TsRes.ResourceTypes.ResourceTypeCollector);
      expect(collection.conditions).toBeInstanceOf(TsRes.Conditions.ConditionCollector);
      expect(collection.conditionSets).toBeInstanceOf(TsRes.Conditions.ConditionSetCollector);
      expect(collection.decisions).toBeInstanceOf(TsRes.Decisions.AbstractDecisionCollector);
      expect(collection.builtResources).toBeInstanceOf(Collections.ValidatingResultMap);
    });

    test('should create collectors with correct sizes', () => {
      const collection = TsRes.Runtime.CompiledResourceCollection.create(createParams).orThrow();

      expect(collection.qualifierTypes.size).toBe(2);
      expect(collection.qualifiers.size).toBe(2);
      expect(collection.resourceTypes.size).toBe(1);
      expect(collection.conditions.size).toBeGreaterThan(0);
      expect(collection.conditionSets.size).toBeGreaterThan(0);
      expect(collection.decisions.size).toBeGreaterThan(0);
      expect(collection.builtResources.size).toBe(1);
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

      const result = TsRes.Runtime.CompiledResourceCollection.create(invalidParams);

      expect(result).toFail();
      expect(result.message).toContain('language');
    });

    test('should fail with invalid resource type reference', () => {
      const invalidResourceTypesMap = new Collections.ResultMap<string, TsRes.ResourceTypes.ResourceType>([
        ['nonexistent', Array.from(resourceTypes.values()).find((rt) => rt.key === 'json')!]
      ]);

      const invalidParams = {
        ...createParams,
        resourceTypes: invalidResourceTypesMap
      };

      const result = TsRes.Runtime.CompiledResourceCollection.create(invalidParams);

      expect(result).toFail();
      expect(result.message).toContain('json');
    });
  });

  describe('getBuiltResource method', () => {
    test('should return existing resource', () => {
      const collection = TsRes.Runtime.CompiledResourceCollection.create(createParams).orThrow();

      const result = collection.getBuiltResource('greeting');

      expect(result).toSucceed();
      expect(result.value!.id).toBe(TsRes.Convert.resourceId.convert('greeting').orThrow());
      expect(result.value!.resourceType).toBe(
        Array.from(resourceTypes.values()).find((rt) => rt.key === 'json')!
      );
    });

    test('should fail for non-existent resource', () => {
      const collection = TsRes.Runtime.CompiledResourceCollection.create(createParams).orThrow();

      const result = collection.getBuiltResource('nonexistent');

      expect(result).toFail();
    });
  });

  describe('property getters', () => {
    test('should return correct qualifierTypes', () => {
      const collection = TsRes.Runtime.CompiledResourceCollection.create(createParams).orThrow();

      expect(collection.qualifierTypes.size).toBe(2);
      expect(
        collection.qualifierTypes.has(TsRes.Convert.qualifierTypeName.convert('language').orThrow())
      ).toBe(true);
      expect(
        collection.qualifierTypes.has(TsRes.Convert.qualifierTypeName.convert('territory').orThrow())
      ).toBe(true);
    });

    test('should return correct qualifiers', () => {
      const collection = TsRes.Runtime.CompiledResourceCollection.create(createParams).orThrow();

      expect(collection.qualifiers.size).toBe(2);
      expect(collection.qualifiers.has(TsRes.Convert.qualifierName.convert('language').orThrow())).toBe(true);
      expect(collection.qualifiers.has(TsRes.Convert.qualifierName.convert('territory').orThrow())).toBe(
        true
      );
    });

    test('should return correct resourceTypes', () => {
      const collection = TsRes.Runtime.CompiledResourceCollection.create(createParams).orThrow();

      expect(collection.resourceTypes.size).toBe(1);
      expect(collection.resourceTypes.has(TsRes.Convert.resourceTypeName.convert('json').orThrow())).toBe(
        true
      );
    });

    test('should return correct builtResources', () => {
      const collection = TsRes.Runtime.CompiledResourceCollection.create(createParams).orThrow();

      expect(
        collection.builtResources.get(TsRes.Convert.resourceId.convert('greeting').orThrow())
      ).toSucceed();
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

      const collection = TsRes.Runtime.CompiledResourceCollection.create(complexParams).orThrow();

      expect(collection.builtResources.size).toBe(3);
      expect(collection.getBuiltResource('greeting-en')).toSucceed();
      expect(collection.getBuiltResource('greeting-us')).toSucceed();
      expect(collection.getBuiltResource('greeting-en-us')).toSucceed();
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

      const collection = TsRes.Runtime.CompiledResourceCollection.create(multiCandidateParams).orThrow();

      const resource = collection.getBuiltResource('greeting').orThrow();
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

      const collection = TsRes.Runtime.CompiledResourceCollection.create(emptyParams).orThrow();

      expect(collection.qualifierTypes.size).toBe(2);
      expect(collection.qualifiers.size).toBe(2);
      expect(collection.resourceTypes.size).toBe(1);
      expect(collection.builtResources.size).toBe(0);
    });
  });
});
