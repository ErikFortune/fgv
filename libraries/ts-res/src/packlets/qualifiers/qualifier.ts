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

import { captureResult, Result } from '@fgv/ts-utils';
import { ConditionPriority, QualifierName } from '../common';
import { QualifierType } from './qualifierTypes';

/**
 * Parameters for creating a new {@link Qualifiers.Qualifier | Qualifier}.
 * @public
 */
export interface IQualifierCreateParams {
  /**
   * The name of the qualifier.
   */
  name: QualifierName;

  /**
   * The {@link Qualifiers.QualifierTypes.QualifierType | type} of the qualifier.
   */
  type: QualifierType;

  /**
   * The default {@link ConditionPriority | priority} of conditions
   * that depend on this qualifier.
   */
  defaultPriority: ConditionPriority;
}

/**
 * Represents a qualifier that can be used to identify the context in
 * which a resource is used.
 * @public
 */
export class Qualifier {
  /**
   * The name of the qualifier.
   */
  public readonly name: QualifierName;
  /**
   * The {@link Qualifiers.QualifierTypes.QualifierType | type} of the qualifier.
   */
  public readonly type: QualifierType;
  /**
   * The default {@link ConditionPriority | priority} of conditions
   * that depend on this qualifier.
   */
  public readonly defaultPriority: ConditionPriority;

  /**
   * Constructs a new instance of a {@link Qualifiers.Qualifier | Qualifier} from the
   * supplied {@link IQualifierCreateParams | parameters}.
   * @param name - The name of the qualifier.
   * @param type - The {@link Qualifiers.QualifierTypes.QualifierType | type} of the qualifier.
   * @param defaultPriority - The default {@link ConditionPriority | priority} of conditions
   * @public
   */
  protected constructor({ name, type, defaultPriority }: IQualifierCreateParams) {
    this.name = name;
    this.type = type;
    this.defaultPriority = defaultPriority;
  }

  /**
   * Creates a new instance of a {@link Qualifiers.Qualifier | Qualifier} from the
   * supplied {@link IQualifierCreateParams | parameters}.
   * @param params - The {@link IQualifierCreateParams | parameters} to use when
   * creating the new instance.
   * @returns `Success` with the new {@link Qualifiers.Qualifier | Qualifier} if successful,
   * `Failure` with an error message otherwise.
   * @public
   */
  public static create(params: IQualifierCreateParams): Result<Qualifier> {
    return captureResult(() => new Qualifier(params));
  }
}
