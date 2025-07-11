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
import { ResourceId, ResourceName, Convert } from '../../common';
import {
  IReadOnlyResourceTreeLeaf,
  IReadOnlyResourceTreeBranch,
  IReadOnlyResourceTreeNode,
  IReadOnlyResourceTreeRoot,
  IReadOnlyResourceTreeChildren
} from './common';
import { IResourceTreeRootInit, ReadOnlyResourceTreeRoot } from './readOnlyResourceTree';

/**
 * A validating wrapper for resource tree collections that validates string inputs before
 * delegating to the underlying tree collection. This interface provides type-safe string-based
 * access to tree operations that would normally require ResourceId and ResourceName typed parameters.
 *
 * All string inputs are validated using the library's Convert utilities before being passed
 * to the underlying tree collection, ensuring type safety and consistent error handling.
 *
 * @example
 * ```typescript
 * // Get a validating collection from a tree
 * const collection: IReadOnlyValidatingResourceTreeCollection<IResource> = tree.children;
 *
 * // Use string literals directly - validation happens automatically
 * const nodeResult = collection.getById('app.messages.welcome');
 * const resourceResult = collection.getResource('welcome');
 * const hasResult = collection.hasResource('welcome');
 * ```
 *
 * @public
 */
export interface IReadOnlyValidatingResourceTreeCollection<T> {
  /**
   * The underlying resource tree collection instance.
   */
  readonly tree: IReadOnlyResourceTreeChildren<T>;

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
 *
 * This interface wraps the underlying tree node and provides access to its properties
 * while maintaining the validating context. All validating nodes extend this interface
 * to provide consistent property access.
 *
 * @public
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface IReadOnlyValidatingResourceTreeNode<T> {
  /**
   * The underlying tree node instance.
   */
  readonly node: IReadOnlyResourceTreeNode<T>;

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
 *
 * Leaf nodes represent the terminal nodes in the resource tree that contain actual
 * resource instances. These nodes do not have children and provide direct access
 * to the resource they contain.
 *
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
 *
 * Branch nodes are intermediate nodes in the resource tree that organize the hierarchical
 * structure. They do not contain resources directly but provide access to child nodes
 * through a validating children collection that accepts string inputs.
 *
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
 *
 * This is the main interface for interacting with a validating resource tree. It provides
 * the same functionality as the underlying tree but with string-based input validation.
 * The tree is organized hierarchically based on dot-separated ResourceId strings, where
 * each segment represents a level in the tree hierarchy.
 *
 * The key benefit is that you can navigate the tree using string literals without needing
 * to convert them to typed ResourceId/ResourceName parameters - the validation happens
 * automatically and consistently returns Result<T> for all operations.
 *
 * @example
 * ```typescript
 * // Create a validating tree from resources
 * const treeResult = ReadOnlyValidatingResourceTreeRoot.create([
 *   ['app.messages.welcome', welcomeResource],
 *   ['app.messages.goodbye', goodbyeResource]
 * ]);
 *
 * const tree = treeResult.orThrow().validating;
 *
 * // Navigate with strings - validation is automatic
 * tree.getBranchById('app.messages').onSuccess((branch) => {
 *   // branch.children also provides string validation
 *   return branch.children.getResource('welcome');
 * });
 * ```
 *
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
 * Implementation of a validating resource tree collection that validates string inputs
 * before delegating to the underlying tree collection.
 *
 * This class wraps an {@link Runtime.ResourceTree.IReadOnlyResourceTreeChildren} instance and provides
 * string-based access to all tree operations. All string inputs are validated using
 * the library's Convert utilities before being passed to the underlying collection.
 *
 * @public
 */
export class ReadOnlyValidatingResourceTreeCollection<T>
  implements IReadOnlyValidatingResourceTreeCollection<T>
{
  public readonly tree: IReadOnlyResourceTreeChildren<T>;

  /**
   * Creates a new validating tree collection wrapper.
   * @param tree - The underlying tree collection to wrap with validation
   */
  public constructor(tree: IReadOnlyResourceTreeChildren<T>) {
    this.tree = tree;
  }

  /**
   * The number of direct child nodes in this collection.
   */
  public get size(): number {
    return this.tree.size;
  }

  /**
   * {@inheritDoc Runtime.ResourceTree.IReadOnlyValidatingResourceTreeCollection.getById}
   */
  public getById(id: string): Result<IReadOnlyValidatingResourceTreeNode<T>> {
    return Convert.resourceId
      .convert(id)
      .onSuccess((validId: ResourceId) => this.tree.getById(validId))
      .onSuccess((node) => succeed(wrapValidatingNode(node)));
  }

  /**
   * {@inheritDoc Runtime.ResourceTree.IReadOnlyValidatingResourceTreeCollection.getResourceById}
   */
  public getResourceById(id: string): Result<IReadOnlyValidatingResourceTreeLeaf<T>> {
    return Convert.resourceId
      .convert(id)
      .onSuccess((validId: ResourceId) => this.tree.getResourceById(validId))
      .onSuccess((leaf) => succeed(wrapValidatingLeaf(leaf)));
  }

  /**
   * {@inheritDoc Runtime.ResourceTree.IReadOnlyValidatingResourceTreeCollection.getBranchById}
   */
  public getBranchById(id: string): Result<IReadOnlyValidatingResourceTreeBranch<T>> {
    return Convert.resourceId
      .convert(id)
      .onSuccess((validId: ResourceId) => this.tree.getBranchById(validId))
      .onSuccess((branch) => succeed(wrapValidatingBranch(branch)));
  }

  /**
   * {@inheritDoc Runtime.ResourceTree.IReadOnlyValidatingResourceTreeCollection.getResource}
   */
  public getResource(name: string): Result<IReadOnlyValidatingResourceTreeLeaf<T>> {
    return Convert.resourceName
      .convert(name)
      .onSuccess((validName: ResourceName) => this.tree.getResource(validName))
      .onSuccess((node) => succeed(wrapValidatingLeaf(node as IReadOnlyResourceTreeLeaf<T>)));
  }

  /**
   * {@inheritDoc Runtime.ResourceTree.IReadOnlyValidatingResourceTreeCollection.getBranch}
   */
  public getBranch(name: string): Result<IReadOnlyValidatingResourceTreeBranch<T>> {
    return Convert.resourceName
      .convert(name)
      .onSuccess((validName: ResourceName) => this.tree.getBranch(validName))
      .onSuccess((node) => succeed(wrapValidatingBranch(node as IReadOnlyResourceTreeBranch<T>)));
  }

  /**
   * {@inheritDoc Runtime.ResourceTree.IReadOnlyValidatingResourceTreeCollection.has}
   */
  public has(id: string): Result<boolean> {
    return Convert.resourceId.convert(id).onSuccess((validId: ResourceId) => {
      return this.tree
        .getById(validId)
        .onSuccess(() => succeed(true))
        .onFailure(() => succeed(false));
    });
  }

  /**
   * {@inheritDoc Runtime.ResourceTree.IReadOnlyValidatingResourceTreeCollection.hasResource}
   */
  public hasResource(id: string): Result<boolean> {
    return Convert.resourceId.convert(id).onSuccess((validId: ResourceId) => {
      return this.tree
        .getResourceById(validId)
        .onSuccess(() => succeed(true))
        .onFailure(() => succeed(false));
    });
  }

  /**
   * {@inheritDoc Runtime.ResourceTree.IReadOnlyValidatingResourceTreeCollection.hasBranch}
   */
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
 *
 * This function determines the type of the input node and wraps it in the appropriate
 * validating interface (leaf or branch). It preserves all the original node properties
 * while adding the validating context.
 *
 * @param node - The base tree node to wrap
 * @returns A validating node interface wrapping the input node
 * @throws Error if the node is neither a leaf nor a branch (which should never happen in a well-formed tree)
 * @internal
 */
function wrapValidatingNode<T>(node: IReadOnlyResourceTreeNode<T>): IReadOnlyValidatingResourceTreeNode<T> {
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
 *
 * Creates a validating leaf node that provides access to the underlying leaf's
 * properties and resource while maintaining the validating context. The resulting
 * interface can be used to access the resource without additional validation.
 *
 * @param leaf - The base leaf node to wrap
 * @returns A validating leaf interface wrapping the input leaf
 * @internal
 */
function wrapValidatingLeaf<T>(leaf: IReadOnlyResourceTreeLeaf<T>): IReadOnlyValidatingResourceTreeLeaf<T> {
  return {
    node: leaf,
    name: leaf.name,
    path: leaf.id,
    isRoot: leaf.isRoot,
    isLeaf: leaf.isLeaf,
    isBranch: leaf.isBranch,
    resource: leaf.resource
  };
}

/**
 * Helper function to wrap a base branch node in a validating branch interface.
 *
 * Creates a validating branch node that provides access to the underlying branch's
 * properties and a validating children collection. The children collection accepts
 * string inputs and provides string-based navigation throughout the subtree.
 *
 * @param branch - The base branch node to wrap
 * @returns A validating branch interface wrapping the input branch
 * @internal
 */
function wrapValidatingBranch<T>(
  branch: IReadOnlyResourceTreeBranch<T>
): IReadOnlyValidatingResourceTreeBranch<T> {
  return {
    node: branch,
    name: branch.name,
    path: branch.id,
    isRoot: branch.isRoot,
    isLeaf: branch.isLeaf,
    isBranch: branch.isBranch,
    children: new ReadOnlyValidatingResourceTreeCollection(branch.children)
  };
}

/**
 * Implementation of a validating resource tree that validates string inputs before delegating to the underlying tree.
 *
 * This class provides the main implementation of {@link Runtime.ResourceTree.IReadOnlyValidatingResourceTree | IReadOnlyValidatingResourceTree}.
 * It wraps a {@link Runtime.ResourceTree.IReadOnlyResourceTreeRoot | IReadOnlyResourceTreeRoot} and provides string-based
 * access to all tree operations. All methods delegate to the wrapped children collection, which handles the validation.
 *
 * @public
 */
export class ReadOnlyValidatingResourceTree<T> implements IReadOnlyValidatingResourceTree<T> {
  public readonly tree: IReadOnlyResourceTreeRoot<T>;
  public readonly children: IReadOnlyValidatingResourceTreeCollection<T>;

  /**
   * Creates a new validating resource tree wrapper.
   * @param tree - The underlying resource tree root to wrap with validation
   */
  public constructor(tree: IReadOnlyResourceTreeRoot<T>) {
    this.tree = tree;
    this.children = new ReadOnlyValidatingResourceTreeCollection(tree.children);
  }

  /**
   * {@inheritDoc Runtime.ResourceTree.IReadOnlyValidatingResourceTree.getById}
   */
  public getById(id: string): Result<IReadOnlyValidatingResourceTreeNode<T>> {
    return this.children.getById(id);
  }

  /**
   * {@inheritDoc Runtime.ResourceTree.IReadOnlyValidatingResourceTree.getResourceById}
   */
  public getResourceById(id: string): Result<IReadOnlyValidatingResourceTreeLeaf<T>> {
    return this.children.getResourceById(id);
  }

  /**
   * {@inheritDoc Runtime.ResourceTree.IReadOnlyValidatingResourceTree.getBranchById}
   */
  public getBranchById(id: string): Result<IReadOnlyValidatingResourceTreeBranch<T>> {
    return this.children.getBranchById(id);
  }

  /**
   * {@inheritDoc Runtime.ResourceTree.IReadOnlyValidatingResourceTree.getResource}
   */
  public getResource(name: string): Result<IReadOnlyValidatingResourceTreeLeaf<T>> {
    return this.children.getResource(name);
  }

  /**
   * {@inheritDoc Runtime.ResourceTree.IReadOnlyValidatingResourceTree.getBranch}
   */
  public getBranch(name: string): Result<IReadOnlyValidatingResourceTreeBranch<T>> {
    return this.children.getBranch(name);
  }

  /**
   * {@inheritDoc Runtime.ResourceTree.IReadOnlyValidatingResourceTree.has}
   */
  public has(id: string): Result<boolean> {
    return this.children.has(id);
  }

  /**
   * {@inheritDoc Runtime.ResourceTree.IReadOnlyValidatingResourceTree.hasResource}
   */
  public hasResource(id: string): Result<boolean> {
    return this.children.hasResource(id);
  }

  /**
   * {@inheritDoc Runtime.ResourceTree.IReadOnlyValidatingResourceTree.hasBranch}
   */
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
 *
 * This class extends {@link Runtime.ResourceTree.ReadOnlyResourceTreeRoot | ReadOnlyResourceTreeRoot} to provide
 * both the standard tree interface and a validating property that accepts string inputs. This eliminates the need for
 * manual type conversion in consumer code and provides a clean, type-safe API for string-based
 * tree navigation.
 *
 * The class can be created from either an array of [ResourceId, resource] pairs or from
 * a tree initialization structure, making it flexible for different use cases.
 *
 * @example
 * ```typescript
 * // Create from resource pairs
 * const tree = ReadOnlyValidatingResourceTreeRoot.create([
 *   ['app.messages.welcome', { id: 'welcome', text: 'Welcome!' }],
 *   ['app.errors.notFound', { id: 'notFound', text: 'Not Found' }]
 * ]).orThrow();
 *
 * // Use the validating interface with strings
 * tree.validating.getBranchById('app').onSuccess((appBranch) => {
 *   // appBranch.children also provides string validation
 *   return appBranch.children.getBranch('messages');
 * });
 * ```
 *
 * @public
 */
export class ReadOnlyValidatingResourceTreeRoot<T> extends ReadOnlyResourceTreeRoot<T> {
  /**
   * A validating interface that validates string inputs before passing them to this tree.
   *
   * This property provides access to the full string-based API for tree navigation.
   * All operations through this interface validate string inputs and return Result types
   * for consistent error handling.
   */
  public readonly validating: IReadOnlyValidatingResourceTree<T>;

  /**
   * Creates a new validating resource tree root. Use the static create method instead.
   * @param params - Parameters for creating the validating tree
   * @internal
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
