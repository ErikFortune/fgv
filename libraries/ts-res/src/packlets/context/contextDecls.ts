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

import { QualifierContextValue, QualifierName } from '../common';
import { Qualifier } from '../qualifiers';

/**
 * Options to control matching of conditions against a context.
 * @public
 */
export interface IContextMatchOptions {
  /**
   * If true, then conditions which would otherwise yield
   * {@link NoMatch | NoMatch} but have a defined {@link Conditions.Condition.scoreAsDefault | scoreAsDefault}
   * will yield `scoreAsDefault`instead of `NoMatch`.
   */
  acceptDefaultScore?: boolean;

  /**
   * If true, then conditions for which a corresponding values is not present in the
   * context being matched will yield `undefined` instead of `NoMatch`.
   */
  partialContextMatch?: boolean;
}

/**
 * Non-validated declaration of a single context qualifier value.
 * @public
 */
export interface IContextQualifierValueDecl {
  qualifier: string;
  value: string;
}

/**
 * Non-validated declaration of a context, consisting of named
 * values.
 * @public
 */
export type IContextDecl = Record<string, string>;

/**
 * Validated declaration of a single context qualifier value.
 * @public
 */
export interface IValidatedContextQualifierValueDecl {
  qualifier: Qualifier;
  value: QualifierContextValue;
}

/**
 * Validated declaration of a context, a record with strongly-typed
 * {@link QualifierTypeName | qualifier type names} as keys and
 * {@link QualifierContextValue | qualifier context values} as values.
 * @public
 */
export type IValidatedContextDecl = Record<QualifierName, QualifierContextValue>;
