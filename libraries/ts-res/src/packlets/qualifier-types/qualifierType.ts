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

import { Collections, ICollectible, Result, fail, succeed } from '@fgv/ts-utils';
import {
  ConditionOperator,
  Convert,
  NoMatch,
  PerfectMatch,
  QualifierConditionValue,
  QualifierContextValue,
  QualifierMatchScore,
  QualifierTypeIndex,
  QualifierTypeName,
  Validate
} from '../common';
import { JsonCompatible, JsonObject } from '@fgv/ts-json-base';
import * as Config from './config';

/**
 * Interface for a qualifier type. A qualifier type implements the build and
 * runtime semantics for some class of related qualifiers (e.g. language,
 * territories, etc).
 * @public
 */
export interface IQualifierType<TCFGJSON extends JsonObject = JsonObject>
  extends ICollectible<QualifierTypeName, QualifierTypeIndex> {
  /**
   * The name of the qualifier type.
   */
  readonly name: QualifierTypeName;

  /**
   * Name of the underlying system type.
   */
  readonly systemTypeName: QualifierTypeName;

  /**
   * Unique key for this qualifier.
   */
  readonly key: QualifierTypeName;

  /**
   * Global index for this qualifier type. Immutable once set, either at
   * construction or using {@link QualifierTypes.IQualifierType.setIndex | setIndex}.
   */
  readonly index: QualifierTypeIndex | undefined;

  /**
   * Validates a condition value for this qualifier type.
   * @param value - The string value to validate.
   * @returns `Success` with the {@link QualifierConditionValue | validated value}
   * if the value is valid for use in a condition, `Failure` with error details
   * otherwise.
   */
  isValidConditionValue(value: string): value is QualifierConditionValue;

  /**
   * Validates a context value for this qualifier type.
   * @param value - The string value to validate.
   * @returns `Success` with the {@link QualifierContextValue | validated value}
   * if the value is valid for use in a runtime context, `Failure` with error
   * details otherwise.
   */
  isValidContextValue(value: string): value is QualifierContextValue;

  /**
   * Determines if a supplied condition value is a potential match for a possible context value.
   * @param conditionValue - The condition value.
   * @param contextValue - The context value.
   * @returns `true` if the condition value is a potential match for the context value, `false` otherwise.
   */
  isPotentialMatch(conditionValue: string, contextValue: string): boolean;

  /**
   * Validates that a value and optional operator are valid for use in a condition
   * for qualifiers of this type.
   * @param value - The string value to validate.
   * @param operator - An optional operator to validate. Defaults to 'matches'.
   */
  validateCondition(value: string, operator?: ConditionOperator): Result<QualifierConditionValue>;

  /**
   * Validates that a value is valid for use in a runtime context for qualifiers
   * of this type.
   * @param value - The string value to validate.
   * @returns `Success` with the {@link QualifierContextValue | validated value}
   * if the value is valid for use in a runtime context, `Failure` with error
   * details otherwise.
   */
  validateContextValue(value: string): Result<QualifierContextValue>;

  /**
   * Determines the extent to which a condition matches a context value for this
   * qualifier type.
   * @param condition - The condition value to evaluate.
   * @param context - The context value to evaluate.
   * @param operator - The operator to use in evaluating the match.
   * @returns a {@link QualifierMatchScore | score} indicating the extent to which
   * the condition matches the context value.
   */
  matches(
    condition: QualifierConditionValue,
    context: QualifierContextValue,
    operator: ConditionOperator
  ): QualifierMatchScore;

  /**
   * Sets the index for this qualifier type. Once set, index is immutable.
   */
  setIndex(index: number): Result<QualifierTypeIndex>;

  /**
   * Gets the configuration for this qualifier type.
   * @returns `Success` with the configuration if successful, `Failure` with an error message otherwise.
   */
  getConfigurationJson(): Result<JsonCompatible<Config.IQualifierTypeConfig<TCFGJSON>>>;

  /**
   * Validates configuration JSON data for this qualifier type.
   * @param from - The unknown data to validate as configuration JSON.
   * @returns `Success` with validated JSON configuration if valid, `Failure` with an error message otherwise.
   */
  validateConfigurationJson(from: unknown): Result<JsonCompatible<Config.IQualifierTypeConfig<TCFGJSON>>>;
}

/**
 * Parameters used to create a base {@link QualifierTypes.QualifierType | qualifier type}.
 * @public
 */
export interface IQualifierTypeCreateParams {
  /**
   * The name of the qualifier type. No default value.
   */
  name: string;

  /**
   * Global index for this qualifier type.
   */
  index?: number;

  /**
   * Flag indicating whether this qualifier type allows a list of values in a context.
   * Defaults to `false`.
   */
  allowContextList?: boolean;
}

/**
 * Abstract base class for qualifier types. Provides default implementations for
 * the {@link QualifierTypes.IQualifierType | IQualifierType} interface.
 * @public
 */
export abstract class QualifierType<TCFGJSON extends JsonObject = JsonObject>
  implements IQualifierType<TCFGJSON>
{
  /**
   * {@inheritdoc QualifierTypes.IQualifierType.name}
   */
  public readonly name: QualifierTypeName;

  /**
   * {@inheritdoc QualifierTypes.IQualifierType.systemTypeName}
   */
  public abstract readonly systemTypeName: QualifierTypeName;

  /**
   * {@inheritdoc QualifierTypes.IQualifierType.key}
   */
  public get key(): QualifierTypeName {
    return this._collectible.key;
  }

  /**
   * {@inheritdoc QualifierTypes.IQualifierType.index}
   */
  public get index(): QualifierTypeIndex | undefined {
    return this._collectible.index;
  }

  protected readonly _collectible: Collections.Collectible<QualifierTypeName, QualifierTypeIndex>;

  /**
   * Flag indicating whether this qualifier type allows a list of values in a context.
   * @public
   */
  public readonly allowContextList: boolean;

  /**
   * Constructor for use by derived classes.
   * @param name - The name of the qualifier type.
   * @param allowContextList - Flag indicating whether this qualifier type allows a
   * comma-separated list of runtime values in the context. Defaults to `false`.
   */
  protected constructor({ name, index, allowContextList }: IQualifierTypeCreateParams) {
    this.name = Convert.qualifierTypeName.convert(name).orThrow();
    this.allowContextList = allowContextList === true;
    this._collectible = new Collections.Collectible<QualifierTypeName, QualifierTypeIndex>({
      key: this.name,
      index: index,
      indexConverter: Convert.qualifierTypeIndex
    });
  }

  /**
   * {@inheritdoc QualifierTypes.IQualifierType.isValidConditionValue}
   */
  public abstract isValidConditionValue(value: string): value is QualifierConditionValue;

  /**
   * {@inheritdoc QualifierTypes.IQualifierType.isValidContextValue}
   */
  public isValidContextValue(value: string): value is QualifierContextValue {
    if (this.isValidConditionValue(value)) {
      return true;
    }
    if (this.allowContextList) {
      /* c8 ignore next 1 - functional code tested but coverage intermittently missed */
      return value.split(',').every((v) => this.isValidConditionValue(v.trim()));
    }
    /* c8 ignore next 1 - functional code tested but coverage intermittently missed */
    return false;
  }

  /**
   * {@inheritdoc QualifierTypes.IQualifierType.isPotentialMatch}
   */
  public isPotentialMatch(conditionValue: string, contextValue: string): boolean {
    if (this.isValidConditionValue(conditionValue) && this.isValidContextValue(contextValue)) {
      return this._matchOne(conditionValue, contextValue, 'matches') !== NoMatch;
    }
    /* c8 ignore next 2 - functional code tested but coverage intermittently missed */
    return false;
  }

  /**
   * {@inheritdoc QualifierTypes.IQualifierType.validateCondition}
   */
  public validateCondition(value: string, operator?: ConditionOperator): Result<QualifierConditionValue> {
    operator = operator ?? 'matches';
    /* c8 ignore next 2 - functional error case tested but coverage intermittently missed */
    if (operator !== 'matches') {
      return fail(`${operator}: invalid condition operator`);
      /* c8 ignore next 2 - functional error case tested but coverage intermittently missed */
    } else if (!this.isValidConditionValue(value)) {
      return fail(`${value}: invalid condition value for qualifierType ${this.name}`);
    }
    return succeed(value);
  }

  /**
   * {@inheritdoc QualifierTypes.IQualifierType.validateContextValue}
   */
  public validateContextValue(value: string): Result<QualifierContextValue> {
    /* c8 ignore next 2 - functional error case tested but coverage intermittently missed */
    if (!this.isValidContextValue(value)) {
      return fail(`${value}: invalid context value for qualifierType ${this.name}`);
    }
    return succeed(value);
  }

  /**
   * {@inheritdoc QualifierTypes.IQualifierType.matches}
   */
  public matches(
    condition: QualifierConditionValue,
    context: QualifierContextValue,
    operator: ConditionOperator
  ): QualifierMatchScore {
    if (this.allowContextList) {
      return this._matchList(condition, QualifierType._splitContext(context), operator);
    }
    return this._matchOne(condition, context, operator);
  }

  /**
   * {@inheritdoc QualifierTypes.IQualifierType.getConfigurationJson}
   */
  public abstract getConfigurationJson(): Result<JsonCompatible<Config.IQualifierTypeConfig<TCFGJSON>>>;

  /**
   * {@inheritdoc QualifierTypes.IQualifierType.validateConfigurationJson}
   */
  public abstract validateConfigurationJson(
    from: unknown
  ): Result<JsonCompatible<Config.IQualifierTypeConfig<TCFGJSON>>>;

  /**
   * {@inheritdoc QualifierTypes.IQualifierType.setIndex}
   */
  public setIndex(index: number): Result<QualifierTypeIndex> {
    return this._collectible.setIndex(index);
  }

  /**
   * {@inheritdoc Validate.isValidQualifierTypeName}
   */
  public static isValidName(name: string): name is QualifierTypeName {
    return Validate.isValidQualifierTypeName(name);
  }

  /**
   * {@inheritdoc Validate.isValidQualifierTypeIndex}
   */
  public static isValidIndex(index: number): index is QualifierTypeIndex {
    return Validate.isValidQualifierTypeIndex(index);
  }

  /**
   * Compares two qualifier types by index.
   * @param t1 - The first qualifier type to compare.
   * @param t2 - The second qualifier type to compare.
   * @returns a number indicating the relative order of the two qualifier types.
   */
  public static compare(t1: QualifierType, t2: QualifierType): number {
    const i1 = t1._collectible.index ?? -1;
    const i2 = t2._collectible.index ?? -1;
    let diff = i1 - i2;

    if (diff === 0) {
      diff = t1.name.localeCompare(t2.name);
    }

    return diff;
  }

  /**
   * Matches a single condition value against a single context value.
   * @param condition - The {@link QualifierConditionValue | condition value} to match.
   * @param context - The {@link QualifierContextValue | context value} to match.
   * @param operator - The {@link ConditionOperator | operator} to use in the match.
   * @returns a {@link QualifierMatchScore | score} indicating the extent to which
   * the condition matches the context value.
   * @public
   */
  protected abstract _matchOne(
    condition: QualifierConditionValue,
    context: QualifierContextValue,
    operator: ConditionOperator
  ): QualifierMatchScore;

  /**
   * Matches a single condition value against a list of context values.
   * @param condition - The {@link QualifierConditionValue | condition value} to match.
   * @param context - The comma-separated list of {@link QualifierContextValue | context values} to match.
   * @param operator - The {@link ConditionOperator | operator} to use in the match.
   * @returns a {@link QualifierMatchScore | score} indicating the extent to which
   * the condition matches the context value.
   * @public
   */
  protected _matchList(
    condition: QualifierConditionValue,
    context: QualifierContextValue[],
    operator: ConditionOperator
  ): QualifierMatchScore {
    const scorePerPosition = 1 / context.length;
    let baseScore = PerfectMatch - scorePerPosition;

    for (let i = 0; i < context.length; i++) {
      const score = this._matchOne(condition, context[i], operator);
      if (score > NoMatch) {
        const adjusted = baseScore + scorePerPosition * score;
        if (Validate.isValidQualifierMatchScore(adjusted)) {
          return adjusted;
        }
      }
      baseScore -= scorePerPosition;
    }
    return NoMatch;
  }

  /**
   * Splits a comma-separated {@link QualifierContextValue | context value} into an
   * array of individual values.
   * @param value - The value to split.
   * @returns an array of individual context values.
   * @public
   */
  protected static _splitContext(value: QualifierContextValue): QualifierContextValue[] {
    return value.split(',').map((s) => s.trim() as QualifierContextValue);
  }
}
