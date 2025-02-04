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
import { Converters, populateObject, Result, succeed } from '@fgv/ts-utils';
import { IConditionDecl, IValidatedConditionDecl } from '../conditionDecls';
import { ReadOnlyQualifierCollector } from '../../qualifiers';

/* eslint-disable @rushstack/typedef-var */

export const conditionDecl = Converters.strictObject<IConditionDecl>({
  name: Converters.string,
  value: Converters.string,
  operator: Common.Convert.conditionOperator.optional(),
  priority: Converters.number
});

export interface IConditionDeclConvertContext {
  readonly qualifiers: ReadOnlyQualifierCollector;
  index: number;
}

export const validatedConditionDecl = Converters.generic<
  IValidatedConditionDecl,
  IConditionDeclConvertContext
>((from: unknown, __self, context?: IConditionDeclConvertContext): Result<IValidatedConditionDecl> => {
  if (!context) {
    return fail('validatedConditionDecl converter requires a context');
  }
  return conditionDecl.convert(from).onSuccess((decl) => {
    return context.qualifiers.validating.get(decl.name).onSuccess((qualifier) => {
      return populateObject<IValidatedConditionDecl>({
        qualifier: () => succeed(qualifier),
        value: () => qualifier.type.validateCondition(decl.value),
        operator: () => succeed(decl.operator ?? 'matches'),
        priority: () =>
          decl.priority
            ? Common.Convert.conditionPriority.convert(decl.priority)
            : succeed(qualifier.defaultPriority),
        index: () => Common.Convert.conditionIndex.convert(context.index)
      })
        .onSuccess((result) => {
          context.index++;
          return succeed(result);
        })
        .withDetail('success');
    });
  });
});
