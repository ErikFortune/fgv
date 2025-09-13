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

import { JsonObject, JsonValue } from '@fgv/ts-json-base';
import { captureResult, fail, Result, succeed } from '@fgv/ts-utils';
import {
  CandidateCompleteness,
  Convert,
  ResourceTypeName,
  ResourceId,
  IResourceResolver
} from '../../../packlets/common';
// eslint-disable-next-line @rushstack/packlets/mechanics
import {
  IResourceCandidateValidationProperties,
  ResourceType
} from '../../../packlets/resource-types/resourceType';
import * as ResourceJson from '../../../packlets/resource-json';

/**
 * Parameters to create a TestDerivedResourceType instance.
 */
export interface ITestDerivedResourceTypeCreateParams {
  /**
   * Optional key for the new TestDerivedResourceType instance.
   * Defaults to 'test-derived'.
   */
  key?: string;

  /**
   * Optional index for the new TestDerivedResourceType instance.
   */
  index?: number;

  /**
   * Optional template for new instances.
   */
  template?: JsonObject;

  /**
   * Optional resource ID to use as a template source.
   * When provided, the resource resolver will be used to look up
   * this resource and use its value as the template.
   */
  templateResourceId?: string;
}

/**
 * Test data structure for the derived resource type
 */
export interface ITestData {
  title: string;
  description?: string;
  metadata?: Record<string, JsonValue>;
}

/**
 * Partial test data structure for the derived resource type
 */
export interface IPartialTestData {
  title?: string;
  description?: string;
  metadata?: Record<string, JsonValue>;
}

/**
 * A derived resource type for testing that demonstrates:
 * 1. Custom validation logic
 * 2. Using a resource resolver to look up template values
 * 3. Type-specific defaults and error handling
 */
export class TestDerivedResourceType extends ResourceType<ITestData> {
  public readonly systemTypeName: ResourceTypeName = Convert.resourceTypeName
    .convert('test-derived')
    .orThrow();

  private _templateResourceId?: string;

  protected constructor(
    key: ResourceTypeName,
    index?: number,
    template?: JsonObject,
    templateResourceId?: string
  ) {
    super(key, index, template);
    this._templateResourceId = templateResourceId;
  }

  /**
   * Factory method to create a new TestDerivedResourceType instance.
   */
  public static create(params?: ITestDerivedResourceTypeCreateParams): Result<TestDerivedResourceType> {
    return Convert.resourceTypeName.convert(params?.key ?? 'test-derived').onSuccess((key) => {
      return captureResult(
        () => new TestDerivedResourceType(key, params?.index, params?.template, params?.templateResourceId)
      );
    });
  }

  /**
   * Validates a resource candidate declaration with custom logic.
   */
  public validateDeclaration(
    props: IResourceCandidateValidationProperties
  ): Result<ITestData | IPartialTestData> {
    // Custom validation: merge method must be 'replace' for full candidates
    if (props.completeness === 'full' && props.mergeMethod !== 'replace') {
      return fail(`${this.key}: Full candidates must use 'replace' merge method, got '${props.mergeMethod}'`);
    }

    return this.validate(props.json, props.completeness);
  }

  /**
   * Validates JSON for this resource type with custom business logic.
   */
  public validate(json: JsonValue, completeness: CandidateCompleteness): Result<IPartialTestData>;
  public validate(json: JsonValue, completeness: 'full'): Result<ITestData>;
  public validate(json: JsonValue, completeness: 'partial'): Result<IPartialTestData>;
  public validate(
    json: JsonValue,
    completeness?: CandidateCompleteness
  ): Result<ITestData | IPartialTestData> {
    if (typeof json !== 'object' || json === null || Array.isArray(json)) {
      return fail(`${this.key}: Expected JSON object, got ${typeof json}`);
    }

    const obj = json as Record<string, JsonValue>;

    // Validate required title field for full resources
    if (completeness === 'full' && (typeof obj.title !== 'string' || !obj.title.trim())) {
      return fail(`${this.key}: 'title' field is required and must be a non-empty string`);
    }

    // Validate optional description
    if (obj.description !== undefined && typeof obj.description !== 'string') {
      return fail(`${this.key}: 'description' field must be a string if provided`);
    }

    // Validate optional metadata
    if (obj.metadata !== undefined) {
      if (typeof obj.metadata !== 'object' || obj.metadata === null || Array.isArray(obj.metadata)) {
        return fail(`${this.key}: 'metadata' field must be an object if provided`);
      }
    }

    const result: ITestData | IPartialTestData = {
      ...(obj.title && { title: obj.title as string }),
      ...(obj.description && { description: obj.description as string }),
      ...(obj.metadata && { metadata: obj.metadata as Record<string, JsonValue> })
    };

    return succeed(result);
  }

  /**
   * Override to demonstrate looking up template values from another resource.
   */
  public getDefaultTemplateCandidate(
    json?: JsonValue,
    conditions?: ResourceJson.Json.ConditionSetDecl,
    resolver?: IResourceResolver
  ): Result<ResourceJson.Json.IChildResourceCandidateDecl> {
    // If a template resource ID is configured and resolver is available, try to resolve it
    if (this._templateResourceId && resolver && !json) {
      return resolver
        .resolveComposedResourceValue(this._templateResourceId)
        .onFailure((error) =>
          fail(`${this.key}: Failed to resolve template resource '${this._templateResourceId}': ${error}`)
        )
        .onSuccess((resolvedValue) => {
          // Use the resolved value as our JSON template
          return super.getDefaultTemplateCandidate(resolvedValue, conditions, resolver);
        });
    }

    // Use provided JSON or fall back to base implementation
    return super.getDefaultTemplateCandidate(json, conditions, resolver);
  }

  /**
   * Override createTemplate to add additional validation for the derived type.
   */
  public createTemplate(
    resourceId: ResourceId,
    init?: JsonValue,
    conditions?: ResourceJson.Json.ConditionSetDecl,
    resolver?: IResourceResolver
  ): Result<ResourceJson.Json.ILooseResourceDecl> {
    // Additional validation: warn if trying to use resolver functionality without a resolver
    if (this._templateResourceId && !resolver) {
      return fail(
        `${this.key}: Template resource ID '${this._templateResourceId}' is configured but no resolver provided`
      );
    }

    return super.createTemplate(resourceId, init, conditions, resolver);
  }
}
