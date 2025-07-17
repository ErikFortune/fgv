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
import { IValidatedContextQualifierValueDecl, IValidatedContextDecl } from './contextDecls';
import { IReadOnlyQualifierCollector, Qualifier } from '../qualifiers';

/**
 * Helper class to parse and validate context tokens.
 * @public
 */
export class ContextTokens {
  /**
   * The {@link Qualifiers.IReadOnlyQualifierCollector | qualifier collector} used to validate
   * qualifier names and values.
   */
  public readonly qualifiers: IReadOnlyQualifierCollector;

  /**
   * Constructs a new {@link Context.ContextTokens | ContextTokens } instance.
   * @param qualifiers - the {@link Qualifiers.IReadOnlyQualifierCollector | qualifier collector} to use
   */
  public constructor(qualifiers: IReadOnlyQualifierCollector) {
    this.qualifiers = qualifiers;
  }

  /**
   * Parses a {@link ContextToken | context qualifier token} string and validates the parts
   * against the qualifiers present in the {@link Context.ContextTokens.qualifiers | qualifier collector}.
   * @param token - the token string to parse.
   * @returns `Success` with the {@link Context.IValidatedContextQualifierValueDecl | validated context qualifier value declaration}
   * if successful, `Failure` with an error message if not.
   */
  public parseContextQualifierToken(token: string): Result<IValidatedContextQualifierValueDecl> {
    return ContextTokens.parseContextQualifierToken(token, this.qualifiers);
  }

  /**
   * Parses a {@link ContextSetToken | context token} string and validates the parts
   * against the qualifiers present in the {@link Context.ContextTokens.qualifiers | qualifier collector}.
   * @param token - the token string to parse.
   * @returns `Success` with the array of {@link Context.IValidatedContextQualifierValueDecl | validated context qualifier value declarations}
   * if successful, `Failure` with an error message if not.
   */
  public parseContextToken(token: string): Result<IValidatedContextQualifierValueDecl[]> {
    return ContextTokens.parseContextToken(token, this.qualifiers);
  }

  /**
   * Validates the {@link Helpers.IContextTokenParts | parts} of a {@link ContextToken | context token}.
   * @param parts - the parts to validate
   * @returns `Success` with the validated declaration if successful, `Failure` with an error message if not.
   */
  public validateContextTokenParts(
    parts: CommonHelpers.IContextTokenParts
  ): Result<IValidatedContextQualifierValueDecl> {
    return ContextTokens.validateContextTokenParts(parts, this.qualifiers);
  }

  /**
   * Given a value, finds a single token-optional qualifier that matches the value.
   * Fails if no qualifiers match, or if more than one qualifier matches.
   * @param value - the value to match.
   * @returns `Success` with the matching qualifier if successful, `Failure` with an error message if not.
   */
  public findQualifierForValue(value: string): Result<Qualifier> {
    return ContextTokens.findQualifierForValue(value, this.qualifiers);
  }

  /**
   * Converts a {@link ContextSetToken | context token} to a validated partial context.
   * @param token - the context token to convert
   * @returns `Success` with the validated partial context if successful, `Failure` with an error message if not.
   */
  public contextTokenToPartialContext(token: string): Result<IValidatedContextDecl> {
    return ContextTokens.contextTokenToPartialContext(token, this.qualifiers);
  }

  /**
   * Converts a validated partial context to a {@link ContextSetToken | context token}.
   * @param context - the validated partial context to convert
   * @returns `Success` with the context token if successful, `Failure` with an error message if not.
   */
  public partialContextToContextToken(context: IValidatedContextDecl): Result<string> {
    return ContextTokens.partialContextToContextToken(context);
  }

  /**
   * Parses a {@link ContextToken | context qualifier token} and validates it against the qualifiers
   * present in the supplied {@link Qualifiers.IReadOnlyQualifierCollector | qualifier collector}.
   * @param token - the token string to parse.
   * @param qualifiers - the {@link Qualifiers.IReadOnlyQualifierCollector | qualifier collector} to use
   * @returns `Success` with a {@link Context.IValidatedContextQualifierValueDecl | validated context qualifier value declaration} if successful,
   * `Failure` with an error message if not.
   */
  public static parseContextQualifierToken(
    token: string,
    qualifiers: IReadOnlyQualifierCollector
  ): Result<IValidatedContextQualifierValueDecl> {
    return CommonHelpers.parseContextQualifierTokenParts(token).onSuccess((parts) => {
      return ContextTokens.validateContextTokenParts(parts, qualifiers);
    });
  }

  /**
   * Parses a {@link ContextSetToken | context token} and validates it against the qualifiers
   * present in the supplied {@link Qualifiers.IReadOnlyQualifierCollector | qualifier collector}.
   * @param token - the token string to parse.
   * @param qualifiers - the {@link Qualifiers.IReadOnlyQualifierCollector | qualifier collector} to use
   * @returns `Success` with an array of {@link Context.IValidatedContextQualifierValueDecl | validated context qualifier value declarations}
   * if successful, `Failure` with an error message if not
   */
  public static parseContextToken(
    token: string,
    qualifiers: IReadOnlyQualifierCollector
  ): Result<IValidatedContextQualifierValueDecl[]> {
    return CommonHelpers.parseContextTokenParts(token).onSuccess((parts) => {
      return mapResults(parts.map((part) => ContextTokens.validateContextTokenParts(part, qualifiers)));
    });
  }

  /**
   * Validates the parts of a context token against the qualifiers present in the supplied
   * {@link Qualifiers.IReadOnlyQualifierCollector | qualifier collector}.
   * @param parts - the {@link Helpers.IContextTokenParts | context token parts} to validate.
   * @param qualifiers - the {@link Qualifiers.IReadOnlyQualifierCollector | qualifier collector} used to
   * validate qualifier names and values.
   * @returns `Success` with a {@link Context.IValidatedContextQualifierValueDecl | validated context qualifier value declaration} if successful,
   * `Failure` with an error message if not.
   */
  public static validateContextTokenParts(
    parts: CommonHelpers.IContextTokenParts,
    qualifiers: IReadOnlyQualifierCollector
  ): Result<IValidatedContextQualifierValueDecl> {
    const qualifierLookup =
      parts.qualifier === undefined
        ? ContextTokens.findQualifierForValue(parts.value, qualifiers)
        : qualifiers.getByNameOrToken(parts.qualifier);

    return qualifierLookup.onSuccess((qualifier) => {
      return qualifier.type
        .validateContextValue(parts.value)
        .onSuccess((value) => {
          return succeed({ qualifier, value });
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
      if (qualifier.tokenIsOptional && qualifier.validateContextValue(value).isSuccess()) {
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

  /**
   * Converts a {@link ContextSetToken | context token} to a validated partial context.
   * @param token - the context token to convert
   * @param qualifiers - the {@link Qualifiers.IReadOnlyQualifierCollector | qualifier collector} to use
   * @returns `Success` with the validated partial context if successful, `Failure` with an error message if not.
   */
  public static contextTokenToPartialContext(
    token: string,
    qualifiers: IReadOnlyQualifierCollector
  ): Result<IValidatedContextDecl> {
    return ContextTokens.parseContextToken(token, qualifiers).onSuccess((qualifierValues) => {
      const context: IValidatedContextDecl = {};

      for (const { qualifier, value } of qualifierValues) {
        const qualifierName = qualifier.name as QualifierName;
        const contextValue = value as QualifierContextValue;

        // Check for duplicate qualifiers
        if (qualifierName in context) {
          return fail(`${qualifier.name}: duplicate qualifier in context token`);
        }

        context[qualifierName] = contextValue;
      }

      return succeed(context);
    });
  }

  /**
   * Converts a validated partial context to a {@link ContextSetToken | context token}.
   * @param context - the validated partial context to convert
   * @returns `Success` with the context token if successful, `Failure` with an error message if not.
   */
  public static partialContextToContextToken(context: IValidatedContextDecl): Result<string> {
    const tokens: string[] = [];

    for (const [qualifierName, contextValue] of Object.entries(context)) {
      // Build token as "qualifier=value"
      tokens.push(`${qualifierName}=${contextValue}`);
    }

    if (tokens.length === 0) {
      return succeed('');
    }

    const tokenString = tokens.join('|');

    // Validate the generated token
    return CommonHelpers.buildContextToken(
      tokens.map((token) => {
        const [qualifier, value] = token.split('=');
        return { qualifier, value };
      })
    ).onSuccess(() => succeed(tokenString));
  }
}
