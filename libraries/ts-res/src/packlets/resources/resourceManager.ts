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
import { ResourceId } from '../common';
import { ReadOnlyQualifierCollector } from '../qualifiers';
import { Resource } from './resource';
import { ResourceTypeMap } from './resourceTypes';

/**
 * Parameters for creating a {@link ResourceManager | ResourceManager}.
 * @public
 */
export interface IResourceManagerCreateParams {
  qualifiers: ReadOnlyQualifierCollector;
  resourceTypes: ResourceTypeMap;
}

/**
 * Class representing a map of resources.
 * @public
 */
export class ResourceManager {
  public readonly qualifiers: ReadOnlyQualifierCollector;
  public readonly resourceTypes: ResourceTypeMap;
  public get resources(): ReadonlyMap<ResourceId, Resource> {
    return this._resources;
  }

  private readonly _resources: Map<ResourceId, Resource>;

  protected constructor(params: IResourceManagerCreateParams) {
    this.qualifiers = params.qualifiers;
    this.resourceTypes = params.resourceTypes;
    this._resources = new Map<ResourceId, Resource>();
  }

  public static create(params: IResourceManagerCreateParams): Result<ResourceManager> {
    return captureResult(() => new ResourceManager(params));
  }
}
