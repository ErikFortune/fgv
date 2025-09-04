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

import { Result, MessageAggregator, succeed, fail, captureResult } from '@fgv/ts-utils';
import { JsonValue, JsonObject, Converters as JsonConverters } from '@fgv/ts-json-base';
import { IResourceManager, IResource } from './iResourceManager';
import { IReadOnlyResourceTreeNode, IReadOnlyResourceTreeRoot } from './resource-tree/common';
import { ResourceResolver } from './resourceResolver';

/**
 * Type for handling resource resolution errors during tree traversal.
 * The handler receives the resource that failed to resolve, the error message, and the resolver for recovery attempts.
 * It can return:
 * - Success(undefined) to omit the property from the result
 * - Success(value) to use an alternate value
 * - Failure to propagate the error
 * @public
 */
export type ResourceErrorHandler = (
  resource: IResource,
  message: string,
  resolver: ResourceResolver
) => Result<JsonValue | undefined>;

/**
 * Type for handling empty branch nodes during tree composition.
 * The handler receives the branch node, names of failed children, and the resolver for recovery attempts.
 * It can return:
 * - Success(undefined) to omit the branch from the result
 * - Success(value) to use an alternate value for the branch
 * - Failure to propagate the error
 * @public
 */
export type EmptyBranchHandler = (
  branchNode: IReadOnlyResourceTreeNode<IResource>,
  failedChildNames: string[],
  resolver: ResourceResolver
) => Result<JsonValue | undefined>;

/**
 * Options for configuring resource tree resolution.
 * @public
 */
export interface IResolveResourceTreeOptions {
  /**
   * Controls how errors are handled when resolving individual resources in the tree.
   * - 'fail': Aggregate all errors and fail if any resource fails to resolve
   * - 'ignore': Skip failed resources and omit them from the result
   * - callback: Custom error handler that can provide alternate values or propagate errors
   * @defaultValue 'fail'
   */
  onResourceError?: 'fail' | 'ignore' | ResourceErrorHandler;

  /**
   * Controls how empty branch nodes are handled during tree composition.
   * - 'allow': Include empty branches as empty objects in the result
   * - 'omit': Exclude empty branches from the parent object
   * - callback: Custom handler that can provide alternate values or recovery logic
   * @defaultValue 'allow'
   */
  onEmptyBranch?: 'allow' | 'omit' | EmptyBranchHandler;
}

/**
 * Specialized resolver for resource tree operations, providing enhanced APIs for
 * resolving entire resource trees from either resource IDs or pre-built tree nodes.
 *
 * This class provides a clean separation between individual resource resolution
 * (handled by ResourceResolver) and tree-based operations, with support for
 * lazy tree construction and enhanced error handling.
 *
 * @public
 */
export class ResourceTreeResolver {
  /**
   * The {@link Runtime.ResourceResolver | ResourceResolver} to use for individual resource resolution
   */
  public readonly resolver: ResourceResolver;

  /**
   * The {@link Runtime.IResourceManager | IResourceManager} to use for lazy tree construction.
   * @internal
   */
  private readonly _resourceManager: IResourceManager<IResource>;
  /**
   * The built resource tree, lazily built on first access.
   * @internal
   */
  private _tree?: Result<IReadOnlyResourceTreeRoot<IResource>>;

  /**
   * Creates a {@link Runtime.ResourceTreeResolver | ResourceTreeResolver} instance.
   * @param resolver - The ResourceResolver to use for individual resource resolution
   */
  public constructor(resolver: ResourceResolver) {
    this.resolver = resolver;
    this._resourceManager = resolver.resourceManager;
  }

  /**
   * Creates a {@link Runtime.ResourceTreeResolver | ResourceTreeResolver} instance.
   * @param resolver - The ResourceResolver to use for individual resource resolution
   */
  public static create(resolver: ResourceResolver): Result<ResourceTreeResolver> {
    return captureResult(() => new ResourceTreeResolver(resolver));
  }

  /**
   * Gets the built resource tree, building it lazily on first access.
   * @returns The resource tree root
   * @throws Error if no resource manager was provided or tree building fails
   * @public
   */
  public get tree(): IReadOnlyResourceTreeRoot<IResource> {
    return this._getTree().orThrow();
  }

  /**
   * Resolves a resource tree from a resource ID, building the tree lazily from the resource manager.
   * @param resourceId - The ID of the root resource to resolve
   * @param options - Optional configuration for error handling during resolution
   * @returns Success with the composed JsonObject or undefined, or Failure with error message
   * @public
   */
  public resolveComposedResourceTree(
    resourceId: string,
    options?: IResolveResourceTreeOptions
  ): Result<JsonObject | undefined>;

  /**
   * Resolves a pre-built resource tree node.
   * @param node - The resource tree node to resolve
   * @param options - Optional configuration for error handling during resolution
   * @returns Success with the composed JsonObject or undefined, or Failure with error message
   * @public
   */
  public resolveComposedResourceTree(
    node: IReadOnlyResourceTreeNode<IResource>,
    options?: IResolveResourceTreeOptions
  ): Result<JsonObject | undefined>;

  /**
   * Implementation for both overloads.
   */
  public resolveComposedResourceTree(
    idOrNode: string | IReadOnlyResourceTreeNode<IResource>,
    options?: IResolveResourceTreeOptions
  ): Result<JsonObject | undefined> {
    if (typeof idOrNode === 'string') {
      return this._resolveFromResourceId(idOrNode, options);
    }
    return this._resolveFromTreeNode(idOrNode, options);
  }

  private _getTree(): Result<IReadOnlyResourceTreeRoot<IResource>> {
    if (!this._tree) {
      this._tree = this._resourceManager.getBuiltResourceTree();
    }
    return this._tree;
  }

  /**
   * Resolves a tree from a resource ID by first building the tree from the resource manager.
   * @internal
   */
  private _resolveFromResourceId(
    resourceId: string,
    options?: IResolveResourceTreeOptions
  ): Result<JsonObject | undefined> {
    return this._getTree().onSuccess((tree) => {
      return tree.children.validating
        .getById(resourceId)
        .onFailure((message) => fail(`${resourceId}: Resource not found in resource tree: ${message}`))
        .onSuccess((rootNode) => this._resolveFromTreeNode(rootNode, options));
    });
  }

  /**
   * Resolves a pre-built tree node using the extracted tree resolution logic.
   * @internal
   */
  private _resolveFromTreeNode(
    node: IReadOnlyResourceTreeNode<IResource>,
    options?: IResolveResourceTreeOptions
  ): Result<JsonObject | undefined> {
    const resourceErrorMode = options?.onResourceError ?? 'fail';
    const emptyBranchMode = options?.onEmptyBranch ?? 'allow';

    // Handle root node with proper Result chaining
    return node.isLeaf
      ? this._processLeafNode(node, '', resourceErrorMode).onSuccess((value) =>
          value !== undefined ? JsonConverters.jsonObject.convert(value) : succeed(undefined)
        )
      : this._processBranchNode(node, '', {
          onResourceError: resourceErrorMode,
          onEmptyBranch: emptyBranchMode
        }).onSuccess((value) => {
          // Only convert undefined to {} if emptyBranchMode is 'allow'
          // For 'omit' mode or custom handlers returning undefined, preserve undefined
          return succeed(value === undefined && emptyBranchMode === 'allow' ? {} : value);
        });
  }

  /**
   * Handles resource resolution errors according to the specified mode.
   * @param resource - The resource that failed to resolve
   * @param message - The error message from the failed resolution
   * @param mode - The error handling mode
   * @param path - The path to the resource in the tree (for error context)
   * @internal
   */
  private _handleResourceError(
    resource: IResource,
    message: string,
    mode: 'fail' | 'ignore' | ResourceErrorHandler,
    path: string
  ): Result<JsonValue | undefined> {
    if (mode === 'ignore') {
      return succeed(undefined);
    }
    if (mode === 'fail') {
      const errorMessage = path ? `${path}: ${message}` : message;
      return fail(errorMessage);
    }
    // Custom handler - pass the resolver for recovery attempts
    return mode(resource, message, this.resolver);
  }

  /**
   * Handles empty branch nodes according to the specified mode.
   * @param node - The empty branch node
   * @param failedChildren - Names of children that failed to resolve
   * @param mode - The empty branch handling mode
   * @param path - The path to the branch in the tree (for error context)
   * @internal
   */
  private _handleEmptyBranch(
    node: IReadOnlyResourceTreeNode<IResource>,
    failedChildren: string[],
    mode: 'allow' | 'omit' | EmptyBranchHandler,
    path: string
  ): Result<JsonValue | undefined> {
    if (mode === 'omit') {
      return succeed(undefined);
    }
    if (mode === 'allow') {
      return succeed({});
    }
    // Custom handler - pass the resolver for recovery attempts
    return mode(node, failedChildren, this.resolver);
  }

  /**
   * Processes a leaf node by resolving its resource value.
   * @param node - The leaf node to process (must be a leaf node)
   * @param path - The path to the node in the tree
   * @param resourceErrorMode - How to handle resource resolution errors
   * @internal
   */
  private _processLeafNode(
    node: IReadOnlyResourceTreeNode<IResource>,
    path: string,
    resourceErrorMode: 'fail' | 'ignore' | ResourceErrorHandler
  ): Result<JsonValue | undefined> {
    /* c8 ignore next 3 - defense in depth */
    if (!node.isLeaf) {
      return fail(`Internal error: processLeafNode called on non-leaf node at ${path}`);
    }

    return this.resolver
      .resolveComposedResourceValue(node.resource)
      .onSuccess<JsonValue | undefined>((value) => succeed(value))
      .onFailure((message) => this._handleResourceError(node.resource, message, resourceErrorMode, path));
  }

  /**
   * Processes a branch node by recursively resolving all its children.
   * @param node - The branch node to process (must be a branch node)
   * @param path - The path to the node in the tree
   * @param options - Resolution options
   * @internal
   */
  private _processBranchNode(
    node: IReadOnlyResourceTreeNode<IResource>,
    path: string,
    options: IResolveResourceTreeOptions
  ): Result<JsonObject | undefined> {
    /* c8 ignore next 3 - defense in depth */
    if (node.isLeaf) {
      return fail(`Internal error: processBranchNode called on leaf node at ${path}`);
    }

    const resourceErrorMode = options.onResourceError ?? 'fail';
    const emptyBranchMode = options.onEmptyBranch ?? 'allow';
    const aggregator = new MessageAggregator();

    // Process all children
    const childResults: JsonObject = {};
    const failedChildren: string[] = [];

    for (const [childName, childNode] of node.children) {
      const childPath = path ? `${path}.${childName}` : childName;

      const childResult = childNode.isLeaf
        ? this._processLeafNode(childNode, childPath, resourceErrorMode)
        : this._processBranchNode(childNode, childPath, options);

      // Process the child result and update our state
      if (childResult.isSuccess()) {
        const value = childResult.value;
        if (value !== undefined) {
          childResults[childName] = value;
        } else {
          failedChildren.push(childName);
        }
      } else {
        if (resourceErrorMode === 'fail') {
          aggregator.addMessage(childResult.message);
        }
        failedChildren.push(childName);
      }
    }

    // Check for accumulated errors in 'fail' mode
    if (resourceErrorMode === 'fail' && aggregator.hasMessages) {
      return fail(aggregator.toString('; '));
    }

    // Handle empty branch
    if (Object.keys(childResults).length === 0) {
      return this._handleEmptyBranch(node, failedChildren, emptyBranchMode, path).onSuccess((value) => {
        if (value === undefined) {
          return succeed(undefined);
        }
        // Ensure we return JsonObject or undefined
        return JsonConverters.jsonObject.convert(value);
      });
    }

    return succeed(childResults);
  }
}
