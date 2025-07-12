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

import { captureResult, Collections, ICollectible, Result } from '@fgv/ts-utils';
import {
  ConditionPriority,
  QualifierIndex,
  QualifierName,
  Convert as CommonConvert,
  QualifierContextValue,
  QualifierConditionValue,
  ConditionOperator
} from '../common';
import { QualifierType } from '../qualifier-types';
import { IValidatedQualifierDecl } from './qualifierDecl';

/**
 * Represents a qualifier that can be used to identify the context in
 * which a resource is used.
 * @public
 */
export class Qualifier implements IValidatedQualifierDecl, ICollectible<QualifierName, QualifierIndex> {
  /**
   * The name of the qualifier.
   */
  public readonly name: QualifierName;

  /**
   * The token used to identify the qualifier in the name or
   * path of a resource being imported.
   */
  public readonly token: QualifierName;

  /**
   * The {@link QualifierTypes.QualifierType | type} of the qualifier.
   */
  public readonly type: QualifierType;

  /**
   * Indicates whether the token is optional in the name or path of a resource being imported.
   */
  public readonly tokenIsOptional: boolean;

  /**
   * The index of the qualifier.
   */
  public get index(): QualifierIndex | undefined {
    return this._collectible.index;
  }

  /**
   * The collector key for this qualifier.
   */
  public get key(): QualifierName {
    return this._collectible.key;
  }

  /**
   * The default {@link ConditionPriority | priority} of conditions
   * that depend on this qualifier.
   */
  public readonly defaultPriority: ConditionPriority;

  protected readonly _collectible: Collections.Collectible<QualifierName, QualifierIndex>;

  /**
   * Constructs a new instance of a {@link Qualifiers.Qualifier | Qualifier} from the
   * supplied {@link Qualifiers.IValidatedQualifierDecl | validated declaration}.
   * @param name - The name of the qualifier.
   * @param type - The {@link QualifierTypes.QualifierType | type} of the qualifier.
   * @param defaultPriority - The default {@link ConditionPriority | priority} of conditions
   * @public
   */
  protected constructor({
    name,
    token,
    type,
    defaultPriority,
    tokenIsOptional,
    index
  }: IValidatedQualifierDecl) {
    this.name = name;
    this.token = token;
    this.type = type;
    this.defaultPriority = defaultPriority;
    this.tokenIsOptional = tokenIsOptional;
    this._collectible = new Collections.Collectible<QualifierName, QualifierIndex>({
      key: name,
      index,
      indexConverter: CommonConvert.qualifierIndex
    });
  }

  /**
   * Creates a new instance of a {@link Qualifiers.Qualifier | Qualifier} from the
   * supplied {@link Qualifiers.IValidatedQualifierDecl | validated declaration}.
   * @param decl - The {@link Qualifiers.IValidatedQualifierDecl | validated declaration}
   * for the new instance.
   * @returns `Success` with the new {@link Qualifiers.Qualifier | Qualifier} if successful,
   * `Failure` with an error message otherwise.
   * @public
   */
  public static create(decl: IValidatedQualifierDecl): Result<Qualifier> {
    return captureResult(() => new Qualifier(decl));
  }

  /**
   * Sets the index of this qualifier.  Once set, the index cannot be changed.
   * @param index - The index to set.
   * @returns `Success` with the index if successful, `Failure` with an error message otherwise.
   */
  public setIndex(index: QualifierIndex): Result<QualifierIndex> {
    return this._collectible.setIndex(index);
  }

  /**
   * {@inheritdoc QualifierTypes.QualifierType.isValidContextValue}
   */
  public isValidContextValue(value: string): value is QualifierContextValue {
    return this.type.isValidContextValue(value);
  }

  /**
   * {@inheritdoc QualifierTypes.QualifierType.isValidConditionValue}
   */
  public isValidConditionValue(value: string): value is QualifierConditionValue {
    return this.type.isValidConditionValue(value);
  }

  /**
   * {@inheritdoc QualifierTypes.QualifierType.validateCondition}
   */
  public validateCondition(value: string, operator?: ConditionOperator): Result<QualifierConditionValue> {
    return this.type.validateCondition(value, operator);
  }

  /**
   * {@inheritdoc QualifierTypes.QualifierType.validateContextValue}
   */
  public validateContextValue(value: string): Result<QualifierContextValue> {
    return this.type.validateContextValue(value);
  }
}
