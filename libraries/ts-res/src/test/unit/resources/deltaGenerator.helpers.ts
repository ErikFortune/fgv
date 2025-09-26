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
import { succeed, fail, Logging, Result } from '@fgv/ts-utils';
import { JsonValue } from '@fgv/ts-json-base';
import * as TsRes from '../../../index';

/**
 * Common test data and setup utilities for DeltaGenerator tests
 */

// Test resource candidates for baseline and delta scenarios
export const baselineResources: TsRes.ResourceJson.Json.ILooseResourceCandidateDecl[] = [
  {
    id: 'greeting.hello',
    json: { message: 'Hello', casual: 'Hi' },
    conditions: { language: 'en' },
    resourceTypeName: 'json'
  },
  {
    id: 'greeting.goodbye',
    json: { message: 'Goodbye', casual: 'Bye' },
    conditions: { language: 'en' },
    resourceTypeName: 'json'
  },
  {
    id: 'numbers.count',
    json: { one: 'one', two: 'two', three: 'three' },
    conditions: { language: 'en' },
    resourceTypeName: 'json'
  }
];

export const deltaResources: TsRes.ResourceJson.Json.ILooseResourceCandidateDecl[] = [
  // Updated resource - some changes
  {
    id: 'greeting.hello',
    json: { message: 'Hello World', casual: 'Hi there' },
    conditions: { language: 'en' },
    resourceTypeName: 'json'
  },
  // New resource - not in baseline
  {
    id: 'greeting.welcome',
    json: { message: 'Welcome', casual: 'Hey' },
    conditions: { language: 'en' },
    resourceTypeName: 'json'
  },
  // Unchanged resource - identical to baseline
  {
    id: 'numbers.count',
    json: { one: 'one', two: 'two', three: 'three' },
    conditions: { language: 'en' },
    resourceTypeName: 'json'
  }
];

/**
 * Test setup interface containing commonly used test objects
 */
export interface ITestSetup {
  qualifierTypes: TsRes.QualifierTypes.QualifierTypeCollector;
  qualifiers: TsRes.Qualifiers.QualifierCollector;
  resourceTypes: TsRes.ResourceTypes.ResourceTypeCollector;
  resourceManager: TsRes.Resources.ResourceManagerBuilder;
  contextProvider: TsRes.Runtime.Context.IContextQualifierProvider;
  mockLogger: jest.Mocked<Logging.ILogger>;
}

/**
 * Creates the base test setup with qualifier types, qualifiers, and resource types
 */
export function createBaseTestSetup(): Omit<ITestSetup, 'resourceManager' | 'mockLogger'> {
  // Set up qualifier types
  const qualifierTypes = TsRes.QualifierTypes.QualifierTypeCollector.create({
    qualifierTypes: [
      TsRes.QualifierTypes.LanguageQualifierType.create().orThrow(),
      TsRes.QualifierTypes.TerritoryQualifierType.create().orThrow()
    ]
  }).orThrow();

  // Set up qualifiers
  const qualifiers = TsRes.Qualifiers.QualifierCollector.create({
    qualifierTypes,
    qualifiers: [
      { name: 'language', typeName: 'language', defaultPriority: 100 },
      { name: 'territory', typeName: 'territory', defaultPriority: 90 }
    ]
  }).orThrow();

  // Set up resource types
  const resourceTypes = TsRes.ResourceTypes.ResourceTypeCollector.create({
    resourceTypes: [TsRes.ResourceTypes.JsonResourceType.create().orThrow()]
  }).orThrow();

  // Set up context provider
  const contextProvider = TsRes.Runtime.ValidatingSimpleContextQualifierProvider.create({
    qualifiers,
    qualifierValues: {
      language: 'en',
      territory: 'US'
    }
  }).orThrow();

  return {
    qualifierTypes,
    qualifiers,
    resourceTypes,
    contextProvider
  };
}

/**
 * Creates a mock logger for testing
 */
export function createMockLogger(): jest.Mocked<Logging.ILogger> {
  return {
    logLevel: 'detail' as const,
    log: jest.fn(),
    detail: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  };
}

/**
 * Creates a resource manager with baseline resources
 */
export function createResourceManagerWithBaseline(
  qualifiers: TsRes.Qualifiers.QualifierCollector,
  resourceTypes: TsRes.ResourceTypes.ResourceTypeCollector,
  resources: TsRes.ResourceJson.Json.ILooseResourceCandidateDecl[] = baselineResources
): TsRes.Resources.ResourceManagerBuilder {
  const resourceManager = TsRes.Resources.ResourceManagerBuilder.create({
    qualifiers,
    resourceTypes
  }).orThrow();

  // Add resources
  resources.forEach((resource) => {
    resourceManager.addLooseCandidate(resource).orThrow();
  });

  return resourceManager;
}

/**
 * Creates a baseline resolver with the given resources
 */
export function createBaselineResolver(
  resourceManager: TsRes.Resources.ResourceManagerBuilder,
  qualifierTypes: TsRes.QualifierTypes.QualifierTypeCollector,
  contextProvider: TsRes.Runtime.Context.IContextQualifierProvider
): TsRes.IResourceResolver {
  const builtManager = resourceManager.build().orThrow();
  return TsRes.Runtime.ResourceResolver.create({
    resourceManager: builtManager,
    qualifierTypes,
    contextQualifierProvider: contextProvider
  }).orThrow();
}

/**
 * Creates a delta resolver with the given resources
 */
export function createDeltaResolver(
  resources: TsRes.ResourceJson.Json.ILooseResourceCandidateDecl[],
  qualifiers: TsRes.Qualifiers.QualifierCollector,
  resourceTypes: TsRes.ResourceTypes.ResourceTypeCollector,
  qualifierTypes: TsRes.QualifierTypes.QualifierTypeCollector,
  contextProvider: TsRes.Runtime.Context.IContextQualifierProvider
): TsRes.IResourceResolver {
  const deltaManager = TsRes.Resources.ResourceManagerBuilder.create({
    qualifiers,
    resourceTypes
  }).orThrow();

  resources.forEach((resource) => {
    deltaManager.addLooseCandidate(resource).orThrow();
  });

  const builtDeltaManager = deltaManager.build().orThrow();
  return TsRes.Runtime.ResourceResolver.create({
    resourceManager: builtDeltaManager,
    qualifierTypes,
    contextQualifierProvider: contextProvider
  }).orThrow();
}

/**
 * Creates a complete test setup with all required objects
 */
export function createCompleteTestSetup(): ITestSetup {
  const baseSetup = createBaseTestSetup();
  const mockLogger = createMockLogger();
  const resourceManager = createResourceManagerWithBaseline(baseSetup.qualifiers, baseSetup.resourceTypes);

  return {
    ...baseSetup,
    resourceManager,
    mockLogger
  };
}

/**
 * Test data for various test scenarios
 */
export const testData: {
  languageResources: {
    baseline: TsRes.ResourceJson.Json.ILooseResourceCandidateDecl[];
    britishEnglish: TsRes.ResourceJson.Json.ILooseResourceCandidateDecl[];
    canadianEnglish: TsRes.ResourceJson.Json.ILooseResourceCandidateDecl[];
  };
  emptyResources: TsRes.ResourceJson.Json.ILooseResourceCandidateDecl[];
  complexResources: TsRes.ResourceJson.Json.ILooseResourceCandidateDecl[];
} = {
  // Resources with language variations
  languageResources: {
    baseline: [
      {
        id: 'greeting.hello',
        json: { message: 'Hello' },
        conditions: { language: 'en-US' },
        resourceTypeName: 'json'
      },
      {
        id: 'greeting.goodbye',
        json: { message: 'Goodbye' },
        conditions: { language: 'en-US' },
        resourceTypeName: 'json'
      }
    ] as TsRes.ResourceJson.Json.ILooseResourceCandidateDecl[],
    britishEnglish: [
      {
        id: 'greeting.hello',
        json: { message: 'Hello' },
        conditions: { language: 'en-GB' },
        resourceTypeName: 'json'
      },
      {
        id: 'greeting.goodbye',
        json: { message: 'Cheerio' },
        conditions: { language: 'en-GB' },
        resourceTypeName: 'json'
      },
      {
        id: 'greeting.thanks',
        json: { message: 'Cheers' },
        conditions: { language: 'en-GB' },
        resourceTypeName: 'json'
      }
    ] as TsRes.ResourceJson.Json.ILooseResourceCandidateDecl[],
    canadianEnglish: [
      {
        id: 'greeting.hello',
        json: { message: 'Hello' },
        conditions: { language: 'en-CA' },
        resourceTypeName: 'json'
      },
      {
        id: 'greeting.goodbye',
        json: { message: 'See ya' },
        conditions: { language: 'en-CA' },
        resourceTypeName: 'json'
      },
      {
        id: 'greeting.apology',
        json: { message: 'Sorry' },
        conditions: { language: 'en-CA' },
        resourceTypeName: 'json'
      }
    ] as TsRes.ResourceJson.Json.ILooseResourceCandidateDecl[]
  },

  // Empty scenarios
  emptyResources: [] as TsRes.ResourceJson.Json.ILooseResourceCandidateDecl[],

  // Complex nested resources
  complexResources: [
    {
      id: 'app.config',
      json: {
        settings: {
          theme: 'dark',
          notifications: {
            enabled: true,
            frequency: 'daily',
            types: ['email', 'push']
          }
        },
        metadata: {
          version: '1.0.0',
          lastUpdated: '2025-01-01'
        }
      },
      conditions: { language: 'en' },
      resourceTypeName: 'json'
    }
  ] as TsRes.ResourceJson.Json.ILooseResourceCandidateDecl[]
};

/**
 * Helper to create a failing resolver for error testing
 */
export function createFailingResolver(errorMessage: string): TsRes.IResourceResolver {
  return {
    resourceIds: [],
    resolveComposedResourceValue: jest.fn().mockReturnValue(fail(errorMessage)),
    withContext: jest.fn().mockReturnValue(succeed({} as TsRes.IResourceResolver))
  };
}

/**
 * Helper to create a custom resolver with specific behavior
 */
export function createCustomResolver(
  resolveImpl: (resourceId: TsRes.ResourceId) => Result<JsonValue>,
  resourceIds: ReadonlyArray<TsRes.ResourceId> = []
): TsRes.IResourceResolver {
  return {
    resourceIds,
    resolveComposedResourceValue: jest.fn().mockImplementation(resolveImpl),
    withContext: jest.fn().mockReturnValue(succeed({} as TsRes.IResourceResolver))
  };
}
