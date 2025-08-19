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

import { JsonValue, JsonObject } from '@fgv/ts-json-base';
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
import * as ResourceJson from '../resource-json';

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
 * Interface for a resource type.  Resource types are responsible for
 * validating and converting JSON values into the appropriate strongly-typed
 * resource value.
 * @public
 */
export interface IResourceType<T = unknown> extends ICollectible<ResourceTypeName, ResourceTypeIndex> {
  /**
   * The key for this resource type.
   */
  readonly key: ResourceTypeName;

  /**
   * The index for this resource type.
   */
  readonly index: ResourceTypeIndex | undefined;

  /**
   * Validates properties of a {@link ResourceJson.Json.ILooseResourceCandidateDecl | resource candidate declaration} for
   * a resource instance value.
   * @param props - The {@link ResourceTypes.IResourceCandidateValidationProperties | properties } to validate.
   * @returns `Success` with the strongly-typed resource value if the JSON and merge method
   * are valid, `Failure` with an error message otherwise.
   * @public
   */
  validateDeclaration(props: IResourceCandidateValidationProperties): Result<T | Partial<T>>;

  /**
   * Validates a JSON value for use as a partial resource instance value.
   * @param json - The JSON value to validate.
   * @param completeness - Describes {@link CandidateCompleteness | how complete} the candidate value is.
   * @returns `Success` with the strongly-typed partial resource value if the JSON is valid,
   * `Failure` with an error message otherwise.
   * @public
   */
  validate(json: JsonValue, completeness: CandidateCompleteness): Result<Partial<T>>;

  /**
   * Validates a JSON value for use as a complete resource instance value.
   * @param json - The JSON value to validate.
   * @param completeness - Describes {@link CandidateCompleteness | how complete} the candidate value is.
   * @returns `Success` with the strongly-typed resource value if the JSON is valid,
   * `Failure` with an error message otherwise.
   * @public
   */
  validate(json: JsonValue, completeness: 'full'): Result<T>;

  /**
   * Validates a JSON value for use as a partial resource instance value.
   * @param json - The JSON value to validate.
   * @param completeness - Describes {@link CandidateCompleteness | how complete} the candidate value is.
   * @returns `Success` with the strongly-typed partial resource value if the JSON is valid,
   * `Failure` with an error message otherwise.
   * @public
   */
  validate(json: JsonValue, completeness: 'partial'): Result<Partial<T>>;

  /**
   * Sets the index for this resource type.  Once set, the index cannot be changed.
   */
  setIndex(index: number): Result<ResourceTypeIndex>;

  /**
   * Creates a template for a new resource of this type.
   * The template provides a default structure for creating new resource instances.
   * @param resourceId - The id for the new resource
   * @returns A loose resource declaration with default values for this resource type
   * @public
   */
  createTemplate(resourceId: ResourceId): ResourceJson.Json.ILooseResourceDecl;
}

/**
 * Abstract base class for resource types which are responsible for
 * validating and converting JSON values into the appropriate strongly-typed
 * resource value.
 * @public
 */
export abstract class ResourceType<T = unknown> implements IResourceType<T> {
  private _collectible: Collections.Collectible<ResourceTypeName, ResourceTypeIndex>;
  /**
   * {@inheritdoc ResourceTypes.IResourceType.key}
   */
  public get key(): ResourceTypeName {
    return this._collectible.key;
  }

  /**
   * {@inheritdoc ResourceTypes.IResourceType.index}
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

  /**
   * Creates a template for a new resource of this type.
   * Default implementation provides a basic template.
   * Subclasses can override to provide type-specific templates.
   * @param resourceId - The id for the new resource
   * @returns A loose resource declaration with default values for this resource type
   * @public
   */
  public createTemplate(resourceId: ResourceId): ResourceJson.Json.ILooseResourceDecl {
    return {
      id: resourceId,
      resourceTypeName: this.key,
      candidates: [
        {
          json: this.getDefaultTemplateValue(),
          conditions: undefined,
          isPartial: false,
          mergeMethod: 'replace'
        }
      ]
    };
  }

  /**
   * Gets the default template value for this resource type.
   * Subclasses should override this to provide type-specific default values.
   * @returns The default JSON value for a new resource of this type
   */
  protected getDefaultTemplateValue(): JsonObject {
    // Default implementation returns an empty object
    // Subclasses should override for type-specific defaults
    return {};
  }
}
