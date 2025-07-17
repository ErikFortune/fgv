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

import { Result, captureResult } from '@fgv/ts-utils';
import { Bcp47 } from '@fgv/ts-bcp47';
import {
  ConditionOperator,
  Convert,
  NoMatch,
  QualifierConditionValue,
  QualifierContextValue,
  QualifierMatchScore,
  Validate
} from '../common';
import { IQualifierTypeCreateParams, QualifierType } from './qualifierType';
import * as Config from './config';
import { sanitizeJsonObject } from '@fgv/ts-json-base';

/**
 * Interface defining the parameters that can be used to create a new
 * {@link QualifierTypes.LanguageQualifierType | LanguageQualifierType}.
 * @public
 */
export interface ILanguageQualifierTypeCreateParams extends Partial<IQualifierTypeCreateParams> {
  /**
   * Optional name for the qualifier type. Defaults to 'language'.
   */
  name?: string;

  /**
   * Optional flag indicating whether the context can be a list of values.
   * Defaults to `true`.
   */
  allowContextList?: boolean;
}

/**
 * {@link QualifierTypes.QualifierType | Qualifier type} which matches BCP-47 language tags
 * applying {@link https://github.com/ErikFortune/fgv/tree/main/libraries/ts-bcp47#tag-matching | similarity matching}.
 * Accepts a list of language tags in the context by default.
 * @public
 */
export class LanguageQualifierType extends QualifierType {
  /**
   * Creates a new instance of a {@link QualifierTypes.LanguageQualifierType | language qualifier type}.
   * @param name - Optional name for the qualifier type. Defaults to 'language'.
   * @param allowContextList - Optional flag indicating whether the context can be a
   * list of values. Defaults to `true`.
   * @public
   */
  protected constructor({ name, allowContextList, index }: ILanguageQualifierTypeCreateParams) {
    allowContextList = allowContextList !== false;
    /* c8 ignore next 2 - coverage intermittently drops these two lines even though they're tested */
    name = name ?? 'language';
    const validated = index ? { index: Convert.qualifierTypeIndex.convert(index).orThrow() } : {};

    super({
      name,
      allowContextList,
      ...validated
    });
  }

  /**
   * Creates a new instance of a {@link QualifierTypes.LanguageQualifierType | language qualifier type}.
   * @param params - Optional {@link QualifierTypes.ILanguageQualifierTypeCreateParams | parameters}
   * to use when creating the new instance.
   * @returns `Success` with the new {@link QualifierTypes.LanguageQualifierType | language qualifier type}
   * if successful, `Failure` otherwise.
   */
  public static create(params?: ILanguageQualifierTypeCreateParams): Result<LanguageQualifierType> {
    /* c8 ignore next 1 - coverage seems to intermittently miss the branch even though it's tested */
    params = params ?? {};
    return captureResult(() => new LanguageQualifierType(params));
  }

  /**
   * Creates a new {@link QualifierTypes.LanguageQualifierType | LanguageQualifierType} from a configuration object.
   * @param config - The {@link QualifierTypes.Config.IQualifierTypeConfig | configuration object} containing
   * the name, systemType, and optional language-specific configuration.
   * @returns `Success` with the new {@link QualifierTypes.LanguageQualifierType | LanguageQualifierType}
   * if successful, `Failure` with an error message otherwise.
   * @public
   */
  public static createFromConfig(
    config: Config.IQualifierTypeConfig<Config.ILanguageQualifierTypeConfig>
  ): Result<LanguageQualifierType> {
    return sanitizeJsonObject<ILanguageQualifierTypeCreateParams>({
      name: config.name,
      allowContextList: config.configuration?.allowContextList === true
    }).onSuccess(LanguageQualifierType.create);
  }

  /**
   * {@inheritdoc QualifierTypes.IQualifierType.isValidConditionValue}
   */
  public isValidConditionValue(value: string): value is QualifierConditionValue {
    return Bcp47.tag(value).isSuccess();
  }

  /**
   * Matches a single language condition against a single language context value using
   * {@link https://github.com/ErikFortune/fgv/tree/main/libraries/ts-bcp47#tag-matching | similarity matching}.
   * @param condition - The language condition value to match.
   * @param context - The language context value to match against.
   * @param operator - The operator to use for the match. Must be 'matches'.
   * @returns The match score, or `noMatch` if the match fails.
   */
  protected _matchOne(
    condition: QualifierConditionValue,
    context: QualifierContextValue,
    operator: ConditionOperator
  ): QualifierMatchScore {
    if (operator === 'matches') {
      const similarity = Bcp47.similarity(condition, context).orDefault(Bcp47.tagSimilarity.none);
      if (similarity > 0.0 && Validate.isValidQualifierMatchScore(similarity)) {
        return similarity;
      }
    }
    return NoMatch;
  }
}
