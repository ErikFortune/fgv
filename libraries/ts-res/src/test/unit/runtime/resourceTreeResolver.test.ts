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

describe('ResourceTreeResolver', () => {
  let qualifierTypes: TsRes.QualifierTypes.QualifierTypeCollector;
  let qualifiers: TsRes.Qualifiers.QualifierCollector;
  let resourceTypes: TsRes.ResourceTypes.ResourceTypeCollector;
  let resourceManager: TsRes.Resources.ResourceManagerBuilder;
  let contextProvider: TsRes.Runtime.ValidatingSimpleContextQualifierProvider;
  let resourceResolver: TsRes.Runtime.ResourceResolver;
  let treeResolver: TsRes.Runtime.ResourceTreeResolver;

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
            conditions: { language: 'zh', territory: 'CN' } // Unmatchable conditions
          }
        ]
      })
      .orThrow();

    resourceManager
      .addResource({
        id: 'missing-in-tree',
        resourceTypeName: 'json',
        candidates: [
          {
            json: { text: 'This resource exists but is not in the tree' },
            conditions: {}
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

    // Create resource resolver
    resourceResolver = TsRes.Runtime.ResourceResolver.create({
      resourceManager,
      qualifierTypes,
      contextQualifierProvider: contextProvider
    }).orThrow();

    // Create tree resolver with resource manager for lazy construction
    treeResolver = new TsRes.Runtime.ResourceTreeResolver(resourceResolver, resourceManager);
  });

  describe('constructor', () => {
    test('should create ResourceTreeResolver with resource manager', () => {
      const resolver = new TsRes.Runtime.ResourceTreeResolver(resourceResolver, resourceManager);
      expect(resolver).toBeDefined();
    });

    test('should create ResourceTreeResolver without resource manager', () => {
      const resolver = new TsRes.Runtime.ResourceTreeResolver(resourceResolver);
      expect(resolver).toBeDefined();
    });
  });

  describe('overload: resolveComposedResourceTree(resourceId: string)', () => {
    test('should resolve single resource by ID', () => {
      expect(treeResolver.resolveComposedResourceTree('simple')).toSucceedWith({
        value: 'simple value'
      });
    });

    test('should resolve complex object resource by ID', () => {
      expect(treeResolver.resolveComposedResourceTree('complex')).toSucceedWith({
        nested: { value: 'complex object' },
        array: [1, 2, 3]
      });
    });

    test('should resolve nested tree structure by root ID', () => {
      expect(treeResolver.resolveComposedResourceTree('app')).toSucceedAndSatisfy((result) => {
        expect(result).toEqual({
          messages: {
            greeting: { text: 'Hi there!' },
            farewell: { text: 'Goodbye!' }
          },
          config: {
            timeout: { timeout: 5000 }
          }
        });
      });
    });

    test('should resolve subtree by partial ID', () => {
      expect(treeResolver.resolveComposedResourceTree('app.messages')).toSucceedWith({
        greeting: { text: 'Hi there!' },
        farewell: { text: 'Goodbye!' }
      });
    });

    test('should resolve leaf node by full ID', () => {
      expect(treeResolver.resolveComposedResourceTree('app.messages.greeting')).toSucceedWith({
        text: 'Hi there!'
      });
    });

    test('should fail when resource manager not provided', () => {
      const resolverWithoutManager = new TsRes.Runtime.ResourceTreeResolver(resourceResolver);

      expect(resolverWithoutManager.resolveComposedResourceTree('simple')).toFailWith(
        /Cannot resolve tree from resource ID 'simple': no resource manager provided/
      );
    });

    test('should fail with invalid resource ID', () => {
      expect(treeResolver.resolveComposedResourceTree('')).toFailWith(
        /Resource '' not found in resource tree/
      );
    });

    test('should fail with malformed resource ID', () => {
      expect(treeResolver.resolveComposedResourceTree('invalid..id')).toFailWith(
        /Resource 'invalid\.\.id' not found in resource tree/
      );
    });

    test('should fail when resource not found in tree', () => {
      // Try to resolve a resource ID that definitely doesn't exist
      expect(treeResolver.resolveComposedResourceTree('completely.nonexistent.resource')).toFailWith(
        /Resource 'completely\.nonexistent\.resource' not found in resource tree/
      );
    });

    test('should fail when resource exists but cannot be resolved', () => {
      expect(treeResolver.resolveComposedResourceTree('broken')).toFailWith(/No matching candidates found/);
    });

    test('should handle resource resolution with options - ignore mode', () => {
      expect(treeResolver.resolveComposedResourceTree('broken', { onResourceError: 'ignore' })).toSucceedWith(
        undefined
      );
    });

    test('should handle resource resolution with options - fail mode', () => {
      expect(treeResolver.resolveComposedResourceTree('broken', { onResourceError: 'fail' })).toFailWith(
        /No matching candidates found/
      );
    });

    test('should handle custom resource error handler', () => {
      const customHandler: TsRes.Runtime.ResourceErrorHandler = (resource, message, resolver) => {
        if (resource.id === 'broken') {
          return succeed({ fallback: 'default value' });
        }
        return fail(`Unhandled error: ${message}`);
      };

      expect(
        treeResolver.resolveComposedResourceTree('broken', { onResourceError: customHandler })
      ).toSucceedWith({
        fallback: 'default value'
      });
    });

    test('should fail when tree building fails', () => {
      // Create a resource manager that will fail when trying to get the built resource tree
      // We'll mock the getBuiltResourceTree method to return a failure
      const mockResourceManager = {
        getBuiltResourceTree: jest.fn().mockReturnValue(fail('Simulated tree building failure'))
      } as unknown as TsRes.Resources.ResourceManagerBuilder;

      const resolverWithBrokenManager = new TsRes.Runtime.ResourceTreeResolver(
        resourceResolver,
        mockResourceManager
      );

      expect(resolverWithBrokenManager.resolveComposedResourceTree('simple')).toFailWith(
        /Failed to build resource tree: Simulated tree building failure/
      );
    });
  });

  describe('overload: resolveComposedResourceTree(node: IReadOnlyResourceTreeNode)', () => {
    test('should resolve single leaf node', () => {
      const simpleResource = resourceManager.getBuiltResource('simple').orThrow();
      const leafNode = TsRes.Runtime.ResourceTree.ReadOnlyResourceTreeLeaf.create(
        'simple' as ResourceName,
        undefined,
        simpleResource
      ).orThrow();

      expect(treeResolver.resolveComposedResourceTree(leafNode)).toSucceedWith({
        value: 'simple value'
      });
    });

    test('should resolve complex object leaf node', () => {
      const complexResource = resourceManager.getBuiltResource('complex').orThrow();
      const leafNode = TsRes.Runtime.ResourceTree.ReadOnlyResourceTreeLeaf.create(
        'complex' as ResourceName,
        undefined,
        complexResource
      ).orThrow();

      expect(treeResolver.resolveComposedResourceTree(leafNode)).toSucceedWith({
        nested: { value: 'complex object' },
        array: [1, 2, 3]
      });
    });

    test('should resolve branch node with single child', () => {
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

      expect(treeResolver.resolveComposedResourceTree(branchNode)).toSucceedWith({
        child: { value: 'simple value' }
      });
    });

    test('should resolve complex nested tree structure', () => {
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

      expect(treeResolver.resolveComposedResourceTree(appBranch)).toSucceedWith({
        messages: {
          greeting: { text: 'Hi there!' },
          farewell: { text: 'Goodbye!' }
        },
        config: {
          timeout: { timeout: 5000 }
        }
      });
    });

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

      expect(treeResolver.resolveComposedResourceTree(emptyBranchNode)).toSucceedWith({});
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

      expect(treeResolver.resolveComposedResourceTree(mixedBranch)).toSucceedWith({
        simple: { value: 'simple value' },
        branch: {
          nested: { nested: { value: 'complex object' }, array: [1, 2, 3] }
        }
      });
    });
  });

  describe('error handling', () => {
    describe('resource resolution errors', () => {
      test('should fail with broken leaf resource in fail mode', () => {
        const brokenResource = resourceManager.getBuiltResource('broken').orThrow();
        const leafNode = TsRes.Runtime.ResourceTree.ReadOnlyResourceTreeLeaf.create(
          'broken' as ResourceName,
          undefined,
          brokenResource
        ).orThrow();

        expect(treeResolver.resolveComposedResourceTree(leafNode, { onResourceError: 'fail' })).toFailWith(
          /No matching candidates found/
        );
      });

      test('should return undefined for broken leaf resource in ignore mode', () => {
        const brokenResource = resourceManager.getBuiltResource('broken').orThrow();
        const leafNode = TsRes.Runtime.ResourceTree.ReadOnlyResourceTreeLeaf.create(
          'broken' as ResourceName,
          undefined,
          brokenResource
        ).orThrow();

        expect(
          treeResolver.resolveComposedResourceTree(leafNode, { onResourceError: 'ignore' })
        ).toSucceedWith(undefined);
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
            } as Record<
              ResourceName,
              TsRes.Runtime.ResourceTree.ResourceTreeNodeInit<TsRes.Runtime.IResource>
            >
          }
        ).orThrow();

        expect(treeResolver.resolveComposedResourceTree(branchNode, { onResourceError: 'fail' })).toFailWith(
          /broken1.*No matching candidates.*broken2.*No matching candidates/
        );
      });

      test('should use custom resource error handler', () => {
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
          treeResolver.resolveComposedResourceTree(leafNode, { onResourceError: customHandler })
        ).toSucceedWith({
          fallback: 'default value'
        });
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
            } as Record<
              ResourceName,
              TsRes.Runtime.ResourceTree.ResourceTreeNodeInit<TsRes.Runtime.IResource>
            >
          }
        ).orThrow();

        expect(
          treeResolver.resolveComposedResourceTree(branchNode, {
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
            } as Record<
              ResourceName,
              TsRes.Runtime.ResourceTree.ResourceTreeNodeInit<TsRes.Runtime.IResource>
            >
          }
        ).orThrow();

        expect(
          treeResolver.resolveComposedResourceTree(branchNode, {
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

      test('should use custom EmptyBranchHandler', () => {
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
            } as Record<
              ResourceName,
              TsRes.Runtime.ResourceTree.ResourceTreeNodeInit<TsRes.Runtime.IResource>
            >
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

          return succeed({ fallbackMessage: 'No content available' });
        };

        expect(
          treeResolver.resolveComposedResourceTree(branchNode, {
            onResourceError: 'ignore',
            onEmptyBranch: customEmptyHandler
          })
        ).toSucceedWith({
          emptyBranch: { fallbackMessage: 'No content available' }
        });
      });
    });
  });

  describe('delegation to ResourceResolver', () => {
    test('should delegate individual resource resolution to ResourceResolver', () => {
      const mockResolver = {
        resolveComposedResourceValue: jest.fn().mockReturnValue(succeed({ resolved: 'by mock' }))
      } as unknown as TsRes.Runtime.ResourceResolver;

      const mockTreeResolver = new TsRes.Runtime.ResourceTreeResolver(mockResolver, resourceManager);
      const simpleResource = resourceManager.getBuiltResource('simple').orThrow();
      const leafNode = TsRes.Runtime.ResourceTree.ReadOnlyResourceTreeLeaf.create(
        'simple' as ResourceName,
        undefined,
        simpleResource
      ).orThrow();

      expect(mockTreeResolver.resolveComposedResourceTree(leafNode)).toSucceedWith({
        resolved: 'by mock'
      });

      expect(mockResolver.resolveComposedResourceValue).toHaveBeenCalledWith(simpleResource);
    });

    test('should pass ResourceResolver to custom error handlers', () => {
      const brokenResource = resourceManager.getBuiltResource('broken').orThrow();
      const leafNode = TsRes.Runtime.ResourceTree.ReadOnlyResourceTreeLeaf.create(
        'broken' as ResourceName,
        undefined,
        brokenResource
      ).orThrow();

      const customHandler: TsRes.Runtime.ResourceErrorHandler = (resource, message, resolver) => {
        // Verify we receive the correct resolver instance
        expect(resolver).toBe(resourceResolver);
        expect(typeof resolver.resolveComposedResourceValue).toBe('function');

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
        treeResolver.resolveComposedResourceTree(leafNode, { onResourceError: customHandler })
      ).toSucceedAndSatisfy((result) => {
        expect(result).toEqual({
          fallback: true,
          originalId: 'broken',
          fallbackValue: { value: 'simple value' }
        });
      });
    });

    test('should pass ResourceResolver to custom empty branch handlers', () => {
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
        // Verify we receive the correct resolver instance
        expect(resolver).toBe(resourceResolver);
        expect(typeof resolver.resolveResource).toBe('function');

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
        treeResolver.resolveComposedResourceTree(branchNode, {
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
  });

  describe('Result pattern usage', () => {
    test('should return Results consistently', () => {
      const result = treeResolver.resolveComposedResourceTree('simple');
      expect(result.isSuccess).toBeDefined();
      expect(result.isFailure).toBeDefined();
      expect(result).toSucceed();
    });

    test('should chain Results properly in error scenarios', () => {
      const result = treeResolver.resolveComposedResourceTree('invalid..id');
      expect(result).toFail();
      expect(result.message).toMatch(/Resource.*not found in resource tree/);
    });

    test('should handle Result chaining in resource tree building', () => {
      const resolverWithoutManager = new TsRes.Runtime.ResourceTreeResolver(resourceResolver);

      const result = resolverWithoutManager.resolveComposedResourceTree('simple');
      expect(result).toFail();
      expect(result.message).toMatch(/no resource manager provided/);
    });

    test('should propagate Result failures through the chain', () => {
      // Test when resource tree building fails
      const mockResourceManager = {
        getBuiltResourceTree: jest.fn().mockReturnValue(fail('Simulated tree building failure'))
      } as unknown as TsRes.Resources.ResourceManagerBuilder;

      const resolverWithBrokenManager = new TsRes.Runtime.ResourceTreeResolver(
        resourceResolver,
        mockResourceManager
      );

      expect(resolverWithBrokenManager.resolveComposedResourceTree('simple')).toFailWith(
        /Failed to build resource tree: Simulated tree building failure/
      );
    });
  });

  describe('integration scenarios', () => {
    test('should resolve entire application tree by string ID', () => {
      expect(treeResolver.resolveComposedResourceTree('app')).toSucceedAndSatisfy((result) => {
        expect(result).toEqual({
          messages: {
            greeting: { text: 'Hi there!' },
            farewell: { text: 'Goodbye!' }
          },
          config: {
            timeout: { timeout: 5000 }
          }
        });
      });
    });

    test('should handle partial tree resolution with mixed success/failure', () => {
      // Add a broken resource to the app tree first
      resourceManager
        .addResource({
          id: 'app.broken',
          resourceTypeName: 'json',
          candidates: [
            {
              json: { text: 'This will never match' },
              conditions: { language: 'zh', territory: 'CN' }
            }
          ]
        })
        .orThrow();

      // Rebuild the resource manager to include the new resource
      resourceManager.build().orThrow();

      expect(treeResolver.resolveComposedResourceTree('app', { onResourceError: 'ignore' })).toSucceedWith({
        messages: {
          greeting: { text: 'Hi there!' },
          farewell: { text: 'Goodbye!' }
        },
        config: {
          timeout: { timeout: 5000 }
        }
        // app.broken omitted due to resolution failure
      });
    });

    test('should work with both overloads to produce same result', () => {
      // Resolve using string ID
      const stringResult = treeResolver.resolveComposedResourceTree('app.messages');

      // Get the tree node and resolve using node overload
      const tree = resourceManager.getBuiltResourceTree().orThrow();
      const appNode = tree.children.validating.getById('app').orThrow();
      if (!appNode.isBranch) {
        throw new Error('Expected app node to be a branch');
      }
      const messagesNode = appNode.children.validating.getById('messages').orThrow();
      const nodeResult = treeResolver.resolveComposedResourceTree(messagesNode);

      expect(stringResult).toSucceed();
      expect(nodeResult).toSucceed();
      expect(stringResult.value).toEqual(nodeResult.value);
    });

    test('should handle deep nesting with both overloads', () => {
      // Test with string ID
      const stringResult = treeResolver.resolveComposedResourceTree('app.messages.greeting');

      // Test with node
      const greetingResource = resourceManager.getBuiltResource('app.messages.greeting').orThrow();
      const leafNode = TsRes.Runtime.ResourceTree.ReadOnlyResourceTreeLeaf.create(
        'greeting' as ResourceName,
        undefined,
        greetingResource
      ).orThrow();
      const nodeResult = treeResolver.resolveComposedResourceTree(leafNode);

      expect(stringResult).toSucceedWith({ text: 'Hi there!' });
      expect(nodeResult).toSucceedWith({ text: 'Hi there!' });
      expect(stringResult.value).toEqual(nodeResult.value);
    });

    test('should handle various option combinations', () => {
      const brokenResource = resourceManager.getBuiltResource('broken').orThrow();
      const validResource = resourceManager.getBuiltResource('simple').orThrow();

      const mixedBranch = TsRes.Runtime.ResourceTree.ReadOnlyResourceTreeBranch.create(
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

      // Test ignore + allow combination
      expect(
        treeResolver.resolveComposedResourceTree(mixedBranch, {
          onResourceError: 'ignore',
          onEmptyBranch: 'allow'
        })
      ).toSucceedWith({
        valid: { value: 'simple value' },
        emptyBranch: {}
      });

      // Test ignore + omit combination
      expect(
        treeResolver.resolveComposedResourceTree(mixedBranch, {
          onResourceError: 'ignore',
          onEmptyBranch: 'omit'
        })
      ).toSucceedWith({
        valid: { value: 'simple value' }
        // emptyBranch omitted
      });
    });
  });

  describe('edge cases and boundary conditions', () => {
    test('should handle empty string resource ID', () => {
      expect(treeResolver.resolveComposedResourceTree('')).toFailWith(
        /Resource '' not found in resource tree/
      );
    });

    test('should handle resource ID with special characters', () => {
      expect(treeResolver.resolveComposedResourceTree('invalid..id')).toFailWith(
        /Resource 'invalid\.\.id' not found in resource tree/
      );
    });

    test('should handle very deep path in error messages', () => {
      const brokenResource = resourceManager.getBuiltResource('broken').orThrow();

      const deepBranch = TsRes.Runtime.ResourceTree.ReadOnlyResourceTreeBranch.create(
        'level1' as ResourceName,
        undefined,
        {
          children: {
            level2: {
              children: {
                level3: {
                  children: {
                    level4: {
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
              } as Record<
                ResourceName,
                TsRes.Runtime.ResourceTree.ResourceTreeNodeInit<TsRes.Runtime.IResource>
              >
            }
          } as Record<ResourceName, TsRes.Runtime.ResourceTree.ResourceTreeNodeInit<TsRes.Runtime.IResource>>
        }
      ).orThrow();

      expect(treeResolver.resolveComposedResourceTree(deepBranch, { onResourceError: 'fail' })).toFailWith(
        /level2\.level3\.level4\.broken.*No matching candidates/
      );
    });

    test('should handle undefined return from custom handlers correctly', () => {
      const brokenResource = resourceManager.getBuiltResource('broken').orThrow();

      // Test resource error handler returning undefined
      const leafNode = TsRes.Runtime.ResourceTree.ReadOnlyResourceTreeLeaf.create(
        'broken' as ResourceName,
        undefined,
        brokenResource
      ).orThrow();

      const undefinedHandler: TsRes.Runtime.ResourceErrorHandler = (resource, message, resolver) => {
        return succeed(undefined);
      };

      expect(
        treeResolver.resolveComposedResourceTree(leafNode, { onResourceError: undefinedHandler })
      ).toSucceedWith(undefined);

      // Test empty branch handler returning undefined
      const branchNode = TsRes.Runtime.ResourceTree.ReadOnlyResourceTreeBranch.create(
        'test' as ResourceName,
        undefined,
        {
          children: {
            empty: {
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

      const undefinedEmptyHandler: TsRes.Runtime.EmptyBranchHandler = (
        branchNode,
        failedChildNames,
        resolver
      ) => {
        return succeed(undefined);
      };

      expect(
        treeResolver.resolveComposedResourceTree(branchNode, {
          onResourceError: 'ignore',
          onEmptyBranch: undefinedEmptyHandler
        })
      ).toSucceedWith(undefined);
    });

    test('should handle custom handlers that return failures', () => {
      const brokenResource = resourceManager.getBuiltResource('broken').orThrow();
      const leafNode = TsRes.Runtime.ResourceTree.ReadOnlyResourceTreeLeaf.create(
        'broken' as ResourceName,
        undefined,
        brokenResource
      ).orThrow();

      const failingHandler: TsRes.Runtime.ResourceErrorHandler = (resource, message, resolver) => {
        return fail(`Custom error for ${resource.id}: ${message}`);
      };

      expect(
        treeResolver.resolveComposedResourceTree(leafNode, { onResourceError: failingHandler })
      ).toFailWith(/Custom error for broken.*No matching candidates/);
    });
  });

  describe('default options behavior', () => {
    test('should use fail mode by default for resource errors', () => {
      const brokenResource = resourceManager.getBuiltResource('broken').orThrow();
      const leafNode = TsRes.Runtime.ResourceTree.ReadOnlyResourceTreeLeaf.create(
        'broken' as ResourceName,
        undefined,
        brokenResource
      ).orThrow();

      const defaultResult = treeResolver.resolveComposedResourceTree(leafNode);
      const explicitResult = treeResolver.resolveComposedResourceTree(leafNode, { onResourceError: 'fail' });

      expect(defaultResult).toFail();
      expect(explicitResult).toFail();
      expect(defaultResult.message).toBe(explicitResult.message);
    });

    test('should use allow mode by default for empty branches', () => {
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

      const defaultResult = treeResolver.resolveComposedResourceTree(emptyBranchNode);
      const explicitResult = treeResolver.resolveComposedResourceTree(emptyBranchNode, {
        onEmptyBranch: 'allow'
      });

      expect(defaultResult).toSucceedWith({});
      expect(explicitResult).toSucceedWith({});
    });
  });
});
