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
import { Converter, Converters, mapResults, populateObject, Result, fail, succeed } from '@fgv/ts-utils';
import { IValidatedConditionDecl } from '../conditionDecls';
import { QualifierMap } from '../../qualifiers';
import { IConditionSetDecl, IValidatedConditionSetDecl } from '../conditionSetDecls';
import { conditionDecl, IConditionDeclConvertContext, validatedConditionDecl } from './decls';
import { ConditionMap } from '../conditionMap';
import { Condition } from '../condition';

/* eslint-disable @rushstack/typedef-var */

/**
 * Converter which converts to a {@link Conditions.IConditionSetDecl | condition set declaration}.
 * @public
 */
export const conditionSetDecl = Converters.strictObject<IConditionSetDecl>({
  conditions: Converters.arrayOf(conditionDecl)
});

/**
 * Context for converting a {@link Conditions.IConditionSetDecl | condition set declaration}
 * into an instantiated {@link Conditions.ConditionSet | condition set} object.
 */
export interface IConditionSetDeclConvertContext {
  readonly qualifiers: QualifierMap;
  readonly conditions: ConditionMap;
  index: number;
}

export const validatedConditionSetDecl = Converters.generic<
  IValidatedConditionSetDecl,
  IConditionSetDeclConvertContext
>((from: unknown, __self, context?: IConditionSetDeclConvertContext): Result<IValidatedConditionSetDecl> => {
  return fail('not implemented');
  /*if (!context) {
    return fail('validatedConditionSetDecl converter requires a context');
  }
  return Converters.arrayOf(validatedConditionDecl)
    .convert(from)
    .onSuccess((decls) => {
        return mapResults(decls.map((decl) => {
            return Condition.getKeyForDecl(decl)
                .onSuccess((key) => {
                    return context.conditions.getOrAdd(key, () => {
                        return Condition.create({...decl, index: context.conditions.size}
                    })
                })
        }))
    });*/
});
