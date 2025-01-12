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

import { Validators as JsonValidators } from '@fgv/ts-json-base';
import { Validator, Validators } from '@fgv/ts-utils';
import {
  CandidateIndex,
  ICandidate,
  IResource,
  ResourceIndex,
  ResourceName,
  ResourceType
} from '../resource';
import { conditionSetIndex, decisionIndex } from './condition';

/**
 * @public
 */
export const resourceName: Validator<ResourceName> = Validators.string.withBrand('ResourceName');

/**
 * @public
 */
export const resourceIndex: Validator<ResourceIndex> = Validators.number.withBrand('ResourceIndex');

/**
 * @public
 */
export const resourceType: Validator<ResourceType> = Validators.string.withBrand('ResourceType');

/**
 * @public
 */
export const candidateIndex: Validator<CandidateIndex> = Validators.number.withBrand('CandidateIndex');

/**
 * @public
 */
export const candidate: Validator<ICandidate, unknown> = Validators.object<ICandidate>({
  candidateIndex: candidateIndex.optional(),
  conditionSetIndex: conditionSetIndex,
  instanceValue: JsonValidators.jsonValue,
  partial: Validators.boolean.optional()
});

/**
 * @public
 */
export const resource: Validator<IResource, unknown> = Validators.object<IResource>({
  index: resourceIndex.optional(),
  name: resourceName,
  decisionIndex: decisionIndex,
  instanceValues: Validators.arrayOf(JsonValidators.jsonValue),
  type: resourceType
});
