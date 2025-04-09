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

import { Converters, Failure, MessageAggregator, Result, succeed, Success } from '@fgv/ts-utils';
import {
  IContextQualifierValueDecl,
  IValidatedContextDecl,
  IValidatedContextQualifierValueDecl
} from '../contextDecls';
import { IReadOnlyQualifierCollector } from '../../qualifiers';

/* eslint-disable @rushstack/typedef-var */

/**
 * Converter for a {@link Context.IContextQualifierValueDecl | context qualifier value declaration}.
 * @public
 */
export const contextQualifierValueDecl = Converters.strictObject<IContextQualifierValueDecl>({
  qualifier: Converters.string,
  value: Converters.string
});

/**
 * Converter for a {@link Context.IContextDecl | context declaration}.
 * @public
 */
export const contextDecl = Converters.recordOf(Converters.string);

/**
 * Context necessary to convert a {@link Context.IContextQualifierValueDecl | context qualifier value declaration}
 * or {@link Context.IContextDecl | context declaration} to their
 * equivalent - {@link Context.IValidatedContextQualifierValueDecl | validated context qualifier value declaration}
 * or {@link Context.IValidatedContextDecl | validated context declaration}, respectively.
 * @public
 */
export interface IContextDeclConvertContext {
  readonly qualifiers: IReadOnlyQualifierCollector;
}

/**
 * Converter which constructs a {@link Context.IValidatedContextQualifierValueDecl | validated context qualifier value declaration}
 * from a {@link Context.IContextQualifierValueDecl | context qualifier value declaration}, instantiating qualifiers by name
 * from a supplied {@link Context.Convert.IContextDeclConvertContext | conversion context}.
 * @public
 */
export const validatedContextQualifierValueDecl = Converters.generic<
  IContextQualifierValueDecl,
  IContextDeclConvertContext
>(
  (
    from: unknown,
    __self,
    context?: IContextDeclConvertContext
  ): Result<IValidatedContextQualifierValueDecl> => {
    if (!context) {
      return Failure.with('validatedContextQualifierValueDecl converter requires a context');
    }
    return contextQualifierValueDecl.convert(from).onSuccess((decl) => {
      const { value: qualifier, message } = context.qualifiers.validating.get(decl.qualifier);
      if (message !== undefined) {
        return Failure.with(message);
      }
      return qualifier.type.validateContextValue(decl.value).onSuccess((value) => {
        return Success.with({
          qualifier: qualifier.name,
          value
        });
      });
    });
  }
);

/**
 * Converter which constructs a {@link Context.IValidatedContextDecl | validated context declaration}
 * from a {@link Context.IContextDecl | context declaration}, instantiating qualifiers by name
 * from a supplied {@link Context.Convert.IContextDeclConvertContext | conversion context}.
 * @public
 */
export const validatedContextDecl = Converters.generic<IValidatedContextDecl, IContextDeclConvertContext>(
  (from: unknown, __self, context?: IContextDeclConvertContext): Result<IValidatedContextDecl> => {
    if (!context) {
      return Failure.with('validatedContextDecl converter requires a context');
    }

    return contextDecl.convert(from).onSuccess((decl) => {
      const errors = new MessageAggregator();
      const result: IValidatedContextDecl = {};

      for (const key in decl) {
        if (key in decl) {
          const { value: qualifier } = context.qualifiers.validating.get(key).aggregateError(errors);
          if (qualifier !== undefined) {
            qualifier.type
              .validateContextValue(decl[key])
              .onSuccess((value) => {
                result[qualifier.name] = value;
                return succeed(value);
              })
              .aggregateError(errors);
          }
        }
      }
      return errors.returnOrReport(Success.with(result));
    });
  }
);
