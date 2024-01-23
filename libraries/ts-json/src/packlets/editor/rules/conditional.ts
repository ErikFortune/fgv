/*
 * Copyright (c) 2020 Erik Fortune
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

import { JsonObject, JsonValue, isJsonObject } from '@fgv/ts-json-base';
import { DetailedResult, Result, captureResult, failWithDetail, succeedWithDetail } from '@fgv/ts-utils';
import { IJsonEditorOptions, JsonEditFailureReason, JsonPropertyEditFailureReason } from '../common';
import { JsonEditorRuleBase } from '../jsonEditorRule';
import { JsonEditorState } from '../jsonEditorState';

/**
 * Returned by {@link Editor.Rules.ConditionalJsonEditorRule._tryParseCondition | ConditionalJsonEditorRule._tryParseCondition}
 * to indicate whether a successful match was due to a matching condition or a default value.
 * @public
 */
export interface IConditionalJsonKeyResult extends JsonObject {
  matchType: 'default' | 'match' | 'unconditional';
}

/**
 * On a successful match, the {@link Editor.Rules.ConditionalJsonEditorRule | ConditionalJsonEditorRule}
 * stores a {@link Editor.Rules.IConditionalJsonDeferredObject | IConditionalJsonDeferredObject} describing the
 * matching result, to be resolved at finalization time.
 * @public
 */
export interface IConditionalJsonDeferredObject extends IConditionalJsonKeyResult {
  value: JsonValue;
}

/**
 * Configuration options for the {@link Editor.Rules.ConditionalJsonEditorRule | ConditionalJsonEditorRule}.
 * @public
 */
export interface IConditionalJsonRuleOptions extends Partial<IJsonEditorOptions> {
  /**
   * If true (default) then properties with unconditional names
   * (which start with !) are flattened.
   */
  flattenUnconditionalValues?: boolean;
}

/**
 * The {@link Editor.Rules.ConditionalJsonEditorRule | ConditionalJsonEditorRule} evaluates
 * properties with conditional keys, omitting non-matching keys and merging keys that match,
 * or default keys only if no other keys match.
 *
 * The default syntax for a conditional key is:
 *    "?value1=value2" - matches if value1 and value2 are the same, is ignored otherwise.
 *    "?value" - matches if value is a non-empty, non-whitespace string. Is ignored otherwise.
 *    "?default" - matches only if no other conditional blocks in the same object were matched.
 * @public
 */
export class ConditionalJsonEditorRule extends JsonEditorRuleBase {
  /**
   * Stored fully-resolved {@link Editor.Rules.IConditionalJsonRuleOptions | options} for this
   * rule.
   * @public
   */
  protected _options?: IConditionalJsonRuleOptions;

  /**
   * Creates a new {@link Editor.Rules.ConditionalJsonEditorRule | ConditionalJsonEditorRule}.
   * @param options - Optional {@link Editor.Rules.IConditionalJsonRuleOptions | configuration options}
   * used for this rule.
   */
  public constructor(options?: IConditionalJsonRuleOptions) {
    super();
    this._options = options;
  }

  /**
   * Creates a new {@link Editor.Rules.ConditionalJsonEditorRule | ConditionalJsonEditorRule}.
   * @param options - Optional {@link Editor.Rules.IConditionalJsonRuleOptions | configuration options}
   * used for this rule.
   */
  public static create(options?: IConditionalJsonRuleOptions): Result<ConditionalJsonEditorRule> {
    return captureResult(() => new ConditionalJsonEditorRule(options));
  }

  /**
   * Evaluates a property for conditional application.
   * @param key - The key of the property to be considered
   * @param value - The {@link JsonValue | value} of the property to be considered.
   * @param state - The {@link Editor.JsonEditorState | editor state} for the object being edited.
   * @returns Returns `Success` with detail `'deferred'` and a
   * {@link Editor.Rules.IConditionalJsonDeferredObject | IConditionalJsonDeferredObject}.
   * for a matching, default or unconditional key. Returns `Failure` with detail `'ignore'` for
   * a non-matching conditional, or with detail `'error'` if an error occurs. Otherwise
   * fails with detail `'inapplicable'`.
   */
  public editProperty(
    key: string,
    value: JsonValue,
    state: JsonEditorState
  ): DetailedResult<JsonObject, JsonPropertyEditFailureReason> {
    const result = this._tryParseCondition(key, state).onSuccess((deferred) => {
      if (isJsonObject(value)) {
        const rtrn: IConditionalJsonDeferredObject = { ...deferred, value };
        return succeedWithDetail(rtrn, 'deferred');
      }
      return failWithDetail<JsonObject, JsonPropertyEditFailureReason>(
        `${key}: conditional body must be object`,
        'error'
      );
    });

    if (result.isFailure() && result.detail === 'error') {
      return state.failValidation('invalidPropertyName', result.message, this._options?.validation);
    }

    return result;
  }

  /**
   * Finalizes any deferred conditional properties. If the only deferred property is
   * default, that property is emitted. Otherwise all matching properties are emitted.
   * @param finalized - The deferred properties to be considered for merge.
   * @param __state - The {@link Editor.JsonEditorState | editor state} for the object
   * being edited.
   */
  public finalizeProperties(
    finalized: JsonObject[],
    __state: JsonEditorState
  ): DetailedResult<JsonObject[], JsonEditFailureReason> {
    let toMerge = finalized;
    if (finalized.length > 1) {
      if (finalized.find((o) => o.matchType === 'match') !== undefined) {
        toMerge = finalized.filter((o) => o.matchType === 'match' || o.matchType === 'unconditional');
      }
    }
    return succeedWithDetail(toMerge.map((o) => o.value).filter(isJsonObject), 'edited');
  }

  /**
   * Determines if a given property key is conditional. Derived classes can override this
   * method to use a different format for conditional properties.
   * @param value - The {@link JsonValue | value} of the property to be considered.
   * @param state - The {@link Editor.JsonEditorState | editor state} for the object being edited.
   * @returns `Success` with detail `'deferred'` and a
   * {@link Editor.Rules.IConditionalJsonKeyResult | IConditionalJsonKeyResult} describing the
   * match for a default or matching conditional property.  Returns `Failure` with detail `'ignore'`
   * for a non-matching conditional property. Fails with detail `'error'` if an error occurs
   * or with detail `'inapplicable'` if the key does not represent a conditional property.
   * @public
   */
  protected _tryParseCondition(
    key: string,
    state: JsonEditorState
  ): DetailedResult<IConditionalJsonKeyResult, JsonPropertyEditFailureReason> {
    if (key.startsWith('?')) {
      // ignore everything after any #
      key = key.split('#')[0].trim();

      if (key === '?default') {
        return succeedWithDetail({ matchType: 'default' }, 'deferred');
      }

      const parts = key.substring(1).split(/(=|>=|<=|>|<|!=)/);
      if (parts.length === 3) {
        if (!this._compare(parts[0].trim(), parts[2].trim(), parts[1])) {
          return failWithDetail(`Condition ${key} does not match`, 'ignore');
        }
        return succeedWithDetail({ matchType: 'match' }, 'deferred');
      } else if (parts.length === 1) {
        if (parts[0].trim().length === 0) {
          return failWithDetail(`Condition ${key} does not match`, 'ignore');
        }
        return succeedWithDetail({ matchType: 'match' }, 'deferred');
      }
      const message = `Malformed condition token ${key}`;
      return state.failValidation('invalidPropertyName', message, this._options?.validation);
    } else if (this._options?.flattenUnconditionalValues !== false && key.startsWith('!')) {
      return succeedWithDetail({ matchType: 'unconditional' }, 'deferred');
    }
    return failWithDetail('inapplicable', 'inapplicable');
  }

  /**
   * Compares two strings using a supplied operator.
   * @param left - The first string to be compared.
   * @param right - The second string to be compared.
   * @param operator - The operator to be applied.
   * @returns `true` if the condition is met, `false` otherwise.
   * @internal
   */
  protected _compare(left: string, right: string, operator: string): boolean {
    switch (operator) {
      case '=':
        return left === right;
      case '>':
        return left > right;
      case '<':
        return left < right;
      case '>=':
        return left >= right;
      case '<=':
        return left <= right;
      case '!=':
        return left !== right;
    }
    /* c8 ignore next 2 - unreachable */
    return false;
  }
}
