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
  Validate,
  ConditionOperator,
  QualifierTypeName
} from '../common';
import { QualifierType } from './qualifierType';
import { LiteralValueHierarchy } from './literalValueHierarchy';
import * as Config from './config';
import { JsonCompatible, JsonObject, sanitizeJsonObject } from '@fgv/ts-json-base';

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

  /**
   * Flag indicating whether the qualifier type should accept lowercase territory codes.
   * Defaults to `false`.
   */
  acceptLowercase?: boolean;

  /**
   * Optional {@link QualifierTypes.Config.LiteralValueHierarchyDecl | hierarchy declaration}
   * of territory values to use for matching. If not provided, no hierarchy will be used.
   */
  hierarchy?: Config.LiteralValueHierarchyDecl<string>;
}

/**
 * Qualifier type for territory values. Territories are two-letter ISO-3166-2
 * Alpha-2 country codes. Canonical territory codes are uppercase, but this
 * implementation handles incorrect casing.
 * @public
 */
export class TerritoryQualifierType extends QualifierType<
  JsonCompatible<Config.ITerritoryQualifierTypeConfig>
> {
  /**
   * {@inheritdoc QualifierTypes.IQualifierType.systemTypeName}
   */
  public readonly systemTypeName: QualifierTypeName = Convert.qualifierTypeName
    .convert('territory')
    .orThrow();

  /**
   * Optional array enumerating allowed territories to further constrain the type.
   */
  public readonly allowedTerritories?: ReadonlyArray<QualifierConditionValue>;

  /**
   * Flag indicating whether the qualifier type should accept lowercase territory codes.
   * Defaults to `false`.
   */
  public readonly acceptLowercase: boolean;

  /**
   * Optional {@link QualifierTypes.LiteralValueHierarchy | hierarchy} of territory
   * values to use for matching. If not provided, no hierarchy will be used.
   */
  public readonly hierarchy?: LiteralValueHierarchy<string>;

  /**
   * Creates a new {@link QualifierTypes.TerritoryQualifierType | TerritoryQualifierType} instance.
   * @public
   */
  protected constructor({
    acceptLowercase,
    allowedTerritories,
    allowContextList,
    name,
    index,
    hierarchy
  }: ITerritoryQualifierTypeCreateParams) {
    /* c8 ignore next 7 - coverage seems to be missing coalescing branches */
    name = name ?? 'territory';
    const validIndex = index !== undefined ? Convert.qualifierTypeIndex.convert(index).orThrow() : undefined;
    const validTerritories =
      allowedTerritories !== undefined
        ? mapResults(
            allowedTerritories.map((t) => TerritoryQualifierType.toTerritoryConditionValue(t.toUpperCase()))
          ).orThrow()
        : undefined;

    allowContextList = allowContextList === true;
    super({
      name: name,
      allowContextList,
      index: validIndex
    });
    this.allowedTerritories = validTerritories;
    this.acceptLowercase = acceptLowercase === true;

    if (hierarchy) {
      /* c8 ignore next 5 - defensive coding: allowedTerritories ?? [] fallback enables open values mode */
      this.hierarchy = LiteralValueHierarchy.create({
        values: allowedTerritories ?? [],
        hierarchy: hierarchy
      }).orThrow();
    }
  }

  /**
   * {@inheritdoc QualifierTypes.QualifierType.isValidConditionValue}
   */
  public isValidConditionValue(value: string): value is QualifierConditionValue {
    const normalized = this.acceptLowercase ? value.toUpperCase() : value;

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
   * @param params - Optional {@link QualifierTypes.ITerritoryQualifierTypeCreateParams | parameters}
   * to use when creating the instance.
   * @returns `Success` with the new {@link QualifierTypes.TerritoryQualifierType | TerritoryQualifierType}
   * if successful, `Failure` with an error message otherwise.
   * @public
   */
  public static create(params?: ITerritoryQualifierTypeCreateParams): Result<TerritoryQualifierType> {
    /* c8 ignore next 1 - coverage having problems with conditional branches */
    params = params ?? {};
    return captureResult(() => new TerritoryQualifierType(params));
  }

  /**
   * Creates a new {@link QualifierTypes.TerritoryQualifierType | TerritoryQualifierType} from a configuration object.
   * @param config - The {@link QualifierTypes.Config.IQualifierTypeConfig | configuration object} containing
   * the name, systemType, and optional territory-specific configuration including allowed territories and hierarchy.
   * @returns `Success` with the new {@link QualifierTypes.TerritoryQualifierType | TerritoryQualifierType}
   * if successful, `Failure` with an error message otherwise.
   * @public
   */
  public static createFromConfig(
    config: Config.IQualifierTypeConfig<Config.ITerritoryQualifierTypeConfig>
  ): Result<TerritoryQualifierType> {
    const territoryConfig = config.configuration ?? {};
    return sanitizeJsonObject<ITerritoryQualifierTypeCreateParams>({
      name: config.name,
      allowContextList: territoryConfig.allowContextList === true,
      allowedTerritories: territoryConfig.allowedTerritories,
      acceptLowercase: territoryConfig.acceptLowercase === true,
      hierarchy: territoryConfig.hierarchy
    }).onSuccess(TerritoryQualifierType.create);
  }

  /**
   * Gets the {@link QualifierTypes.Config.ISystemTerritoryQualifierTypeConfig | strongly typed configuration}
   * for this qualifier type.
   * @returns `Success` with the configuration if successful, `Failure` with an error message otherwise.
   */
  public getConfiguration(): Result<Config.ISystemTerritoryQualifierTypeConfig> {
    return this.getConfigurationJson().onSuccess((json) =>
      Config.Convert.systemTerritoryQualifierTypeConfig.convert(json)
    );
  }

  /**
   * {@inheritdoc QualifierTypes.IQualifierType.getConfigurationJson}
   */
  public getConfigurationJson(): Result<JsonCompatible<Config.ISystemTerritoryQualifierTypeConfig>> {
    const hierarchy: JsonObject = this.hierarchy ? { hierarchy: this.hierarchy.asRecord() } : {};
    const allowedTerritories: JsonObject = this.allowedTerritories
      ? { allowedTerritories: [...this.allowedTerritories] }
      : {};
    return succeed({
      name: this.name,
      systemType: 'territory' as const,
      configuration: {
        allowContextList: this.allowContextList,
        acceptLowercase: this.acceptLowercase,
        ...allowedTerritories,
        ...hierarchy
      }
    });
  }

  /**
   * {@inheritdoc QualifierTypes.IQualifierType.validateConfigurationJson}
   */
  public validateConfigurationJson(
    from: unknown
  ): Result<JsonCompatible<Config.ISystemTerritoryQualifierTypeConfig>> {
    return Config.Convert.systemTerritoryQualifierTypeConfig.convert(from);
  }

  /**
   * Validates a {@link QualifierTypes.Config.ISystemTerritoryQualifierTypeConfig | strongly typed configuration object}
   * for this qualifier type.
   * @param from - The unknown data to validate as a configuration object.
   * @returns `Success` with the validated configuration if successful, `Failure` with an error message otherwise.
   */
  public validateConfiguration(from: unknown): Result<Config.ISystemTerritoryQualifierTypeConfig> {
    return this.validateConfigurationJson(from).onSuccess((json) =>
      Config.Convert.systemTerritoryQualifierTypeConfig.convert(json)
    );
  }

  /**
   * {@inheritdoc QualifierTypes.QualifierType._matchOne}
   */
  protected _matchOne(
    condition: QualifierConditionValue,
    context: QualifierContextValue,
    __operator?: ConditionOperator
  ): QualifierMatchScore {
    if (this.isValidConditionValue(condition) && this.isValidContextValue(context)) {
      // Normalize to uppercase for territory codes
      const normalizedCondition = condition.toUpperCase();
      const normalizedContext = context.toUpperCase() as QualifierContextValue;

      if (normalizedCondition === normalizedContext) {
        return PerfectMatch;
      }

      if (this.hierarchy) {
        return this.hierarchy.match(
          normalizedCondition as QualifierConditionValue,
          normalizedContext as QualifierContextValue,
          __operator
        );
      }
    }
    return NoMatch;
  }

  /**
   * Determines whether a value is a valid condition value for a territory qualifier.
   * @param value - The value to validate.
   * @param acceptLowercase - Flag indicating whether the qualifier type should accept lowercase territory codes.
   * Defaults to `false`.
   * @returns `true` if the value is a valid condition value, `false` otherwise.
   * @public
   */
  public static isValidTerritoryConditionValue(
    value: string,
    acceptLowercase?: boolean
  ): value is QualifierConditionValue {
    if (acceptLowercase !== true && value !== value.toUpperCase()) {
      return false;
    }
    return Validate.RegularExpressions.territoryCode.test(value.toUpperCase());
  }

  /**
   * Converts a string value to a territory condition value.
   * @param value - The value to convert.
   * @param acceptLowercase - Flag indicating whether the qualifier type should accept lowercase territory codes.
   * Defaults to `false`.
   * @returns `Success` with the converted value if successful, `Failure` with an error
   * message otherwise.
   * @public
   */
  public static toTerritoryConditionValue(
    value: string,
    acceptLowercase?: boolean
  ): Result<QualifierConditionValue> {
    const normalized = value.toUpperCase();
    return TerritoryQualifierType.isValidTerritoryConditionValue(normalized, acceptLowercase)
      ? succeed(normalized)
      : fail(`${value}: not a valid territory code`);
  }
}
