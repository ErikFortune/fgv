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

import { Converters, populateObject, Result, fail, succeed } from '@fgv/ts-utils';
import { IQualifierDecl, IValidatedQualifierDecl } from '../qualifierDecl';
import { Validate } from '../../common';
import { ReadOnlyQualifierTypeCollector } from '../../qualifier-types';

/* eslint-disable @rushstack/typedef-var */

/**
 * Converter for a {@link Qualifiers.IQualifierDecl | qualifier declaration}.
 * @public
 */
export const qualifierDecl = Converters.strictObject<IQualifierDecl>({
  name: Converters.string,
  typeName: Converters.string,
  defaultPriority: Converters.number
});

/**
 * Context necessary to convert a {@link Qualifiers.IValidatedQualifierDecl | validated qualifier declaration}.
 * @public
 */
export interface IQualifierDeclConvertContext {
  readonly qualifierTypes: ReadOnlyQualifierTypeCollector;
  qualifierIndex?: number;
}

/**
 * Converter which constructs a {@link Qualifiers.IValidatedQualifierDecl | validated qualifier declaration}
 * from a {@link Qualifiers.IQualifierDecl | qualifier declaration}, instantiating qualifier types by name
 * from a supplied {@link Qualifiers.Convert.IQualifierDeclConvertContext | conversion context}.
 * @public
 */
export const validatedQualifierDecl = Converters.generic<
  IValidatedQualifierDecl,
  IQualifierDeclConvertContext
>((from: unknown, __self, context?: IQualifierDeclConvertContext): Result<IValidatedQualifierDecl> => {
  /* c8 ignore next 7  - this is tested but code coverage is losing its mind */
  if (context === undefined) {
    return fail('validatedQualifierDecl converter requires a context');
  }
  const validatedIndexResult =
    context.qualifierIndex !== undefined
      ? Validate.toQualifierIndex(context.qualifierIndex)
      : succeed(undefined);

  return qualifierDecl.convert(from).onSuccess((decl) => {
    return populateObject<IValidatedQualifierDecl>({
      name: () => Validate.toQualifierName(decl.name),
      type: () => context.qualifierTypes.validating.get(decl.typeName),
      defaultPriority: () => Validate.toConditionPriority(decl.defaultPriority),
      index: () => validatedIndexResult
    }).onSuccess((validated) => {
      if (context.qualifierIndex !== undefined) {
        context.qualifierIndex++;
      }
      return succeed(validated);
    });
  });
});
