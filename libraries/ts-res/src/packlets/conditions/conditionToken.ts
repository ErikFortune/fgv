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

import { mapResults, Result, succeed } from '@fgv/ts-utils';
import { Helpers as CommonHelpers, ConditionOperator } from '../common';
import { IValidatedConditionDecl } from './conditionDecls';
import { IReadOnlyQualifierCollector, Qualifier } from '../qualifiers';

/**
 * Helper class to parse and validate condition tokens.
 * @public
 */
export class ConditionTokens {
  /**
   * The {@link Qualifiers.IReadOnlyQualifierCollector | qualifier collector} used to validate
   * qualifier names and values.
   */
  public readonly qualifiers: IReadOnlyQualifierCollector;

  /**
   * Constructs a new {@link Conditions.ConditionTokens | ConditionTokens } instance.
   * @param qualifiers - the {@link Qualifiers.IReadOnlyQualifierCollector | qualifier collector} to use
   */
  public constructor(qualifiers: IReadOnlyQualifierCollector) {
    this.qualifiers = qualifiers;
  }

  /**i
   * Parses a {@link ConditionToken | condition token} string and validates the parts
   * against the qualifiers present in the {@link Conditions.ConditionTokens.qualifiers | qualifier collector}.
   * @param token - the token string to parse.
   * @returns `Success` with the {@link Conditions.IValidatedConditionDecl | validated condition declaration}
   * if successful, `Failure` with an error message if not.
   */
  public parseConditionToken(token: string): Result<IValidatedConditionDecl> {
    return ConditionTokens.parseConditionToken(token, this.qualifiers);
  }

  /**
   * Parses a {@link ConditionSetToken | condition set token} string and validates the parts
   * against the qualifiers present in the {@link Conditions.ConditionTokens.qualifiers | qualifier collector}.
   * @param token - the token string to parse.
   * @returns `Success` with the array of {@link Conditions.IValidatedConditionDecl | validated condition declarations}
   * if successful, `Failure` with an error message if not.
   */
  public parseConditionSetToken(token: string): Result<IValidatedConditionDecl[]> {
    return ConditionTokens.parseConditionSetToken(token, this.qualifiers);
  }

  /**
   * Validates the {@link Helpers.IConditionTokenParts | parts} of a {@link ConditionToken | condition token}.
   * @param parts - the parts to validate
   * @returns `Success` with the validated declaration if successful, `Failure` with an error message if not.
   */
  public validateConditionTokenParts(
    parts: CommonHelpers.IConditionTokenParts
  ): Result<IValidatedConditionDecl> {
    return ConditionTokens.validateConditionTokenParts(parts, this.qualifiers);
  }

  /**
   * Given a value, finds a single token-optional qualifier that matches the value.
   * Fails if no qualifiers match, or if more than one qualifier matches.
   * @param value - the value to match.
   * @returns `Success` with the matching qualifier if successful, `Failure` with an error message if not.
   */
  public findQualifierForValue(value: string): Result<Qualifier> {
    return ConditionTokens.findQualifierForValue(value, this.qualifiers);
  }

  /**
   * Parses a {@link ConditionToken | condition token} and validates it against the qualifiers
   * present in the supplied {@link Qualifiers.IReadOnlyQualifierCollector | qualifier collector}.
   * @param token - the token string to parse.
   * @param qualifiers - the {@link Qualifiers.IReadOnlyQualifierCollector | qualifier collector} to use
   * @returns `Success` with a {@link Conditions.IValidatedConditionDecl | validated condition declaration} if successful,
   * `Failure` with an error message if not.
   */
  public static parseConditionToken(
    token: string,
    qualifiers: IReadOnlyQualifierCollector
  ): Result<IValidatedConditionDecl> {
    return CommonHelpers.parseConditionTokenParts(token).onSuccess((parts) => {
      return ConditionTokens.validateConditionTokenParts(parts, qualifiers);
    });
  }

  /**
   * Parses a {@link ConditionSetToken | condition set token} and validates it against the qualifiers
   * present in the supplied {@link Qualifiers.IReadOnlyQualifierCollector | qualifier collector}.
   * @param token - the token string to parse.
   * @param qualifiers - the {@link Qualifiers.IReadOnlyQualifierCollector | qualifier collector} to use
   * @returns `Success` with an array of {@link Conditions.IValidatedConditionDecl | validated condition declarations}
   * if successful, `Failure` with an error message if not
   */
  public static parseConditionSetToken(
    token: string,
    qualifiers: IReadOnlyQualifierCollector
  ): Result<IValidatedConditionDecl[]> {
    return CommonHelpers.parseConditionSetTokenParts(token).onSuccess((parts) => {
      return mapResults(parts.map((part) => ConditionTokens.validateConditionTokenParts(part, qualifiers)));
    });
  }

  /**
   * Validates the parts of a condition token against the qualifiers present in the supplied
   * {@link Qualifiers.IReadOnlyQualifierCollector | qualifier collector}.
   * @param parts - the {@link Helpers.IConditionTokenParts | condition token parts} to validate.
   * @param qualifiers - the {@link Qualifiers.IReadOnlyQualifierCollector | qualifier collector} used to
   * validate qualifier names and values.
   * @returns `Success` with a {@link Conditions.IValidatedConditionDecl | validated condition declaration} if successful,
   * `Failure` with an error message if not.
   */
  public static validateConditionTokenParts(
    parts: CommonHelpers.IConditionTokenParts,
    qualifiers: IReadOnlyQualifierCollector
  ): Result<IValidatedConditionDecl> {
    const qualifierLookup =
      parts.qualifier === undefined
        ? ConditionTokens.findQualifierForValue(parts.value, qualifiers)
        : qualifiers.getByNameOrToken(parts.qualifier);

    return qualifierLookup.onSuccess((qualifier) => {
      return qualifier.type
        .validateCondition(parts.value)
        .onSuccess((value) => {
          const operator: ConditionOperator = 'matches';
          const priority = qualifier.defaultPriority;
          return succeed({ qualifier, value, operator, priority });
        })
        .withDetail('failure', 'success');
    });
  }

  /**
   * Given a value and a set of qualifiers, finds a single token-optional qualifier that matches the value.
   * Fails if no qualifiers match, or if more than one qualifier matches.
   * @param value - the value to match.
   * @param qualifiers - the qualifiers to match against.
   * @returns `Success` with the matching qualifier if successful, `Failure` with an error message if not.
   */
  public static findQualifierForValue(
    value: string,
    qualifiers: IReadOnlyQualifierCollector
  ): Result<Qualifier> {
    const matched: Qualifier[] = [];
    for (const qualifier of qualifiers.values()) {
      if (qualifier.tokenIsOptional && qualifier.type.validateCondition(value).isSuccess()) {
        matched.push(qualifier);
      }
    }
    if (matched.length === 0) {
      return fail(`${value}: does not match any qualifier`);
    }
    if (matched.length > 1) {
      return fail(`${value}: matches multiple qualifiers (${matched.map((q) => q.name).join(', ')})`);
    }
    return succeed(matched[0]);
  }
}
