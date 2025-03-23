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

import * as Common from '../../common';
import { Converters, populateObject, Result, fail, succeed } from '@fgv/ts-utils';
import { IConditionDecl, IValidatedConditionDecl } from '../conditionDecls';
import { IReadOnlyQualifierCollector } from '../../qualifiers';

/* eslint-disable @rushstack/typedef-var */

/**
 * Converter for a {@link Conditions.IConditionDecl | condition declaration}.
 * @public
 */
export const conditionDecl = Converters.strictObject<IConditionDecl>({
  qualifierName: Converters.string,
  value: Converters.string,
  operator: Common.Convert.conditionOperator.optional(),
  priority: Converters.number.optional(),
  scoreAsDefault: Converters.number.optional()
});

/**
 * Conversion context to uses when converting
 * a {@link Conditions.IValidatedConditionDecl | validated condition declaration}.
 * @public
 */
export interface IConditionDeclConvertContext {
  readonly qualifiers: IReadOnlyQualifierCollector;
  conditionIndex?: number;
}

/**
 * Converter which constructs a {@link Conditions.IValidatedConditionDecl | validated condition declaration}
 * from a {@link Conditions.IConditionDecl | condition declaration}, instantiating qualifiers by name
 * from a supplied {@link Conditions.Convert.IConditionDeclConvertContext | conversion context}.
 * @public
 */
export const validatedConditionDecl = Converters.generic<
  IValidatedConditionDecl,
  IConditionDeclConvertContext
>((from: unknown, __self, context?: IConditionDeclConvertContext): Result<IValidatedConditionDecl> => {
  /* c8 ignore next 3 - coverage is having a bad day */
  if (!context) {
    return fail('validatedConditionDecl converter requires a context');
  }
  return conditionDecl.convert(from).onSuccess((decl) => {
    const operator = decl.operator ?? 'matches';
    return context.qualifiers.validating.get(decl.qualifierName).onSuccess((qualifier) => {
      return populateObject<IValidatedConditionDecl>({
        qualifier: () => succeed(qualifier),
        value: () => qualifier.type.validateCondition(decl.value, operator),
        operator: () => succeed(operator),
        priority: () =>
          decl.priority
            ? Common.Convert.conditionPriority.convert(decl.priority)
            : succeed(qualifier.defaultPriority),
        scoreAsDefault: () =>
          decl.scoreAsDefault
            ? Common.Convert.qualifierMatchScore.convert(decl.scoreAsDefault)
            : succeed(undefined),
        index: () =>
          context.conditionIndex
            ? Common.Convert.conditionIndex.convert(context.conditionIndex)
            : succeed(undefined)
      })
        .onSuccess((result) => {
          if (context.conditionIndex !== undefined) {
            context.conditionIndex++;
          }
          return succeed(result);
        })
        .withDetail('success');
    });
  });
});
