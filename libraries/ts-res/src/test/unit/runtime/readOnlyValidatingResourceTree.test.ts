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
import {
  ReadOnlyValidatingResourceTreeRoot,
  ReadOnlyValidatingResourceTree
} from '../../../packlets/runtime';
import { ResourceId } from '../../../packlets/common';

interface ITestResource {
  id: string;
  value: string;
}

describe('ReadOnlyValidatingResourceTree', () => {
  let tree: ReadOnlyValidatingResourceTree<ITestResource>;

  beforeEach(() => {
    const resources: [ResourceId, ITestResource][] = [
      ['app.messages.welcome' as ResourceId, { id: 'welcome', value: 'Welcome!' }],
      ['app.errors.notFound' as ResourceId, { id: 'notFound', value: 'Not Found' }],
      ['user.profile' as ResourceId, { id: 'profile', value: 'Profile' }],
      ['settings' as ResourceId, { id: 'settings', value: 'Settings' }]
    ];

    const root = ReadOnlyValidatingResourceTreeRoot.create(resources).orThrow();
    tree = root.validating;
  });

  describe('getById', () => {
    test('gets nodes with valid string ResourceIds', () => {
      expect(tree.getById('app')).toSucceedAndSatisfy((node) => {
        expect(node.path).toBe('app');
        expect(node.isBranch).toBe(true);
        expect(node.isLeaf).toBe(false);
      });

      expect(tree.getById('app.messages.welcome')).toSucceedAndSatisfy((node) => {
        expect(node.path).toBe('app.messages.welcome');
        expect(node.isLeaf).toBe(true);
        expect(node.isBranch).toBe(false);
      });

      expect(tree.getById('settings')).toSucceedAndSatisfy((node) => {
        expect(node.path).toBe('settings');
        expect(node.isLeaf).toBe(true);
        expect(node.isBranch).toBe(false);
      });
    });

    test('fails with invalid ResourceId strings', () => {
      expect(tree.getById('invalid..id')).toFail();
      expect(tree.getById('..invalid')).toFail();
      expect(tree.getById('')).toFail();
      expect(tree.getById('app.')).toFail();
    });

    test('fails with non-existent ResourceIds', () => {
      expect(tree.getById('nonexistent')).toFailWith(/resource not found/);
      expect(tree.getById('app.nonexistent')).toFailWith(/resource not found/);
    });
  });

  describe('getResourceById', () => {
    test('gets resource leaf nodes with valid string ResourceIds', () => {
      expect(tree.getResourceById('app.messages.welcome')).toSucceedAndSatisfy((leaf) => {
        expect(leaf.resource.id).toBe('welcome');
        expect(leaf.resource.value).toBe('Welcome!');
        expect(leaf.isLeaf).toBe(true);
      });

      expect(tree.getResourceById('settings')).toSucceedAndSatisfy((leaf) => {
        expect(leaf.resource.id).toBe('settings');
        expect(leaf.resource.value).toBe('Settings');
      });
    });

    test('fails for branch nodes', () => {
      expect(tree.getResourceById('app')).toFailWith(/not a resource/);
      expect(tree.getResourceById('app.messages')).toFailWith(/not a resource/);
    });

    test('fails with invalid ResourceId strings', () => {
      expect(tree.getResourceById('invalid..id')).toFail();
      expect(tree.getResourceById('')).toFail();
    });
  });

  describe('getBranchById', () => {
    test('gets branch nodes with valid string ResourceIds', () => {
      expect(tree.getBranchById('app')).toSucceedAndSatisfy((branch) => {
        expect(branch.isBranch).toBe(true);
        expect(branch.children.size).toBeGreaterThan(0);
      });

      expect(tree.getBranchById('app.messages')).toSucceedAndSatisfy((branch) => {
        expect(branch.isBranch).toBe(true);
      });
    });

    test('fails for leaf nodes', () => {
      expect(tree.getBranchById('app.messages.welcome')).toFailWith(/not a branch/);
      expect(tree.getBranchById('settings')).toFailWith(/not a branch/);
    });

    test('fails with invalid ResourceId strings', () => {
      expect(tree.getBranchById('invalid..id')).toFail();
      expect(tree.getBranchById('')).toFail();
    });
  });

  describe('getResource', () => {
    test('gets resource nodes with valid string ResourceNames', () => {
      expect(tree.getResource('settings')).toSucceedAndSatisfy((node) => {
        expect(node.isLeaf).toBe(true);
        expect(node.path).toBe('settings');
      });
    });

    test('fails for branch nodes', () => {
      expect(tree.getResource('app')).toFailWith(/not a resource/);
      expect(tree.getResource('user')).toFailWith(/not a resource/);
    });

    test('fails with invalid ResourceName strings', () => {
      expect(tree.getResource('invalid..name')).toFail();
      expect(tree.getResource('')).toFail();
      expect(tree.getResource('name.with.dots')).toFail();
    });
  });

  describe('getBranch', () => {
    test('gets branch nodes with valid string ResourceNames', () => {
      expect(tree.getBranch('app')).toSucceedAndSatisfy((node) => {
        expect(node.isBranch).toBe(true);
        expect(node.path).toBe('app');
      });

      expect(tree.getBranch('user')).toSucceedAndSatisfy((node) => {
        expect(node.isBranch).toBe(true);
        expect(node.path).toBe('user');
      });
    });

    test('fails for leaf nodes', () => {
      expect(tree.getBranch('settings')).toFailWith(/not a branch/);
    });

    test('fails with invalid ResourceName strings', () => {
      expect(tree.getBranch('invalid..name')).toFail();
      expect(tree.getBranch('')).toFail();
    });
  });

  describe('has', () => {
    test('returns true for existing nodes with valid ResourceIds', () => {
      expect(tree.has('app')).toSucceedWith(true);
      expect(tree.has('app.messages')).toSucceedWith(true);
      expect(tree.has('app.messages.welcome')).toSucceedWith(true);
      expect(tree.has('settings')).toSucceedWith(true);
    });

    test('returns false for non-existent ResourceIds', () => {
      expect(tree.has('nonexistent')).toSucceedWith(false);
      expect(tree.has('app.nonexistent')).toSucceedWith(false);
    });

    test('fails with invalid ResourceId strings', () => {
      expect(tree.has('invalid..id')).toFail();
      expect(tree.has('')).toFail();
    });
  });

  describe('hasResource', () => {
    test('returns true for existing resource nodes', () => {
      expect(tree.hasResource('app.messages.welcome')).toSucceedWith(true);
      expect(tree.hasResource('settings')).toSucceedWith(true);
    });

    test('returns false for branch nodes', () => {
      expect(tree.hasResource('app')).toSucceedWith(false);
      expect(tree.hasResource('app.messages')).toSucceedWith(false);
    });

    test('returns false for non-existent ResourceIds', () => {
      expect(tree.hasResource('nonexistent')).toSucceedWith(false);
    });

    test('fails with invalid ResourceId strings', () => {
      expect(tree.hasResource('invalid..id')).toFail();
      expect(tree.hasResource('')).toFail();
    });
  });

  describe('hasBranch', () => {
    test('returns true for existing branch nodes', () => {
      expect(tree.hasBranch('app')).toSucceedWith(true);
      expect(tree.hasBranch('app.messages')).toSucceedWith(true);
      expect(tree.hasBranch('user')).toSucceedWith(true);
    });

    test('returns false for leaf nodes', () => {
      expect(tree.hasBranch('app.messages.welcome')).toSucceedWith(false);
      expect(tree.hasBranch('settings')).toSucceedWith(false);
    });

    test('returns false for non-existent ResourceIds', () => {
      expect(tree.hasBranch('nonexistent')).toSucceedWith(false);
    });

    test('fails with invalid ResourceId strings', () => {
      expect(tree.hasBranch('invalid..id')).toFail();
      expect(tree.hasBranch('')).toFail();
    });
  });
});

describe('ReadOnlyValidatingResourceTreeRoot', () => {
  describe('create with resource array', () => {
    test('creates validating tree from resources', () => {
      const resources: [ResourceId, ITestResource][] = [
        ['app.messages.welcome' as ResourceId, { id: 'welcome', value: 'Welcome!' }],
        ['settings' as ResourceId, { id: 'settings', value: 'Settings' }]
      ];

      expect(ReadOnlyValidatingResourceTreeRoot.create(resources)).toSucceedAndSatisfy((root) => {
        expect(root.isRoot).toBe(true);
        expect(root.children.size).toBe(2); // app and settings
        expect(root.validating).toBeDefined();

        // Test that validating property works
        expect(root.validating.getById('app')).toSucceed();
        expect(root.validating.getById('settings')).toSucceed();
        expect(root.validating.getResourceById('app.messages.welcome')).toSucceed();
      });
    });

    test('fails with invalid resource structure', () => {
      const resources: [ResourceId, ITestResource][] = [
        ['app' as ResourceId, { id: 'app', value: 'Application' }],
        ['app.child' as ResourceId, { id: 'child', value: 'Child' }]
      ];

      expect(ReadOnlyValidatingResourceTreeRoot.create(resources)).toFailWith(
        /Expected a branch but found a leaf/
      );
    });

    test('handles empty resource array', () => {
      expect(ReadOnlyValidatingResourceTreeRoot.create([])).toSucceedAndSatisfy((root) => {
        expect(root.children.size).toBe(0);
        expect(root.validating).toBeDefined();
        expect(root.validating.has('anything')).toSucceedWith(false);
      });
    });
  });

  describe('create with init object', () => {
    test('creates validating tree from init structure', () => {
      const init = {
        children: {
          app: { resource: { id: 'app', value: 'Application' } },
          messages: {
            children: {
              welcome: { resource: { id: 'welcome', value: 'Welcome!' } }
            }
          }
        }
      };

      expect(ReadOnlyValidatingResourceTreeRoot.create(init)).toSucceedAndSatisfy((root) => {
        expect(root.children.size).toBe(2);
        expect(root.validating).toBeDefined();

        // Test validating interface
        expect(root.validating.getResource('app')).toSucceed();
        expect(root.validating.getBranch('messages')).toSucceed();
        expect(root.validating.getResourceById('messages.welcome')).toSucceed();
      });
    });

    test('creates empty tree from empty init', () => {
      const init = { children: {} };

      expect(ReadOnlyValidatingResourceTreeRoot.create(init)).toSucceedAndSatisfy((root) => {
        expect(root.children.size).toBe(0);
        expect(root.validating).toBeDefined();
      });
    });
  });

  describe('validating property integration', () => {
    test('validating property provides type-safe string access', () => {
      const resources: [ResourceId, ITestResource][] = [
        ['app.messages.welcome' as ResourceId, { id: 'welcome', value: 'Welcome!' }],
        ['user.profile' as ResourceId, { id: 'profile', value: 'Profile' }]
      ];

      const root = ReadOnlyValidatingResourceTreeRoot.create(resources).orThrow();

      // Test that we can use string literals without type casting
      expect(root.validating.getById('app')).toSucceed();
      expect(root.validating.getResourceById('app.messages.welcome')).toSucceed();
      expect(root.validating.getBranchById('app.messages')).toSucceed();
      expect(root.validating.getResource('non-existent')).toFailWith(/not found/);

      // Test that validation catches invalid input
      expect(root.validating.getById('invalid..id')).toFail();
      expect(root.validating.getResource('invalid.name.with.dots')).toFail();
    });
  });
});
