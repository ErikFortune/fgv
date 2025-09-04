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

import { Collections, Result, fail, succeed, ValidatingCollector, captureResult } from '@fgv/ts-utils';
import { ResourceType } from './resourceType';
import { Convert as CommonConvert, ResourceTypeName } from '../common';

/**
 * Parameters for creating a {@link ResourceTypes.ResourceTypeCollector | ResourceTypeCollector}.
 * @public
 */
export interface IResourceCollectorCreateParams {
  resourceTypes?: ResourceType[];
}

/**
 * Map {@link ResourceTypeName | resource type names} to {@link ResourceTypes.ResourceType | resource types}.
 * @public
 */
export class ResourceTypeCollector extends ValidatingCollector<ResourceType> {
  protected constructor({ resourceTypes }: IResourceCollectorCreateParams) {
    /* c8 ignore next 1 - coverage having a rough day */
    resourceTypes = resourceTypes ?? [];

    super({
      converters: new Collections.KeyValueConverters<ResourceTypeName, ResourceType>({
        key: CommonConvert.resourceTypeName,
        value: (from: unknown) => this._toResourceType(from)
      })
    });
    resourceTypes.forEach((resourceType) => {
      this.add(resourceType).orThrow();
    });
  }

  /**
   * Creates a new {@link ResourceTypes.ResourceTypeCollector | ResourceTypeCollector}.
   * @param params - Optional for creating the new collector.
   * @returns `Success` with the new instance, or `Failure` with an error
   * message if the collector could not be created.
   */
  public static create(params?: IResourceCollectorCreateParams): Result<ResourceTypeCollector> {
    /* c8 ignore next 1 - coverage having a rough day */
    params = params ?? {};
    return captureResult(() => new ResourceTypeCollector(params));
  }

  protected _toResourceType(from: unknown): Result<ResourceType> {
    if (from instanceof ResourceType) {
      return succeed(from);
    }
    return fail('Not a resource type.');
  }
}

/**
 * A read-only version of {@link ResourceTypes.ResourceTypeCollector | ResourceTypeCollector}.
 * @public
 */
export type ReadOnlyResourceTypeCollector = Collections.IReadOnlyValidatingCollector<ResourceType>;
