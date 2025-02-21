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

import { captureResult, Result, fail, succeed, mapResults } from '@fgv/ts-utils';
import {
  Convert,
  NoMatch,
  PerfectMatch,
  QualifierConditionValue,
  QualifierContextValue,
  QualifierMatchScore,
  Validate
} from '../common';
import { QualifierType } from './qualifierType';

/**
 * Parameters used to create a new {@link QualifierTypes.TerritoryQualifierType | TerritoryQualifierType} instance.
 * @public
 */
export interface ITerritoryQualifierTypeCreateParams {
  /**
   * {@inheritdoc QualifierTypes.IQualifierTypeCreateParams.name}
   */
  name?: string;

  /**
   * {@inheritdoc QualifierTypes.IQualifierTypeCreateParams.allowContextList}
   */
  allowContextList?: boolean;

  /**
   * {@inheritdoc QualifierTypes.IQualifierTypeCreateParams.index}
   */
  index?: number;

  /**
   * Optional array enumerating allowed territories to further constrain the type.
   */
  allowedTerritories?: string[];
}

/**
 * Qualifier type for territory values. Territories are two-letter ISO-3166-2
 * Alpha-2 country codes.  Canonical territory codes are uppercase, but this
 * implementation handles incorrect casing.
 * @public
 */
export class TerritoryQualifierType extends QualifierType {
  /**
   * Optional array enumerating allowed territories to further constrain the type.
   */
  public readonly allowedTerritories?: ReadonlyArray<QualifierConditionValue>;

  /**
   * Creates a new {@link QualifierTypes.TerritoryQualifierType | TerritoryQualifierType} instance.
   * @public
   */
  protected constructor({
    allowedTerritories,
    allowContextList,
    name,
    index
  }: ITerritoryQualifierTypeCreateParams) {
    /* c8 ignore next 7 - coverage seems to be missing coalescing branches */
    name = name ?? 'territory';
    const validIndex = index !== undefined ? Convert.qualifierTypeIndex.convert(index).orThrow() : undefined;
    const validTerritories =
      allowedTerritories !== undefined
        ? mapResults(
            allowedTerritories.map((t) => TerritoryQualifierType.toTerritoryConditionValue(t))
          ).orThrow()
        : undefined;

    allowContextList = allowContextList === true;
    super({
      name: name,
      allowContextList,
      index: validIndex
    });
    this.allowedTerritories = validTerritories;
  }

  /**
   * {@inheritdoc QualifierTypes.QualifierType.isValidConditionValue}
   */
  public isValidConditionValue(value: string): value is QualifierConditionValue {
    const normalized = value.toUpperCase();
    /* c8 ignore next 6 - definitely tested but coverage is missing it */
    if (!TerritoryQualifierType.isValidTerritoryConditionValue(normalized)) {
      return false;
    }
    if (this.allowedTerritories !== undefined) {
      return this.allowedTerritories.includes(normalized);
    }
    return true;
  }

  /**
   * Creates a new {@link QualifierTypes.TerritoryQualifierType | TerritoryQualifierType} instance.
   * @param params - Optional {@link QualifierTypes.ITerritoryQualifierTypeCreateParams | parameters} to use
   * when creating the instance.
   * @returns `Success` with the new {@link QualifierTypes.TerritoryQualifierType | TerritoryQualifierType} if successful,
   * `Failure` with an error message otherwise.
   * @public
   */
  public static create(params?: ITerritoryQualifierTypeCreateParams): Result<TerritoryQualifierType> {
    /* c8 ignore next 1 - coverage having problems with conditional branches */
    params = params ?? {};
    return captureResult(() => new TerritoryQualifierType(params));
  }

  /**
   * {@inheritdoc QualifierTypes.QualifierType._matchOne}
   */
  protected _matchOne(
    condition: QualifierConditionValue,
    context: QualifierContextValue
  ): QualifierMatchScore {
    if (this.isValidConditionValue(condition) && condition.toUpperCase() === context.toUpperCase()) {
      return PerfectMatch;
    }
    return NoMatch;
  }

  /**
   * Determines whether a value is a valid condition value for a territory qualifier.
   * @param value - The value to validate.
   * @returns `true` if the value is a valid condition value, `false` otherwise.
   * @public
   */
  public static isValidTerritoryConditionValue(value: string): value is QualifierConditionValue {
    return Validate.RegularExpressions.territoryCode.test(value);
  }

  /**
   * Converts a string value to a territory condition value.
   * @param value - The value to convert.
   * @returns `Success` with the converted value if successful, `Failure` with an error message otherwise.
   * @public
   */
  public static toTerritoryConditionValue(value: string): Result<QualifierConditionValue> {
    const normalized = value.toUpperCase();
    return TerritoryQualifierType.isValidTerritoryConditionValue(normalized)
      ? succeed(normalized)
      : fail(`${value}: not a valid territory code`);
  }
}
