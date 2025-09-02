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

import { mapResults, Result, fail, succeed } from '@fgv/ts-utils';
import { Helpers as CommonHelpers, QualifierName, QualifierContextValue } from '../common';
import {
  IValidatedQualifierDefaultValueDecl,
  IValidatedQualifierDefaultValuesDecl
} from './qualifierDefaultValueDecls';
import { IReadOnlyQualifierCollector } from './qualifierCollector';

/**
 * Helper class to parse and validate qualifier default value tokens.
 * @public
 */
export class QualifierDefaultValueTokens {
  /**
   * The {@link Qualifiers.IReadOnlyQualifierCollector | qualifier collector} used to validate
   * qualifier names and values.
   */
  public readonly qualifiers: IReadOnlyQualifierCollector;

  /**
   * Constructs a new {@link Qualifiers.QualifierDefaultValueTokens | QualifierDefaultValueTokens } instance.
   * @param qualifiers - the {@link Qualifiers.IReadOnlyQualifierCollector | qualifier collector} to use
   */
  public constructor(qualifiers: IReadOnlyQualifierCollector) {
    this.qualifiers = qualifiers;
  }

  /**
   * Parses a {@link QualifierDefaultValueToken | qualifier default value token} string and validates the parts
   * against the qualifiers present in the {@link Qualifiers.QualifierDefaultValueTokens.qualifiers | qualifier collector}.
   * @param token - the token string to parse.
   * @returns `Success` with the {@link Qualifiers.IValidatedQualifierDefaultValueDecl | validated qualifier default value declaration}
   * if successful, `Failure` with an error message if not.
   */
  public parseQualifierDefaultValueToken(token: string): Result<IValidatedQualifierDefaultValueDecl> {
    return QualifierDefaultValueTokens.parseQualifierDefaultValueToken(token, this.qualifiers);
  }

  /**
   * Parses a {@link QualifierDefaultValuesToken | qualifier default values token} string and validates the parts
   * against the qualifiers present in the {@link Qualifiers.QualifierDefaultValueTokens.qualifiers | qualifier collector}.
   * @param token - the token string to parse.
   * @returns `Success` with the array of {@link Qualifiers.IValidatedQualifierDefaultValueDecl | validated qualifier default value declarations}
   * if successful, `Failure` with an error message if not.
   */
  public parseQualifierDefaultValuesToken(token: string): Result<IValidatedQualifierDefaultValueDecl[]> {
    return QualifierDefaultValueTokens.parseQualifierDefaultValuesToken(token, this.qualifiers);
  }

  /**
   * Validates the {@link Helpers.IQualifierDefaultValueTokenParts | parts} of a {@link QualifierDefaultValueToken | qualifier default value token}.
   * @param parts - the parts to validate
   * @returns `Success` with the validated declaration if successful, `Failure` with an error message if not.
   */
  public validateQualifierDefaultValueTokenParts(
    parts: CommonHelpers.IQualifierDefaultValueTokenParts
  ): Result<IValidatedQualifierDefaultValueDecl> {
    return QualifierDefaultValueTokens.validateQualifierDefaultValueTokenParts(parts, this.qualifiers);
  }

  /**
   * Converts a {@link QualifierDefaultValuesToken | qualifier default values token} to a validated qualifier default values declaration.
   * @param token - the qualifier default values token to convert
   * @returns `Success` with the validated qualifier default values declaration if successful, `Failure` with an error message if not.
   */
  public qualifierDefaultValuesTokenToDecl(token: string): Result<IValidatedQualifierDefaultValuesDecl> {
    return QualifierDefaultValueTokens.qualifierDefaultValuesTokenToDecl(token, this.qualifiers);
  }

  /**
   * Converts a validated qualifier default values declaration to a {@link QualifierDefaultValuesToken | qualifier default values token}.
   * @param decl - the validated qualifier default values declaration to convert
   * @returns `Success` with the qualifier default values token if successful, `Failure` with an error message if not.
   */
  public declToQualifierDefaultValuesToken(decl: IValidatedQualifierDefaultValuesDecl): Result<string> {
    return QualifierDefaultValueTokens.declToQualifierDefaultValuesToken(decl);
  }

  /**
   * Parses a {@link QualifierDefaultValueToken | qualifier default value token} and validates it against the qualifiers
   * present in the supplied {@link Qualifiers.IReadOnlyQualifierCollector | qualifier collector}.
   * @param token - the token string to parse.
   * @param qualifiers - the {@link Qualifiers.IReadOnlyQualifierCollector | qualifier collector} to use
   * @returns `Success` with a {@link Qualifiers.IValidatedQualifierDefaultValueDecl | validated qualifier default value declaration} if successful,
   * `Failure` with an error message if not.
   */
  public static parseQualifierDefaultValueToken(
    token: string,
    qualifiers: IReadOnlyQualifierCollector
  ): Result<IValidatedQualifierDefaultValueDecl> {
    return CommonHelpers.parseQualifierDefaultValueTokenParts(token).onSuccess((parts) => {
      return QualifierDefaultValueTokens.validateQualifierDefaultValueTokenParts(parts, qualifiers);
    });
  }

  /**
   * Parses a {@link QualifierDefaultValuesToken | qualifier default values token} and validates it against the qualifiers
   * present in the supplied {@link Qualifiers.IReadOnlyQualifierCollector | qualifier collector}.
   * @param token - the token string to parse.
   * @param qualifiers - the {@link Qualifiers.IReadOnlyQualifierCollector | qualifier collector} to use
   * @returns `Success` with an array of {@link Qualifiers.IValidatedQualifierDefaultValueDecl | validated qualifier default value declarations}
   * if successful, `Failure` with an error message if not
   */
  public static parseQualifierDefaultValuesToken(
    token: string,
    qualifiers: IReadOnlyQualifierCollector
  ): Result<IValidatedQualifierDefaultValueDecl[]> {
    return CommonHelpers.parseQualifierDefaultValuesTokenParts(token).onSuccess((parts) => {
      return mapResults(
        parts.map((part) =>
          QualifierDefaultValueTokens.validateQualifierDefaultValueTokenParts(part, qualifiers)
        )
      );
    });
  }

  /**
   * Validates the parts of a qualifier default value token against the qualifiers present in the supplied
   * {@link Qualifiers.IReadOnlyQualifierCollector | qualifier collector}.
   * @param parts - the {@link Helpers.IQualifierDefaultValueTokenParts | qualifier default value token parts} to validate.
   * @param qualifiers - the {@link Qualifiers.IReadOnlyQualifierCollector | qualifier collector} used to
   * validate qualifier names and values.
   * @returns `Success` with a {@link Qualifiers.IValidatedQualifierDefaultValueDecl | validated qualifier default value declaration} if successful,
   * `Failure` with an error message if not.
   */
  public static validateQualifierDefaultValueTokenParts(
    parts: CommonHelpers.IQualifierDefaultValueTokenParts,
    qualifiers: IReadOnlyQualifierCollector
  ): Result<IValidatedQualifierDefaultValueDecl> {
    return qualifiers.getByNameOrToken(parts.qualifier).onSuccess((qualifier) => {
      // Allow empty values to remove defaults
      if (parts.value === '') {
        return succeed({ qualifier, value: '' as QualifierContextValue });
      }

      return qualifier.type
        .validateContextValue(parts.value)
        .onSuccess((value) => {
          return succeed({ qualifier, value });
        })
        .withDetail('failure', 'success');
    });
  }

  /**
   * Converts a {@link QualifierDefaultValuesToken | qualifier default values token} to a validated qualifier default values declaration.
   * @param token - the qualifier default values token to convert
   * @param qualifiers - the {@link Qualifiers.IReadOnlyQualifierCollector | qualifier collector} to use
   * @returns `Success` with the validated qualifier default values declaration if successful, `Failure` with an error message if not.
   */
  public static qualifierDefaultValuesTokenToDecl(
    token: string,
    qualifiers: IReadOnlyQualifierCollector
  ): Result<IValidatedQualifierDefaultValuesDecl> {
    return QualifierDefaultValueTokens.parseQualifierDefaultValuesToken(token, qualifiers).onSuccess(
      (qualifierDefaultValues) => {
        const defaultValues: IValidatedQualifierDefaultValuesDecl = {};

        for (const { qualifier, value } of qualifierDefaultValues) {
          const qualifierName = qualifier.name as QualifierName;
          const contextValue = value as QualifierContextValue;

          // Check for duplicate qualifiers
          if (qualifierName in defaultValues) {
            return fail(`${qualifier.name}: duplicate qualifier in default values token`);
          }

          // Only add non-empty values (empty values remove defaults)
          if (contextValue !== '') {
            defaultValues[qualifierName] = contextValue;
          }
        }

        return succeed(defaultValues);
      }
    );
  }

  /**
   * Converts a validated qualifier default values declaration to a {@link QualifierDefaultValuesToken | qualifier default values token}.
   * @param decl - the validated qualifier default values declaration to convert
   * @returns `Success` with the qualifier default values token if successful, `Failure` with an error message if not.
   */
  public static declToQualifierDefaultValuesToken(
    decl: IValidatedQualifierDefaultValuesDecl
  ): Result<string> {
    const tokens: string[] = [];

    for (const [qualifierName, contextValue] of Object.entries(decl)) {
      // Build token as "qualifier=value"
      tokens.push(`${qualifierName}=${contextValue}`);
    }

    if (tokens.length === 0) {
      return succeed('');
    }

    const tokenString = tokens.join('|');

    // Validate the generated token
    return CommonHelpers.buildQualifierDefaultValuesToken(
      tokens.map((token) => {
        const [qualifier, value] = token.split('=');
        return { qualifier, value };
      })
    ).onSuccess(() => succeed(tokenString));
  }
}
