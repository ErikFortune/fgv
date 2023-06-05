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

import {
  DetailedResult,
  Result,
  captureResult,
  fail,
  failWithDetail,
  mapDetailedResults,
  mapResults,
  succeed,
  succeedWithDetail
} from '@fgv/ts-utils';
import {
  ConditionalJsonEditorRule,
  MultiValueJsonEditorRule,
  ReferenceJsonEditorRule,
  TemplatedJsonEditorRule
} from './rules';

import { IJsonContext } from '../context';
import { JsonArray, JsonObject, JsonValue, isJsonArray, isJsonObject, isJsonPrimitive } from '../json';
import {
  IJsonCloneEditor,
  IJsonEditorOptions,
  IJsonEditorValidationOptions,
  JsonEditFailureReason,
  JsonPropertyEditFailureReason
} from './common';

import { IJsonEditorRule } from './jsonEditorRule';
import { JsonEditorState } from './jsonEditorState';

/**
 * A {@link JsonEditor | JsonEditor} can be used to edit JSON objects in place or to
 * clone any JSON value, applying a default context and optional set of editor rules that
 * were supplied at initialization.
 * @public
 */
export class JsonEditor implements IJsonCloneEditor {
  /**
   * Default singleton {@link Editor.JsonEditor | JsonEditor}.
   * @internal
   */
  protected static _default?: JsonEditor;

  /**
   * Full set of {@link Editor.IJsonEditorOptions | editor options} in effect for this editor.
   */
  public options: IJsonEditorOptions;

  /**
   * The set of {@link Editor.IJsonEditorRule | editor rules} applied by this editor.
   * @internal
   */
  protected _rules: IJsonEditorRule[];

  /**
   * Protected constructor for {@link Editor.JsonEditor | JsonEditor} and derived classes.
   * External consumers should instantiate via the {@link Editor.JsonEditor.create | create static method}.
   * @param options - Optional partial {@link Editor.IJsonEditorOptions | editor options} for the
   * constructed editor.
   * @param rules - Any {@link Editor.IJsonEditorRule | editor rules} to be applied by the editor.
   * @internal
   */
  protected constructor(options?: Partial<IJsonEditorOptions>, rules?: IJsonEditorRule[]) {
    this.options = JsonEditor._getDefaultOptions(options).orThrow();
    this._rules = rules || JsonEditor.getDefaultRules(this.options).orThrow();
  }

  /**
   * Default singleton {@link Editor.JsonEditor | JsonEditor} for simple use. Applies all rules
   * but with no default context.
   */
  public static get default(): JsonEditor {
    if (!JsonEditor._default) {
      const rules = this.getDefaultRules().orDefault();
      JsonEditor._default = new JsonEditor(undefined, rules);
    }
    return JsonEditor._default;
  }

  /**
   * Constructs a new {@link Editor.JsonEditor | JsonEditor}.
   * @param options - Optional partial {@link Editor.IJsonEditorOptions | editor options} for the
   * constructed editor.
   * @param rules - Optional set of {@link Editor.IJsonEditorRule | editor rules} to be applied by the editor.
   * @readonly A new {@link Editor.JsonEditor | JsonEditor}.
   */
  public static create(options?: Partial<IJsonEditorOptions>, rules?: IJsonEditorRule[]): Result<JsonEditor> {
    return captureResult(() => new JsonEditor(options, rules));
  }

  /**
   * Gets the default set of rules to be applied for a given set of options.
   * By default, all available rules (templates, conditionals, multi-value and references)
   * are applied.
   * @param options - Optional partial {@link Editor.IJsonEditorOptions | editor options} for
   * all rules.
   * @returns Default {@link Editor.IJsonEditorRule | editor rules} with any supplied options
   * applied.
   */
  public static getDefaultRules(options?: IJsonEditorOptions): Result<IJsonEditorRule[]> {
    return mapResults<IJsonEditorRule>([
      TemplatedJsonEditorRule.create(options),
      ConditionalJsonEditorRule.create(options),
      MultiValueJsonEditorRule.create(options),
      ReferenceJsonEditorRule.create(options)
    ]);
  }

  /**
   * @internal
   */
  protected static _getDefaultOptions(options?: Partial<IJsonEditorOptions>): Result<IJsonEditorOptions> {
    const context: IJsonContext | undefined = options?.context;
    let validation: IJsonEditorValidationOptions | undefined = options?.validation;
    if (validation === undefined) {
      validation = {
        onInvalidPropertyName: 'error',
        onInvalidPropertyValue: 'error',
        onUndefinedPropertyValue: 'ignore'
      };
    }
    return succeed({ context, validation });
  }

  /**
   * Merges a supplied source object into a supplied target, updating the target object.
   * @param target - The target {@link JsonObject | object} to be updated
   * @param src - The source {@link JsonObject | object} to be merged
   * @param runtimeContext - An optional {@link IJsonContext | IJsonContext} supplying variables
   * and references.
   * @returns `Success` with the original source {@link JsonObject | object} if merge was successful.
   * Returns `Failure` with details if an error occurs.
   */
  public mergeObjectInPlace(
    target: JsonObject,
    src: JsonObject,
    runtimeContext?: IJsonContext
  ): Result<JsonObject> {
    const state = new JsonEditorState(this, this.options, runtimeContext);
    return this._mergeObjectInPlace(target, src, state).onSuccess((merged) => {
      return this._finalizeAndMerge(merged, state);
    });
  }

  /**
   * Merges multiple supplied source objects into a supplied target, updating the target
   * object and using the default context supplied at creation time.
   * @param target - The target {@link JsonObject | object} to be updated
   * @param srcObjects - {@link JsonObject | Objects} to be merged into the target object, in the order
   * supplied.
   * @returns `Success` with the original source {@link JsonObject | object} if merge was successful.
   * Returns `Failure` with details if an error occurs.
   */
  public mergeObjectsInPlace(target: JsonObject, srcObjects: JsonObject[]): Result<JsonObject> {
    return this.mergeObjectsInPlaceWithContext(this.options.context, target, srcObjects);
  }

  /**
   * Merges multiple supplied source objects into a supplied target, updating the target
   * object and using an optional {@link IJsonContext | context} supplied in the call.
   * @param context - An optional {@link IJsonContext | IJsonContext} supplying variables and
   * references.
   * @param base - The base {@link JsonObject | object} to be updated
   * @param srcObjects - Objects to be merged into the target object, in the order supplied.
   * @returns `Success` with the original source {@link JsonObject | object} if merge was successful.
   * Returns `Failure` with details if an error occurs.
   */
  public mergeObjectsInPlaceWithContext(
    context: IJsonContext | undefined,
    base: JsonObject,
    srcObjects: JsonObject[]
  ): Result<JsonObject> {
    for (const src of srcObjects) {
      const mergeResult = this.mergeObjectInPlace(base, src, context);
      if (mergeResult.isFailure()) {
        return mergeResult.withFailureDetail('error');
      }
    }
    return succeedWithDetail(base);
  }

  /**
   * Deep clones a supplied {@link JsonValue | JSON value}, applying all editor rules and a default
   * or optionally supplied context
   * @param src - The {@link JsonValue | JsonValue} to be cloned.
   * @param context - An optional {@link IJsonContext | JSON context} supplying variables and references.
   */
  public clone(src: JsonValue, context?: IJsonContext): DetailedResult<JsonValue, JsonEditFailureReason> {
    const state = new JsonEditorState(this, this.options, context);
    let value = src;
    let valueResult = this._editValue(src, state);

    while (valueResult.isSuccess()) {
      value = valueResult.value;
      valueResult = this._editValue(value, state);
    }

    if (valueResult.detail === 'error' || valueResult.detail === 'ignore') {
      return valueResult;
    }

    if (isJsonPrimitive(value) || value === null) {
      return succeedWithDetail(value, 'edited');
    } else if (isJsonObject(value)) {
      return this.mergeObjectInPlace({}, value, state.context).withFailureDetail('error');
    } else if (isJsonArray(value)) {
      return this._cloneArray(value, state.context);
    } else if (value === undefined) {
      return state.failValidation('undefinedPropertyValue');
    }
    return state.failValidation(
      'invalidPropertyValue',
      `Cannot convert invalid JSON: "${JSON.stringify(value)}"`
    );
  }

  /**
   *
   * @param target -
   * @param src -
   * @param state -
   * @returns
   * @internal
   */
  protected _mergeObjectInPlace(
    target: JsonObject,
    src: JsonObject,
    state: JsonEditorState
  ): Result<JsonObject> {
    for (const key in src) {
      if (src.hasOwnProperty(key)) {
        const propResult = this._editProperty(key, src[key], state);
        if (propResult.isSuccess()) {
          if (propResult.detail === 'deferred') {
            state.defer(propResult.value);
          } else {
            const mergeResult = this._mergeObjectInPlace(target, propResult.value, state);
            if (mergeResult.isFailure()) {
              return mergeResult;
            }
          }
        } else if (propResult.detail === 'inapplicable') {
          const valueResult = this.clone(src[key], state.context).onSuccess((cloned) => {
            return this._mergeClonedProperty(target, key, cloned, state);
          });

          if (valueResult.isFailure() && valueResult.detail === 'error') {
            return fail(`${key}: ${valueResult.message}`);
          }
        } else if (propResult.detail !== 'ignore') {
          return fail(`${key}: ${propResult.message}`);
        }
      } else {
        return fail(`${key}: Cannot merge inherited properties`);
      }
    }
    return succeed(target);
  }

  /**
   *
   * @param src -
   * @param context -
   * @returns
   * @internal
   */
  protected _cloneArray(
    src: JsonArray,
    context?: IJsonContext
  ): DetailedResult<JsonArray, JsonEditFailureReason> {
    const results = src.map((v) => {
      return this.clone(v, context);
    });

    return mapDetailedResults<JsonValue, JsonEditFailureReason>(results, ['ignore'])
      .onSuccess((converted) => {
        return succeed(converted);
      })
      .withFailureDetail('error');
  }

  /**
   *
   * @param target -
   * @param key -
   * @param newValue -
   * @param state -
   * @returns
   * @internal
   */
  protected _mergeClonedProperty(
    target: JsonObject,
    key: string,
    newValue: JsonValue,
    state: JsonEditorState
  ): DetailedResult<JsonValue, JsonEditFailureReason> {
    const existing = target[key];

    // merge is called right after clone so this should never happen
    // since clone itself will have failed
    // istanbul ignore else
    if (isJsonPrimitive(newValue)) {
      target[key] = newValue;
      return succeedWithDetail(newValue, 'edited');
    } else if (isJsonObject(newValue)) {
      if (isJsonObject(existing)) {
        return this.mergeObjectInPlace(existing, newValue, state.context).withFailureDetail('error');
      }
      target[key] = newValue;
      return succeedWithDetail(newValue, 'edited');
    } else if (isJsonArray(newValue)) {
      if (isJsonArray(existing)) {
        target[key] = existing.concat(...newValue);
        return succeedWithDetail(target[key], 'edited');
      }
      target[key] = newValue;
      return succeedWithDetail(newValue, 'edited');
    } else {
      return failWithDetail(`Invalid JSON: ${JSON.stringify(newValue)}`, 'error');
    }
  }

  /**
   *
   * @param key -
   * @param value -
   * @param state -
   * @returns
   * @internal
   */
  protected _editProperty(
    key: string,
    value: JsonValue,
    state: JsonEditorState
  ): DetailedResult<JsonObject, JsonPropertyEditFailureReason> {
    for (const rule of this._rules) {
      const ruleResult = rule.editProperty(key, value, state);
      if (ruleResult.isSuccess() || ruleResult.detail !== 'inapplicable') {
        return ruleResult;
      }
    }
    return failWithDetail('inapplicable', 'inapplicable');
  }

  /**
   *
   * @param value -
   * @param state -
   * @returns
   * @internal
   */
  protected _editValue(
    value: JsonValue,
    state: JsonEditorState
  ): DetailedResult<JsonValue, JsonEditFailureReason> {
    for (const rule of this._rules) {
      const ruleResult = rule.editValue(value, state);
      if (ruleResult.isSuccess() || ruleResult.detail !== 'inapplicable') {
        return ruleResult;
      }
    }
    return failWithDetail('inapplicable', 'inapplicable');
  }

  /**
   *
   * @param target -
   * @param state -
   * @returns
   * @internal
   */
  protected _finalizeAndMerge(
    target: JsonObject,
    state: JsonEditorState
  ): DetailedResult<JsonObject, JsonEditFailureReason> {
    const deferred = state.deferred;
    if (deferred.length > 0) {
      for (const rule of this._rules) {
        const ruleResult = rule.finalizeProperties(deferred, state);
        if (ruleResult.isSuccess()) {
          return this.mergeObjectsInPlaceWithContext(
            state.context,
            target,
            ruleResult.value
          ).withFailureDetail('error');
        } else if (ruleResult.detail === 'ignore') {
          succeedWithDetail(target, 'edited');
        } else if (ruleResult.detail !== 'inapplicable') {
          return failWithDetail(ruleResult.message, ruleResult.detail);
        }
      }
    }
    return succeedWithDetail(target, 'edited');
  }
}
