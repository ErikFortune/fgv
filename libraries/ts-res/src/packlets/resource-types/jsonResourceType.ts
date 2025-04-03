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

import { Converters as JsonConverters, JsonObject } from '@fgv/ts-json-base';
import { IResourceCandidateValidationProperties, ResourceType } from './resourceType';
import { Convert, ResourceTypeName } from '../common';
import { captureResult, Result } from '@fgv/ts-utils';

/**
 * Parameters to create a {@link ResourceTypes.JsonResourceType | JsonResourceType} instance.
 * @public
 */
export interface IJsonResourceTypeCreateParams {
  /**
   * Optional key for the new {@link ResourceTypes.JsonResourceType | JsonResourceType} instance.
   * Defaults to 'json'.
   */
  key?: string;

  /**
   * Optional index for the new {@link ResourceTypes.JsonResourceType | JsonResourceType}
   * instance.
   */
  index?: number;
}

/**
 * Implementation of a {@link ResourceTypes.ResourceType | ResourceType} for JSON values.
 * @public
 */
export class JsonResourceType extends ResourceType<JsonObject> {
  /**
   * Protected {@link ResourceTypes.JsonResourceType | JsonResourceType} constructor for use by subclasses.
   * Use {@link ResourceTypes.JsonResourceType.create | JsonResourceType.create} to create a new instance.
   * @param key - The key for the new {@link ResourceTypes.JsonResourceType | JsonResourceType} instance.
   * @param index - Optional index for the new {@link ResourceTypes.JsonResourceType | JsonResourceType} instance.
   */
  protected constructor(key: ResourceTypeName, index?: number) {
    super(key, index);
  }

  /**
   * Factory method to create a new {@link ResourceTypes.JsonResourceType | JsonResourceType} instance.
   * @param params - {@link ResourceTypes.IJsonResourceTypeCreateParams | Parameters} to create the new instance.
   * @returns `Success` with the new {@link ResourceTypes.JsonResourceType | JsonResourceType} instance if successful
   * or `Failure` with an error message if not.
   */
  public static create(params?: IJsonResourceTypeCreateParams): Result<JsonResourceType> {
    return Convert.resourceTypeName.convert(params?.key ?? 'json').onSuccess((key) => {
      return captureResult(() => new JsonResourceType(key, params?.index));
    });
  }

  /**
   * {@inheritdoc ResourceTypes.ResourceType.validateDeclaration}
   */

  public validateDeclaration(props: IResourceCandidateValidationProperties): Result<JsonObject> {
    return JsonConverters.jsonObject.convert(props.json);
  }

  /**
   * {@inheritdoc ResourceTypes.ResourceType.(validate:1)}
   */
  public validate(json: JsonObject, isPartial: true): Result<JsonObject>;
  /**
   * {@inheritdoc ResourceTypes.ResourceType.(validate:2)}
   */
  public validate(json: JsonObject, isPartial: false): Result<JsonObject>;
  /**
   * {@inheritdoc ResourceTypes.ResourceType.(validate:3)}
   */
  public validate(json: JsonObject, isPartial: boolean): Result<JsonObject>;
  public validate(json: JsonObject, __isPartial?: boolean): Result<JsonObject> {
    return JsonConverters.jsonObject.convert(json);
  }
}
