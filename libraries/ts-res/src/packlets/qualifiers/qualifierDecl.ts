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

import { ConditionPriority, QualifierIndex, QualifierName } from '../common';
import { QualifierType } from '../qualifier-types';

/**
 * Simple declaration for a {@link Qualifiers.Qualifier | Qualifier}.
 * @public
 */
export interface IQualifierDecl {
  name: string;
  typeName: string;
  defaultPriority: number;
}

/**
 * Validated declaration for a {@link Qualifiers.Qualifier | Qualifier}.
 * @public
 */
export interface IValidatedQualifierDecl {
  /**
   * The name of the qualifier.
   */
  name: QualifierName;

  /**
   * The {@link QualifierTypes.QualifierType | type} of the qualifier.
   */
  type: QualifierType;

  /**
   * The default {@link ConditionPriority | priority} of conditions
   * that depend on this qualifier.
   */
  defaultPriority: ConditionPriority;

  /**
   * Index of the qualifier.
   */
  index: QualifierIndex | undefined;
}
