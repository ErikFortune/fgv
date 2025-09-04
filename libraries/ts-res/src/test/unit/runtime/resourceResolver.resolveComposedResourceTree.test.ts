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
import * as TsRes from '../../../index';
import { ResourceName, ResourceId } from '../../../packlets/common';

describe('ResourceResolver.resolveComposedResourceTree', () => {
  let qualifierTypes: TsRes.QualifierTypes.QualifierTypeCollector;
  let qualifiers: TsRes.Qualifiers.QualifierCollector;
  let resourceTypes: TsRes.ResourceTypes.ResourceTypeCollector;
  let resourceManager: TsRes.Resources.ResourceManagerBuilder;
  let contextProvider: TsRes.Runtime.ValidatingSimpleContextQualifierProvider;
  let resolver: TsRes.Runtime.ResourceResolver;

  beforeEach(() => {
    // Set up qualifier types
    qualifierTypes = TsRes.QualifierTypes.QualifierTypeCollector.create({
      qualifierTypes: [
        TsRes.QualifierTypes.LanguageQualifierType.create().orThrow(),
        TsRes.QualifierTypes.TerritoryQualifierType.create().orThrow(),
        TsRes.QualifierTypes.LiteralQualifierType.create({
          name: 'tone',
          enumeratedValues: ['formal', 'standard', 'informal']
        }).orThrow()
      ]
    }).orThrow();

    // Set up qualifiers
    qualifiers = TsRes.Qualifiers.QualifierCollector.create({
      qualifierTypes,
      qualifiers: [
        { name: 'language', typeName: 'language', defaultPriority: 600 },
        { name: 'territory', typeName: 'territory', defaultPriority: 700 },
        { name: 'tone', typeName: 'tone', defaultPriority: 500 }
      ]
    }).orThrow();

    // Set up resource types
    resourceTypes = TsRes.ResourceTypes.ResourceTypeCollector.create({
      resourceTypes: [TsRes.ResourceTypes.JsonResourceType.create().orThrow()]
    }).orThrow();

    // Set up resource manager
    resourceManager = TsRes.Resources.ResourceManagerBuilder.create({
      qualifiers,
      resourceTypes
    }).orThrow();

    // Add test resources for tree testing
    resourceManager
      .addResource({
        id: 'app.messages.greeting',
        resourceTypeName: 'json',
        candidates: [
          {
            json: { text: 'Hello!', tone: 'formal' },
            conditions: { language: 'en', tone: 'formal' }
          },
          {
            json: { text: 'Hi there!' },
            conditions: { language: 'en', tone: 'standard' }
          }
        ]
      })
      .orThrow();

    resourceManager
      .addResource({
        id: 'app.messages.farewell',
        resourceTypeName: 'json',
        candidates: [
          {
            json: { text: 'Goodbye!' },
            conditions: { language: 'en' }
          }
        ]
      })
      .orThrow();

    resourceManager
      .addResource({
        id: 'app.config.timeout',
        resourceTypeName: 'json',
        candidates: [
          {
            json: { timeout: 5000 },
            conditions: {}
          }
        ]
      })
      .orThrow();

    resourceManager
      .addResource({
        id: 'simple',
        resourceTypeName: 'json',
        candidates: [
          {
            json: { value: 'simple value' },
            conditions: {}
          }
        ]
      })
      .orThrow();

    resourceManager
      .addResource({
        id: 'complex',
        resourceTypeName: 'json',
        candidates: [
          {
            json: { nested: { value: 'complex object' }, array: [1, 2, 3] },
            conditions: {}
          }
        ]
      })
      .orThrow();

    resourceManager
      .addResource({
        id: 'broken',
        resourceTypeName: 'json',
        candidates: [
          {
            json: { text: 'This will never match' },
            conditions: { language: 'zh', territory: 'CN' } // Unmatchable conditions (Chinese China, but context is en-US)
          }
        ]
      })
      .orThrow();

    resourceManager
      .addResource({
        id: 'broken2',
        resourceTypeName: 'json',
        candidates: [
          {
            json: { text: 'This will also never match' },
            conditions: { language: 'de', territory: 'DE' } // Unmatchable conditions
          }
        ]
      })
      .orThrow();

    // Set up context provider
    contextProvider = TsRes.Runtime.ValidatingSimpleContextQualifierProvider.create({
      qualifiers,
      qualifierValues: {
        language: 'en',
        territory: 'US',
        tone: 'standard'
      }
    }).orThrow();

    // Build the resource manager first
    resourceManager.build().orThrow();

    // Create resolver
    resolver = TsRes.Runtime.ResourceResolver.create({
      resourceManager,
      qualifierTypes,
      contextQualifierProvider: contextProvider
    }).orThrow();
  });

  describe('leaf nodes', () => {
    test('should resolve single leaf node resource value', () => {
      const simpleResource = resourceManager.getBuiltResource('simple').orThrow();
      const leafNode = TsRes.Runtime.ResourceTree.ReadOnlyResourceTreeLeaf.create(
        'simple' as ResourceName,
        undefined,
        simpleResource
      ).orThrow();

      expect(resolver.resolveComposedResourceTree(leafNode)).toSucceedAndSatisfy((result) => {
        expect(result).toEqual({ value: 'simple value' });
      });
    });

    test('should resolve leaf node with complex object value', () => {
      const complexResource = resourceManager.getBuiltResource('complex').orThrow();
      const leafNode = TsRes.Runtime.ResourceTree.ReadOnlyResourceTreeLeaf.create(
        'complex' as ResourceName,
        undefined,
        complexResource
      ).orThrow();

      expect(resolver.resolveComposedResourceTree(leafNode)).toSucceedWith({
        nested: { value: 'complex object' },
        array: [1, 2, 3]
      });
    });

    test('should wrap non-object root leaf values in value property', () => {
      const timeoutResource = resourceManager.getBuiltResource('app.config.timeout').orThrow();
      const leafNode = TsRes.Runtime.ResourceTree.ReadOnlyResourceTreeLeaf.create(
        'timeout' as ResourceName,
        undefined,
        timeoutResource
      ).orThrow();

      expect(resolver.resolveComposedResourceTree(leafNode)).toSucceedAndSatisfy((result) => {
        expect(result).toEqual({ timeout: 5000 });
      });
    });

    test('should preserve object structure for root leaf with object value', () => {
      const greetingResource = resourceManager.getBuiltResource('app.messages.greeting').orThrow();
      const leafNode = TsRes.Runtime.ResourceTree.ReadOnlyResourceTreeLeaf.create(
        'greeting' as ResourceName,
        undefined,
        greetingResource
      ).orThrow();

      expect(resolver.resolveComposedResourceTree(leafNode)).toSucceedWith({
        text: 'Hi there!'
      });
    });
  });

  describe('branch nodes', () => {
    test('should resolve empty branch node to empty object', () => {
      const emptyBranchNode = TsRes.Runtime.ResourceTree.ReadOnlyResourceTreeBranch.create(
        'empty' as ResourceName,
        undefined,
        {
          children: {} as Record<
            ResourceName,
            TsRes.Runtime.ResourceTree.ResourceTreeNodeInit<TsRes.Runtime.IResource>
          >
        }
      ).orThrow();

      expect(resolver.resolveComposedResourceTree(emptyBranchNode)).toSucceedWith({});
    });

    test('should recursively resolve branch with single child', () => {
      const simpleResource = resourceManager.getBuiltResource('simple').orThrow();

      const branchNode = TsRes.Runtime.ResourceTree.ReadOnlyResourceTreeBranch.create(
        'parent' as ResourceName,
        undefined,
        {
          children: {
            child: { resource: simpleResource }
          } as Record<ResourceName, TsRes.Runtime.ResourceTree.ResourceTreeNodeInit<TsRes.Runtime.IResource>>
        }
      ).orThrow();

      expect(resolver.resolveComposedResourceTree(branchNode)).toSucceedWith({
        child: { value: 'simple value' }
      });
    });

    test('should recursively resolve complex nested tree structure', () => {
      const greetingResource = resourceManager.getBuiltResource('app.messages.greeting').orThrow();
      const farewellResource = resourceManager.getBuiltResource('app.messages.farewell').orThrow();
      const timeoutResource = resourceManager.getBuiltResource('app.config.timeout').orThrow();

      const appBranch = TsRes.Runtime.ResourceTree.ReadOnlyResourceTreeBranch.create(
        'app' as ResourceName,
        undefined,
        {
          children: {
            messages: {
              children: {
                greeting: { resource: greetingResource },
                farewell: { resource: farewellResource }
              } as Record<
                ResourceName,
                TsRes.Runtime.ResourceTree.ResourceTreeNodeInit<TsRes.Runtime.IResource>
              >
            },
            config: {
              children: {
                timeout: { resource: timeoutResource }
              } as Record<
                ResourceName,
                TsRes.Runtime.ResourceTree.ResourceTreeNodeInit<TsRes.Runtime.IResource>
              >
            }
          } as Record<ResourceName, TsRes.Runtime.ResourceTree.ResourceTreeNodeInit<TsRes.Runtime.IResource>>
        }
      ).orThrow();

      expect(resolver.resolveComposedResourceTree(appBranch)).toSucceedWith({
        messages: {
          greeting: { text: 'Hi there!' },
          farewell: { text: 'Goodbye!' }
        },
        config: {
          timeout: { timeout: 5000 }
        }
      });
    });

    test('should handle mixed leaf and branch nodes at same level', () => {
      const simpleResource = resourceManager.getBuiltResource('simple').orThrow();
      const complexResource = resourceManager.getBuiltResource('complex').orThrow();

      const mixedBranch = TsRes.Runtime.ResourceTree.ReadOnlyResourceTreeBranch.create(
        'mixed' as ResourceName,
        undefined,
        {
          children: {
            simple: { resource: simpleResource },
            branch: {
              children: {
                nested: { resource: complexResource }
              } as Record<
                ResourceName,
                TsRes.Runtime.ResourceTree.ResourceTreeNodeInit<TsRes.Runtime.IResource>
              >
            }
          } as Record<ResourceName, TsRes.Runtime.ResourceTree.ResourceTreeNodeInit<TsRes.Runtime.IResource>>
        }
      ).orThrow();

      expect(resolver.resolveComposedResourceTree(mixedBranch)).toSucceedWith({
        simple: { value: 'simple value' },
        branch: {
          nested: { nested: { value: 'complex object' }, array: [1, 2, 3] }
        }
      });
    });
  });

  describe('error handling - fail mode', () => {
    test('should fail immediately for broken root leaf resource', () => {
      const brokenResource = resourceManager.getBuiltResource('broken').orThrow();
      const leafNode = TsRes.Runtime.ResourceTree.ReadOnlyResourceTreeLeaf.create(
        'broken' as ResourceName,
        undefined,
        brokenResource
      ).orThrow();

      expect(resolver.resolveComposedResourceTree(leafNode, { onResourceError: 'fail' })).toFailWith(
        /No matching candidates found/
      );
    });

    test('should aggregate errors from multiple failed resources in tree', () => {
      const brokenResource = resourceManager.getBuiltResource('broken').orThrow();
      const validResource = resourceManager.getBuiltResource('simple').orThrow();

      const branchNode = TsRes.Runtime.ResourceTree.ReadOnlyResourceTreeBranch.create(
        'test' as ResourceName,
        undefined,
        {
          children: {
            broken1: { resource: brokenResource },
            valid: { resource: validResource },
            broken2: { resource: brokenResource }
          } as Record<ResourceName, TsRes.Runtime.ResourceTree.ResourceTreeNodeInit<TsRes.Runtime.IResource>>
        }
      ).orThrow();

      expect(resolver.resolveComposedResourceTree(branchNode, { onResourceError: 'fail' })).toFailWith(
        /broken1.*No matching candidates.*broken2.*No matching candidates/
      );
    });

    test('should include path information in aggregated error messages', () => {
      const brokenResource = resourceManager.getBuiltResource('broken').orThrow();

      const appBranch = TsRes.Runtime.ResourceTree.ReadOnlyResourceTreeBranch.create(
        'app' as ResourceName,
        undefined,
        {
          children: {
            deep: {
              children: {
                nested: {
                  children: {
                    broken: { resource: brokenResource }
                  } as Record<
                    ResourceName,
                    TsRes.Runtime.ResourceTree.ResourceTreeNodeInit<TsRes.Runtime.IResource>
                  >
                }
              } as Record<
                ResourceName,
                TsRes.Runtime.ResourceTree.ResourceTreeNodeInit<TsRes.Runtime.IResource>
              >
            }
          } as Record<ResourceName, TsRes.Runtime.ResourceTree.ResourceTreeNodeInit<TsRes.Runtime.IResource>>
        }
      ).orThrow();

      expect(resolver.resolveComposedResourceTree(appBranch, { onResourceError: 'fail' })).toFailWith(
        /deep\.nested\.broken.*No matching candidates/
      );
    });
  });

  describe('error handling - ignore mode', () => {
    test('should return empty object for broken root leaf resource', () => {
      const brokenResource = resourceManager.getBuiltResource('broken').orThrow();
      const leafNode = TsRes.Runtime.ResourceTree.ReadOnlyResourceTreeLeaf.create(
        'broken' as ResourceName,
        undefined,
        brokenResource
      ).orThrow();

      expect(resolver.resolveComposedResourceTree(leafNode, { onResourceError: 'ignore' })).toSucceedWith(
        undefined
      );
    });

    test('should omit failed properties from result object', () => {
      const brokenResource = resourceManager.getBuiltResource('broken').orThrow();
      const validResource = resourceManager.getBuiltResource('simple').orThrow();

      const branchNode = TsRes.Runtime.ResourceTree.ReadOnlyResourceTreeBranch.create(
        'test' as ResourceName,
        undefined,
        {
          children: {
            valid1: { resource: validResource },
            broken: { resource: brokenResource },
            valid2: { resource: validResource }
          } as Record<ResourceName, TsRes.Runtime.ResourceTree.ResourceTreeNodeInit<TsRes.Runtime.IResource>>
        }
      ).orThrow();

      expect(resolver.resolveComposedResourceTree(branchNode, { onResourceError: 'ignore' })).toSucceedWith({
        valid1: { value: 'simple value' },
        valid2: { value: 'simple value' }
        // broken property should be omitted
      });
    });

    test('should handle nested branches with mixed success/failure', () => {
      const brokenResource = resourceManager.getBuiltResource('broken').orThrow();
      const validResource = resourceManager.getBuiltResource('simple').orThrow();

      const appBranch = TsRes.Runtime.ResourceTree.ReadOnlyResourceTreeBranch.create(
        'app' as ResourceName,
        undefined,
        {
          children: {
            bad: {
              children: {
                broken: { resource: brokenResource }
              } as Record<
                ResourceName,
                TsRes.Runtime.ResourceTree.ResourceTreeNodeInit<TsRes.Runtime.IResource>
              >
            },
            good: {
              children: {
                valid: { resource: validResource }
              } as Record<
                ResourceName,
                TsRes.Runtime.ResourceTree.ResourceTreeNodeInit<TsRes.Runtime.IResource>
              >
            }
          } as Record<ResourceName, TsRes.Runtime.ResourceTree.ResourceTreeNodeInit<TsRes.Runtime.IResource>>
        }
      ).orThrow();

      expect(resolver.resolveComposedResourceTree(appBranch, { onResourceError: 'ignore' })).toSucceedWith({
        bad: {}, // Empty branch when all children failed
        good: {
          valid: { value: 'simple value' }
        }
      });
    });
  });

  describe('error handling - custom handler', () => {
    test('should use custom handler return value for failed resources', () => {
      const brokenResource = resourceManager.getBuiltResource('broken').orThrow();
      const leafNode = TsRes.Runtime.ResourceTree.ReadOnlyResourceTreeLeaf.create(
        'broken' as ResourceName,
        undefined,
        brokenResource
      ).orThrow();

      const customHandler: TsRes.Runtime.ResourceErrorHandler = (resource, message, resolver) => {
        if (resource.id === 'broken') {
          return succeed({ fallback: 'default value' });
        }
        return fail(`Unhandled error: ${message}`);
      };

      expect(
        resolver.resolveComposedResourceTree(leafNode, { onResourceError: customHandler })
      ).toSucceedWith({
        fallback: 'default value'
      });
    });

    test('should omit properties when custom handler returns undefined', () => {
      const brokenResource = resourceManager.getBuiltResource('broken').orThrow();
      const validResource = resourceManager.getBuiltResource('simple').orThrow();

      const branchNode = TsRes.Runtime.ResourceTree.ReadOnlyResourceTreeBranch.create(
        'test' as ResourceName,
        undefined,
        {
          children: {
            broken: { resource: brokenResource },
            valid: { resource: validResource }
          } as Record<ResourceName, TsRes.Runtime.ResourceTree.ResourceTreeNodeInit<TsRes.Runtime.IResource>>
        }
      ).orThrow();

      const customHandler: TsRes.Runtime.ResourceErrorHandler = (resource, message, resolver) => {
        return succeed(undefined); // Omit the property
      };

      expect(
        resolver.resolveComposedResourceTree(branchNode, { onResourceError: customHandler })
      ).toSucceedWith({
        valid: { value: 'simple value' }
        // broken property omitted due to undefined return
      });
    });

    test('should aggregate errors when custom handler returns failure', () => {
      const brokenResource = resourceManager.getBuiltResource('broken').orThrow();

      const branchNode = TsRes.Runtime.ResourceTree.ReadOnlyResourceTreeBranch.create(
        'test' as ResourceName,
        undefined,
        {
          children: {
            broken1: { resource: brokenResource },
            broken2: { resource: brokenResource }
          } as Record<ResourceName, TsRes.Runtime.ResourceTree.ResourceTreeNodeInit<TsRes.Runtime.IResource>>
        }
      ).orThrow();

      const customHandler: TsRes.Runtime.ResourceErrorHandler = (resource, message, resolver) => {
        return fail(`Custom error for ${resource.id}: ${message}`);
      };

      expect(
        resolver.resolveComposedResourceTree(branchNode, { onResourceError: customHandler })
      ).toSucceedWith({}); // Both properties omitted due to handler returning failures
    });

    test('should handle mixed success, omitted, and replacement values from custom handler', () => {
      const brokenResource = resourceManager.getBuiltResource('broken').orThrow();
      const validResource = resourceManager.getBuiltResource('simple').orThrow();
      const broken2Resource = resourceManager.getBuiltResource('broken2').orThrow();

      const branchNode = TsRes.Runtime.ResourceTree.ReadOnlyResourceTreeBranch.create(
        'test' as ResourceName,
        undefined,
        {
          children: {
            broken1: { resource: brokenResource },
            valid: { resource: validResource },
            broken2: { resource: broken2Resource }
          } as Record<ResourceName, TsRes.Runtime.ResourceTree.ResourceTreeNodeInit<TsRes.Runtime.IResource>>
        }
      ).orThrow();

      const customHandler: TsRes.Runtime.ResourceErrorHandler = (resource, message, resolver) => {
        if (resource.id === 'broken') {
          return succeed(undefined); // Omit property
        } else if (resource.id === 'broken2') {
          return succeed('replacement value'); // Use replacement
        }
        return fail(`Unhandled error: ${message}`);
      };

      expect(
        resolver.resolveComposedResourceTree(branchNode, { onResourceError: customHandler })
      ).toSucceedWith({
        valid: { value: 'simple value' },
        broken2: 'replacement value'
        // broken1 omitted
      });
    });

    test('should fail for root leaf when custom handler returns failure', () => {
      const brokenResource = resourceManager.getBuiltResource('broken').orThrow();
      const leafNode = TsRes.Runtime.ResourceTree.ReadOnlyResourceTreeLeaf.create(
        'broken' as ResourceName,
        undefined,
        brokenResource
      ).orThrow();

      const customHandler: TsRes.Runtime.ResourceErrorHandler = (resource, message, resolver) => {
        return fail(`Custom root error: ${message}`);
      };

      expect(resolver.resolveComposedResourceTree(leafNode, { onResourceError: customHandler })).toFailWith(
        /Custom root error.*No matching candidates/
      );
    });

    test('should return empty object for root leaf when custom handler returns undefined', () => {
      const brokenResource = resourceManager.getBuiltResource('broken').orThrow();
      const leafNode = TsRes.Runtime.ResourceTree.ReadOnlyResourceTreeLeaf.create(
        'broken' as ResourceName,
        undefined,
        brokenResource
      ).orThrow();

      const customHandler: TsRes.Runtime.ResourceErrorHandler = (resource, message, resolver) => {
        return succeed(undefined);
      };

      expect(
        resolver.resolveComposedResourceTree(leafNode, { onResourceError: customHandler })
      ).toSucceedWith(undefined);
    });
  });

  describe('empty branch handling', () => {
    test('should include empty branches with onEmptyBranch: allow', () => {
      const brokenResource = resourceManager.getBuiltResource('broken').orThrow();

      const branchNode = TsRes.Runtime.ResourceTree.ReadOnlyResourceTreeBranch.create(
        'test' as ResourceName,
        undefined,
        {
          children: {
            emptyBranch: {
              children: {
                broken: { resource: brokenResource }
              } as Record<
                ResourceName,
                TsRes.Runtime.ResourceTree.ResourceTreeNodeInit<TsRes.Runtime.IResource>
              >
            }
          } as Record<ResourceName, TsRes.Runtime.ResourceTree.ResourceTreeNodeInit<TsRes.Runtime.IResource>>
        }
      ).orThrow();

      expect(
        resolver.resolveComposedResourceTree(branchNode, {
          onResourceError: 'ignore',
          onEmptyBranch: 'allow'
        })
      ).toSucceedWith({
        emptyBranch: {} // Empty branch included
      });
    });

    test('should omit empty branches with onEmptyBranch: omit', () => {
      const brokenResource = resourceManager.getBuiltResource('broken').orThrow();
      const validResource = resourceManager.getBuiltResource('simple').orThrow();

      const branchNode = TsRes.Runtime.ResourceTree.ReadOnlyResourceTreeBranch.create(
        'test' as ResourceName,
        undefined,
        {
          children: {
            emptyBranch: {
              children: {
                broken: { resource: brokenResource }
              } as Record<
                ResourceName,
                TsRes.Runtime.ResourceTree.ResourceTreeNodeInit<TsRes.Runtime.IResource>
              >
            },
            validBranch: {
              children: {
                valid: { resource: validResource }
              } as Record<
                ResourceName,
                TsRes.Runtime.ResourceTree.ResourceTreeNodeInit<TsRes.Runtime.IResource>
              >
            }
          } as Record<ResourceName, TsRes.Runtime.ResourceTree.ResourceTreeNodeInit<TsRes.Runtime.IResource>>
        }
      ).orThrow();

      expect(
        resolver.resolveComposedResourceTree(branchNode, {
          onResourceError: 'ignore',
          onEmptyBranch: 'omit'
        })
      ).toSucceedWith({
        validBranch: {
          valid: { value: 'simple value' }
        }
        // emptyBranch omitted
      });
    });

    test('should return undefined for root empty branch with onEmptyBranch: omit', () => {
      const brokenResource = resourceManager.getBuiltResource('broken').orThrow();

      const emptyRootBranch = TsRes.Runtime.ResourceTree.ReadOnlyResourceTreeBranch.create(
        'empty' as ResourceName,
        undefined,
        {
          children: {
            broken: { resource: brokenResource }
          } as Record<ResourceName, TsRes.Runtime.ResourceTree.ResourceTreeNodeInit<TsRes.Runtime.IResource>>
        }
      ).orThrow();

      expect(
        resolver.resolveComposedResourceTree(emptyRootBranch, {
          onResourceError: 'ignore',
          onEmptyBranch: 'omit'
        })
      ).toSucceedWith(undefined);
    });

    test('should use custom EmptyBranchHandler for recovery', () => {
      const brokenResource = resourceManager.getBuiltResource('broken').orThrow();

      const branchNode = TsRes.Runtime.ResourceTree.ReadOnlyResourceTreeBranch.create(
        'test' as ResourceName,
        undefined,
        {
          children: {
            emptyBranch: {
              children: {
                broken: { resource: brokenResource }
              } as Record<
                ResourceName,
                TsRes.Runtime.ResourceTree.ResourceTreeNodeInit<TsRes.Runtime.IResource>
              >
            }
          } as Record<ResourceName, TsRes.Runtime.ResourceTree.ResourceTreeNodeInit<TsRes.Runtime.IResource>>
        }
      ).orThrow();

      const customEmptyHandler: TsRes.Runtime.EmptyBranchHandler = (
        branchNode,
        failedChildNames,
        resolver
      ) => {
        expect(failedChildNames).toEqual(['broken']);
        expect(branchNode.name).toBe('emptyBranch');
        expect(resolver).toBeDefined();

        // Provide fallback content for empty branch
        return succeed({ fallbackMessage: 'No content available' });
      };

      expect(
        resolver.resolveComposedResourceTree(branchNode, {
          onResourceError: 'ignore',
          onEmptyBranch: customEmptyHandler
        })
      ).toSucceedWith({
        emptyBranch: { fallbackMessage: 'No content available' }
      });
    });

    test('should handle custom EmptyBranchHandler that returns undefined', () => {
      const brokenResource = resourceManager.getBuiltResource('broken').orThrow();
      const validResource = resourceManager.getBuiltResource('simple').orThrow();

      const branchNode = TsRes.Runtime.ResourceTree.ReadOnlyResourceTreeBranch.create(
        'test' as ResourceName,
        undefined,
        {
          children: {
            emptyBranch: {
              children: {
                broken: { resource: brokenResource }
              } as Record<
                ResourceName,
                TsRes.Runtime.ResourceTree.ResourceTreeNodeInit<TsRes.Runtime.IResource>
              >
            },
            validBranch: {
              children: {
                valid: { resource: validResource }
              } as Record<
                ResourceName,
                TsRes.Runtime.ResourceTree.ResourceTreeNodeInit<TsRes.Runtime.IResource>
              >
            }
          } as Record<ResourceName, TsRes.Runtime.ResourceTree.ResourceTreeNodeInit<TsRes.Runtime.IResource>>
        }
      ).orThrow();

      const customEmptyHandler: TsRes.Runtime.EmptyBranchHandler = (
        branchNode,
        failedChildNames,
        resolver
      ) => {
        return succeed(undefined); // Omit empty branch
      };

      expect(
        resolver.resolveComposedResourceTree(branchNode, {
          onResourceError: 'ignore',
          onEmptyBranch: customEmptyHandler
        })
      ).toSucceedWith({
        validBranch: {
          valid: { value: 'simple value' }
        }
        // emptyBranch omitted due to handler returning undefined
      });
    });

    test('should handle custom EmptyBranchHandler that fails', () => {
      const brokenResource = resourceManager.getBuiltResource('broken').orThrow();

      const branchNode = TsRes.Runtime.ResourceTree.ReadOnlyResourceTreeBranch.create(
        'test' as ResourceName,
        undefined,
        {
          children: {
            emptyBranch: {
              children: {
                broken: { resource: brokenResource }
              } as Record<
                ResourceName,
                TsRes.Runtime.ResourceTree.ResourceTreeNodeInit<TsRes.Runtime.IResource>
              >
            }
          } as Record<ResourceName, TsRes.Runtime.ResourceTree.ResourceTreeNodeInit<TsRes.Runtime.IResource>>
        }
      ).orThrow();

      const customEmptyHandler: TsRes.Runtime.EmptyBranchHandler = (
        branchNode,
        failedChildNames,
        resolver
      ) => {
        return fail(`Empty branch error: test had ${failedChildNames.length} failed children`);
      };

      expect(
        resolver.resolveComposedResourceTree(branchNode, {
          onResourceError: 'ignore',
          onEmptyBranch: customEmptyHandler
        })
      ).toFailWith(/Empty branch error: test had 1 failed children/);
    });

    test('should handle nested empty branches with different modes', () => {
      const brokenResource = resourceManager.getBuiltResource('broken').orThrow();
      const validResource = resourceManager.getBuiltResource('simple').orThrow();

      const complexBranch = TsRes.Runtime.ResourceTree.ReadOnlyResourceTreeBranch.create(
        'root' as ResourceName,
        undefined,
        {
          children: {
            level1: {
              children: {
                emptyLevel2: {
                  children: {
                    broken: { resource: brokenResource }
                  } as Record<
                    ResourceName,
                    TsRes.Runtime.ResourceTree.ResourceTreeNodeInit<TsRes.Runtime.IResource>
                  >
                },
                validLevel2: {
                  children: {
                    valid: { resource: validResource }
                  } as Record<
                    ResourceName,
                    TsRes.Runtime.ResourceTree.ResourceTreeNodeInit<TsRes.Runtime.IResource>
                  >
                }
              } as Record<
                ResourceName,
                TsRes.Runtime.ResourceTree.ResourceTreeNodeInit<TsRes.Runtime.IResource>
              >
            }
          } as Record<ResourceName, TsRes.Runtime.ResourceTree.ResourceTreeNodeInit<TsRes.Runtime.IResource>>
        }
      ).orThrow();

      expect(
        resolver.resolveComposedResourceTree(complexBranch, {
          onResourceError: 'ignore',
          onEmptyBranch: 'omit'
        })
      ).toSucceedWith({
        level1: {
          validLevel2: {
            valid: { value: 'simple value' }
          }
          // emptyLevel2 omitted
        }
      });
    });
  });

  describe('default options', () => {
    test('should use fail mode by default', () => {
      const brokenResource = resourceManager.getBuiltResource('broken').orThrow();
      const leafNode = TsRes.Runtime.ResourceTree.ReadOnlyResourceTreeLeaf.create(
        'broken' as ResourceName,
        undefined,
        brokenResource
      ).orThrow();

      // No options provided - should default to 'fail'
      expect(resolver.resolveComposedResourceTree(leafNode)).toFailWith(/No matching candidates found/);
    });

    test('should explicitly handle fail mode the same as default', () => {
      const brokenResource = resourceManager.getBuiltResource('broken').orThrow();
      const leafNode = TsRes.Runtime.ResourceTree.ReadOnlyResourceTreeLeaf.create(
        'broken' as ResourceName,
        undefined,
        brokenResource
      ).orThrow();

      const defaultResult = resolver.resolveComposedResourceTree(leafNode);
      const explicitResult = resolver.resolveComposedResourceTree(leafNode, { onResourceError: 'fail' });

      expect(defaultResult).toFail();
      expect(explicitResult).toFail();
      expect(defaultResult.message).toBe(explicitResult.message);
    });

    test('should use onEmptyBranch: allow by default', () => {
      const emptyBranchNode = TsRes.Runtime.ResourceTree.ReadOnlyResourceTreeBranch.create(
        'empty' as ResourceName,
        undefined,
        {
          children: {} as Record<
            ResourceName,
            TsRes.Runtime.ResourceTree.ResourceTreeNodeInit<TsRes.Runtime.IResource>
          >
        }
      ).orThrow();

      const defaultResult = resolver.resolveComposedResourceTree(emptyBranchNode);
      const explicitResult = resolver.resolveComposedResourceTree(emptyBranchNode, {
        onEmptyBranch: 'allow'
      });

      expect(defaultResult).toSucceedWith({});
      expect(explicitResult).toSucceedWith({});
    });

    test('should use both defaults when no options provided', () => {
      const brokenResource = resourceManager.getBuiltResource('broken').orThrow();
      const emptyBranchNode = TsRes.Runtime.ResourceTree.ReadOnlyResourceTreeBranch.create(
        'test' as ResourceName,
        undefined,
        {
          children: {
            broken: { resource: brokenResource }
          } as Record<ResourceName, TsRes.Runtime.ResourceTree.ResourceTreeNodeInit<TsRes.Runtime.IResource>>
        }
      ).orThrow();

      // Should fail due to onResourceError: 'fail' default
      expect(resolver.resolveComposedResourceTree(emptyBranchNode)).toFailWith(/No matching candidates/);
    });
  });

  describe('recovery mechanisms', () => {
    test('should use resolver in ResourceErrorHandler for fallback resolution', () => {
      const brokenResource = resourceManager.getBuiltResource('broken').orThrow();
      const leafNode = TsRes.Runtime.ResourceTree.ReadOnlyResourceTreeLeaf.create(
        'broken' as ResourceName,
        undefined,
        brokenResource
      ).orThrow();

      const recoveryHandler: TsRes.Runtime.ResourceErrorHandler = (resource, message, resolver) => {
        // Try to resolve a fallback resource using the provided resolver
        const fallbackResult = resolver.resolveResource('simple' as ResourceId);
        return fallbackResult.onSuccess((candidate) => {
          return succeed({
            fallback: true,
            originalId: resource.id,
            fallbackValue: candidate.json
          });
        });
      };

      expect(
        resolver.resolveComposedResourceTree(leafNode, { onResourceError: recoveryHandler })
      ).toSucceedAndSatisfy((result) => {
        expect(result).toEqual({
          fallback: true,
          originalId: 'broken',
          fallbackValue: { value: 'simple value' }
        });
      });
    });

    test('should use resolver in EmptyBranchHandler for template injection', () => {
      const brokenResource = resourceManager.getBuiltResource('broken').orThrow();

      const branchNode = TsRes.Runtime.ResourceTree.ReadOnlyResourceTreeBranch.create(
        'test' as ResourceName,
        undefined,
        {
          children: {
            emptyBranch: {
              children: {
                broken: { resource: brokenResource }
              } as Record<
                ResourceName,
                TsRes.Runtime.ResourceTree.ResourceTreeNodeInit<TsRes.Runtime.IResource>
              >
            }
          } as Record<ResourceName, TsRes.Runtime.ResourceTree.ResourceTreeNodeInit<TsRes.Runtime.IResource>>
        }
      ).orThrow();

      const templateHandler: TsRes.Runtime.EmptyBranchHandler = (branchNode, failedChildNames, resolver) => {
        // Inject template content using resolver
        const templateResult = resolver.resolveResource('app.config.timeout' as ResourceId);
        return templateResult.onSuccess((candidate) => {
          return succeed({
            template: true,
            branchName: branchNode.name,
            failedChildren: failedChildNames,
            templateValue: candidate.json
          });
        });
      };

      expect(
        resolver.resolveComposedResourceTree(branchNode, {
          onResourceError: 'ignore',
          onEmptyBranch: templateHandler
        })
      ).toSucceedAndSatisfy((result) => {
        expect(result).toEqual({
          emptyBranch: {
            template: true,
            branchName: 'emptyBranch',
            failedChildren: ['broken'],
            templateValue: { timeout: 5000 }
          }
        });
      });
    });

    test('should handle context switching in recovery handlers', () => {
      const brokenResource = resourceManager.getBuiltResource('broken').orThrow();

      const leafNode = TsRes.Runtime.ResourceTree.ReadOnlyResourceTreeLeaf.create(
        'broken' as ResourceName,
        undefined,
        brokenResource
      ).orThrow();

      const contextSwitchHandler: TsRes.Runtime.ResourceErrorHandler = (resource, message, resolver) => {
        // Try to create a new context with different qualifiers for recovery
        const newContextProvider = TsRes.Runtime.ValidatingSimpleContextQualifierProvider.create({
          qualifiers,
          qualifierValues: {
            language: 'en',
            territory: 'US',
            tone: 'formal' // Switch to formal tone
          }
        }).orThrow();

        const newResolver = TsRes.Runtime.ResourceResolver.create({
          resourceManager,
          qualifierTypes,
          contextQualifierProvider: newContextProvider
        }).orThrow();

        // Try to resolve the same resource with different context
        const recoveryResult = newResolver.resolveResource(resource.id);
        return recoveryResult
          .onSuccess((candidate) => {
            return succeed({
              recovered: true,
              context: 'formal',
              value: candidate.json
            });
          })
          .onFailure(() => {
            return succeed({
              recovered: false,
              context: 'formal',
              value: { noRecovery: true, originalError: message }
            });
          });
      };

      expect(
        resolver.resolveComposedResourceTree(leafNode, { onResourceError: contextSwitchHandler })
      ).toSucceedAndSatisfy((result) => {
        // The broken resource still can't resolve even with formal context, so we get noRecovery
        expect(result).toEqual({
          recovered: false,
          context: 'formal',
          value: {
            noRecovery: true,
            originalError: expect.stringMatching(/No matching candidates/)
          }
        });
      });
    });
  });

  describe('handler context validation', () => {
    test('should provide correct resource object to ResourceErrorHandler', () => {
      const brokenResource = resourceManager.getBuiltResource('broken').orThrow();
      const leafNode = TsRes.Runtime.ResourceTree.ReadOnlyResourceTreeLeaf.create(
        'broken' as ResourceName,
        undefined,
        brokenResource
      ).orThrow();

      const contextValidator: TsRes.Runtime.ResourceErrorHandler = (resource, message, resolver) => {
        // Validate resource object properties
        expect(resource).toBeDefined();
        expect(resource.id).toBe('broken');
        expect(resource.resourceType).toBeDefined();
        expect(resource.candidates).toBeDefined();
        expect(Array.isArray(resource.candidates)).toBe(true);
        expect(resource.candidates.length).toBe(1);

        // Validate message
        expect(typeof message).toBe('string');
        expect(message).toMatch(/No matching candidates/);

        // Validate resolver
        expect(resolver).toBeDefined();
        expect(typeof resolver.resolveResource).toBe('function');

        return succeed({ validated: true });
      };

      expect(
        resolver.resolveComposedResourceTree(leafNode, { onResourceError: contextValidator })
      ).toSucceedWith({
        validated: true
      });
    });

    test('should provide correct parameters to EmptyBranchHandler', () => {
      const brokenResource = resourceManager.getBuiltResource('broken').orThrow();
      const broken2Resource = resourceManager.getBuiltResource('broken2').orThrow();

      const branchNode = TsRes.Runtime.ResourceTree.ReadOnlyResourceTreeBranch.create(
        'testBranch' as ResourceName,
        undefined,
        {
          children: {
            emptyChild: {
              children: {
                broken1: { resource: brokenResource },
                broken2: { resource: broken2Resource }
              } as Record<
                ResourceName,
                TsRes.Runtime.ResourceTree.ResourceTreeNodeInit<TsRes.Runtime.IResource>
              >
            }
          } as Record<ResourceName, TsRes.Runtime.ResourceTree.ResourceTreeNodeInit<TsRes.Runtime.IResource>>
        }
      ).orThrow();

      const contextValidator: TsRes.Runtime.EmptyBranchHandler = (branchNode, failedChildNames, resolver) => {
        // Validate branch node
        expect(branchNode).toBeDefined();
        expect(branchNode.name).toBe('emptyChild');
        expect(branchNode.isBranch).toBe(true);

        // Validate failed child names
        expect(Array.isArray(failedChildNames)).toBe(true);
        expect(failedChildNames).toEqual(['broken1', 'broken2']);
        expect(failedChildNames.length).toBe(2);

        // Validate resolver
        expect(resolver).toBeDefined();
        expect(typeof resolver.resolveResource).toBe('function');

        return succeed({
          contextValidated: true,
          branchName: branchNode.name,
          failedCount: failedChildNames.length
        });
      };

      expect(
        resolver.resolveComposedResourceTree(branchNode, {
          onResourceError: 'ignore',
          onEmptyBranch: contextValidator
        })
      ).toSucceedWith({
        emptyChild: {
          contextValidated: true,
          branchName: 'emptyChild',
          failedCount: 2
        }
      });
    });

    test('should provide same resolver instance to both handler types', () => {
      const brokenResource = resourceManager.getBuiltResource('broken').orThrow();

      const branchNode = TsRes.Runtime.ResourceTree.ReadOnlyResourceTreeBranch.create(
        'test' as ResourceName,
        undefined,
        {
          children: {
            emptyBranch: {
              children: {
                broken: { resource: brokenResource }
              } as Record<
                ResourceName,
                TsRes.Runtime.ResourceTree.ResourceTreeNodeInit<TsRes.Runtime.IResource>
              >
            }
          } as Record<ResourceName, TsRes.Runtime.ResourceTree.ResourceTreeNodeInit<TsRes.Runtime.IResource>>
        }
      ).orThrow();

      let resourceHandlerResolver: TsRes.Runtime.ResourceResolver | undefined;
      let emptyBranchHandlerResolver: TsRes.Runtime.ResourceResolver | undefined;

      const resourceHandler: TsRes.Runtime.ResourceErrorHandler = (resource, message, resolver) => {
        resourceHandlerResolver = resolver;
        return succeed(undefined); // Let resource fail to trigger empty branch
      };

      const emptyBranchHandler: TsRes.Runtime.EmptyBranchHandler = (
        branchNode,
        failedChildNames,
        resolver
      ) => {
        emptyBranchHandlerResolver = resolver;
        return succeed({ bothReceived: true });
      };

      expect(
        resolver.resolveComposedResourceTree(branchNode, {
          onResourceError: resourceHandler,
          onEmptyBranch: emptyBranchHandler
        })
      ).toSucceedWith({
        emptyBranch: { bothReceived: true }
      });

      // Verify same resolver instance was passed to both handlers
      expect(resourceHandlerResolver).toBe(emptyBranchHandlerResolver);
      expect(resourceHandlerResolver).toBe(resolver);
    });
  });

  describe('return type validation', () => {
    test('should distinguish undefined from empty object for root nodes', () => {
      const brokenResource = resourceManager.getBuiltResource('broken').orThrow();

      // Test root leaf with ignore mode - should return undefined
      const leafNode = TsRes.Runtime.ResourceTree.ReadOnlyResourceTreeLeaf.create(
        'broken' as ResourceName,
        undefined,
        brokenResource
      ).orThrow();

      expect(resolver.resolveComposedResourceTree(leafNode, { onResourceError: 'ignore' })).toSucceedWith(
        undefined
      );

      // Test root empty branch with omit mode - should return undefined
      const emptyBranchNode = TsRes.Runtime.ResourceTree.ReadOnlyResourceTreeBranch.create(
        'empty' as ResourceName,
        undefined,
        {
          children: {
            broken: { resource: brokenResource }
          } as Record<ResourceName, TsRes.Runtime.ResourceTree.ResourceTreeNodeInit<TsRes.Runtime.IResource>>
        }
      ).orThrow();

      expect(
        resolver.resolveComposedResourceTree(emptyBranchNode, {
          onResourceError: 'ignore',
          onEmptyBranch: 'omit'
        })
      ).toSucceedWith(undefined);

      // Test root empty branch with allow mode - should return {}
      expect(
        resolver.resolveComposedResourceTree(emptyBranchNode, {
          onResourceError: 'ignore',
          onEmptyBranch: 'allow'
        })
      ).toSucceedWith({});
    });

    test('should handle mixed success and omit scenarios correctly', () => {
      const brokenResource = resourceManager.getBuiltResource('broken').orThrow();
      const validResource = resourceManager.getBuiltResource('simple').orThrow();

      const mixedBranchNode = TsRes.Runtime.ResourceTree.ReadOnlyResourceTreeBranch.create(
        'mixed' as ResourceName,
        undefined,
        {
          children: {
            valid: { resource: validResource },
            emptyBranch: {
              children: {
                broken: { resource: brokenResource }
              } as Record<
                ResourceName,
                TsRes.Runtime.ResourceTree.ResourceTreeNodeInit<TsRes.Runtime.IResource>
              >
            }
          } as Record<ResourceName, TsRes.Runtime.ResourceTree.ResourceTreeNodeInit<TsRes.Runtime.IResource>>
        }
      ).orThrow();

      // With omit mode, empty branch should be omitted but valid content preserved
      expect(
        resolver.resolveComposedResourceTree(mixedBranchNode, {
          onResourceError: 'ignore',
          onEmptyBranch: 'omit'
        })
      ).toSucceedWith({
        valid: { value: 'simple value' }
        // emptyBranch omitted
      });

      // With allow mode, empty branch should be included as {}
      expect(
        resolver.resolveComposedResourceTree(mixedBranchNode, {
          onResourceError: 'ignore',
          onEmptyBranch: 'allow'
        })
      ).toSucceedWith({
        valid: { value: 'simple value' },
        emptyBranch: {}
      });
    });

    test('should return Result<JsonObject | undefined> for all scenarios', () => {
      const validResource = resourceManager.getBuiltResource('simple').orThrow();
      const brokenResource = resourceManager.getBuiltResource('broken').orThrow();

      // Successful resolution returns JsonObject
      const validLeaf = TsRes.Runtime.ResourceTree.ReadOnlyResourceTreeLeaf.create(
        'valid' as ResourceName,
        undefined,
        validResource
      ).orThrow();

      expect(resolver.resolveComposedResourceTree(validLeaf)).toSucceedAndSatisfy((result) => {
        expect(result).toEqual({ value: 'simple value' });
        expect(typeof result).toBe('object');
        expect(result).not.toBe(undefined);
      });

      // Failed root leaf with ignore returns undefined
      const brokenLeaf = TsRes.Runtime.ResourceTree.ReadOnlyResourceTreeLeaf.create(
        'broken' as ResourceName,
        undefined,
        brokenResource
      ).orThrow();

      expect(
        resolver.resolveComposedResourceTree(brokenLeaf, { onResourceError: 'ignore' })
      ).toSucceedAndSatisfy((result) => {
        expect(result).toBe(undefined);
      });

      // Empty root branch with omit returns undefined
      const emptyBranch = TsRes.Runtime.ResourceTree.ReadOnlyResourceTreeBranch.create(
        'empty' as ResourceName,
        undefined,
        {
          children: {
            broken: { resource: brokenResource }
          } as Record<ResourceName, TsRes.Runtime.ResourceTree.ResourceTreeNodeInit<TsRes.Runtime.IResource>>
        }
      ).orThrow();

      expect(
        resolver.resolveComposedResourceTree(emptyBranch, {
          onResourceError: 'ignore',
          onEmptyBranch: 'omit'
        })
      ).toSucceedAndSatisfy((result) => {
        expect(result).toBe(undefined);
      });
    });
  });

  describe('deeply nested trees', () => {
    test('should handle very deep nesting levels', () => {
      const validResource = resourceManager.getBuiltResource('simple').orThrow();

      const branchA = TsRes.Runtime.ResourceTree.ReadOnlyResourceTreeBranch.create(
        'a' as ResourceName,
        undefined,
        {
          children: {
            b: {
              children: {
                c: {
                  children: {
                    d: {
                      children: {
                        e: { resource: validResource }
                      } as Record<
                        ResourceName,
                        TsRes.Runtime.ResourceTree.ResourceTreeNodeInit<TsRes.Runtime.IResource>
                      >
                    }
                  } as Record<
                    ResourceName,
                    TsRes.Runtime.ResourceTree.ResourceTreeNodeInit<TsRes.Runtime.IResource>
                  >
                }
              } as Record<
                ResourceName,
                TsRes.Runtime.ResourceTree.ResourceTreeNodeInit<TsRes.Runtime.IResource>
              >
            }
          } as Record<ResourceName, TsRes.Runtime.ResourceTree.ResourceTreeNodeInit<TsRes.Runtime.IResource>>
        }
      ).orThrow();

      expect(resolver.resolveComposedResourceTree(branchA)).toSucceedWith({
        b: {
          c: {
            d: {
              e: { value: 'simple value' }
            }
          }
        }
      });
    });

    test('should handle deep nesting with error paths and include full paths', () => {
      const brokenResource = resourceManager.getBuiltResource('broken').orThrow();

      const branch1 = TsRes.Runtime.ResourceTree.ReadOnlyResourceTreeBranch.create(
        'level1' as ResourceName,
        undefined,
        {
          children: {
            level2: {
              children: {
                level3: {
                  children: {
                    broken: { resource: brokenResource }
                  } as Record<
                    ResourceName,
                    TsRes.Runtime.ResourceTree.ResourceTreeNodeInit<TsRes.Runtime.IResource>
                  >
                }
              } as Record<
                ResourceName,
                TsRes.Runtime.ResourceTree.ResourceTreeNodeInit<TsRes.Runtime.IResource>
              >
            }
          } as Record<ResourceName, TsRes.Runtime.ResourceTree.ResourceTreeNodeInit<TsRes.Runtime.IResource>>
        }
      ).orThrow();

      expect(resolver.resolveComposedResourceTree(branch1, { onResourceError: 'fail' })).toFailWith(
        /level2\.level3\.broken.*No matching candidates/
      );
    });
  });
});
