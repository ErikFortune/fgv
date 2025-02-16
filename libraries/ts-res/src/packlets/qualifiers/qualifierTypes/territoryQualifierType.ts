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
import {
  Convert,
  NoMatch,
  PerfectMatch,
  QualifierConditionValue,
  QualifierContextValue,
  QualifierMatchScore
} from '../../common';
import { QualifierType } from './qualifierType';

/**
 * Parameters used to create a new {@link Qualifiers.QualifierTypes.TerritoryQualifierType | TerritoryQualifierType} instance.
 * @public
 */
export interface ITerritoryQualifierTypeCreateParams {
  allowedTerritories?: string[];

  index: number;
}

/**
 * Qualifier type for territory values. Territories are two-letter ISO-3166-2
 * Alpha-2 country codes.  Canonical territory codes are uppercase, but this
 * implementation handles incorrect casing.
 * @public
 */
export class TerritoryQualifierType extends QualifierType {
  /**
   * Regular expression that matches valid territory codes.
   * Canonical territory codes are uppercase, but this
   * implementation handles incorrect casing.
   * @public
   */
  protected readonly _territoryRegExp: RegExp = /^(?:[A-Za-z]{2})$/;

  /**
   * Optional array enumerating allowed territories to further constrain the type.
   */
  protected readonly _allowedTerritories?: ReadonlyArray<string>;

  /**
   * Creates a new {@link Qualifiers.QualifierTypes.TerritoryQualifierType | TerritoryQualifierType} instance.
   * @public
   */
  protected constructor({ allowedTerritories, index }: ITerritoryQualifierTypeCreateParams) {
    super({
      name: 'territory',
      allowContextList: false,
      index: Convert.qualifierTypeIndex.convert(index).orThrow()
    });
    if (allowedTerritories !== undefined) {
      allowedTerritories.forEach((v) => {
        if (!this._territoryRegExp.test(v)) {
          throw new Error(
            `${v}: Invalid territory value in enumerated value list for territory qualifier type.`
          );
        }
      });
    }
    this._allowedTerritories = allowedTerritories?.map((t) => t.toUpperCase());
  }

  /**
   * {@inheritdoc Qualifiers.QualifierTypes.QualifierType.isValidConditionValue}
   */
  public isValidConditionValue(value: string): value is QualifierConditionValue {
    if (this._allowedTerritories !== undefined) {
      return this._allowedTerritories.includes(value.toUpperCase());
    }
    return this._territoryRegExp.test(value);
  }

  /**
   * Creates a new {@link Qualifiers.QualifierTypes.TerritoryQualifierType | TerritoryQualifierType} instance.
   * @param params - Optional {@link Qualifiers.QualifierTypes.ITerritoryQualifierTypeCreateParams | parameters} to use
   * when creating the instance.
   * @returns `Success` with the new {@link Qualifiers.QualifierTypes.TerritoryQualifierType | TerritoryQualifierType} if successful,
   * `Failure` with an error message otherwise.
   * @public
   */
  public static create(params: ITerritoryQualifierTypeCreateParams): Result<TerritoryQualifierType> {
    return captureResult(() => new TerritoryQualifierType(params));
  }

  /**
   * {@inheritdoc Qualifiers.QualifierTypes.QualifierType._matchOne}
   */
  protected _matchOne(
    condition: QualifierConditionValue,
    context: QualifierContextValue
  ): QualifierMatchScore {
    return condition.toUpperCase() === context.toUpperCase() ? PerfectMatch : NoMatch;
  }
}
