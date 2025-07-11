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

import { MessageAggregator, Result, captureResult, mapResults, succeed } from '@fgv/ts-utils';
import { ResourceId, ResourceName, Helpers } from '../../common';
import {
  IReadOnlyResourceTreeNode,
  IReadOnlyResourceTreeLeaf,
  IReadOnlyResourceTreeBranch,
  IReadOnlyResourceTreeRoot,
  IReadOnlyResourceTreeChildren
} from './common';
import { ReadOnlyResourceTreeChildren } from './resourceTreeChildren';

/**
 * Interface for initializing a resource tree root with child nodes.
 * @public
 */
export interface IResourceTreeRootInit<T> {
  readonly children: Record<ResourceName, ResourceTreeNodeInit<T>>;
}

/**
 * Interface for initializing a leaf node with a resource value.
 * @public
 */
export interface IResourceTreeLeafInit<T> {
  readonly resource: T;
}

/**
 * Interface for initializing a branch node with child nodes.
 * @public
 */
export interface IResourceTreeBranchInit<T> {
  readonly children: Record<ResourceName, ResourceTreeNodeInit<T>>;
}

/**
 * Union type for tree node initialization data.
 * @public
 */
export type ResourceTreeNodeInit<T> = IResourceTreeLeafInit<T> | IResourceTreeBranchInit<T>;

// Type guards
/**
 * Type guard to determine if an init object represents a branch or root with children.
 * @param init - The initialization object to test
 * @returns True if the init object has children property
 * @public
 */
export function isResourceTreeRootOrNodeInit<T>(
  init: ResourceTreeNodeInit<T> | IResourceTreeRootInit<T>
): init is IResourceTreeBranchInit<T> {
  return 'children' in init;
}

/**
 * Type guard to determine if an init object represents a leaf node with a resource.
 * @param init - The initialization object to test
 * @returns True if the init object has a resource but no children
 * @public
 */
export function isResourceTreeLeafInit<T>(init: ResourceTreeNodeInit<T>): init is IResourceTreeLeafInit<T> {
  return 'resource' in init && !('children' in init);
}

/**
 * Implementation of a read-only resource tree leaf node that contains a resource value.
 * Leaf nodes represent the actual resources in the tree and cannot have children.
 * @public
 */
export class ReadOnlyResourceTreeLeaf<T> implements IReadOnlyResourceTreeLeaf<T> {
  public readonly name: ResourceName;
  public readonly id: ResourceId;
  public readonly resource: T;

  public get isRoot(): false {
    return false;
  }

  public get isBranch(): false {
    return false;
  }

  public get isLeaf(): true {
    return true;
  }

  /**
   * Creates a new leaf node. Use the static create method instead.
   * @param name - The name of this node (last segment of the path)
   * @param parentPath - The path to the parent node (undefined for root-level nodes)
   * @param resource - The resource value stored in this leaf
   */
  protected constructor(name: ResourceName, parentPath: ResourceId | undefined, resource: T) {
    this.name = name;
    this.id = Helpers.joinResourceIds(parentPath, name).orThrow();
    this.resource = resource;
  }

  /**
   * Creates a new ReadOnlyResourceTreeLeaf instance.
   * @param name - The name of this node (last segment of the path)
   * @param parentPath - The path to the parent node (undefined for root-level nodes)
   * @param resource - The resource value to store in this leaf
   * @returns Result containing the new leaf node or failure if construction fails
   */
  public static create<T>(
    name: ResourceName,
    parentPath: ResourceId | undefined,
    resource: T
  ): Result<ReadOnlyResourceTreeLeaf<T>> {
    return captureResult(() => new ReadOnlyResourceTreeLeaf(name, parentPath, resource));
  }
}

/**
 * Implementation of a read-only resource tree branch node that contains child nodes.
 * Branch nodes organize other nodes in a hierarchical structure and may optionally contain a resource value.
 * @public
 */
export class ReadOnlyResourceTreeBranch<T> implements IReadOnlyResourceTreeBranch<T> {
  public readonly children: IReadOnlyResourceTreeChildren<T>;
  public readonly name: ResourceName;
  public readonly id: ResourceId;

  public get isRoot(): false {
    return false;
  }

  public get isBranch(): true {
    return true;
  }

  public get isLeaf(): false {
    return false;
  }

  /**
   * Creates a new branch node. Use the static create method instead.
   * @param name - The name of this node (last segment of the path)
   * @param parentPath - The path to the parent node (undefined for root-level nodes)
   * @param init - Initialization data containing child nodes
   */
  private constructor(
    name: ResourceName,
    parentPath: ResourceId | undefined,
    init: IResourceTreeBranchInit<T>
  ) {
    this.name = name;
    this.id = Helpers.joinResourceIds(parentPath, name).orThrow();

    const children = mapResults<IReadOnlyResourceTreeNode<T>>(
      (
        Array.from(Object.entries(init.children)) as [
          ResourceName,
          IResourceTreeBranchInit<T> | IResourceTreeLeafInit<T>
        ][]
      ).map(([childName, childInit]) => {
        if (isResourceTreeLeafInit(childInit)) {
          return ReadOnlyResourceTreeLeaf.create(childName, this.id, childInit.resource);
        }
        return ReadOnlyResourceTreeBranch.create(childName, this.id, childInit);
      })
    ).orThrow();

    this.children = new ReadOnlyResourceTreeChildren(
      this.id,
      children.map((c): [ResourceName, IReadOnlyResourceTreeNode<T>] => [c.name, c])
    );
  }

  /**
   * Creates a new ReadOnlyResourceTreeBranch instance.
   * @param childName - The name of this node (last segment of the path)
   * @param path - The path to the parent node (undefined for root-level nodes)
   * @param childInit - Initialization data containing child nodes
   * @returns Result containing the new branch node or failure if construction fails
   */
  public static create<T>(
    childName: ResourceName,
    path: ResourceId | undefined,
    childInit: IResourceTreeBranchInit<T>
  ): Result<ReadOnlyResourceTreeBranch<T>> {
    return captureResult(() => new ReadOnlyResourceTreeBranch(childName, path, childInit));
  }
}

/**
 * Union type representing any node in a read-only resource tree.
 * @public
 */
export type ReadOnlyResourceTreeNode<T> = ReadOnlyResourceTreeBranch<T> | ReadOnlyResourceTreeLeaf<T>;

/**
 * Implementation of a read-only resource tree root that organizes resources hierarchically.
 * The root provides the entry point for tree navigation and resource access by ResourceId paths.
 * @public
 */
export class ReadOnlyResourceTreeRoot<T> implements IReadOnlyResourceTreeRoot<T> {
  public readonly children: IReadOnlyResourceTreeChildren<T>;

  public get isRoot(): true {
    return true;
  }

  public get isBranch(): false {
    return false;
  }

  public get isLeaf(): false {
    return false;
  }

  /**
   * Creates a new root node. Use the static create method instead.
   * @param init - Initialization data containing child nodes
   */
  protected constructor(init: IResourceTreeRootInit<T>) {
    const children = mapResults<ReadOnlyResourceTreeBranch<T> | ReadOnlyResourceTreeLeaf<T>>(
      (
        Array.from(Object.entries(init.children)) as [
          ResourceName,
          IResourceTreeBranchInit<T> | IResourceTreeLeafInit<T>
        ][]
      ).map(([childName, childInit]) => {
        if (isResourceTreeLeafInit(childInit)) {
          return ReadOnlyResourceTreeLeaf.create(childName, undefined, childInit.resource);
        }
        return ReadOnlyResourceTreeBranch.create(childName, undefined, childInit);
      })
    ).orThrow();

    this.children = new ReadOnlyResourceTreeChildren(
      undefined,
      children.map((c): [ResourceName, IReadOnlyResourceTreeNode<T>] => [c.name, c])
    );
  }

  /**
   * Creates a new ReadOnlyResourceTreeRoot from an array of resources.
   * @param resources - Array of [ResourceId, resource] pairs to build the tree from
   * @returns Result containing the new root or failure if construction fails
   */
  public static create<T>(resources: [ResourceId, T][]): Result<ReadOnlyResourceTreeRoot<T>>;

  /**
   * Creates a new ReadOnlyResourceTreeRoot from initialization data.
   * @param init - Tree initialization structure
   * @returns Result containing the new root or failure if construction fails
   */
  public static create<T>(init: IResourceTreeRootInit<T>): Result<ReadOnlyResourceTreeRoot<T>>;

  /**
   * Creates a new ReadOnlyResourceTreeRoot from either resources or initialization data.
   * @param init - Either an array of [ResourceId, resource] pairs or tree initialization structure
   * @returns Result containing the new root or failure if construction fails
   */
  public static create<T>(
    init: IResourceTreeRootInit<T> | [ResourceId, T][]
  ): Result<ReadOnlyResourceTreeRoot<T>> {
    if (Array.isArray(init)) {
      return ReadOnlyResourceTreeRoot.createResourceTreeInit(init).onSuccess((treeInit) =>
        captureResult(() => new ReadOnlyResourceTreeRoot(treeInit))
      );
    }
    return captureResult(() => new ReadOnlyResourceTreeRoot(init));
  }

  /**
   * Converts an array of resources into tree initialization data.
   * Validates that resource paths do not conflict - if a path has child resources,
   * it cannot itself be a resource (e.g., if 'app.messages.welcome' exists, then 'app' cannot be a resource).
   * @param resources - Array of [ResourceId, resource] pairs to convert
   * @returns Result containing the initialization structure or failure if validation fails
   */
  public static createResourceTreeInit<T>(resources: [ResourceId, T][]): Result<IResourceTreeRootInit<T>> {
    const errors: MessageAggregator = new MessageAggregator();
    const root: IResourceTreeRootInit<T> = { children: {} };

    for (const [id, resource] of resources) {
      Helpers.splitResourceId(id)
        .onSuccess((pathComponents) => {
          let currentNode: IResourceTreeBranchInit<T> | IResourceTreeRootInit<T> = root;
          const resourceName = pathComponents.pop()!;

          for (const nodeName of pathComponents) {
            if (isResourceTreeRootOrNodeInit(currentNode)) {
              if (!(nodeName in currentNode.children)) {
                currentNode.children[nodeName] = { children: {} };
              }
              if (isResourceTreeLeafInit(currentNode.children[nodeName])) {
                errors.addMessage(`${id}: Expected a branch but found a leaf at ${nodeName}.`);
              } else {
                currentNode = currentNode.children[nodeName];
              }
            } else if (isResourceTreeLeafInit(currentNode)) {
              errors.addMessage(`${id}: Expected a branch but found a leaf.`);
              break;
            } else {
              errors.addMessage(`${id}: Unexpected structure in resource tree`);
            }
          }

          if (isResourceTreeRootOrNodeInit(currentNode)) {
            if (resourceName in currentNode.children) {
              errors.addMessage(`${id}: Duplicate resource at path.`);
            } else {
              currentNode.children[resourceName] = { resource };
            }
          } else {
            errors.addMessage(`${id}: Expected a branch but found a leaf.`);
          }
          return succeed(currentNode.children[resourceName]);
        })
        .aggregateError(errors);
    }
    return errors.returnOrReport(succeed(root));
  }
}
