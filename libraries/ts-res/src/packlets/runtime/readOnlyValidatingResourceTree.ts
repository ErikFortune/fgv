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
  IResourceTreeRootInit,
  IReadOnlyResultResourceTree
} from './resultResourceTree';
import { ReadOnlyResourceTreeRoot } from './readOnlyResourceTree';

/**
 * A validating wrapper for resource tree collections that validates string inputs.
 * @public
 */
export interface IReadOnlyValidatingResourceTreeCollection<T> {
  /**
   * The underlying resource tree collection instance.
   */
  readonly tree: IReadOnlyResultResourceTree<T>;

  /**
   * The number of direct child nodes in this collection.
   */
  readonly size: number;

  /**
   * Gets a tree node by its string ResourceId path, validating the input.
   * @param id - The string ResourceId path to validate and look up
   * @returns Result containing the node if found, or failure if validation fails or not found
   */
  getById(id: string): Result<IReadOnlyValidatingResourceTreeNode<T>>;

  /**
   * Gets a resource leaf node by its string ResourceId path, validating the input.
   * @param id - The string ResourceId path to validate and look up
   * @returns Result containing the validating leaf if found and is a resource, or failure otherwise
   */
  getResourceById(id: string): Result<IReadOnlyValidatingResourceTreeLeaf<T>>;

  /**
   * Gets a branch node by its string ResourceId path, validating the input.
   * @param id - The string ResourceId path to validate and look up
   * @returns Result containing the validating branch if found and has children, or failure otherwise
   */
  getBranchById(id: string): Result<IReadOnlyValidatingResourceTreeBranch<T>>;

  /**
   * Gets a resource node by its string name (single component), validating the input.
   * @param name - The string ResourceName to validate and look up
   * @returns Result containing the validating node if it's a resource, or failure if validation fails or not found
   */
  getResource(name: string): Result<IReadOnlyValidatingResourceTreeLeaf<T>>;

  /**
   * Gets a branch node by its string name (single component), validating the input.
   * @param name - The string ResourceName to validate and look up
   * @returns Result containing the validating node if it's a branch, or failure if validation fails or not found
   */
  getBranch(name: string): Result<IReadOnlyValidatingResourceTreeBranch<T>>;

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
 * Base interface for validating tree nodes that provide string validation capabilities.
 * @public
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface IReadOnlyValidatingResourceTreeNode<T> {
  /**
   * The underlying tree node instance.
   */
  readonly node: IReadOnlyResourceTreeNode;

  /**
   * The name of this node.
   */
  readonly name: ResourceName;

  /**
   * The full path to this node.
   */
  readonly path: ResourceId;

  /**
   * Whether this is the root node.
   */
  readonly isRoot: boolean;

  /**
   * Whether this is a leaf node (contains a resource).
   */
  readonly isLeaf: boolean;

  /**
   * Whether this is a branch node (has children).
   */
  readonly isBranch: boolean;
}

/**
 * Interface for validating leaf nodes that contain resources.
 * @public
 */
export interface IReadOnlyValidatingResourceTreeLeaf<T> extends IReadOnlyValidatingResourceTreeNode<T> {
  /**
   * The underlying leaf node instance.
   */
  readonly node: IReadOnlyResourceTreeLeaf<T>;

  /**
   * The resource contained in this leaf.
   */
  readonly resource: T;

  readonly isLeaf: true;
  readonly isBranch: false;
  readonly isRoot: false;
}

/**
 * Interface for validating branch nodes that contain child collections.
 * @public
 */
export interface IReadOnlyValidatingResourceTreeBranch<T> extends IReadOnlyValidatingResourceTreeNode<T> {
  /**
   * The underlying branch node instance.
   */
  readonly node: IReadOnlyResourceTreeBranch<T>;

  /**
   * Validating children collection that accepts string inputs.
   */
  readonly children: IReadOnlyValidatingResourceTreeCollection<T>;

  readonly isLeaf: false;
  readonly isBranch: true;
  readonly isRoot: false;
}

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
   * Validating children collection that accepts string inputs.
   */
  readonly children: IReadOnlyValidatingResourceTreeCollection<T>;

  /**
   * Gets a tree node by its string ResourceId path, validating the input.
   * @param id - The string ResourceId path to validate and look up
   * @returns Result containing the validating node if found, or failure if validation fails or not found
   */
  getById(id: string): Result<IReadOnlyValidatingResourceTreeNode<T>>;

  /**
   * Gets a resource leaf node by its string ResourceId path, validating the input.
   * @param id - The string ResourceId path to validate and look up
   * @returns Result containing the validating leaf if found and is a resource, or failure otherwise
   */
  getResourceById(id: string): Result<IReadOnlyValidatingResourceTreeLeaf<T>>;

  /**
   * Gets a branch node by its string ResourceId path, validating the input.
   * @param id - The string ResourceId path to validate and look up
   * @returns Result containing the validating branch if found and has children, or failure otherwise
   */
  getBranchById(id: string): Result<IReadOnlyValidatingResourceTreeBranch<T>>;

  /**
   * Gets a resource node by its string name (single component), validating the input.
   * @param name - The string ResourceName to validate and look up
   * @returns Result containing the validating node if it's a resource, or failure if validation fails or not found
   */
  getResource(name: string): Result<IReadOnlyValidatingResourceTreeLeaf<T>>;

  /**
   * Gets a branch node by its string name (single component), validating the input.
   * @param name - The string ResourceName to validate and look up
   * @returns Result containing the validating node if it's a branch, or failure if validation fails or not found
   */
  getBranch(name: string): Result<IReadOnlyValidatingResourceTreeBranch<T>>;

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
 * Implementation of a validating resource tree collection that validates string inputs.
 * @public
 */
export class ReadOnlyValidatingResourceTreeCollection<T>
  implements IReadOnlyValidatingResourceTreeCollection<T>
{
  public readonly tree: IReadOnlyResultResourceTree<T>;

  /**
   * Creates a new validating tree collection wrapper.
   * @param tree - The underlying tree collection to wrap
   */
  public constructor(tree: IReadOnlyResultResourceTree<T>) {
    this.tree = tree;
  }

  /**
   * The number of direct child nodes in this collection.
   */
  public get size(): number {
    return this.tree.size;
  }

  public getById(id: string): Result<IReadOnlyValidatingResourceTreeNode<T>> {
    return Convert.resourceId
      .convert(id)
      .onSuccess((validId: ResourceId) => this.tree.getById(validId))
      .onSuccess((node) => succeed(wrapValidatingNode(node)));
  }

  public getResourceById(id: string): Result<IReadOnlyValidatingResourceTreeLeaf<T>> {
    return Convert.resourceId
      .convert(id)
      .onSuccess((validId: ResourceId) => this.tree.getResourceById(validId))
      .onSuccess((leaf) => succeed(wrapValidatingLeaf(leaf)));
  }

  public getBranchById(id: string): Result<IReadOnlyValidatingResourceTreeBranch<T>> {
    return Convert.resourceId
      .convert(id)
      .onSuccess((validId: ResourceId) => this.tree.getBranchById(validId))
      .onSuccess((branch) => succeed(wrapValidatingBranch(branch)));
  }

  public getResource(name: string): Result<IReadOnlyValidatingResourceTreeLeaf<T>> {
    return Convert.resourceName
      .convert(name)
      .onSuccess((validName: ResourceName) => this.tree.getResource(validName))
      .onSuccess((node) => succeed(wrapValidatingLeaf(node as IReadOnlyResourceTreeLeaf<T>)));
  }

  public getBranch(name: string): Result<IReadOnlyValidatingResourceTreeBranch<T>> {
    return Convert.resourceName
      .convert(name)
      .onSuccess((validName: ResourceName) => this.tree.getBranch(validName))
      .onSuccess((node) => succeed(wrapValidatingBranch(node as IReadOnlyResourceTreeBranch<T>)));
  }

  public has(id: string): Result<boolean> {
    return Convert.resourceId.convert(id).onSuccess((validId: ResourceId) => {
      return this.tree
        .getById(validId)
        .onSuccess(() => succeed(true))
        .onFailure(() => succeed(false));
    });
  }

  public hasResource(id: string): Result<boolean> {
    return Convert.resourceId.convert(id).onSuccess((validId: ResourceId) => {
      return this.tree
        .getResourceById(validId)
        .onSuccess(() => succeed(true))
        .onFailure(() => succeed(false));
    });
  }

  public hasBranch(id: string): Result<boolean> {
    return Convert.resourceId.convert(id).onSuccess((validId: ResourceId) => {
      return this.tree
        .getBranchById(validId)
        .onSuccess(() => succeed(true))
        .onFailure(() => succeed(false));
    });
  }
}

/**
 * Helper function to wrap a base tree node in a validating node interface.
 */
function wrapValidatingNode<T>(node: IReadOnlyResourceTreeNode): IReadOnlyValidatingResourceTreeNode<T> {
  if (node.isLeaf) {
    return wrapValidatingLeaf(node as IReadOnlyResourceTreeLeaf<T>);
  } else if (node.isBranch) {
    return wrapValidatingBranch(node as IReadOnlyResourceTreeBranch<T>);
  }

  // This should never happen in a well-formed tree
  throw new Error(`Invalid node type: node is neither leaf nor branch`);
}

/**
 * Helper function to wrap a base leaf node in a validating leaf interface.
 */
function wrapValidatingLeaf<T>(leaf: IReadOnlyResourceTreeLeaf<T>): IReadOnlyValidatingResourceTreeLeaf<T> {
  return {
    node: leaf,
    name: leaf.name,
    path: leaf.path,
    isRoot: leaf.isRoot,
    isLeaf: leaf.isLeaf,
    isBranch: leaf.isBranch,
    resource: leaf.resource
  };
}

/**
 * Helper function to wrap a base branch node in a validating branch interface.
 */
function wrapValidatingBranch<T>(
  branch: IReadOnlyResourceTreeBranch<T>
): IReadOnlyValidatingResourceTreeBranch<T> {
  return {
    node: branch,
    name: branch.name,
    path: branch.path,
    isRoot: branch.isRoot,
    isLeaf: branch.isLeaf,
    isBranch: branch.isBranch,
    children: new ReadOnlyValidatingResourceTreeCollection(branch.children)
  };
}

/**
 * Implementation of a validating resource tree that validates string inputs before delegating to the underlying tree.
 * @public
 */
export class ReadOnlyValidatingResourceTree<T> implements IReadOnlyValidatingResourceTree<T> {
  public readonly tree: IReadOnlyResourceTreeRoot<T>;
  public readonly children: IReadOnlyValidatingResourceTreeCollection<T>;

  /**
   * Creates a new validating resource tree wrapper.
   * @param tree - The underlying resource tree root to wrap
   */
  public constructor(tree: IReadOnlyResourceTreeRoot<T>) {
    this.tree = tree;
    this.children = new ReadOnlyValidatingResourceTreeCollection(tree.children);
  }

  public getById(id: string): Result<IReadOnlyValidatingResourceTreeNode<T>> {
    return this.children.getById(id);
  }

  public getResourceById(id: string): Result<IReadOnlyValidatingResourceTreeLeaf<T>> {
    return this.children.getResourceById(id);
  }

  public getBranchById(id: string): Result<IReadOnlyValidatingResourceTreeBranch<T>> {
    return this.children.getBranchById(id);
  }

  public getResource(name: string): Result<IReadOnlyValidatingResourceTreeLeaf<T>> {
    return this.children.getResource(name);
  }

  public getBranch(name: string): Result<IReadOnlyValidatingResourceTreeBranch<T>> {
    return this.children.getBranch(name);
  }

  public has(id: string): Result<boolean> {
    return this.children.has(id);
  }

  public hasResource(id: string): Result<boolean> {
    return this.children.hasResource(id);
  }

  public hasBranch(id: string): Result<boolean> {
    return this.children.hasBranch(id);
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
