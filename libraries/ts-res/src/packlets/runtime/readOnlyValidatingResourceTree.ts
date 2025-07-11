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

import { Result, captureResult, succeed } from '@fgv/ts-utils';
import { ResourceId, ResourceName, Convert } from '../common';
import {
  IReadOnlyResourceTreeLeaf,
  IReadOnlyResourceTreeBranch,
  IReadOnlyResourceTreeNode,
  IReadOnlyResourceTreeRoot,
  IResourceTreeRootInit
} from './resultResourceTree';
import { ReadOnlyResourceTreeRoot } from './readOnlyResourceTree';

/**
 * A read-only interface for a validating resource tree that accepts string inputs.
 * @public
 */
export interface IReadOnlyValidatingResourceTree<T> {
  /**
   * The underlying resource tree root instance.
   */
  readonly tree: IReadOnlyResourceTreeRoot<T>;

  /**
   * Gets a tree node by its string ResourceId path, validating the input.
   * @param id - The string ResourceId path to validate and look up
   * @returns Result containing the node if found, or failure if validation fails or not found
   */
  getById(id: string): Result<IReadOnlyResourceTreeNode>;

  /**
   * Gets a resource leaf node by its string ResourceId path, validating the input.
   * @param id - The string ResourceId path to validate and look up
   * @returns Result containing the leaf if found and is a resource, or failure otherwise
   */
  getResourceById(id: string): Result<IReadOnlyResourceTreeLeaf<T>>;

  /**
   * Gets a branch node by its string ResourceId path, validating the input.
   * @param id - The string ResourceId path to validate and look up
   * @returns Result containing the branch if found and has children, or failure otherwise
   */
  getBranchById(id: string): Result<IReadOnlyResourceTreeBranch<T>>;

  /**
   * Gets a resource node by its string name (single component), validating the input.
   * @param name - The string ResourceName to validate and look up
   * @returns Result containing the node if it's a resource, or failure if validation fails or not found
   */
  getResource(name: string): Result<IReadOnlyResourceTreeNode>;

  /**
   * Gets a branch node by its string name (single component), validating the input.
   * @param name - The string ResourceName to validate and look up
   * @returns Result containing the node if it's a branch, or failure if validation fails or not found
   */
  getBranch(name: string): Result<IReadOnlyResourceTreeNode>;

  /**
   * Checks if a node exists at the given string ResourceId path.
   * @param id - The string ResourceId path to validate and check
   * @returns Result containing true if node exists, false if not, or failure if validation fails
   */
  has(id: string): Result<boolean>;

  /**
   * Checks if a resource exists at the given string ResourceId path.
   * @param id - The string ResourceId path to validate and check
   * @returns Result containing true if resource exists, false if not, or failure if validation fails
   */
  hasResource(id: string): Result<boolean>;

  /**
   * Checks if a branch exists at the given string ResourceId path.
   * @param id - The string ResourceId path to validate and check
   * @returns Result containing true if branch exists, false if not, or failure if validation fails
   */
  hasBranch(id: string): Result<boolean>;
}

/**
 * Implementation of a validating resource tree that validates string inputs before delegating to the underlying tree.
 * @public
 */
export class ReadOnlyValidatingResourceTree<T> implements IReadOnlyValidatingResourceTree<T> {
  public readonly tree: IReadOnlyResourceTreeRoot<T>;

  /**
   * Creates a new validating resource tree wrapper.
   * @param tree - The underlying resource tree root to wrap
   */
  public constructor(tree: IReadOnlyResourceTreeRoot<T>) {
    this.tree = tree;
  }

  public getById(id: string): Result<IReadOnlyResourceTreeNode> {
    return Convert.resourceId
      .convert(id)
      .onSuccess((validId: ResourceId) => this.tree.children.getById(validId));
  }

  public getResourceById(id: string): Result<IReadOnlyResourceTreeLeaf<T>> {
    return Convert.resourceId
      .convert(id)
      .onSuccess((validId: ResourceId) => this.tree.children.getResourceById(validId));
  }

  public getBranchById(id: string): Result<IReadOnlyResourceTreeBranch<T>> {
    return Convert.resourceId
      .convert(id)
      .onSuccess((validId: ResourceId) => this.tree.children.getBranchById(validId));
  }

  public getResource(name: string): Result<IReadOnlyResourceTreeNode> {
    return Convert.resourceName
      .convert(name)
      .onSuccess((validName: ResourceName) => this.tree.children.getResource(validName));
  }

  public getBranch(name: string): Result<IReadOnlyResourceTreeNode> {
    return Convert.resourceName
      .convert(name)
      .onSuccess((validName: ResourceName) => this.tree.children.getBranch(validName));
  }

  public has(id: string): Result<boolean> {
    return Convert.resourceId.convert(id).onSuccess((validId: ResourceId) => {
      return this.tree.children
        .getById(validId)
        .onSuccess(() => succeed(true))
        .onFailure(() => succeed(false));
    });
  }

  public hasResource(id: string): Result<boolean> {
    return Convert.resourceId.convert(id).onSuccess((validId: ResourceId) => {
      return this.tree.children
        .getResourceById(validId)
        .onSuccess(() => succeed(true))
        .onFailure(() => succeed(false));
    });
  }

  public hasBranch(id: string): Result<boolean> {
    return Convert.resourceId.convert(id).onSuccess((validId: ResourceId) => {
      return this.tree.children
        .getBranchById(validId)
        .onSuccess(() => succeed(true))
        .onFailure(() => succeed(false));
    });
  }
}

/**
 * Parameters for creating a ReadOnlyValidatingResourceTree.
 * @public
 */
export interface IReadOnlyValidatingResourceTreeCreateParams<T> {
  /**
   * Array of [ResourceId, resource] pairs to build the tree from.
   */
  resources: [ResourceId, T][];
}

/**
 * Alternative parameters for creating a ReadOnlyValidatingResourceTree from initialization data.
 * @public
 */
export interface IReadOnlyValidatingResourceTreeCreateFromInitParams<T> {
  /**
   * Tree initialization structure.
   */
  init: IResourceTreeRootInit<T>;
}

/**
 * A ReadOnlyResourceTreeRoot with a validating property that enables validated use with string inputs.
 * This eliminates the need for type casting in consumer code.
 * @public
 */
export class ReadOnlyValidatingResourceTreeRoot<T> extends ReadOnlyResourceTreeRoot<T> {
  /**
   * A validating interface that validates string inputs before passing them to this tree.
   */
  public readonly validating: IReadOnlyValidatingResourceTree<T>;

  /**
   * Creates a new validating resource tree root. Use the static create method instead.
   * @param params - Parameters for creating the validating tree
   */
  protected constructor(
    params:
      | IReadOnlyValidatingResourceTreeCreateParams<T>
      | IReadOnlyValidatingResourceTreeCreateFromInitParams<T>
  ) {
    if ('resources' in params) {
      // Create from resources array
      const initResult = ReadOnlyResourceTreeRoot.createResourceTreeInit(params.resources);
      super(initResult.orThrow());
    } else {
      // Create from init structure
      super(params.init);
    }

    this.validating = new ReadOnlyValidatingResourceTree(this);
  }

  /**
   * Creates a new ReadOnlyValidatingResourceTreeRoot from an array of resources.
   * @param resources - Array of [ResourceId, resource] pairs to build the tree from
   * @returns Result containing the new validating tree root or failure if construction fails
   */
  public static create<T>(resources: [ResourceId, T][]): Result<ReadOnlyValidatingResourceTreeRoot<T>>;

  /**
   * Creates a new ReadOnlyValidatingResourceTreeRoot from initialization data.
   * @param init - Tree initialization structure
   * @returns Result containing the new validating tree root or failure if construction fails
   */
  public static create<T>(init: IResourceTreeRootInit<T>): Result<ReadOnlyValidatingResourceTreeRoot<T>>;

  /**
   * Creates a new ReadOnlyValidatingResourceTreeRoot from either resources or initialization data.
   * @param init - Either an array of [ResourceId, resource] pairs or tree initialization structure
   * @returns Result containing the new validating tree root or failure if construction fails
   */
  public static create<T>(
    init: [ResourceId, T][] | IResourceTreeRootInit<T>
  ): Result<ReadOnlyValidatingResourceTreeRoot<T>> {
    if (Array.isArray(init)) {
      return captureResult(() => new ReadOnlyValidatingResourceTreeRoot({ resources: init }));
    }
    return captureResult(() => new ReadOnlyValidatingResourceTreeRoot({ init }));
  }
}
