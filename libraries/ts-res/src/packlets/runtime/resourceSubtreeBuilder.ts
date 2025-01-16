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

import { IResourceCreateParams, Resource } from './resource';
import * as Common from '../common';
import { captureResult, mapResults, MessageAggregator, Result, succeed } from '@fgv/ts-utils';
import { ResourceSubtree } from './resourceSubtree';

/**
 * Builder for a {@link ResourceSubtree | resource subtree}.
 * @public
 */
export class ResourceSubtreeBuilder {
  public readonly path: Common.ResourcePath;
  public readonly name: Common.ResourceName;
  public get resources(): ReadonlyMap<Common.ResourceName, Resource> {
    return this._resources;
  }
  public get children(): ReadonlyMap<Common.ResourceName, ResourceSubtreeBuilder> {
    return this._children;
  }
  public get isRoot(): boolean {
    return this.path === Common.ResourceNames.resourceRoot;
  }

  protected readonly _resources: Map<Common.ResourceName, Resource>;
  protected readonly _children: Map<Common.ResourceName, ResourceSubtreeBuilder>;

  protected constructor(path: Common.ResourcePath, name: Common.ResourceName) {
    this.path = path;
    this.name = name;
    this._resources = new Map<Common.ResourceName, Resource>();
    this._children = new Map<Common.ResourceName, ResourceSubtreeBuilder>();
  }

  public static create(parentPath: string, name: string): Result<ResourceSubtreeBuilder> {
    if (!Common.ResourceNames.isValidPath(parentPath)) {
      return fail(`${parentPath}: invalid resource path for parent.`);
    }
    if (!Common.ResourceNames.isValidName(name)) {
      return fail(`${name}: invalid resource name for subtree.`);
    }
    return Common.ResourceNames.join(parentPath, name).onSuccess((path) =>
      captureResult(() => new ResourceSubtreeBuilder(path, name))
    );
  }

  public static createRoot(): Result<ResourceSubtreeBuilder> {
    return captureResult(
      () => new ResourceSubtreeBuilder(Common.ResourceNames.resourceRoot, '' as Common.ResourceName)
    );
  }

  public addResource(resource: Resource): Result<Resource> {
    if (this._resources.has(resource.name)) {
      return fail(`${resource.name}: resource already exists in ${this.path}.`);
    }
    if (resource.path !== Common.ResourceNames.join(this.path, resource.name).orDefault()) {
      return fail(`${resource.name}: resource path does not match ${this.path}.`);
    }
    this._resources.set(resource.name, resource);
    return succeed(resource);
  }

  public createResource(init: Omit<IResourceCreateParams, 'parentPath'>): Result<Resource> {
    return Resource.create({ ...init, parentPath: this.path }).onSuccess((resource) =>
      this.addResource(resource)
    );
  }

  public getOrAddSubtree(name: Common.ResourceName): Result<ResourceSubtreeBuilder> {
    const existing = this._children.get(name);
    if (existing) {
      return succeed(existing);
    }
    return ResourceSubtreeBuilder.create(this.path, name).onSuccess((subtree) => {
      this._children.set(name as Common.ResourceName, subtree);
      return succeed(subtree);
    });
  }

  public build(): Result<ResourceSubtree> {
    const errors = new MessageAggregator();
    const children = new Map<Common.ResourceName, ResourceSubtree>();
    for (const [name, child] of this._children) {
      child
        .build()
        .onSuccess((subtree) => succeed(children.set(name, subtree)))
        .aggregateError(errors);
    }
    if (errors.hasMessages) {
      return fail(`subtree build: ${errors.toString()}`);
    }
    return ResourceSubtree.create({
      path: this.path,
      name: this.name,
      resources: this.resources,
      children
    });
  }
}
