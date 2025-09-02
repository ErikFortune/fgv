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
import { Qualifier } from './qualifier';

/**
 * Non-validated declaration of a single qualifier default value.
 * @public
 */
export interface IQualifierDefaultValueDecl {
  qualifier: string;
  value: string;
}

/**
 * Non-validated declaration of qualifier default values, consisting of named
 * default values.
 * @public
 */
export type IQualifierDefaultValuesDecl = Record<string, string>;

/**
 * Validated declaration of a single qualifier default value.
 * @public
 */
export interface IValidatedQualifierDefaultValueDecl {
  qualifier: Qualifier;
  value: QualifierContextValue;
}

/**
 * Validated declaration of qualifier default values, a record with strongly-typed
 * {@link QualifierName | qualifier names} as keys and
 * {@link QualifierContextValue | qualifier context values} as values.
 * @public
 */
export type IValidatedQualifierDefaultValuesDecl = Record<QualifierName, QualifierContextValue>;
