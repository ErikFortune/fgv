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

import { Converters, Result, fail } from '@fgv/ts-utils';
import { IReadOnlyQualifierCollector } from '../qualifierCollector';
import { Qualifier } from '../qualifier';

/* eslint-disable @rushstack/typedef-var */

/**
 * Context necessary to convert a string or number to a
 * {@link Qualifiers.Qualifier | Qualifier} object.
 * @public
 */
export interface IQualifierConvertContext {
  qualifiers: IReadOnlyQualifierCollector;
}

/**
 * Converter which choose a qualifier by name or number from a
 * supplied {@link Qualifiers.Convert.IQualifierConvertContext | conversion context}.
 * @public
 */
export const qualifier = Converters.generic<Qualifier, IQualifierConvertContext>(
  (from: unknown, __self, context?: IQualifierConvertContext): Result<Qualifier> => {
    if (context === undefined) {
      return fail('qualifier converter requires a context');
    }
    if (typeof from === 'string') {
      return context.qualifiers.validating.get(from);
    } else if (typeof from === 'number') {
      return context.qualifiers.getAt(from);
    }
    return fail('qualifier converter requires a string or number');
  }
);
