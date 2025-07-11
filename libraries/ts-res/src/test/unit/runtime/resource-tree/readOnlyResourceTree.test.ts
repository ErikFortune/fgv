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

describe('ReadOnlyResourceTreeLeaf', () => {
  describe('create', () => {
    test('creates leaf node with parent path', () => {
      const resource: ITestResource = { id: 'test', value: 'Test Value' };

      expect(
        ResourceTree.ReadOnlyResourceTreeLeaf.create(
          'testNode' as ResourceName,
          'parent' as ResourceId,
          resource
        )
      ).toSucceedAndSatisfy((leaf) => {
        expect(leaf.name).toBe('testNode');
        expect(leaf.path).toBe('parent.testNode');
        expect(leaf.resource).toBe(resource);
        expect(leaf.isLeaf).toBe(true);
        expect(leaf.isBranch).toBe(false);
        expect(leaf.isRoot).toBe(false);
      });
    });

    test('creates leaf node without parent path', () => {
      const resource: ITestResource = { id: 'test', value: 'Test Value' };

      expect(
        ResourceTree.ReadOnlyResourceTreeLeaf.create('testNode' as ResourceName, undefined, resource)
      ).toSucceedAndSatisfy((leaf) => {
        expect(leaf.name).toBe('testNode');
        expect(leaf.path).toBe('testNode');
        expect(leaf.resource).toBe(resource);
      });
    });

    test('fails with invalid resource name', () => {
      const resource: ITestResource = { id: 'test', value: 'Test Value' };

      expect(
        ResourceTree.ReadOnlyResourceTreeLeaf.create(
          'invalid..name' as unknown as ResourceName,
          undefined,
          resource
        )
      ).toFail();
    });
  });
});

describe('ReadOnlyResourceTreeBranch', () => {
  describe('create', () => {
    test('creates branch with leaf children', () => {
      const branchInit = {
        children: {
          child1: { resource: { id: 'child1', value: 'Child 1' } },
          child2: { resource: { id: 'child2', value: 'Child 2' } }
        } as Record<ResourceName, { resource: ITestResource }>
      };

      expect(
        ResourceTree.ReadOnlyResourceTreeBranch.create(
          'branch' as ResourceName,
          'parent' as ResourceId,
          branchInit
        )
      ).toSucceedAndSatisfy((branch) => {
        expect(branch.name).toBe('branch');
        expect(branch.path).toBe('parent.branch');
        expect(branch.isLeaf).toBe(false);
        expect(branch.isBranch).toBe(true);
        expect(branch.isRoot).toBe(false);
        expect(branch.children.size).toBe(2);
        expect(branch.children.has('child1' as ResourceName)).toBe(true);
        expect(branch.children.has('child2' as ResourceName)).toBe(true);
      });
    });

    test('creates branch with mixed children', () => {
      const branchInit = {
        children: {
          leaf: { resource: { id: 'leaf', value: 'Leaf' } },
          nestedBranch: {
            children: {
              nestedLeaf: { resource: { id: 'nested', value: 'Nested' } }
            } as Record<ResourceName, { resource: ITestResource }>
          }
        } as Record<
          ResourceName,
          { resource: ITestResource } | { children: Record<ResourceName, { resource: ITestResource }> }
        >
      };

      expect(
        ResourceTree.ReadOnlyResourceTreeBranch.create('branch' as ResourceName, undefined, branchInit)
      ).toSucceedAndSatisfy((branch) => {
        expect(branch.children.size).toBe(2);

        expect(branch.children.get('leaf' as ResourceName)).toSucceedAndSatisfy((leafNode) => {
          expect(leafNode.isLeaf).toBe(true);
          expect(leafNode.path).toBe('branch.leaf');
        });

        expect(branch.children.get('nestedBranch' as ResourceName)).toSucceedAndSatisfy((branchNode) => {
          expect(branchNode.isBranch).toBe(true);
          expect(branchNode.path).toBe('branch.nestedBranch');
        });
      });
    });

    test('creates empty branch', () => {
      const branchInit = { children: {} };

      expect(
        ResourceTree.ReadOnlyResourceTreeBranch.create('empty' as ResourceName, undefined, branchInit)
      ).toSucceedAndSatisfy((branch) => {
        expect(branch.children.size).toBe(0);
        expect(branch.isBranch).toBe(true);
      });
    });
  });
});

describe('ReadOnlyResourceTreeRoot', () => {
  describe('create with resource array', () => {
    test('creates root from simple resources', () => {
      const resources: [ResourceId, ITestResource][] = [
        ['app' as ResourceId, { id: 'app', value: 'Application' }],
        ['greeting' as ResourceId, { id: 'greeting', value: 'Hello' }]
      ];

      expect(ResourceTree.ReadOnlyResourceTreeRoot.create(resources)).toSucceedAndSatisfy((root) => {
        expect(root.isRoot).toBe(true);
        expect(root.isLeaf).toBe(false);
        expect(root.isBranch).toBe(false);
        expect(root.children.size).toBe(2);
        expect(root.children.has('app' as ResourceName)).toBe(true);
        expect(root.children.has('greeting' as ResourceName)).toBe(true);
      });
    });

    test('creates root with hierarchical resources', () => {
      const resources: [ResourceId, ITestResource][] = [
        ['app.messages.welcome' as ResourceId, { id: 'welcome', value: 'Welcome!' }],
        ['app.errors.notFound' as ResourceId, { id: 'notFound', value: 'Not Found' }],
        ['user.profile' as ResourceId, { id: 'profile', value: 'Profile' }],
        ['settings' as ResourceId, { id: 'settings', value: 'Settings' }]
      ];

      expect(ResourceTree.ReadOnlyResourceTreeRoot.create(resources)).toSucceedAndSatisfy((root) => {
        expect(root.children.size).toBe(3); // app, user, and settings

        // Check app branch (no resource, only children)
        expect(root.children.get('app' as ResourceName)).toSucceedAndSatisfy((appNode) => {
          expect(appNode.isLeaf).toBe(false); // No resource at app level
          expect(appNode.isBranch).toBe(true); // Has children
        });

        // Check user branch (no resource, only children)
        expect(root.children.get('user' as ResourceName)).toSucceedAndSatisfy((userNode) => {
          expect(userNode.isLeaf).toBe(false); // No resource at user level
          expect(userNode.isBranch).toBe(true); // Has children
        });

        // Check settings leaf (resource, no children)
        expect(root.children.get('settings' as ResourceName)).toSucceedAndSatisfy((settingsNode) => {
          expect(settingsNode.isLeaf).toBe(true); // Has resource
          expect(settingsNode.isBranch).toBe(false); // No children
        });

        // Test nested access
        expect(root.children.getById('app.messages.welcome' as ResourceId)).toSucceedAndSatisfy(
          (welcomeNode) => {
            expect(welcomeNode.isLeaf).toBe(true);
            expect(welcomeNode.path).toBe('app.messages.welcome');
          }
        );
      });
    });

    test('fails with duplicate resources', () => {
      const resources: [ResourceId, ITestResource][] = [
        ['app' as ResourceId, { id: 'app1', value: 'First' }],
        ['app' as ResourceId, { id: 'app2', value: 'Second' }]
      ];

      expect(ResourceTree.ReadOnlyResourceTreeRoot.create(resources)).toFailWith(
        /Duplicate resource at path/
      );
    });

    test('fails with conflicting leaf/branch structure', () => {
      const resources: [ResourceId, ITestResource][] = [
        ['app' as ResourceId, { id: 'app', value: 'Application' }],
        ['app.child' as ResourceId, { id: 'child', value: 'Child' }]
      ];

      // This should fail because 'app' cannot be both a resource and have children
      expect(ResourceTree.ReadOnlyResourceTreeRoot.create(resources)).toFailWith(
        /Expected a branch but found a leaf/
      );
    });

    test('handles deep nesting', () => {
      const resources: [ResourceId, ITestResource][] = [
        ['level1.level2.level3.level4.deep' as ResourceId, { id: 'deep', value: 'Deep Resource' }]
      ];

      expect(ResourceTree.ReadOnlyResourceTreeRoot.create(resources)).toSucceedAndSatisfy((root) => {
        expect(root.children.size).toBe(1);
        expect(root.children.getById('level1.level2.level3.level4.deep' as ResourceId)).toSucceedAndSatisfy(
          (deepNode) => {
            expect(deepNode.isLeaf).toBe(true);
            expect(deepNode.path).toBe('level1.level2.level3.level4.deep');
          }
        );
      });
    });

    test('handles empty resource array', () => {
      expect(ResourceTree.ReadOnlyResourceTreeRoot.create([])).toSucceedAndSatisfy((root) => {
        expect(root.children.size).toBe(0);
        expect(root.isRoot).toBe(true);
      });
    });
  });

  describe('create with init object', () => {
    test('creates root from init structure', () => {
      const init = {
        children: {
          app: { resource: { id: 'app', value: 'Application' } },
          messages: {
            children: {
              welcome: { resource: { id: 'welcome', value: 'Welcome!' } }
            } as Record<ResourceName, { resource: ITestResource }>
          }
        } as Record<
          ResourceName,
          { resource: ITestResource } | { children: Record<ResourceName, { resource: ITestResource }> }
        >
      };

      expect(ResourceTree.ReadOnlyResourceTreeRoot.create(init)).toSucceedAndSatisfy((root) => {
        expect(root.children.size).toBe(2);
        expect(root.children.has('app' as ResourceName)).toBe(true);
        expect(root.children.has('messages' as ResourceName)).toBe(true);
      });
    });

    test('creates empty root from empty init', () => {
      const init = { children: {} };

      expect(ResourceTree.ReadOnlyResourceTreeRoot.create(init)).toSucceedAndSatisfy((root) => {
        expect(root.children.size).toBe(0);
      });
    });
  });

  describe('createResourceTreeInit', () => {
    test('converts simple resources to init structure', () => {
      const resources: [ResourceId, ITestResource][] = [
        ['app' as ResourceId, { id: 'app', value: 'Application' }],
        ['greeting' as ResourceId, { id: 'greeting', value: 'Hello' }]
      ];

      expect(ResourceTree.ReadOnlyResourceTreeRoot.createResourceTreeInit(resources)).toSucceedAndSatisfy(
        (init) => {
          expect('app' in init.children).toBe(true);
          expect('greeting' in init.children).toBe(true);
          expect((init.children as Record<string, { resource: ITestResource }>).app).toEqual({
            resource: { id: 'app', value: 'Application' }
          });
        }
      );
    });

    test('converts hierarchical resources to nested init structure', () => {
      const resources: [ResourceId, ITestResource][] = [
        ['app.messages.welcome' as ResourceId, { id: 'welcome', value: 'Welcome!' }]
      ];

      expect(ResourceTree.ReadOnlyResourceTreeRoot.createResourceTreeInit(resources)).toSucceedAndSatisfy(
        (init) => {
          expect('app' in init.children).toBe(true);
          const appChild = (
            init.children as Record<
              string,
              { children: Record<string, { children: Record<string, { resource: ITestResource }> }> }
            >
          ).app;
          expect('children' in appChild).toBe(true);

          if ('children' in appChild) {
            expect('messages' in appChild.children).toBe(true);
            const messagesChild = appChild.children.messages;
            expect('children' in messagesChild).toBe(true);

            if ('children' in messagesChild) {
              expect('welcome' in messagesChild.children).toBe(true);
              expect(messagesChild.children.welcome).toEqual({
                resource: { id: 'welcome', value: 'Welcome!' }
              });
            }
          }
        }
      );
    });

    test('fails with duplicate resources', () => {
      const resources: [ResourceId, ITestResource][] = [
        ['app' as ResourceId, { id: 'app1', value: 'First' }],
        ['app' as ResourceId, { id: 'app2', value: 'Second' }]
      ];

      expect(ResourceTree.ReadOnlyResourceTreeRoot.createResourceTreeInit(resources)).toFailWith(
        /Duplicate resource at path/
      );
    });

    test('handles invalid resource IDs', () => {
      const resources: [ResourceId, ITestResource][] = [
        ['invalid..id' as ResourceId, { id: 'invalid', value: 'Invalid' }]
      ];

      expect(ResourceTree.ReadOnlyResourceTreeRoot.createResourceTreeInit(resources)).toFail();
    });
  });

  describe('resource access methods', () => {
    let root: ResourceTree.ReadOnlyResourceTreeRoot<ITestResource>;

    beforeEach(() => {
      const resources: [ResourceId, ITestResource][] = [
        ['app.messages.welcome' as ResourceId, { id: 'welcome', value: 'Welcome!' }],
        ['user.profile' as ResourceId, { id: 'profile', value: 'Profile' }],
        ['settings' as ResourceId, { id: 'settings', value: 'Settings' }]
      ];
      root = ResourceTree.ReadOnlyResourceTreeRoot.create(resources).orThrow();
    });

    test('getById returns correct nodes', () => {
      // Test branch node access
      expect(root.children.getById('app' as ResourceId)).toSucceedAndSatisfy((node) => {
        expect(node.path).toBe('app');
        expect(node.isBranch).toBe(true);
        expect(node.isLeaf).toBe(false);
      });

      // Test leaf node access
      expect(root.children.getById('app.messages.welcome' as ResourceId)).toSucceedAndSatisfy((node) => {
        expect(node.path).toBe('app.messages.welcome');
        expect(node.isLeaf).toBe(true);
        expect(node.isBranch).toBe(false);
      });

      // Test root-level leaf access
      expect(root.children.getById('settings' as ResourceId)).toSucceedAndSatisfy((node) => {
        expect(node.path).toBe('settings');
        expect(node.isLeaf).toBe(true);
        expect(node.isBranch).toBe(false);
      });
    });

    test('getResourceById returns only leaf nodes', () => {
      // Should fail for branch nodes
      expect(root.children.getResourceById('app' as ResourceId)).toFailWith(/not a resource/);
      expect(root.children.getResourceById('app.messages' as ResourceId)).toFailWith(/not a resource/);

      // Should succeed for leaf nodes
      expect(root.children.getResourceById('app.messages.welcome' as ResourceId)).toSucceed();
      expect(root.children.getResourceById('settings' as ResourceId)).toSucceed();
    });

    test('getBranchById returns only branch nodes', () => {
      // Should succeed for branch nodes
      expect(root.children.getBranchById('app' as ResourceId)).toSucceed();
      expect(root.children.getBranchById('app.messages' as ResourceId)).toSucceed();
      expect(root.children.getBranchById('user' as ResourceId)).toSucceed();

      // Should fail for leaf nodes
      expect(root.children.getBranchById('app.messages.welcome' as ResourceId)).toFailWith(/not a branch/);
      expect(root.children.getBranchById('settings' as ResourceId)).toFailWith(/not a branch/);
    });
  });
});
