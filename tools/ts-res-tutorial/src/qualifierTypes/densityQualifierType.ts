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

import { captureResult, Result, succeed } from '@fgv/ts-utils';
import {
  ConditionOperator,
  NoMatch,
  PerfectMatch,
  QualifierConditionValue,
  QualifierContextValue,
  QualifierMatchScore,
  QualifierTypeName,
  QualifierTypes
} from '@fgv/ts-res';
import { JsonCompatibleType } from '@fgv/ts-json-base';

/**
 * Ordered density buckets understood by the {@link DensityQualifierType}.
 * Listed from lowest to highest so the index of each value can be used as
 * a proxy for "how close" two buckets are.
 * @public
 */
export const DENSITY_BUCKETS: ReadonlyArray<string> = ['ldpi', 'mdpi', 'hdpi', 'xhdpi', 'xxhdpi'];

/**
 * Parameters for creating a {@link DensityQualifierType}.
 * @public
 */
export interface IDensityQualifierTypeCreateParams {
  /**
   * Name used to identify this qualifier type inside a system configuration.
   * Defaults to `'density'`.
   */
  name?: string;

  /**
   * Global index assigned to the type by its collector. Normally supplied
   * automatically by the ts-res configuration layer.
   */
  index?: number;
}

/**
 * A custom {@link QualifierTypes.QualifierType | QualifierType} that
 * recognises Android-style pixel density buckets (`ldpi`, `mdpi`, `hdpi`,
 * `xhdpi`, `xxhdpi`).
 *
 * @remarks
 * The match semantics are deliberately simple so they are easy to reason
 * about in the tutorial:
 *
 * - Exact bucket match scores {@link QualifierTypes.PerfectMatch | PerfectMatch}.
 * - Adjacent buckets (e.g. `hdpi` vs `xhdpi`) score a partial match so that
 *   a near-density asset is still preferred over nothing.
 * - Two buckets apart scores lower again.
 * - Three or more buckets apart scores {@link QualifierTypes.NoMatch | NoMatch}.
 *
 * The point of this class isn't to be the "correct" way to model density -
 * it's to show how a consumer can plug a brand-new qualifier type into the
 * ts-res configuration pipeline without modifying the library itself.
 *
 * @public
 */
export class DensityQualifierType extends QualifierTypes.QualifierType {
  /**
   * The systemType string this class handles. The companion
   * `DensityQualifierTypeFactory` uses this value to decide whether it
   * can instantiate an entry from the YAML/JSON system configuration.
   */
  public static readonly systemType: string = 'density';

  /**
   * {@inheritdoc QualifierTypes.QualifierType.systemTypeName}
   */
  public readonly systemTypeName: QualifierTypeName = DensityQualifierType.systemType as QualifierTypeName;

  /**
   * Protected constructor - use {@link DensityQualifierType.create} instead.
   */
  protected constructor(params: IDensityQualifierTypeCreateParams) {
    super({
      name: params.name ?? 'density',
      index: params.index,
      allowContextList: false
    });
  }

  /**
   * Factory method. Returns a `Result<DensityQualifierType>` so callers can
   * compose construction into the rest of the ts-res Result-based pipeline.
   */
  public static create(params?: IDensityQualifierTypeCreateParams): Result<DensityQualifierType> {
    return captureResult(() => new DensityQualifierType(params ?? {}));
  }

  /**
   * {@inheritdoc QualifierTypes.QualifierType.isValidConditionValue}
   */
  public isValidConditionValue(value: string): value is QualifierConditionValue {
    return DENSITY_BUCKETS.includes(value.toLowerCase());
  }

  /**
   * {@inheritdoc QualifierTypes.QualifierType.getConfigurationJson}
   */
  public getConfigurationJson(): Result<JsonCompatibleType<QualifierTypes.Config.IQualifierTypeConfig>> {
    return succeed({
      name: this.name,
      systemType: DensityQualifierType.systemType,
      configuration: {}
    });
  }

  /**
   * Validates and returns the configuration JSON for this qualifier type.
   *
   * @remarks
   * In a production implementation this would use a `Converter` to validate
   * the raw shape. The tutorial keeps the story focused on matching logic,
   * so we simply accept the incoming configuration object unchanged.
   */
  public validateConfigurationJson(
    from: unknown
  ): Result<JsonCompatibleType<QualifierTypes.Config.IQualifierTypeConfig>> {
    return succeed(from as JsonCompatibleType<QualifierTypes.Config.IQualifierTypeConfig>);
  }

  /**
   * Scores a single condition/context value pair.
   *
   * @remarks
   * The match score is derived from the distance between the condition
   * bucket and the context bucket in the {@link DENSITY_BUCKETS | ordered
   * bucket list}. Distance 0 is perfect, distance 1 is a strong partial,
   * distance 2 is a weak partial, anything beyond is a no-match.
   */
  protected _matchOne(
    condition: QualifierConditionValue,
    context: QualifierContextValue,
    operator: ConditionOperator
  ): QualifierMatchScore {
    if (operator !== 'matches') {
      return NoMatch;
    }

    const conditionIndex = DENSITY_BUCKETS.indexOf(condition.toLowerCase());
    const contextIndex = DENSITY_BUCKETS.indexOf(context.toLowerCase());

    if (conditionIndex < 0 || contextIndex < 0) {
      return NoMatch;
    }

    const distance = Math.abs(conditionIndex - contextIndex);
    if (distance === 0) {
      return PerfectMatch;
    }
    if (distance === 1) {
      return 0.7 as QualifierMatchScore;
    }
    if (distance === 2) {
      return 0.4 as QualifierMatchScore;
    }
    return NoMatch;
  }
}
