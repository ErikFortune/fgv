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

import { Converter, Converters, Validators } from '@fgv/ts-utils';
import * as Common from '../../common';
import { IResourceCollection } from './model';

/**
 * Validates a resource collection object
 * @public
 */
export const resourceCollection: Converter<IResourceCollection> =
  Converters.strictObject<IResourceCollection>({
    qualifierTypes: Validators.arrayOf(Common.Validate.qualifierType),
    qualifiers: Validators.arrayOf(Common.Validate.qualifier),
    conditions: Validators.arrayOf(Common.Validate.condition),
    conditionSets: Validators.arrayOf(Common.Validate.conditionSet),
    decisions: Validators.arrayOf(Common.Validate.decision),
    resources: Converters.recordOf(Common.Validate.resource, { keyConverter: Common.Validate.resourceName })
  });
