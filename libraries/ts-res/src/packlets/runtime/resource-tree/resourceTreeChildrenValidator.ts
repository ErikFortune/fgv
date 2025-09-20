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

import { Validate } from '../../common';
import { Result, IReadOnlyResultMap, DetailedResult, Collections, failWithDetail } from '@fgv/ts-utils';
import { ResourceName } from '../../common';
import {
  IReadOnlyResourceTreeBranch,
  IReadOnlyResourceTreeChildren,
  IReadOnlyResourceTreeLeaf,
  IReadOnlyResourceTreeNode
} from './common';

/**
 * A validator wrapper for resource tree children that validates string inputs before
 * delegating to the underlying tree children collection.
 *
 * This class implements {@link Runtime.ResourceTree.IReadOnlyValidatingResourceTreeChildren | IReadOnlyValidatingResourceTreeChildren}
 * by wrapping an {@link Runtime.ResourceTree.IReadOnlyResourceTreeChildren | IReadOnlyResourceTreeChildren} instance and
 * providing string-based access to all tree operations. All string inputs are validated using the library's
 * validation utilities before being passed to the underlying collection.
 *
 * The validator acts as a bridge between string-based external APIs and the
 * strongly-typed internal tree operations, ensuring type safety and consistent
 * error handling throughout the resource tree navigation.
 *
 * @public
 */
export class ResourceTreeChildrenValidator<T> implements IReadOnlyResourceTreeChildren<T, string, string> {
  private readonly _inner: IReadOnlyResourceTreeChildren<T>;

  /**
   * Creates a new validator wrapper for resource tree children.
   * @param inner - The underlying resource tree children collection to wrap with validation
   */
  public constructor(inner: IReadOnlyResourceTreeChildren<T>) {
    this._inner = inner;
  }

  /**
   * Gets a tree node by its string ResourceId path, validating the input.
   * @param id - The string ResourceId path to validate and look up
   * @returns Result containing the node if found, or failure if validation fails or not found
   */
  public getById(id: string): Result<IReadOnlyResourceTreeNode<T>> {
    return Validate.toResourceId(id).onSuccess((resourceId) => {
      return this._inner.getById(resourceId);
    });
  }

  /**
   * Gets a resource node by its string name (single component), validating the input.
   * @param name - The string ResourceName to validate and look up
   * @returns Result containing the node if it's a resource, or failure if validation fails or not found
   */
  public getResource(name: string): Result<IReadOnlyResourceTreeNode<T>> {
    return Validate.toResourceName(name).onSuccess((resourceName) => {
      return this._inner.getResource(resourceName);
    });
  }

  /**
   * Gets a branch node by its string name (single component), validating the input.
   * @param name - The string ResourceName to validate and look up
   * @returns Result containing the node if it's a branch, or failure if validation fails or not found
   */
  public getBranch(name: string): Result<IReadOnlyResourceTreeNode<T>> {
    return Validate.toResourceName(name).onSuccess((resourceName) => {
      return this._inner.getBranch(resourceName);
    });
  }

  /**
   * Gets a resource leaf node by its string ResourceId path, validating the input.
   * @param id - The string ResourceId path to validate and look up
   * @returns Result containing the leaf if found and is a resource, or failure otherwise
   */
  public getResourceById(id: string): Result<IReadOnlyResourceTreeLeaf<T>> {
    return Validate.toResourceId(id).onSuccess((resourceId) => {
      return this._inner.getResourceById(resourceId);
    });
  }

  /**
   * Gets a branch node by its string ResourceId path, validating the input.
   * @param id - The string ResourceId path to validate and look up
   * @returns Result containing the branch if found and has children, or failure otherwise
   */
  public getBranchById(id: string): Result<IReadOnlyResourceTreeBranch<T>> {
    return Validate.toResourceId(id).onSuccess((resourceId) => {
      return this._inner.getBranchById(resourceId);
    });
  }

  /**
   * The number of direct child nodes in this collection.
   */
  public get size(): number {
    return this._inner.size;
  }

  /**
   * Returns an iterator of [ResourceName, node] pairs for all child nodes.
   * @returns Map iterator for all child nodes
   */
  public entries(): IterableIterator<[ResourceName, IReadOnlyResourceTreeNode<T>]> {
    return this._inner.entries();
  }

  /**
   * Executes a callback function for each child node in the collection.
   * @param cb - The callback function to execute for each child node
   * @param arg - Optional argument to pass to the callback
   */
  public forEach(
    cb: (value: unknown, key: string, map: IReadOnlyResultMap<string, unknown>, thisArg?: unknown) => void,
    arg?: unknown
  ): void {
    for (const [key, value] of this._inner.entries()) {
      cb(value, key as ResourceName, this, arg);
    }
  }

  /**
   * Gets a child node by its string key with detailed error information.
   * @param key - The string key to look up
   * @returns DetailedResult containing the node if found, or failure with details
   */
  public get(key: string): DetailedResult<IReadOnlyResourceTreeNode<T>, Collections.ResultMapResultDetail> {
    if (Validate.isValidResourceName(key)) {
      return this._inner.get(key);
    }
    return failWithDetail(`${key}: invalid resource name.`, 'invalid-key');
  }

  /**
   * Checks if a child node exists at the given string key.
   * @param key - The string key to check
   * @returns True if a child node exists at the key, false otherwise
   */
  public has(key: string): boolean {
    return this._inner.has(key as ResourceName);
  }

  /**
   * Returns an iterator of ResourceName keys for all child nodes.
   * @returns Map iterator for all child node keys
   */
  public keys(): IterableIterator<ResourceName> {
    return this._inner.keys();
  }

  /**
   * Returns an iterator of child node values.
   * @returns Map iterator for all child node values
   */
  public values(): IterableIterator<IReadOnlyResourceTreeNode<T>> {
    return this._inner.values();
  }

  /**
   * Returns an iterator for [ResourceName, node] pairs, enabling for...of iteration.
   * @returns Iterable iterator for all child nodes
   */
  public [Symbol.iterator](): IterableIterator<[ResourceName, IReadOnlyResourceTreeNode<T>]> {
    return this._inner[Symbol.iterator]();
  }
}
