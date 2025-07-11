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
  IReadOnlyResourceTreeNode,
  IReadOnlyValidatingResourceTreeChildren
} from './common';

export class ResourceTreeChildrenValidator<T> implements IReadOnlyValidatingResourceTreeChildren<T> {
  private readonly _inner: IReadOnlyResourceTreeChildren<T>;

  public constructor(inner: IReadOnlyResourceTreeChildren<T>) {
    this._inner = inner;
  }

  public getById(id: string): Result<IReadOnlyResourceTreeNode<T>> {
    return Validate.toResourceId(id).onSuccess((resourceId) => {
      return this._inner.getById(resourceId);
    });
  }

  public getResource(name: string): Result<IReadOnlyResourceTreeNode<T>> {
    return Validate.toResourceName(name).onSuccess((resourceName) => {
      return this._inner.getResource(resourceName);
    });
  }

  public getBranch(name: string): Result<IReadOnlyResourceTreeNode<T>> {
    return Validate.toResourceName(name).onSuccess((resourceName) => {
      return this._inner.getBranch(resourceName);
    });
  }

  public getResourceById(id: string): Result<IReadOnlyResourceTreeLeaf<T>> {
    return Validate.toResourceId(id).onSuccess((resourceId) => {
      return this._inner.getResourceById(resourceId);
    });
  }

  public getBranchById(id: string): Result<IReadOnlyResourceTreeBranch<T>> {
    return Validate.toResourceId(id).onSuccess((resourceId) => {
      return this._inner.getBranchById(resourceId);
    });
  }

  public get size(): number {
    return this._inner.size;
  }

  public entries(): MapIterator<[ResourceName, IReadOnlyResourceTreeNode<T>]> {
    return this._inner.entries();
  }

  public forEach(
    cb: (value: unknown, key: string, map: IReadOnlyResultMap<string, unknown>, thisArg?: unknown) => void,
    arg?: unknown
  ): void {
    for (const [key, value] of this._inner.entries()) {
      cb(value, key as ResourceName, this, arg);
    }
  }

  public get(
    key: ResourceName
  ): DetailedResult<IReadOnlyResourceTreeNode<T>, Collections.ResultMapResultDetail> {
    if (Validate.isValidResourceName(key)) {
      return this._inner.get(key);
    }
    return failWithDetail(`${key}: invalid resource name.`, 'invalid-key');
  }

  public has(key: ResourceName): boolean {
    return this._inner.has(key as ResourceName);
  }

  public keys(): MapIterator<ResourceName> {
    return this._inner.keys();
  }

  public values(): MapIterator<IReadOnlyResourceTreeNode<T>> {
    return this._inner.values();
  }

  public [Symbol.iterator](): IterableIterator<[ResourceName, IReadOnlyResourceTreeNode<T>]> {
    return this._inner[Symbol.iterator]();
  }
}
