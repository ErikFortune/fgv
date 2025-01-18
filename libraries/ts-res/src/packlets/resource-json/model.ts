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
import * as Common from '../common';

/**
 * Type representing the possible ways that a resource value can be merged into an existing resource.
 * - 'augment' means that the new value should be merged into the existing value, with new properties added and existing properties updated.
 * - 'delete' means that the existing values should be deleted.
 * - 'replace' means that the new value should replace the existing value.
 * @public
 */
export type ResourceValueMergeType = 'augment' | 'delete' | 'replace';

/**
 * Array of all possible {@link ResourceValueMergeType | resource merge type} values.
 * @public
 */
export const allResourceValueMergeTypes: ResourceValueMergeType[] = ['augment', 'delete', 'replace'];

/**
 * Type representing a set of conditions that must be met for a resource to be selected.
 * @public
 */
export type ConditionSetDecl = Record<Common.QualifierName, JsonValue>;

/**
 * Interface representing a resource candidate declaration.
 * @public
 */
export interface IResourceCandidateDecl {
  /**
   * The {@link Common.ResourceId | id} of the resource.
   */
  readonly id: Common.ResourceId;

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
  readonly partial?: boolean;

  /**
   * The type of merge to be used when merging the resource into the existing resource.
   * default is 'augment'.
   */
  readonly merge?: ResourceValueMergeType;

  /**
   * The type of resource.
   */
  readonly resourceTypeName?: Common.ResourceTypeName;
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
