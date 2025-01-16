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

import { captureResult, Result } from '@fgv/ts-utils';
import * as Common from '../common';
import { Resource } from './resource';

/**
 * Represents the parameters required to create a new ResourceSubtree.
 * @public
 */
export interface IResourceSubtreeCreateParams {
  path: string;
  name: string;
  resources: ReadonlyMap<Common.ResourceName, Resource>;
  children: ReadonlyMap<Common.ResourceName, ResourceSubtree>;
}

/**
 * Represents a static subtree of resources.
 * @public
 */
export class ResourceSubtree {
  public readonly path: string;
  public readonly name: string;
  public get resources(): ReadonlyMap<Common.ResourceName, Resource> {
    return this._resources;
  }
  public get children(): ReadonlyMap<Common.ResourceName, ResourceSubtree> {
    return this._children;
  }

  private _resources: Map<Common.ResourceName, Resource>;
  private _children: Map<Common.ResourceName, ResourceSubtree>;

  protected constructor(
    path: Common.ResourcePath,
    name: Common.ResourceName,
    resources: ReadonlyMap<Common.ResourceName, Resource>,
    children: ReadonlyMap<Common.ResourceName, ResourceSubtree>
  ) {
    this.path = path;
    this.name = name;
    this._resources = new Map(resources.entries());
    this._children = new Map(children.entries());
  }

  public static create({
    path,
    name,
    resources,
    children
  }: IResourceSubtreeCreateParams): Result<ResourceSubtree> {
    if (!Common.ResourceNames.isValidPath(path)) {
      return fail(`${path}: invalid resource path for subtree.`);
    }
    if (!Common.ResourceNames.isValidName(name)) {
      return fail(`${name}: invalid resource name for subtree.`);
    }
    if (!path.endsWith(`/${name}`)) {
      return fail(`${name}: does not match path ${path}.`);
    }
    return captureResult(() => new ResourceSubtree(path, name, resources, children));
  }
}
