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

import { Validators, Validator } from '@fgv/ts-utils';
import { Validators as JsonValidators } from '@fgv/ts-json-base';
import { Validate, ResourceId } from '../common';
import { ResourceType } from '../resource-types';
import { ConcreteDecision } from '../decisions';
import { IResource, IResourceCandidate } from './iResourceManager';

/**
 * Validates an {@link Runtime.IResourceCandidate | IResourceCandidate} object.
 * @public
 */
export const resourceCandidate: Validator<IResourceCandidate, unknown> =
  Validators.object<IResourceCandidate>({
    json: JsonValidators.jsonValue,
    isPartial: Validators.boolean,
    mergeMethod: Validators.isA(
      'resource value merge method',
      (v): v is 'augment' | 'delete' | 'replace' => v === 'augment' || v === 'delete' || v === 'replace'
    )
  });

/**
 * Validates an {@link Runtime.IResource | IResource} object.
 * @public
 */
export const resource: Validator<IResource, unknown> = Validators.object<IResource>({
  id: Validators.isA(
    'ResourceId',
    (v): v is ResourceId => typeof v === 'string' && Validate.isValidResourceId(v)
  ),
  resourceType: Validators.isA('ResourceType instance', (v): v is ResourceType => v instanceof ResourceType),
  decision: Validators.isA(
    'ConcreteDecision instance',
    (v): v is ConcreteDecision => v instanceof ConcreteDecision
  ),
  candidates: Validators.arrayOf(resourceCandidate)
});
