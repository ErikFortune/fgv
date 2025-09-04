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
import { Brand, Result } from '@fgv/ts-utils';

/**
 * Branded string representing a validated resource id.  A resource ID
 * is a dot-separated sequence of resource names.
 * @public
 */
export type ResourceId = Brand<string, 'ResourceId'>;

/**
 * Branded string representing a validated resource name.
 * @public
 */
export type ResourceName = Brand<string, 'ResourceName'>;

/**
 * Branded number representing a validated resource index.
 * @public
 */
export type ResourceIndex = Brand<number, 'ResourceIndex'>;

/**
 * Branded string representing a validated resource type name.
 * @public
 */
export type ResourceTypeName = Brand<string, 'ResourceTypeName'>;

/**
 * Branded number representing a validated resource type index.
 * @public
 */
export type ResourceTypeIndex = Brand<number, 'ResourceTypeIndex'>;

/**
 * Type representing the possible ways that a resource value can be merged into an existing resource.
 * - 'augment' means that the new value should be merged into the existing value, with new properties added and existing properties updated.
 * - 'delete' means that the existing values should be deleted.
 * - 'replace' means that the new value should replace the existing value.
 * @public
 */
export type ResourceValueMergeMethod = 'augment' | 'delete' | 'replace';

/**
 * Array of all possible {@link ResourceValueMergeMethod | resource merge type} values.
 * @public
 */
export const allResourceValueMergeMethods: ResourceValueMergeMethod[] = ['augment', 'delete', 'replace'];

/**
 * The completeness of a resource candidate value.  A full value is one that
 * contains all of the required properties for the resource type.  A partial
 * value is one that contains some of the required properties for the resource
 * type.
 * @public
 */
export type CandidateCompleteness = 'full' | 'partial';

/**
 * Branded number representing a validated candidate value index.
 * Candidate value indices are used to identify candidate values
 * within a resource set and to enable sharing of like values.
 * @public
 */
export type CandidateValueIndex = Brand<number, 'CandidateValueIndex'>;

/**
 * Branded string representing a validated candidate value key.
 * Candidate value keys are used to identify candidate values
 * within a resource set and to enable sharing of like values.
 * @public
 */
export type CandidateValueKey = Brand<string, 'CandidateValueKey'>;

/**
 * Minimal resource resolver
 * @public
 */
export interface IResourceResolver {
  /**
   * Resolves a resource to a composed value by merging matching candidates according to their merge methods.
   * Starting from the highest priority candidates, finds the first "full" candidate and merges all higher
   * priority "partial" candidates into it in ascending order of priority.
   * @param resource - The string id of the resource to resolve.
   * @returns `Success` with the composed JsonValue if successful,
   * or `Failure` with an error message if no candidates match or resolution fails.
   * @public
   */
  resolveComposedResourceValue(resource: string): Result<JsonValue>;

  /**
   * Resolves a resource tree to a composed JSON object by recursively resolving all resources in the tree.
   * For leaf nodes, resolves the resource value. For branch nodes, creates nested objects with child properties.
   * @param node - The resource tree node to resolve.
   * @param options - Optional configuration for error handling during resolution.
   * @returns `Success` with the composed JsonObject if successful,
   * or `Failure` with an error message if resolution fails.
   * @public
   */
  resolveComposedResourceTree?(
    node: unknown, // Will be IResourceTreeNode<IResource> but avoiding circular dependency
    options?: unknown // Will be IResolveResourceTreeOptions
  ): Result<JsonValue>;

  /**
   * Creates a new {@link IResourceResolver | resource resolver} with the given context.
   * @param context - The context to use for the new resource resolver.
   * @returns `Success` with the new resource resolver if successful,
   * or `Failure` with an error message if the context is invalid.
   * @public
   */
  withContext(context: Record<string, string>): Result<IResourceResolver>;
}
