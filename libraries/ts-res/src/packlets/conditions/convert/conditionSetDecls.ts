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

import { Converter, Converters, Result, fail, mapResults, succeed } from '@fgv/ts-utils';
import { IConditionSetDecl, IValidatedConditionSetDecl } from '../conditionSetDecls';
import { conditionDecl, typedConditionDecl } from './decls';
import { ConditionCollector } from '../conditionCollector';

/* eslint-disable @rushstack/typedef-var */

/**
 * Converter which converts to a {@link Conditions.IConditionSetDecl | condition set declaration}.
 *
 * @remarks
 * Accepts any string as the qualifier name of each contained condition. Use
 * `typedConditionSetDecl` to narrow the accepted set of qualifier names to a literal-string union.
 *
 * @public
 */
export const conditionSetDecl = Converters.strictObject<IConditionSetDecl>({
  conditions: Converters.arrayOf(conditionDecl)
});

/**
 * Returns a `Converter` for an `IConditionSetDecl<TQualifierNames>` narrowed on a supplied
 * `qualifierName` converter.
 *
 * @remarks
 * Each contained condition is converted via `typedConditionDecl(qualifierNameConverter)`.
 *
 * @public
 */
export function typedConditionSetDecl<TQualifierNames extends string>(
  qualifierNameConverter: Converter<TQualifierNames>
): Converter<IConditionSetDecl<TQualifierNames>> {
  return Converters.strictObject<IConditionSetDecl<TQualifierNames>>({
    conditions: Converters.arrayOf(typedConditionDecl(qualifierNameConverter))
  });
}

/**
 * Context for converting a {@link Conditions.IConditionSetDecl | condition set declaration}
 * into an instantiated {@link Conditions.ConditionSet | condition set} object.
 * @public
 */
export interface IConditionSetDeclConvertContext {
  readonly conditions: ConditionCollector;
  conditionSetIndex?: number;
}

function _validatedConditionSetDeclBody<TQualifierNames extends string>(
  innerConditionSetDecl: Converter<IConditionSetDecl<TQualifierNames>>,
  from: unknown,
  context?: IConditionSetDeclConvertContext
): Result<IValidatedConditionSetDecl> {
  /* c8 ignore next 3 - coverage is having a bad day */
  if (!context) {
    return fail('validatedConditionSetDecl converter requires a context');
  }

  return innerConditionSetDecl.convert(from).onSuccess((decl) => {
    return mapResults(
      decl.conditions.map((condition) => context.conditions.validating.getOrAdd(condition))
    ).onSuccess((conditions) => {
      /* c8 ignore next 1 - coverage having issues */
      const index = context.conditionSetIndex ? context.conditionSetIndex++ : undefined;
      return succeed({ conditions, index });
    });
  });
}

/**
 * Converter which constructs a {@link Conditions.IValidatedConditionSetDecl | validated condition set declaration}
 * from a {@link Conditions.IConditionSetDecl | condition set declaration}, instantiating qualifiers by name
 * from a supplied {@link Conditions.Convert.IConditionSetDeclConvertContext | conversion context}.
 *
 * @remarks
 * Accepts any string as the qualifier name. Use `typedValidatedConditionSetDecl` to layer
 * literal-string narrowing on top of the collector-membership check.
 *
 * @public
 */
export const validatedConditionSetDecl = Converters.generic<
  IValidatedConditionSetDecl,
  IConditionSetDeclConvertContext
>((from: unknown, __self, context?: IConditionSetDeclConvertContext): Result<IValidatedConditionSetDecl> => {
  return _validatedConditionSetDeclBody(conditionSetDecl, from, context);
});

/**
 * Returns a `Converter` for an `IValidatedConditionSetDecl` narrowed on a supplied
 * `qualifierName` converter.
 *
 * @public
 */
export function typedValidatedConditionSetDecl<TQualifierNames extends string>(
  qualifierNameConverter: Converter<TQualifierNames>
): Converter<IValidatedConditionSetDecl, IConditionSetDeclConvertContext> {
  const inner = typedConditionSetDecl(qualifierNameConverter);
  return Converters.generic<IValidatedConditionSetDecl, IConditionSetDeclConvertContext>(
    (
      from: unknown,
      __self,
      context?: IConditionSetDeclConvertContext
    ): Result<IValidatedConditionSetDecl> => {
      return _validatedConditionSetDeclBody(inner, from, context);
    }
  );
}
