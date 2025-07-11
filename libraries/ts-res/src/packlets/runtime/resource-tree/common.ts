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

import { IReadOnlyResultMap, Result } from '@fgv/ts-utils';
import { ResourceId, ResourceName } from '../../common';

/**
 * Interface for leaf nodes in a resource tree.
 * Leaf nodes contain resource values and cannot have child nodes.
 * In a valid resource tree, if a path has child resources (e.g., 'app.messages.welcome'),
 * then that path cannot itself be a resource (i.e., 'app' cannot be both a resource and have children).
 * @public
 */
export interface IReadOnlyResourceTreeLeaf<T> {
  readonly id: ResourceId;
  readonly name: ResourceName;
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
export interface IReadOnlyResourceTreeBranch<T> {
  readonly id: ResourceId;
  readonly name: ResourceName;
  readonly children: IReadOnlyResourceTreeChildren<T>;
  readonly isLeaf: false;
  readonly isBranch: true;
  readonly isRoot: false;
}

/**
 * Interface for the root node of a resource tree.
 * @public
 */
export interface IReadOnlyResourceTreeRoot<T> {
  readonly children: IReadOnlyResourceTreeChildren<T>;
  readonly isRoot: true;
  readonly isLeaf: false;
  readonly isBranch: false;
}

/**
 * Union type representing any node in the resource tree, which can be a leaf or a branch.
 * This allows for flexible handling of different node types in the tree structure.
 * @public
 */
export type IReadOnlyResourceTreeNode<T> = IReadOnlyResourceTreeLeaf<T> | IReadOnlyResourceTreeBranch<T>;

/**
 * Interface for a read-only result-based resource tree with navigation methods.
 * @public
 */
export interface IReadOnlyResourceTreeChildren<
  T,
  TID extends string = ResourceId,
  TNAME extends string = ResourceName
> extends IReadOnlyResultMap<ResourceName, IReadOnlyResourceTreeNode<T>> {
  /**
   * Gets a tree node by its full ResourceId path.
   * @param id - The ResourceId path to look up
   * @returns Result containing the node if found, or failure if not found
   */
  getById(id: TID): Result<IReadOnlyResourceTreeNode<T>>;

  /**
   * Gets a resource node by its direct name (single component).
   * @param name - The ResourceName to look up
   * @returns Result containing the node if it's a resource, or failure if not found or not a resource
   */
  getResource(name: TNAME): Result<IReadOnlyResourceTreeNode<T>>;

  /**
   * Gets a branch node by its direct name (single component).
   * @param name - The ResourceName to look up
   * @returns Result containing the node if it's a branch, or failure if not found or not a branch
   */
  getBranch(name: TNAME): Result<IReadOnlyResourceTreeNode<T>>;

  /**
   * Gets a resource leaf node by its full ResourceId path.
   * @param id - The ResourceId path to look up
   * @returns Result containing the leaf if found and is a resource, or failure otherwise
   */
  getResourceById(id: TID): Result<IReadOnlyResourceTreeLeaf<T>>;

  /**
   * Gets a branch node by its full ResourceId path.
   * @param id - The ResourceId path to look up
   * @returns Result containing the branch if found and has children, or failure otherwise
   */
  getBranchById(id: TID): Result<IReadOnlyResourceTreeBranch<T>>;
}

/**
 * A read-only interface for accessing resource tree children using weakly-typed string keys.
 * @public
 */
export interface IReadOnlyValidatingResourceTreeChildren<T>
  extends IReadOnlyResourceTreeChildren<T, string, string> {}
