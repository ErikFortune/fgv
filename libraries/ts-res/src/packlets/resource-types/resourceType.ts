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
  CandidateCompleteness,
  Convert as CommonConvert,
  Validate,
  ResourceTypeIndex,
  ResourceTypeName,
  ResourceValueMergeMethod,
  ResourceId
} from '../common';

/**
 * Parameters used to validate a {@link ResourceJson.Json.ILooseResourceCandidateDecl | resource candidate declaration}.
 * @public
 */
export interface IResourceCandidateValidationProperties {
  /**
   * {@inheritdoc ResourceJson.Json.ILooseResourceCandidateDecl.id}
   * @public
   */
  id: ResourceId;

  /**
   * Describes how complete the candidate value is.
   * @public
   */
  completeness: CandidateCompleteness;

  /**
   * {@inheritdoc ResourceJson.Json.ILooseResourceCandidateDecl.json}
   * @public
   */
  json: JsonValue;

  /**
   * {@inheritdoc ResourceJson.Json.ILooseResourceCandidateDecl.mergeMethod}
   * @public
   */
  mergeMethod: ResourceValueMergeMethod;
}

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

  protected constructor(key: ResourceTypeName, index?: number) {
    this._collectible = new Collections.Collectible<ResourceTypeName, ResourceTypeIndex>({
      key,
      /* c8 ignore next 1 - coverage having a rough time */
      index: index !== undefined ? Validate.toResourceTypeIndex(index).orThrow() : undefined,
      indexConverter: CommonConvert.resourceTypeIndex
    });
  }

  /**
   * Validates properties of a {@link ResourceJson.Json.ILooseResourceCandidateDecl | resource candidate declaration} for
   * a resource instance value.
   * @param props - The {@link ResourceTypes.IResourceCandidateValidationProperties | properties } to validate.
   * @returns `Success` with the strongly-typed resource value if the JSON and merge method
   * are valid, `Failure` with an error message otherwise.
   * @public
   */
  public abstract validateDeclaration(props: IResourceCandidateValidationProperties): Result<T | Partial<T>>;

  /**
   * Validates a JSON value for use as a partial resource instance value.
   * @param json - The JSON value to validate.
   * @param completeness - Describes {@link CandidateCompleteness | how complete} the candidate value is.
   * @returns `Success` with the strongly-typed partial resource value if the JSON is valid,
   * `Failure` with an error message otherwise.
   * @public
   */
  public abstract validate(json: JsonValue, completeness: CandidateCompleteness): Result<Partial<T>>;

  /**
   * Validates a JSON value for use as a complete resource instance value.
   * @param json - The JSON value to validate.
   * @param completeness - Describes {@link CandidateCompleteness | how complete} the candidate value is.
   * @returns `Success` with the strongly-typed resource value if the JSON is valid,
   * `Failure` with an error message otherwise.
   * @public
   */
  public abstract validate(json: JsonValue, completeness: 'full'): Result<T>;

  /**
   * Validates a JSON value for use as a partial resource instance value.
   * @param json - The JSON value to validate.
   * @param completeness - Describes {@link CandidateCompleteness | how complete} the candidate value is.
   * @returns `Success` with the strongly-typed partial resource value if the JSON is valid,
   * `Failure` with an error message otherwise.
   * @public
   */
  public abstract validate(json: JsonValue, completeness: 'partial'): Result<Partial<T>>;

  /**
   * Validates a JSON value for use as a full or partial resource instance value.
   * @param json - The JSON value to validate.
   * @param completeness - Describes {@link CandidateCompleteness | how complete} the candidate value is.
   * @returns `Success` with the strongly-typed full or partial resource value if
   * the JSON is valid, `Failure` with an error message otherwise.
   * @public
   */
  public abstract validate(json: JsonValue, completeness?: CandidateCompleteness): Result<T | Partial<T>>;

  /**
   * Sets the index for this resource type.  Once set, the index cannot be changed.
   */
  public setIndex(index: number): Result<ResourceTypeIndex> {
    return this._collectible.setIndex(index);
  }
}
