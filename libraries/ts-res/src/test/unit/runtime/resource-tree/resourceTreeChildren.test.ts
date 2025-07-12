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
import { ResourceTree } from '../../../../packlets/runtime';
import { ResourceId, ResourceName } from '../../../../packlets/common';

interface ITestResource {
  id: string;
  value: string;
}

describe('ReadOnlyResourceTreeChildren', () => {
  let children: ResourceTree.ReadOnlyResourceTreeChildren<ITestResource>;
  let leafNode: ResourceTree.ReadOnlyResourceTreeLeaf<ITestResource>;
  let branchNode: ResourceTree.ReadOnlyResourceTreeBranch<ITestResource>;

  beforeEach(() => {
    // Create test nodes
    leafNode = ResourceTree.ReadOnlyResourceTreeLeaf.create(
      'testLeaf' as ResourceName,
      'parent' as ResourceId,
      { id: 'leaf', value: 'Leaf Value' }
    ).orThrow();

    branchNode = ResourceTree.ReadOnlyResourceTreeBranch.create(
      'testBranch' as ResourceName,
      'parent' as ResourceId,
      {
        children: {
          childLeaf: { resource: { id: 'child', value: 'Child Value' } }
        } as Record<ResourceName, { resource: ITestResource }>
      }
    ).orThrow();

    // Create children collection
    children = new ResourceTree.ReadOnlyResourceTreeChildren('parent' as ResourceId, [
      ['testLeaf' as ResourceName, leafNode],
      ['testBranch' as ResourceName, branchNode]
    ]);
  });

  describe('constructor and basic properties', () => {
    test('creates children collection with proper setup', () => {
      expect(children.size).toBe(2);
      expect(children.has('testLeaf' as ResourceName)).toBe(true);
      expect(children.has('testBranch' as ResourceName)).toBe(true);
      expect(children.validating).toBeDefined();
    });

    test('creates empty children collection', () => {
      const emptyChildren = new ResourceTree.ReadOnlyResourceTreeChildren(undefined, []);

      expect(emptyChildren.size).toBe(0);
      expect(emptyChildren.validating).toBeDefined();
    });

    test('creates root-level children collection', () => {
      const rootChildren = new ResourceTree.ReadOnlyResourceTreeChildren(undefined, [
        ['root' as ResourceName, leafNode]
      ]);

      expect(rootChildren.size).toBe(1);
    });
  });

  describe('getResource method', () => {
    test('returns leaf nodes successfully', () => {
      expect(children.getResource('testLeaf' as ResourceName)).toSucceedAndSatisfy((node) => {
        expect(node.isLeaf).toBe(true);
        expect(node.name).toBe('testLeaf');
        expect((node as ResourceTree.ReadOnlyResourceTreeLeaf<ITestResource>).resource.value).toBe(
          'Leaf Value'
        );
      });
    });

    test('fails for branch nodes', () => {
      expect(children.getResource('testBranch' as ResourceName)).toFailWith(/not a resource.*in parent/);
    });

    test('fails for nonexistent nodes', () => {
      expect(children.getResource('nonexistent' as ResourceName)).toFailWith(/not found/);
    });

    test('provides context in error messages', () => {
      expect(children.getResource('testBranch' as ResourceName)).toFailWith(/in parent/);
    });

    test('works with root-level collection (no path context)', () => {
      const rootChildren = new ResourceTree.ReadOnlyResourceTreeChildren(undefined, [
        ['leaf' as ResourceName, leafNode]
      ]);

      expect(rootChildren.getResource('nonexistent' as ResourceName)).toFailWith(/not found/);
    });
  });

  describe('getBranch method', () => {
    test('returns branch nodes successfully', () => {
      expect(children.getBranch('testBranch' as ResourceName)).toSucceedAndSatisfy((node) => {
        expect(node.isBranch).toBe(true);
        expect(node.name).toBe('testBranch');
        if (node.isBranch) {
          expect(node.children).toBeDefined();
        }
      });
    });

    test('fails for leaf nodes', () => {
      expect(children.getBranch('testLeaf' as ResourceName)).toFailWith(/not a branch.*in parent/);
    });

    test('fails for nonexistent nodes', () => {
      expect(children.getBranch('nonexistent' as ResourceName)).toFailWith(/not found/);
    });

    test('provides context in error messages', () => {
      expect(children.getBranch('testLeaf' as ResourceName)).toFailWith(/in parent/);
    });

    test('works with root-level collection (no path context)', () => {
      const rootChildren = new ResourceTree.ReadOnlyResourceTreeChildren(undefined, [
        ['branch' as ResourceName, branchNode]
      ]);

      expect(rootChildren.getBranch('nonexistent' as ResourceName)).toFailWith(/not found/);
    });
  });

  describe('getById method', () => {
    test('returns direct child nodes', () => {
      expect(children.getById('testLeaf' as ResourceId)).toSucceedAndSatisfy((node) => {
        expect(node.isLeaf).toBe(true);
        expect(node.name).toBe('testLeaf');
      });

      expect(children.getById('testBranch' as ResourceId)).toSucceedAndSatisfy((node) => {
        expect(node.isBranch).toBe(true);
        expect(node.name).toBe('testBranch');
      });
    });

    test('returns nested child nodes', () => {
      expect(children.getById('testBranch.childLeaf' as ResourceId)).toSucceedAndSatisfy((node) => {
        expect(node.isLeaf).toBe(true);
        expect(node.id).toBe('parent.testBranch.childLeaf');
      });
    });

    test('fails for nonexistent direct children', () => {
      expect(children.getById('nonexistent' as ResourceId)).toFailWith(/resource not found.*in parent/);
    });

    test('fails for nonexistent nested children', () => {
      expect(children.getById('testBranch.nonexistent' as ResourceId)).toFailWith(
        /resource not found.*in parent/
      );
    });

    test('fails when trying to traverse through leaf nodes', () => {
      expect(children.getById('testLeaf.impossible' as ResourceId)).toFailWith(
        /resource not found.*in parent/
      );
    });

    test('handles complex nested paths', () => {
      // Create a deeper tree structure
      const deepBranch = ResourceTree.ReadOnlyResourceTreeBranch.create('deep' as ResourceName, undefined, {
        children: {
          level1: {
            children: {
              level2: {
                children: {
                  finalLeaf: { resource: { id: 'final', value: 'Deep Value' } }
                } as Record<ResourceName, { resource: ITestResource }>
              }
            }
          }
        } as Record<
          ResourceName,
          { children: Record<ResourceName, { children: Record<ResourceName, { resource: ITestResource }> }> }
        >
      }).orThrow();

      const deepChildren = new ResourceTree.ReadOnlyResourceTreeChildren(undefined, [
        ['deep' as ResourceName, deepBranch]
      ]);

      expect(deepChildren.getById('deep.level1.level2.finalLeaf' as ResourceId)).toSucceedAndSatisfy(
        (node) => {
          expect(node.isLeaf).toBe(true);
          expect(node.id).toBe('deep.level1.level2.finalLeaf');
        }
      );
    });

    test('handles invalid ResourceId paths', () => {
      expect(children.getById('invalid..id' as ResourceId)).toFailWith(/not a valid resource name/i);
    });

    test('provides context in error messages', () => {
      expect(children.getById('nonexistent' as ResourceId)).toFailWith(/in parent/);
    });

    test('works with root-level collection (no path context)', () => {
      const rootChildren = new ResourceTree.ReadOnlyResourceTreeChildren(undefined, [
        ['test' as ResourceName, leafNode]
      ]);

      expect(rootChildren.getById('nonexistent' as ResourceId)).toFailWith(/resource not found/);
    });
  });

  describe('getResourceById method', () => {
    test('returns leaf nodes successfully', () => {
      expect(children.getResourceById('testLeaf' as ResourceId)).toSucceedAndSatisfy((leaf) => {
        expect(leaf.isLeaf).toBe(true);
        expect(leaf.resource.value).toBe('Leaf Value');
      });

      expect(children.getResourceById('testBranch.childLeaf' as ResourceId)).toSucceedAndSatisfy((leaf) => {
        expect(leaf.isLeaf).toBe(true);
        expect(leaf.resource.value).toBe('Child Value');
      });
    });

    test('fails for branch nodes', () => {
      expect(children.getResourceById('testBranch' as ResourceId)).toFailWith(/not a resource.*in parent/);
    });

    test('fails for nonexistent resources', () => {
      expect(children.getResourceById('nonexistent' as ResourceId)).toFailWith(
        /resource not found.*in parent/
      );
    });

    test('provides context in error messages', () => {
      expect(children.getResourceById('testBranch' as ResourceId)).toFailWith(/in parent/);
    });

    test('works with root-level collection (no path context)', () => {
      const rootChildren = new ResourceTree.ReadOnlyResourceTreeChildren(undefined, [
        ['leaf' as ResourceName, leafNode]
      ]);

      expect(rootChildren.getResourceById('nonexistent' as ResourceId)).toFailWith(/resource not found/);
    });
  });

  describe('getBranchById method', () => {
    test('returns branch nodes successfully', () => {
      expect(children.getBranchById('testBranch' as ResourceId)).toSucceedAndSatisfy((branch) => {
        expect(branch.isBranch).toBe(true);
        expect(branch.children.size).toBe(1);
      });
    });

    test('fails for leaf nodes', () => {
      expect(children.getBranchById('testLeaf' as ResourceId)).toFailWith(/not a branch.*in parent/);
      expect(children.getBranchById('testBranch.childLeaf' as ResourceId)).toFailWith(
        /not a branch.*in parent/
      );
    });

    test('fails for nonexistent branches', () => {
      expect(children.getBranchById('nonexistent' as ResourceId)).toFailWith(/resource not found.*in parent/);
    });

    test('provides context in error messages', () => {
      expect(children.getBranchById('testLeaf' as ResourceId)).toFailWith(/in parent/);
    });

    test('works with root-level collection (no path context)', () => {
      const rootChildren = new ResourceTree.ReadOnlyResourceTreeChildren(undefined, [
        ['branch' as ResourceName, branchNode]
      ]);

      expect(rootChildren.getBranchById('nonexistent' as ResourceId)).toFailWith(/resource not found/);
    });
  });

  describe('validating property', () => {
    test('provides string-based access to all methods', () => {
      // Basic string-based access
      expect(children.validating.getById('testLeaf')).toSucceedAndSatisfy((node) => {
        expect(node.isLeaf).toBe(true);
      });

      expect(children.validating.getResource('testLeaf')).toSucceedAndSatisfy((node) => {
        expect(node.isLeaf).toBe(true);
      });

      expect(children.validating.getBranch('testBranch')).toSucceedAndSatisfy((node) => {
        expect(node.isBranch).toBe(true);
      });

      expect(children.validating.getResourceById('testLeaf')).toSucceedAndSatisfy((leaf) => {
        expect(leaf.isLeaf).toBe(true);
      });

      expect(children.validating.getBranchById('testBranch')).toSucceedAndSatisfy((branch) => {
        expect(branch.isBranch).toBe(true);
      });
    });

    test('validates string inputs and fails with invalid strings', () => {
      expect(children.validating.getById('invalid..id')).toFailWith(/invalid.*resource.*id/i);
      expect(children.validating.getResource('invalid..name')).toFailWith(/invalid.*resource.*name/i);
      expect(children.validating.getBranch('invalid..name')).toFailWith(/invalid.*resource.*name/i);
      expect(children.validating.getResourceById('invalid..id')).toFailWith(/invalid.*resource.*id/i);
      expect(children.validating.getBranchById('invalid..id')).toFailWith(/invalid.*resource.*id/i);
    });

    test('provides consistent interface behavior', () => {
      expect(children.validating.size).toBe(children.size);
      expect(Array.from(children.validating.keys())).toEqual(Array.from(children.keys()));
      expect(Array.from(children.validating.values())).toEqual(Array.from(children.values()));
    });
  });

  describe('edge cases and error conditions', () => {
    test('handles empty path components gracefully', () => {
      expect(children.getById('' as ResourceId)).toFailWith(/not a valid resource name/i);
    });

    test('handles complex traversal failures', () => {
      // Try to traverse beyond a leaf
      expect(children.getById('testLeaf.beyond.leaf' as ResourceId)).toFailWith(/resource not found/);

      // Try to access deeply nested nonexistent path
      expect(children.getById('testBranch.nonexistent.deep.path' as ResourceId)).toFailWith(
        /resource not found/
      );
    });

    test('maintains proper error context throughout navigation', () => {
      const deepChildren = new ResourceTree.ReadOnlyResourceTreeChildren('deep.path' as ResourceId, [
        ['test' as ResourceName, leafNode]
      ]);

      expect(deepChildren.getResource('nonexistent' as ResourceName)).toFailWith(/nonexistent.*not found/i);
      expect(deepChildren.getBranch('test' as ResourceName)).toFailWith(/in deep\.path/);
    });

    test('root-level error messages (no path context)', () => {
      // Create root-level children (path = undefined) to test uncovered branches
      const rootChildren = new ResourceTree.ReadOnlyResourceTreeChildren(undefined, [
        ['leaf' as ResourceName, leafNode],
        ['branch' as ResourceName, branchNode]
      ]);

      // Test getResource method error at root level (covers line 63)
      expect(rootChildren.getResource('branch' as ResourceName)).toFailWith(/branch: not a resource\.$/);

      // Test getBranch method error at root level (covers line 74)
      expect(rootChildren.getBranch('leaf' as ResourceName)).toFailWith(/leaf: not a branch\.$/);
    });

    test('properly inherits from ResultMap functionality', () => {
      // Test inherited methods work properly
      expect(children.get('testLeaf' as ResourceName)).toSucceedAndSatisfy((node) => {
        expect(node.isLeaf).toBe(true);
      });

      expect(children.get('nonexistent' as ResourceName)).toFailWith(/not found/);

      // Test iteration methods
      const keys = Array.from(children.keys());
      expect(keys).toHaveLength(2);
      expect(keys).toContain('testLeaf');
      expect(keys).toContain('testBranch');

      const values = Array.from(children.values());
      expect(values).toHaveLength(2);
      expect(values.some((node) => node.isLeaf)).toBe(true);
      expect(values.some((node) => node.isBranch)).toBe(true);

      const entries = Array.from(children.entries());
      expect(entries).toHaveLength(2);
      expect(entries.every(([name, node]) => typeof name === 'string' && node !== undefined)).toBe(true);
    });
  });
});
