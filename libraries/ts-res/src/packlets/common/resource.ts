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
import { ResourcePath, ResourceName } from './resourceNames';

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
