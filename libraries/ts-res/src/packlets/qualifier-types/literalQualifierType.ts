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

import { captureResult, mapResults, Result, fail, succeed } from '@fgv/ts-utils';
import {
  ConditionOperator,
  Convert,
  NoMatch,
  PerfectMatch,
  QualifierConditionValue,
  QualifierContextValue,
  QualifierMatchScore,
  QualifierTypeName,
  Validate
} from '../common';
import { QualifierType } from './qualifierType';
import { LiteralValueHierarchy } from './literalValueHierarchy';
import * as Config from './config';
import { JsonCompatible, JsonObject, sanitizeJsonObject } from '@fgv/ts-json-base';

/**
 * Interface defining the parameters that can be used to create a new
 * {@link QualifierTypes.LiteralQualifierType | LiteralQualifierType}.
 * @public
 */
export interface ILiteralQualifierTypeCreateParams {
  /**
   * Optional name for the qualifier type. Defaults to 'literal'.
   */
  name?: string;

  /**
   * Optional flag indicating whether the context can be a list of values.
   * Defaults to `true`.
   */
  allowContextList?: boolean;

  /**
   * Optional flag indicating whether the match should be case-sensitive.
   * Defaults to `false`.
   */
  caseSensitive?: boolean;

  /**
   * Optional array of enumerated values to further constrain the type.
   * Defaults to no constraint.
   */
  enumeratedValues?: ReadonlyArray<string>;

  /**
   * Optional {@link QualifierTypes.Config.LiteralValueHierarchyDecl | hierarchy declaration}
   * of literal values to use for matching. If not provided, no hierarchy will be used.
   */
  hierarchy?: Config.LiteralValueHierarchyDecl<string>;

  /**
   * Global index for this qualifier type.
   */
  index?: number;
}

/**
 * A {@link QualifierTypes.QualifierType | qualifier} that matches a literal value,
 * optionally case-sensitive or matching against an ordered list of values at runtime.
 * @public
 */
export class LiteralQualifierType extends QualifierType {
  /**
   * {@inheritdoc QualifierTypes.IQualifierType.systemTypeName}
   */
  public readonly systemTypeName: QualifierTypeName = Convert.qualifierTypeName.convert('literal').orThrow();

  /**
   * Indicates whether the qualifier match is case-sensitive.
   */
  public readonly caseSensitive: boolean;

  /**
   * Optional array of enumerated values to further constrain the type.
   */
  public readonly enumeratedValues?: ReadonlyArray<QualifierConditionValue>;

  /**
   * Optional {@link QualifierTypes.LiteralValueHierarchy | hierarchy} of literal
   * values to use for matching. If not provided, no hierarchy will be used.
   */
  public readonly hierarchy?: LiteralValueHierarchy<string>;

  /**
   * Constructs a new {@link QualifierTypes.LiteralQualifierType | LiteralQualifierType}.
   * @param name - Optional name for the qualifier type. Defaults to 'literal'.
   * @param caseSensitive - Optional flag indicating whether the match should be
   * case-sensitive. Defaults to `false`.
   * @param allowContextList - Optional flag indicating whether the context can be a
   * list of values. Defaults to `false`.
   * @public
   */
  protected constructor({
    name,
    caseSensitive,
    allowContextList,
    enumeratedValues,
    hierarchy,
    index
  }: ILiteralQualifierTypeCreateParams) {
    allowContextList = allowContextList !== false;
    super({
      name: name ?? 'literal',
      allowContextList,
      index: index !== undefined ? Convert.qualifierTypeIndex.convert(index).orThrow() : undefined
    });
    this.caseSensitive = caseSensitive === true;
    this.enumeratedValues = enumeratedValues
      ? mapResults(Array.from(enumeratedValues).map(LiteralQualifierType.toLiteralConditionValue)).orThrow()
      : undefined;
    if (hierarchy) {
      /* c8 ignore next 5 - defensive coding: enumeratedValues ?? [] fallback enables open values mode */
      this.hierarchy = LiteralValueHierarchy.create({
        values: enumeratedValues ?? [],
        hierarchy: hierarchy
      }).orThrow();
    }
  }

  /**
   * Determines whether a value is a valid condition value for a literal qualifier.
   * The {@link QualifierTypes.LiteralQualifierType | LiteralQualifierType} accepts
   * any identifier as a valid condition value.
   * @param value - The value to validate.
   * @returns `true` if the value is a valid condition value, `false` otherwise.
   */
  public isValidConditionValue(value: string): value is QualifierConditionValue {
    if (this.enumeratedValues) {
      if (this.caseSensitive) {
        return this.enumeratedValues.includes(value as QualifierConditionValue);
      }
      return this.enumeratedValues.some((v) => v.toLowerCase() === value.toLowerCase());
    }
    return LiteralQualifierType.isValidLiteralConditionValue(value);
  }

  /**
   * {@inheritdoc QualifierTypes.IQualifierType.isPotentialMatch}
   */
  public isPotentialMatch(conditionValue: string, contextValue: string): boolean {
    if (this.isValidConditionValue(conditionValue) && this.isValidContextValue(contextValue)) {
      if (this._matchOne(conditionValue, contextValue, 'matches') !== NoMatch) {
        return true;
      }
      if (this.hierarchy) {
        return this.hierarchy.isAncestor(conditionValue, contextValue);
      }
    }
    return false;
  }

  /**
   * Gets a {@link QualifierTypes.Config.ISystemLiteralQualifierTypeConfig | strongly typed configuration object}
   * for this qualifier type.
   * @returns `Success` with the configuration if successful, `Failure` with an error message otherwise.
   */
  public getConfiguration(): Result<Config.ISystemLiteralQualifierTypeConfig> {
    return this.getConfigurationJson().onSuccess((json) =>
      Config.Convert.systemLiteralQualifierTypeConfig.convert(json)
    );
  }

  /**
   * {@inheritdoc QualifierTypes.IQualifierType.getConfigurationJson}
   */
  public getConfigurationJson(): Result<JsonCompatible<Config.ISystemLiteralQualifierTypeConfig>> {
    const hierarchy: JsonObject = this.hierarchy ? { hierarchy: this.hierarchy.asRecord() } : {};
    const enumeratedValues: JsonObject = this.enumeratedValues
      ? { enumeratedValues: [...this.enumeratedValues] }
      : {};
    return succeed({
      name: this.name,
      systemType: 'literal' as const,
      configuration: {
        allowContextList: this.allowContextList,
        caseSensitive: this.caseSensitive,
        ...enumeratedValues,
        ...hierarchy
      }
    });
  }

  /**
   * {@inheritdoc QualifierTypes.IQualifierType.validateConfigurationJson}
   */
  public validateConfigurationJson(
    from: unknown
  ): Result<JsonCompatible<Config.ISystemLiteralQualifierTypeConfig>> {
    return Config.Convert.systemLiteralQualifierTypeConfig.convert(from);
  }

  /**
   * Validates a {@link QualifierTypes.Config.ISystemLiteralQualifierTypeConfig | strongly typed configuration object}
   * for this qualifier type.
   * @param from - The unknown data to validate as a configuration object.
   * @returns `Success` with the validated configuration if successful, `Failure` with an error message otherwise.
   */
  public validateConfiguration(from: unknown): Result<Config.ISystemLiteralQualifierTypeConfig> {
    return Config.Convert.systemLiteralQualifierTypeConfig.convert(from);
  }

  /**
   * {@inheritdoc QualifierTypes.QualifierType._matchOne}
   */
  protected _matchOne(
    condition: QualifierConditionValue,
    context: QualifierContextValue,
    __operator: ConditionOperator
  ): QualifierMatchScore {
    if (this.hierarchy) {
      return this.hierarchy.match(condition, context, __operator);
    }
    if (this.caseSensitive) {
      return condition === (context as string) ? PerfectMatch : NoMatch;
    } else {
      return condition.toLowerCase() === context.toLowerCase() ? PerfectMatch : NoMatch;
    }
  }

  /**
   * Creates a new {@link QualifierTypes.LiteralQualifierType | LiteralQualifierType}.
   * @param params - Optional {@link QualifierTypes.ILiteralQualifierTypeCreateParams | parameters}
   * to use when creating the new instance.
   * @returns `Success` with the new {@link QualifierTypes.LiteralQualifierType | LiteralQualifierType}
   * if successful, `Failure` with an error message otherwise.
   * @public
   */
  public static create(params?: ILiteralQualifierTypeCreateParams): Result<LiteralQualifierType> {
    return captureResult(() => new LiteralQualifierType(params ?? {}));
  }

  /**
   * Creates a new {@link QualifierTypes.LiteralQualifierType | LiteralQualifierType} from a configuration object.
   * @param config - The {@link QualifierTypes.Config.IQualifierTypeConfig | configuration object} containing
   * the name, systemType, and optional literal-specific configuration including case sensitivity,
   * enumerated values, and hierarchy information.
   * @returns `Success` with the new {@link QualifierTypes.LiteralQualifierType | LiteralQualifierType}
   * if successful, `Failure` with an error message otherwise.
   * @public
   */
  public static createFromConfig(
    config: Config.IQualifierTypeConfig<Config.ILiteralQualifierTypeConfig>
  ): Result<LiteralQualifierType> {
    const literalConfig = config.configuration ?? {};
    return sanitizeJsonObject<ILiteralQualifierTypeCreateParams>({
      name: config.name,
      allowContextList: literalConfig.allowContextList === true,
      caseSensitive: literalConfig.caseSensitive,
      enumeratedValues: literalConfig.enumeratedValues,
      hierarchy: literalConfig.hierarchy
    }).onSuccess(LiteralQualifierType.create);
  }

  /**
   * Checks if the given value is a valid literal condition value.
   * @param from - The value to validate.
   * @returns `true` if the value is a valid literal condition value, otherwise `false`.
   * @public
   */
  public static isValidLiteralConditionValue(from: string): from is QualifierConditionValue {
    return Validate.RegularExpressions.identifier.test(from);
  }

  /**
   * Converts a string to a {@link QualifierConditionValue | literal condition value}.
   * @param from - The string to convert.
   * @returns `Success` with the converted value if valid, or `Failure` with an error
   * message if not.
   * @public
   */
  public static toLiteralConditionValue(from: string): Result<QualifierConditionValue> {
    return LiteralQualifierType.isValidLiteralConditionValue(from)
      ? succeed(from)
      : fail(`${from}: not a valid literal condition value.`);
  }
}
