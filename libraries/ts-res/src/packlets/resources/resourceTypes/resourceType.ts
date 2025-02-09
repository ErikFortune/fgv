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

import { JsonValue } from '@fgv/ts-json-base';
import { Collections, ICollectible, Result } from '@fgv/ts-utils';
import {
  Convert as CommonConvert,
  ResourceTypeIndex,
  ResourceTypeName,
  ResourceValueMergeMethod
} from '../../common';

/**
 * Abstract base class for resource types which are responsible for
 * validating and converting JSON values into the appropriate strongly-typed
 * resource value.
 * @public
 */
export abstract class ResourceType<T = unknown> implements ICollectible<ResourceTypeName, ResourceTypeIndex> {
  private _collectible: Collections.Collectible<ResourceTypeName, ResourceTypeIndex>;
  /**
   * The key for this resource type.
   */
  public get key(): ResourceTypeName {
    return this._collectible.key;
  }

  /**
   * The index for this resource type.
   */
  public get index(): ResourceTypeIndex | undefined {
    return this._collectible.index;
  }

  protected constructor(key: ResourceTypeName, index?: ResourceTypeIndex) {
    this._collectible = new Collections.Collectible<ResourceTypeName, ResourceTypeIndex>({
      key,
      index,
      indexConverter: CommonConvert.resourceTypeIndex
    });
  }

  /**
   * Validates a {@link ResourceJson.IResourceCandidateDecl | resource candidate declaration} for
   * a partial resource instance value.
   * @param json - The JSON value to validate.
   * @param isPartial - `true` indicates that the value is expected to be incomplete.
   * @param mergeMethod - The method to use when merging with previously resolved values.
   * @returns `Success` with the strongly-typed resource value if the JSON and merge
   * method are valid, `Failure` with an error message otherwise.
   * @public
   */
  public abstract validateDeclaration(
    json: JsonValue,
    isPartial: true,
    mergeMethod: ResourceValueMergeMethod
  ): Result<Partial<T>>;

  /**
   * Validates a {@link ResourceJson.IResourceCandidateDecl | resource candidate declaration} for
   * a complete resource instance value.
   * @param json - The JSON value to validate.
   * @param isPartial - `false` indicates that the value is expected to be complete.
   * @param mergeMethod - The method to use when merging with previously resolved values.
   * @returns `Success` with the strongly-typed resource value if the JSON and merge method
   * are valid, `Failure` with an error message otherwise.
   * @public
   */
  public abstract validateDeclaration(
    json: JsonValue,
    isPartial: false,
    mergeMethod: ResourceValueMergeMethod
  ): Result<T>;

  /**
   * Validates a {@link ResourceJson.IResourceCandidateDecl | resource candidate declaration} for
   * a resource instance value.
   * @param json - The JSON value to validate.
   * @param isPartial - Indicates whether the value is expected to be incomplete.
   * @param mergeMethod - The method to use when merging with previously resolved values.
   * @returns `Success` with the strongly-typed resource value if the JSON and merge method
   * are valid, `Failure` with an error message otherwise.
   * @public
   */
  public abstract validateDeclaration(
    json: JsonValue,
    isPartial: boolean,
    mergeMethod: ResourceValueMergeMethod
  ): Result<T | Partial<T>>;

  public abstract validateDeclaration(
    json: JsonValue,
    isPartial: boolean,
    mergeMethod?: ResourceValueMergeMethod
  ): Result<T | Partial<T>>;

  /**
   * Validates a JSON value for use as a partial resource instance value.
   * @param json - The JSON value to validate.
   * @param isPartial - `true` indicates that the value is expected to be partial.
   * @returns `Success` with the strongly-typed partial resource value if the JSON is valid,
   * `Failure` with an error message otherwise.
   * @public
   */
  public abstract validate(json: JsonValue, isPartial: true): Result<T>;

  /**
   * Validates a JSON value for use as a complete resource instance value.
   * @param json - The JSON value to validate.
   * @param isPartial - `false` indicates that the value is expected to be complete.
   * @returns `Success` with the strongly-typed resource value if the JSON is valid,
   * `Failure` with an error message otherwise.
   * @public
   */
  public abstract validate(json: JsonValue, isPartial: false): Result<Partial<T>>;

  /**
   * Validates a JSON value for use as a full or partial resource instance value.
   * @param json - The JSON value to validate.
   * @param isPartial - Indicates whether the value is expected to be partial.
   * @returns `Success` with the strongly-typed full or partial resource value if
   * the JSON is valid, `Failure` with an error message otherwise.
   * @public
   */
  public abstract validate(json: JsonValue, isPartial: boolean): Result<T | Partial<T>>;

  /**
   * Sets the index for this resource type.  Once set, the index cannot be changed.
   */
  public setIndex(index: number): Result<ResourceTypeIndex> {
    return this._collectible.setIndex(index);
  }
}
