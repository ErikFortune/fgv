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

import { captureResult, Collections, Result, fail } from '@fgv/ts-utils';
import {
  Convert as CommonConvert,
  ConditionIndex,
  ConditionKey,
  ConditionOperator,
  ConditionPriority,
  ConditionToken,
  QualifierConditionValue,
  QualifierMatchScore,
  Validate
} from '../common';
import { Qualifier } from '../qualifiers';
import { IValidatedConditionDecl } from './conditionDecls';
import * as ResourceJson from '../resource-json';
import * as Context from '../context';

// eslint-disable-next-line @rushstack/typedef-var
const scoreFormatter = new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 3 });

/**
 * Represents a single condition applied to some resource instance.
 * @public
 */
export class Condition implements IValidatedConditionDecl {
  /**
   * The {@link Qualifiers.Qualifier | qualifier} used in this condition.
   */
  public readonly qualifier: Qualifier;

  /**
   * The value to be matched in this condition.
   */
  public readonly value: QualifierConditionValue;

  /**
   * The {@link ConditionOperator | operator} used when matching context value to condition value.
   */
  public readonly operator: ConditionOperator;

  /**
   * The {@link ConditionPriority | relative priority} of this condition.
   */
  public readonly priority: ConditionPriority;

  /**
   * The {@link QualifierMatchScore | score} to be used when this condition is the default.
   */
  public readonly scoreAsDefault?: QualifierMatchScore;

  protected _collectible: Collections.Collectible<ConditionKey, ConditionIndex>;

  /**
   * Constructs a new {@link Conditions.Condition | Condition} object.
   * @param qualifier - The {@link Qualifiers.Qualifier | qualifier} used in this condition.
   * @param value - The value to be matched in this condition.
   * @param operator - The {@link ConditionOperator | operator} used when matching context value to condition value.
   * @param priority - The {@link ConditionPriority | relative priority} of this condition.
   * @public
   */
  protected constructor({
    qualifier,
    value,
    operator,
    priority,
    scoreAsDefault,
    index
  }: IValidatedConditionDecl) {
    this.qualifier = qualifier;
    this.operator = operator;
    this.value = qualifier.validateCondition(value, operator).orThrow();
    this.priority = priority;
    this.scoreAsDefault = scoreAsDefault;
    this._collectible = new Collections.Collectible({
      key: this.toKey(),
      index,
      indexConverter: CommonConvert.conditionIndex
    });
  }

  public get key(): ConditionKey {
    return this._collectible.key;
  }

  public get index(): ConditionIndex | undefined {
    return this._collectible.index;
  }

  public setIndex(index: ConditionIndex): Result<ConditionIndex> {
    return this._collectible.setIndex(index);
  }

  /**
   * Creates a new {@link Conditions.Condition | Condition} object from the supplied
   * {@link Conditions.IValidatedConditionDecl | validated condition declaration}.
   * @param decl - The {@link Conditions.IValidatedConditionDecl | validated condition declaration}
   * describing the condition to create.
   * @returns `Success` with the new {@link Conditions.Condition | Condition} if successful,
   * `Failure` otherwise.
   * @public
   */
  public static create(decl: IValidatedConditionDecl): Result<Condition> {
    return captureResult(() => new Condition(decl));
  }

  /**
   * Determines if this condition matches the supplied {@link Context.IValidatedContextDecl | validated context}.
   * @param context - The {@link Context.IValidatedContextDecl | context} to match against.
   * @returns A {@link QualifierMatchScore | match score} indicating match quality if the condition is present
   * in the context to be matched, `undefined` otherwise.
   */
  public matchContext(context: Context.IValidatedContextDecl): QualifierMatchScore | undefined {
    if (this.qualifier.name in context) {
      const contextValue = context[this.qualifier.name];
      return this.qualifier.type.matches(this.value, contextValue, this.operator);
    }
    return undefined;
  }

  /**
   * Determines if this condition matches the supplied {@link Context.IValidatedContextDecl | validated context}.
   * @remarks
   * A condition matches a context if it is present and the comparison yields a non-zero {@link QualifierMatchScore | match score},
   * *or* if the condition is not present in the context.
   * @param context - The {@link Context.IValidatedContextDecl | context} to match against.
   * @returns `true` if the condition matches the context, `false` otherwise.
   * @public
   */
  public isContextMatch(context: Context.IValidatedContextDecl): boolean {
    return this.matchContext(context) !== undefined;
  }

  /**
   * Compares two conditions for sorting purposes.
   * @param c1 - The first {@link Conditions.Condition | condition} to compare.
   * @param c2 - The second {@link Conditions.Condition | condition} to compare.
   * @returns A negative number if c1 should come before c2, a positive number
   * if c2 should come before c1, or zero if they are equivalent.
   * @public
   */
  public static compare(c1: Condition, c2: Condition): number {
    let diff = c1.priority - c2.priority;
    diff = diff === 0 ? (c1.scoreAsDefault ?? 0) - (c2.scoreAsDefault ?? 0) : diff;
    diff = diff === 0 ? c1.qualifier.name.localeCompare(c2.qualifier.name) : diff;
    diff = diff === 0 ? c1.value.localeCompare(c2.value) : diff;
    return diff;
  }

  /**
   * Gets a {@link ConditionToken | condition token} for this condition, if possible.
   * It is not possible to get a token for a condition with an operator other than `matches`,
   * with other-than-default priority, or with a name or value that contains other than alphanumeric
   * characters, underscore or non-leading hyphen.
   * @param terse - if `true` and if the qualifier token is optional, the token will be omitted
   * from the generated {@link ConditionToken | condition token}.
   * @returns
   */
  public toToken(terse?: boolean): Result<ConditionToken> {
    /* c8 ignore next 3 - defense in depth very difficult to induce */
    if (this.operator !== 'matches') {
      return fail(`${this.operator}: cannot create condition token for operator other than 'matches'`);
    }
    if (this.priority !== this.qualifier.defaultPriority) {
      return fail(`${this.priority}: cannot create condition token for non-default priority`);
    }
    if (terse && this.qualifier.tokenIsOptional) {
      return Validate.toConditionToken(this.value);
    }
    /* c8 ignore next 1 - coverage having a bad day */
    const name = this.qualifier.token ?? this.qualifier.name;
    return Validate.toConditionToken(`${name}=${this.value}`);
  }

  /**
   * Gets the {@link ConditionKey | key} for this condition.
   * @returns -
   */
  public toKey(): ConditionKey {
    return Condition.getKeyForDecl(this).orThrow();
  }

  /**
   * Get a human-readable string representation of the condition.
   * @returns A string representation of the condition.
   * @public
   */
  public toString(): string {
    return this.toKey();
  }

  /**
   * Gets the {@link ResourceJson.Json.IChildConditionDecl | child condition declaration} for this condition.
   * @param options - The {@link ResourceJson.Helpers.IDeclarationOptions | options} to use when creating the child
   * condition declaration.
   * @returns The {@link ResourceJson.Json.IChildConditionDecl | child condition declaration} for this condition.
   * @public
   */
  public toChildConditionDecl(
    options?: ResourceJson.Helpers.IDeclarationOptions
  ): ResourceJson.Json.IChildConditionDecl {
    const showDefaults = options?.showDefaults === true;
    return {
      value: this.value,
      /* c8 ignore next 1 - not really possible to reproduce right now */
      ...(showDefaults || this.operator !== 'matches' ? { operator: this.operator } : {}),
      ...(showDefaults || this.priority !== this.qualifier.defaultPriority
        ? { priority: this.priority }
        : {}),
      ...(this.scoreAsDefault ? { scoreAsDefault: this.scoreAsDefault } : {})
    };
  }

  /**
   * Gets the value for this condition, or the {@link ResourceJson.Json.IChildConditionDecl | child condition declaration}
   * if the condition has non-default operator, priority or a score as default.
   * @param options - The {@link ResourceJson.Helpers.IDeclarationOptions | options} to use when creating the child
   * condition declaration.
   * @returns A string value for this condition, or the {@link ResourceJson.Json.IChildConditionDecl | child condition declaration}
   * if the condition has non-default operator, priority or a score as default.
   */
  public toValueOrChildConditionDecl(
    options?: ResourceJson.Helpers.IDeclarationOptions
  ): string | ResourceJson.Json.IChildConditionDecl {
    if (
      options?.showDefaults !== true &&
      this.operator === 'matches' &&
      this.priority === this.qualifier.defaultPriority &&
      this.scoreAsDefault === undefined
    ) {
      return this.value;
    }
    return this.toChildConditionDecl(options);
  }

  /**
   * Gets the {@link ResourceJson.Json.ILooseConditionDecl | loose condition declaration} for this condition.
   * @param options - The {@link ResourceJson.Helpers.IDeclarationOptions | options} to use when creating the loose
   * condition declaration.
   * @returns The {@link ResourceJson.Json.ILooseConditionDecl | loose condition declaration} for this condition.
   * @public
   */
  public toLooseConditionDecl(
    options?: ResourceJson.Helpers.IDeclarationOptions
  ): ResourceJson.Json.ILooseConditionDecl {
    const showDefaults = options?.showDefaults === true;
    return {
      qualifierName: this.qualifier.name,
      value: this.value,
      /* c8 ignore next 1 - not really possible to reproduce right now */
      ...(showDefaults || this.operator !== 'matches' ? { operator: this.operator } : {}),
      ...(showDefaults || this.priority !== this.qualifier.defaultPriority
        ? { priority: this.priority }
        : {}),
      ...(this.scoreAsDefault ? { scoreAsDefault: this.scoreAsDefault } : {})
    };
  }

  /**
   * Gets the {@link ConditionKey | condition key} for a supplied {@link Conditions.IValidatedConditionDecl | condition declaration}.
   * @param decl - The {@link Conditions.IValidatedConditionDecl | condition declaration} for which to get the key.
   * @returns `Success` with the condition key if successful, `Failure` otherwise.
   * @public
   */
  public static getKeyForDecl(decl: IValidatedConditionDecl): Result<ConditionKey> {
    const scoreAsDefault = decl.scoreAsDefault ? `(${scoreFormatter.format(decl.scoreAsDefault)})` : '';
    const key =
      decl.operator === 'matches'
        ? `${decl.qualifier.name}-[${decl.value}]@${decl.priority}${scoreAsDefault}`
        : `${decl.qualifier.name}-${decl.operator}-[${decl.value}]@${decl.priority}${scoreAsDefault}`;
    return Validate.toConditionKey(key);
  }
}
