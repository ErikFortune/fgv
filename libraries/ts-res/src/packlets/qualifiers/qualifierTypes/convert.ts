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

import { Converter, Converters, Result, fail } from '@fgv/ts-utils';
import { QualifierTypeMap } from './qualifierTypeMap';
import { QualifierType } from './qualifierType';

/**
 * Context necessary to convert a qualifier name or number to an
 * instantiated {@link Qualifiers.QualifierType}.
 * @public
 */
export interface IQualifierTypeConvertContext {
  qualifierTypes: QualifierTypeMap;
}

/**
 * Converter for {@link Qualifiers.QualifierType | QualifierType} objects,
 * retrieves a {@link Qualifiers.QualifierType | QualifierType} by name or
 * index from a supplied {@link IQualifierTypeConvertContext | conversion context}.
 * @public
 */
// eslint-disable-next-line @rushstack/typedef-var
export const qualifierType = Converters.generic<QualifierType, IQualifierTypeConvertContext>(
  (
    from: unknown,
    __self: Converter<QualifierType, IQualifierTypeConvertContext>,
    context?: IQualifierTypeConvertContext
  ): Result<QualifierType> => {
    if (!context) {
      return fail('qualifierType converter requires a context');
    }
    if (typeof from === 'string') {
      return context.qualifierTypes.converting.get(from);
    } else if (typeof from === 'number') {
      return context.qualifierTypes.getAt(from);
    }
    return fail('qualifierType converter requires a string or number');
  }
);
