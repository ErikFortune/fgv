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
import { ResourceName } from '../../../packlets/common';

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

      expect(resolver.resolveComposedResourceTree(leafNode, { onError: 'fail' })).toFailWith(
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

      expect(resolver.resolveComposedResourceTree(branchNode, { onError: 'fail' })).toFailWith(
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

      expect(resolver.resolveComposedResourceTree(appBranch, { onError: 'fail' })).toFailWith(
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

      expect(resolver.resolveComposedResourceTree(leafNode, { onError: 'ignore' })).toSucceedWith({});
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

      expect(resolver.resolveComposedResourceTree(branchNode, { onError: 'ignore' })).toSucceedWith({
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

      expect(resolver.resolveComposedResourceTree(appBranch, { onError: 'ignore' })).toSucceedWith({
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

      const customHandler: TsRes.Runtime.ResourceTreeErrorHandler = (node, message) => {
        if (node.name === 'broken') {
          return succeed({ fallback: 'default value' });
        }
        return fail(`Unhandled error: ${message}`);
      };

      expect(resolver.resolveComposedResourceTree(leafNode, { onError: customHandler })).toSucceedWith({
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

      const customHandler: TsRes.Runtime.ResourceTreeErrorHandler = (node, message) => {
        return succeed(undefined); // Omit the property
      };

      expect(resolver.resolveComposedResourceTree(branchNode, { onError: customHandler })).toSucceedWith({
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

      const customHandler: TsRes.Runtime.ResourceTreeErrorHandler = (node, message) => {
        return fail(`Custom error for ${node.name}: ${message}`);
      };

      expect(resolver.resolveComposedResourceTree(branchNode, { onError: customHandler })).toSucceedWith({}); // Both properties omitted due to handler returning failures
    });

    test('should handle mixed success, omitted, and replacement values from custom handler', () => {
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

      const customHandler: TsRes.Runtime.ResourceTreeErrorHandler = (node, message) => {
        if (node.name === 'broken1') {
          return succeed(undefined); // Omit property
        } else if (node.name === 'broken2') {
          return succeed('replacement value'); // Use replacement
        }
        return fail(`Unhandled error: ${message}`);
      };

      expect(resolver.resolveComposedResourceTree(branchNode, { onError: customHandler })).toSucceedWith({
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

      const customHandler: TsRes.Runtime.ResourceTreeErrorHandler = (node, message) => {
        return fail(`Custom root error: ${message}`);
      };

      expect(resolver.resolveComposedResourceTree(leafNode, { onError: customHandler })).toFailWith(
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

      const customHandler: TsRes.Runtime.ResourceTreeErrorHandler = (node, message) => {
        return succeed(undefined);
      };

      expect(resolver.resolveComposedResourceTree(leafNode, { onError: customHandler })).toSucceedWith({});
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
      const explicitResult = resolver.resolveComposedResourceTree(leafNode, { onError: 'fail' });

      expect(defaultResult).toFail();
      expect(explicitResult).toFail();
      expect(defaultResult.message).toBe(explicitResult.message);
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

      expect(resolver.resolveComposedResourceTree(branch1, { onError: 'fail' })).toFailWith(
        /level2\.level3\.broken.*No matching candidates/
      );
    });
  });
});
