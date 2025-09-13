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

import { Collections, Result, ResultMap, fail, succeed } from '@fgv/ts-utils';
import { ResourceId, ResourceName, Helpers } from '../../common';
import {
  IReadOnlyResourceTreeBranch,
  IReadOnlyResourceTreeChildren,
  IReadOnlyResourceTreeLeaf,
  IReadOnlyResourceTreeNode,
  IReadOnlyValidatingResourceTreeChildren
} from './common';
import { ResourceTreeChildrenValidator } from './resourceTreeChildrenValidator';

/**
 * Implementation of a result-based resource tree that provides hierarchical access to resources.
 * Extends ResultMap to provide collection-like access while adding tree-specific navigation methods.
 * @public
 */
export class ReadOnlyResourceTreeChildren<T>
  extends ResultMap<ResourceName, IReadOnlyResourceTreeNode<T>>
  implements IReadOnlyValidatingResourceTreeChildren<T>
{
  protected path: ResourceId | undefined;
  public validating: IReadOnlyResourceTreeChildren<T, string, string>;

  /**
   * Creates a new ReadOnlyResourceTreeChildren instance.
   * @param path - The path to this tree node (undefined for root)
   * @param entries - Array of [name, node] tuples to populate the tree
   */
  public constructor(path: ResourceId | undefined, entries: [ResourceName, IReadOnlyResourceTreeNode<T>][]) {
    super(entries);
    this.path = path;
    this.validating = new ResourceTreeChildrenValidator<T>(this);
  }

  public getResource(name: ResourceName): Result<IReadOnlyResourceTreeNode<T>> {
    return this.get(name).onSuccess((node) => {
      if (node.isLeaf) {
        return succeed(node).withDetail<Collections.ResultMapResultDetail>('success');
      }
      return fail<IReadOnlyResourceTreeNode<T>>(
        `${name}: not a resource${this.path ? ` in ${this.path}` : ''}.`
      ).withDetail<Collections.ResultMapResultDetail>('failure');
    });
  }

  public getBranch(name: ResourceName): Result<IReadOnlyResourceTreeNode<T>> {
    return this.get(name).onSuccess((node) => {
      if (node.isBranch) {
        return succeed(node).withDetail<Collections.ResultMapResultDetail>('success');
      }
      return fail<IReadOnlyResourceTreeNode<T>>(
        `${name}: not a branch${this.path ? ` in ${this.path}` : ''}.`
      ).withDetail<Collections.ResultMapResultDetail>('failure');
    });
  }

  public getById(id: ResourceId): Result<IReadOnlyResourceTreeNode<T>> {
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
            /* c8 ignore next 1 - defense in depth */
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
