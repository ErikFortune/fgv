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

import { Collections, IReadOnlyResultMap, Result, ResultMap, fail, succeed } from '@fgv/ts-utils';
import { ResourceId, ResourceName, Helpers } from '../../common';

// Base interfaces for resource tree nodes
/**
 * Base interface for resource tree nodes.
 * @public
 */
export interface IReadOnlyResourceTreeNode {
  readonly name: ResourceName;
  readonly path: ResourceId;
  readonly isRoot: boolean;
  readonly isLeaf: boolean;
  readonly isBranch: boolean;
}

/**
 * Interface for leaf nodes in a resource tree.
 * Leaf nodes contain resource values and cannot have child nodes.
 * In a valid resource tree, if a path has child resources (e.g., 'app.messages.welcome'),
 * then that path cannot itself be a resource (i.e., 'app' cannot be both a resource and have children).
 * @public
 */
export interface IReadOnlyResourceTreeLeaf<T> extends IReadOnlyResourceTreeNode {
  readonly resource: T;
  readonly isLeaf: true;
  readonly isBranch: false;
  readonly isRoot: false;
}

/**
 * Interface for branch nodes in a resource tree that contain child nodes.
 * Branch nodes organize the tree structure and cannot have resource values.
 * If a path has child resources, it must be a branch and cannot itself be a resource.
 * @public
 */
export interface IReadOnlyResourceTreeBranch<T> extends IReadOnlyResourceTreeNode {
  readonly children: IReadOnlyResultResourceTree<T>;
  readonly isLeaf: false;
  readonly isBranch: true;
  readonly isRoot: false;
}

/**
 * Interface for the root node of a resource tree.
 * @public
 */
export interface IReadOnlyResourceTreeRoot<T> {
  readonly children: IReadOnlyResultResourceTree<T>;
  readonly isRoot: true;
  readonly isLeaf: false;
  readonly isBranch: false;
}

// Tree initialization interfaces
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

// ResultResourceTree interface and implementation
/**
 * Interface for a read-only result-based resource tree with navigation methods.
 * @public
 */
export interface IReadOnlyResultResourceTree<T>
  extends IReadOnlyResultMap<ResourceName, IReadOnlyResourceTreeNode> {
  /**
   * Gets a tree node by its full ResourceId path.
   * @param id - The ResourceId path to look up
   * @returns Result containing the node if found, or failure if not found
   */
  getById(id: ResourceId): Result<IReadOnlyResourceTreeNode>;

  /**
   * Gets a resource node by its direct name (single component).
   * @param name - The ResourceName to look up
   * @returns Result containing the node if it's a resource, or failure if not found or not a resource
   */
  getResource(name: ResourceName): Result<IReadOnlyResourceTreeNode>;

  /**
   * Gets a branch node by its direct name (single component).
   * @param name - The ResourceName to look up
   * @returns Result containing the node if it's a branch, or failure if not found or not a branch
   */
  getBranch(name: ResourceName): Result<IReadOnlyResourceTreeNode>;

  /**
   * Gets a resource leaf node by its full ResourceId path.
   * @param id - The ResourceId path to look up
   * @returns Result containing the leaf if found and is a resource, or failure otherwise
   */
  getResourceById(id: ResourceId): Result<IReadOnlyResourceTreeLeaf<T>>;

  /**
   * Gets a branch node by its full ResourceId path.
   * @param id - The ResourceId path to look up
   * @returns Result containing the branch if found and has children, or failure otherwise
   */
  getBranchById(id: ResourceId): Result<IReadOnlyResourceTreeBranch<T>>;
}

/**
 * Implementation of a result-based resource tree that provides hierarchical access to resources.
 * Extends ResultMap to provide collection-like access while adding tree-specific navigation methods.
 * @public
 */
export class ResultResourceTree<T>
  extends ResultMap<ResourceName, IReadOnlyResourceTreeNode>
  implements IReadOnlyResultResourceTree<T>
{
  protected path: ResourceId | undefined;

  /**
   * Creates a new ResultResourceTree instance.
   * @param path - The path to this tree node (undefined for root)
   * @param entries - Array of [name, node] tuples to populate the tree
   */
  public constructor(path: ResourceId | undefined, entries: [ResourceName, IReadOnlyResourceTreeNode][]) {
    super(entries);
    this.path = path;
  }

  public getResource(name: ResourceName): Result<IReadOnlyResourceTreeNode> {
    return this.get(name).onSuccess((node) => {
      if (node.isLeaf) {
        return succeed(node).withDetail<Collections.ResultMapResultDetail>('success');
      }
      return fail<IReadOnlyResourceTreeNode>(
        `${name}: not a resource${this.path ? ` in ${this.path}` : ''}.`
      ).withDetail<Collections.ResultMapResultDetail>('failure');
    });
  }

  public getBranch(name: ResourceName): Result<IReadOnlyResourceTreeNode> {
    return this.get(name).onSuccess((node) => {
      if (node.isBranch) {
        return succeed(node).withDetail<Collections.ResultMapResultDetail>('success');
      }
      return fail<IReadOnlyResourceTreeNode>(
        `${name}: not a branch${this.path ? ` in ${this.path}` : ''}.`
      ).withDetail<Collections.ResultMapResultDetail>('failure');
    });
  }

  public getById(id: ResourceId): Result<IReadOnlyResourceTreeNode> {
    return Helpers.splitResourceId(id).onSuccess((names) => {
      let name = names.shift();
      if (name !== undefined) {
        let node = this.get(name).orDefault();
        while (node) {
          name = names.shift();
          if (name === undefined) {
            return succeed(node);
          }
          if (node.isLeaf) {
            return fail(`${id}: resource not found${this.path ? ` in ${this.path}` : ''}.`);
          }
          node = (node as IReadOnlyResourceTreeBranch<T>).children.get(name).orDefault();
        }
      }
      return fail(`${id}: resource not found${this.path ? ` in ${this.path}` : ''}.`);
    });
  }

  public getResourceById(id: ResourceId): Result<IReadOnlyResourceTreeLeaf<T>> {
    return this.getById(id).onSuccess((node) => {
      if (node.isLeaf) {
        return succeed(node as IReadOnlyResourceTreeLeaf<T>).withDetail<Collections.ResultMapResultDetail>(
          'success'
        );
      }
      return fail<IReadOnlyResourceTreeLeaf<T>>(
        `${id}: not a resource${this.path ? ` in ${this.path}` : ''}.`
      ).withDetail<Collections.ResultMapResultDetail>('failure');
    });
  }

  public getBranchById(id: ResourceId): Result<IReadOnlyResourceTreeBranch<T>> {
    return this.getById(id).onSuccess((node) => {
      if (node.isBranch) {
        return succeed(node as IReadOnlyResourceTreeBranch<T>).withDetail<Collections.ResultMapResultDetail>(
          'success'
        );
      }
      return fail<IReadOnlyResourceTreeBranch<T>>(
        `${id}: not a branch${this.path ? ` in ${this.path}` : ''}.`
      ).withDetail<Collections.ResultMapResultDetail>('failure');
    });
  }
}
