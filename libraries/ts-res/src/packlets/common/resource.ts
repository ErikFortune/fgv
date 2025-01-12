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
import { ConditionSetIndex, DecisionIndex } from './condition';
import { Brand } from '@fgv/ts-utils';

/**
 * @public
 */
export type ResourceName = Brand<string, 'ResourceName'>;

/**
 * Validates a string to determine if it is a valid {@link ResourceName | ResourceName}.
 * @param name - the string to be tested
 * @returns `true` if the string is a valid {@link ResourceName | ResourceName}, `false` otherwise.
 * @public
 */
export function isValidResourceName(name: string): name is ResourceName {
  return /ˆ[-_a-zA-Z0-9]+$/.test(name);
}

/**
 * @public
 */
export type ResourceTypeName = Brand<string, 'ResourceType'>;

/**
 * @public
 */
export type ResourceTypeIndex = Brand<number, 'ResourceTypeIndex'>;

/**
 * @public
 */
export type CandidateIndex = Brand<number, 'CandidateIndex'>;

/**
 * @public
 */
export type ResourcePath = Brand<string, 'ResourcePath'>;

/**
 * Validates a string to determine if it is a valid {@link ResourceName | ResourceName}.
 * @param name - the string to be tested
 * @returns `true` if the string is a valid {@link ResourceName | ResourceName}, `false` otherwise.
 * @public
 */
export function isValidResourcePath(name: string): name is ResourceName {
  return /ˆ\/\/[-_a-zA-Z0-9\/]+$/.test(name);
}

/**
 * Appends a resource name to a resource path.
 * @param path - the path to which the name will be appended.
 * @param name - the name to append.
 * @returns The updated path.
 * @public
 */
export function appendResourcePath(path: ResourcePath | '', name: ResourceName): ResourcePath {
  if (path === '') {
    return `//${path}` as ResourcePath;
  }
  return `${path}/${name}` as ResourcePath;
}

/**
 * @public
 */
export type ResourceTypeConfig = Brand<JsonValue, 'ResourceTypeConfig'>;

/**
 * @public
 */
export interface IResourceType {
  index?: ResourceTypeIndex;
  name: ResourceTypeName;
  config?: ResourceTypeConfig;
}

/**
 * @public
 */
export interface ICandidate {
  candidateIndex?: CandidateIndex;
  conditionSetIndex: ConditionSetIndex;
  instanceValue: JsonValue;
  partial?: boolean;
}

/**
 * @public
 */
export type InstanceValue = Brand<JsonValue, 'InstanceValue'>;

/**
 * @public
 */
export interface IResource {
  path?: ResourcePath;
  name: ResourceName;
  decisionIndex: DecisionIndex;
  instanceValues: InstanceValue[];
  typeIndex: ResourceTypeIndex;
}

/**
 * @public
 */
export interface IResourceSubtree {
  name: ResourceName;
  path?: ResourcePath;
  resources?: Record<ResourceName, IResource>;
  children?: Record<ResourceName, IResourceSubtree>;
}
