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

describe('ResourceTreeChildrenValidator', () => {
  let validator: ResourceTree.ResourceTreeChildrenValidator<ITestResource>;
  let innerChildren: ResourceTree.ReadOnlyResourceTreeChildren<ITestResource>;
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
          childLeaf: { resource: { id: 'child', value: 'Child Value' } },
          nestedBranch: {
            children: {
              deepLeaf: { resource: { id: 'deep', value: 'Deep Value' } }
            } as Record<ResourceName, { resource: ITestResource }>
          }
        } as Record<
          ResourceName,
          { resource: ITestResource } | { children: Record<ResourceName, { resource: ITestResource }> }
        >
      }
    ).orThrow();

    // Create inner children collection
    innerChildren = new ResourceTree.ReadOnlyResourceTreeChildren('parent' as ResourceId, [
      ['testLeaf' as ResourceName, leafNode],
      ['testBranch' as ResourceName, branchNode]
    ]);

    // Create validator
    validator = new ResourceTree.ResourceTreeChildrenValidator(innerChildren);
  });

  describe('constructor', () => {
    test('creates validator with inner children', () => {
      expect(validator).toBeDefined();
      expect(validator.size).toBe(2);
    });
  });

  describe('getById method', () => {
    test('validates and retrieves nodes by string ResourceId', () => {
      expect(validator.getById('testLeaf')).toSucceedAndSatisfy((node) => {
        expect(node.isLeaf).toBe(true);
        expect(node.name).toBe('testLeaf');
      });

      expect(validator.getById('testBranch')).toSucceedAndSatisfy((node) => {
        expect(node.isBranch).toBe(true);
        expect(node.name).toBe('testBranch');
      });
    });

    test('validates and retrieves nested nodes', () => {
      expect(validator.getById('testBranch.childLeaf')).toSucceedAndSatisfy((node) => {
        expect(node.isLeaf).toBe(true);
        expect(node.id).toBe('parent.testBranch.childLeaf');
      });

      expect(validator.getById('testBranch.nestedBranch.deepLeaf')).toSucceedAndSatisfy((node) => {
        expect(node.isLeaf).toBe(true);
        expect(node.id).toBe('parent.testBranch.nestedBranch.deepLeaf');
      });
    });

    test('fails with invalid ResourceId strings', () => {
      expect(validator.getById('invalid..id')).toFailWith(/invalid resource ID/i);
      expect(validator.getById('')).toFailWith(/invalid resource ID/i);
      expect(validator.getById('.')).toFailWith(/invalid resource ID/i);
      expect(validator.getById('.invalid')).toFailWith(/invalid resource ID/i);
      expect(validator.getById('invalid.')).toFailWith(/invalid resource ID/i);
    });

    test('fails for nonexistent resources', () => {
      expect(validator.getById('nonexistent')).toFailWith(/resource not found/);
      expect(validator.getById('testBranch.nonexistent')).toFailWith(/resource not found/);
    });
  });

  describe('getResource method', () => {
    test('validates and retrieves resource nodes by string ResourceName', () => {
      expect(validator.getResource('testLeaf')).toSucceedAndSatisfy((node) => {
        expect(node.isLeaf).toBe(true);
        expect(node.name).toBe('testLeaf');
      });
    });

    test('fails for branch nodes', () => {
      expect(validator.getResource('testBranch')).toFailWith(/not a resource/);
    });

    test('fails with invalid ResourceName strings', () => {
      expect(validator.getResource('invalid..name')).toFailWith(/invalid resource name/i);
      expect(validator.getResource('')).toFailWith(/invalid resource name/i);
      expect(validator.getResource('.')).toFailWith(/invalid resource name/i);
    });

    test('fails for nonexistent resources', () => {
      expect(validator.getResource('nonexistent')).toFailWith(/not found/);
    });
  });

  describe('getBranch method', () => {
    test('validates and retrieves branch nodes by string ResourceName', () => {
      expect(validator.getBranch('testBranch')).toSucceedAndSatisfy((node) => {
        expect(node.isBranch).toBe(true);
        expect(node.name).toBe('testBranch');
      });
    });

    test('fails for leaf nodes', () => {
      expect(validator.getBranch('testLeaf')).toFailWith(/not a branch/);
    });

    test('fails with invalid ResourceName strings', () => {
      expect(validator.getBranch('invalid..name')).toFailWith(/invalid resource name/i);
      expect(validator.getBranch('')).toFailWith(/invalid resource name/i);
      expect(validator.getBranch('.')).toFailWith(/invalid resource name/i);
    });

    test('fails for nonexistent branches', () => {
      expect(validator.getBranch('nonexistent')).toFailWith(/not found/);
    });
  });

  describe('getResourceById method', () => {
    test('validates and retrieves resource leafs by string ResourceId', () => {
      expect(validator.getResourceById('testLeaf')).toSucceedAndSatisfy((leaf) => {
        expect(leaf.isLeaf).toBe(true);
        expect(leaf.resource.value).toBe('Leaf Value');
      });

      expect(validator.getResourceById('testBranch.childLeaf')).toSucceedAndSatisfy((leaf) => {
        expect(leaf.isLeaf).toBe(true);
        expect(leaf.resource.value).toBe('Child Value');
      });
    });

    test('fails for branch nodes', () => {
      expect(validator.getResourceById('testBranch')).toFailWith(/not a resource/);
    });

    test('fails with invalid ResourceId strings', () => {
      expect(validator.getResourceById('invalid..id')).toFailWith(/invalid resource ID/i);
      expect(validator.getResourceById('')).toFailWith(/invalid resource ID/i);
    });

    test('fails for nonexistent resources', () => {
      expect(validator.getResourceById('nonexistent')).toFailWith(/resource not found/);
    });
  });

  describe('getBranchById method', () => {
    test('validates and retrieves branch nodes by string ResourceId', () => {
      expect(validator.getBranchById('testBranch')).toSucceedAndSatisfy((branch) => {
        expect(branch.isBranch).toBe(true);
        if (branch.isBranch) {
          expect(branch.children.size).toBe(2);
        }
      });

      expect(validator.getBranchById('testBranch.nestedBranch')).toSucceedAndSatisfy((branch) => {
        expect(branch.isBranch).toBe(true);
        if (branch.isBranch) {
          expect(branch.children.size).toBe(1);
        }
      });
    });

    test('fails for leaf nodes', () => {
      expect(validator.getBranchById('testLeaf')).toFailWith(/not a branch/);
      expect(validator.getBranchById('testBranch.childLeaf')).toFailWith(/not a branch/);
    });

    test('fails with invalid ResourceId strings', () => {
      expect(validator.getBranchById('invalid..id')).toFailWith(/invalid resource ID/i);
      expect(validator.getBranchById('')).toFailWith(/invalid resource ID/i);
    });

    test('fails for nonexistent branches', () => {
      expect(validator.getBranchById('nonexistent')).toFailWith(/resource not found/);
    });
  });

  describe('collection interface methods', () => {
    test('size property reflects inner collection', () => {
      expect(validator.size).toBe(innerChildren.size);
      expect(validator.size).toBe(2);
    });

    test('entries method returns inner collection entries', () => {
      const validatorEntries = Array.from(validator.entries());
      const innerEntries = Array.from(innerChildren.entries());

      expect(validatorEntries).toHaveLength(2);
      expect(validatorEntries).toEqual(innerEntries);
    });

    test('forEach method iterates over all entries', () => {
      const iterations: Array<{ key: string; value: unknown }> = [];

      validator.forEach((value, key) => {
        iterations.push({ key, value });
      });

      expect(iterations).toHaveLength(2);
      expect(iterations.some(({ key }) => key === 'testLeaf')).toBe(true);
      expect(iterations.some(({ key }) => key === 'testBranch')).toBe(true);
    });

    test('forEach method with thisArg parameter', () => {
      const context = { count: 0 };

      validator.forEach((value: unknown, key: string) => {
        context.count++;
      });

      expect(context.count).toBe(2);
    });

    test('get method validates key and returns node', () => {
      expect(validator.get('testLeaf' as ResourceName)).toSucceedAndSatisfy((node) => {
        expect(node.isLeaf).toBe(true);
      });

      expect(validator.get('testBranch' as ResourceName)).toSucceedAndSatisfy((node) => {
        expect(node.isBranch).toBe(true);
      });

      expect(validator.get('nonexistent' as ResourceName)).toFailWith(/not found/);
    });

    test('get method validates ResourceName and fails with invalid key', () => {
      expect(validator.get('invalid..name' as unknown as ResourceName)).toFailWith(/invalid resource name/i);
      expect(validator.get('' as unknown as ResourceName)).toFailWith(/invalid resource name/i);
    });

    test('has method checks for existence', () => {
      expect(validator.has('testLeaf' as ResourceName)).toBe(true);
      expect(validator.has('testBranch' as ResourceName)).toBe(true);
      expect(validator.has('nonexistent' as ResourceName)).toBe(false);
    });

    test('keys method returns all ResourceName keys', () => {
      const keys = Array.from(validator.keys());
      expect(keys).toHaveLength(2);
      expect(keys).toContain('testLeaf');
      expect(keys).toContain('testBranch');
    });

    test('values method returns all node values', () => {
      const values = Array.from(validator.values());
      expect(values).toHaveLength(2);
      expect(values.some((node) => node.isLeaf)).toBe(true);
      expect(values.some((node) => node.isBranch)).toBe(true);
    });

    test('Symbol.iterator enables for...of iteration', () => {
      const iterations: Array<[ResourceName, unknown]> = [];

      for (const entry of validator) {
        iterations.push(entry);
      }

      expect(iterations).toHaveLength(2);
      expect(iterations.some(([name]) => name === 'testLeaf')).toBe(true);
      expect(iterations.some(([name]) => name === 'testBranch')).toBe(true);
    });
  });

  describe('edge cases and error handling', () => {
    test('handles empty inner collection', () => {
      const emptyChildren = new ResourceTree.ReadOnlyResourceTreeChildren(undefined, []);
      const emptyValidator = new ResourceTree.ResourceTreeChildrenValidator(emptyChildren);

      expect(emptyValidator.size).toBe(0);
      expect(emptyValidator.getById('anything')).toFailWith(/resource not found/i);
      expect(emptyValidator.getResource('anything')).toFailWith(/not found/i);
    });

    test('handles complex validation failures consistently', () => {
      // Test that all methods consistently validate their string inputs
      const invalidInputs = ['invalid..name', '', '.', '..', 'name.', '.name'];

      for (const invalid of invalidInputs) {
        expect(validator.getResource(invalid)).toFailWith(/invalid resource name/i);
        expect(validator.getBranch(invalid)).toFailWith(/invalid resource name/i);
      }

      const invalidIds = ['invalid..id', '', '.', '..', 'id.', '.id'];

      for (const invalid of invalidIds) {
        expect(validator.getById(invalid)).toFailWith(/invalid resource ID/i);
        expect(validator.getResourceById(invalid)).toFailWith(/invalid resource ID/i);
        expect(validator.getBranchById(invalid)).toFailWith(/invalid resource ID/i);
      }
    });

    test('delegates properly to inner collection for all operations', () => {
      // Verify that the validator acts as a proper wrapper
      expect(validator.size).toBe(innerChildren.size);

      const validatorKeys = Array.from(validator.keys());
      const innerKeys = Array.from(innerChildren.keys());
      expect(validatorKeys).toEqual(innerKeys);

      const validatorValues = Array.from(validator.values());
      const innerValues = Array.from(innerChildren.values());
      expect(validatorValues).toEqual(innerValues);
    });

    test('maintains error message consistency with inner collection', () => {
      // When validation passes, error messages should match inner collection
      const innerResult = innerChildren.getById('nonexistent' as ResourceId);
      const validatorResult = validator.getById('nonexistent');

      expect(innerResult).toFail();
      expect(validatorResult).toFailWith(/not found/);
    });
  });
});
