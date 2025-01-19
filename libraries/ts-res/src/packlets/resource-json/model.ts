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
import { QualifierName, ResourceId, ResourceTypeName, ResourceValueMergeMethod } from '../common';
/**
 * Type representing a set of conditions that must be met for a resource to be selected.
 * @public
 */
export type ConditionSetDecl = Record<QualifierName, string>;

/**
 * Interface representing a resource candidate declaration.
 * @public
 */
export interface IResourceCandidateDecl {
  /**
   * The {@link ResourceId | id} of the resource.
   */
  readonly id: ResourceId;

  /**
   * The JSON value of the resource.
   */
  readonly json: JsonValue;

  /**
   * The conditions that must be met for the resource to be selected.
   */
  readonly conditions: ConditionSetDecl;

  /**
   * If true, the resource is only a partial representation of the full resource.
   */
  readonly isPartial?: boolean;

  /**
   * The merge method to be used when merging the resource into the existing resource.
   * default is 'augment'.
   */
  readonly mergeMethod?: ResourceValueMergeMethod;

  /**
   * The type of resource.
   */
  readonly resourceTypeName?: ResourceTypeName;
}

/**
 * Interface representing a declaration of a collection
 * of resources.
 * @public
 */
export interface IResourceCollectionDecl {
  /**
   * Optional conditions that apply to all resources in the collection.
   */
  readonly conditions?: ConditionSetDecl;

  /**
   * The resources in the collection.
   */
  readonly resources?: IResourceCandidateDecl[];

  /**
   * Optional collections contained within this collection.
   */
  readonly collections?: IResourceCollectionDecl[];
}
