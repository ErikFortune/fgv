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

import {
  JsonArray,
  JsonObject,
  JsonValue,
  isJsonArray,
  isJsonObject,
  isJsonPrimitive
} from '@fgv/ts-json-base';
import { IJsonContext } from '../context';
import {
  IJsonCloneEditor,
  IJsonEditorMergeOptions,
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
   * Default singleton {@link JsonEditor | JsonEditor}.
   * @internal
   */
  protected static _default?: JsonEditor;

  /**
   * Full set of {@link IJsonEditorOptions | editor options} in effect for this editor.
   */
  public options: IJsonEditorOptions;

  /**
   * The set of {@link IJsonEditorRule | editor rules} applied by this editor.
   * @internal
   */
  protected _rules: IJsonEditorRule[];

  /**
   * Protected constructor for {@link JsonEditor | JsonEditor} and derived classes.
   * External consumers should instantiate via the {@link JsonEditor.create | create static method}.
   * @param options - Optional partial {@link IJsonEditorOptions | editor options} for the
   * constructed editor.
   * @param rules - Any {@link IJsonEditorRule | editor rules} to be applied by the editor.
   * @internal
   */
  protected constructor(options?: Partial<IJsonEditorOptions>, rules?: IJsonEditorRule[]) {
    this.options = JsonEditor._getDefaultOptions(options).orThrow();
    this._rules = rules || JsonEditor.getDefaultRules(this.options).orThrow();
  }

  /**
   * Default singleton {@link JsonEditor | JsonEditor} for simple use. Applies all rules
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
   * Constructs a new {@link JsonEditor | JsonEditor}.
   * @param options - Optional partial {@link IJsonEditorOptions | editor options} for the
   * constructed editor.
   * @param rules - Optional set of {@link IJsonEditorRule | editor rules} to be applied by the editor.
   * @readonly A new {@link JsonEditor | JsonEditor}.
   */
  public static create(options?: Partial<IJsonEditorOptions>, rules?: IJsonEditorRule[]): Result<JsonEditor> {
    return captureResult(() => new JsonEditor(options, rules));
  }

  /**
   * Gets the default set of rules to be applied for a given set of options.
   * By default, all available rules (templates, conditionals, multi-value and references)
   * are applied.
   * @param options - Optional partial {@link IJsonEditorOptions | editor options} for
   * all rules.
   * @returns Default {@link IJsonEditorRule | editor rules} with any supplied options
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
   * Creates a complete IJsonEditorOptions object from partial options, filling in
   * default values for any missing properties. This ensures all editor instances
   * have consistent, complete configuration including validation rules and merge behavior.
   * @param options - Optional partial editor options to merge with defaults
   * @returns Success with complete editor options, or Failure if validation fails
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
    let merge: IJsonEditorMergeOptions | undefined = options?.merge;
    if (merge === undefined) {
      merge = {
        arrayMergeBehavior: 'append',
        nullAsDelete: false
      };
    } else {
      merge = {
        arrayMergeBehavior: merge.arrayMergeBehavior,
        nullAsDelete: merge.nullAsDelete ?? false
      };
    }
    return succeed({ context, validation, merge });
  }

  /**
   * Merges a supplied source object into a supplied target, updating the target object.
   * @param target - The target `JsonObject` to be updated
   * @param src - The source `JsonObject` to be merged
   * @param runtimeContext - An optional {@link IJsonContext | IJsonContext} supplying variables
   * and references.
   * @returns `Success` with the original source `JsonObject` if merge was successful.
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
   * @param target - The target `JsonObject` to be updated
   * @param srcObjects - `JsonObject`s to be merged into the target object, in the order
   * supplied.
   * @returns `Success` with the original source `JsonObject` if merge was successful.
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
   * @param base - The base `JsonObject` to be updated
   * @param srcObjects - Objects to be merged into the target object, in the order supplied.
   * @returns `Success` with the original source `JsonObject` if merge was successful.
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
   * Deep clones a supplied `JsonValue`, applying all editor rules and a default
   * or optionally supplied context
   * @param src - The `JsonValue` to be cloned.
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
      return this._cloneObjectWithoutNullAsDelete({}, value, state);
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
   * Merges properties from a source object into a target object, applying editor rules and
   * null-as-delete logic. This is the core merge implementation that handles property-by-property
   * merging with rule processing and deferred property handling.
   * @param target - The target object to merge properties into
   * @param src - The source object containing properties to merge
   * @param state - The editor state containing options and context
   * @returns Success with the modified target object, or Failure with error details
   * @internal
   */
  protected _mergeObjectInPlace(
    target: JsonObject,
    src: JsonObject,
    state: JsonEditorState
  ): Result<JsonObject> {
    for (const key in src) {
      if (src.hasOwnProperty(key)) {
        // Skip dangerous property names to prevent prototype pollution
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
          continue;
        }
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
   * Creates a deep clone of a JSON array by recursively cloning each element.
   * Each array element is cloned using the main clone method, preserving the
   * editor's rules and validation settings.
   * @param src - The source JSON array to clone
   * @param context - Optional JSON context for cloning operations
   * @returns Success with the cloned array, or Failure with error details
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
   * Merges a single cloned property value into a target object. This method handles
   * the core merge logic including null-as-delete behavior, array merging, and
   * recursive object merging. The null-as-delete check occurs before primitive
   * handling to ensure null values can signal property deletion.
   * @param target - The target object to merge the property into
   * @param key - The property key being merged
   * @param newValue - The cloned value to merge (from source object)
   * @param state - The editor state containing merge options and context
   * @returns Success with the merged value, or Failure with error details
   * @internal
   */
  protected _mergeClonedProperty(
    target: JsonObject,
    key: string,
    newValue: JsonValue,
    state: JsonEditorState
  ): DetailedResult<JsonValue, JsonEditFailureReason> {
    // Skip dangerous property names to prevent prototype pollution
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      return succeedWithDetail(newValue, 'edited');
    }

    const existing = target[key];

    // Handle null-as-delete behavior before primitive check
    /* c8 ignore next 1 - ? is defense in depth */
    if (newValue === null && state.options.merge?.nullAsDelete === true) {
      delete target[key];
      return succeedWithDetail(null, 'edited');
    }

    // merge is called right after clone so this should never happen
    // since clone itself will have failed

    if (isJsonPrimitive(newValue)) {
      target[key] = newValue;
      return succeedWithDetail(newValue, 'edited');
    }

    if (isJsonObject(newValue)) {
      if (isJsonObject(existing)) {
        return this.mergeObjectInPlace(existing, newValue, state.context).withFailureDetail('error');
      }
      target[key] = newValue;
      return succeedWithDetail(newValue, 'edited');
    }

    /* c8 ignore else */
    if (isJsonArray(newValue)) {
      if (isJsonArray(existing)) {
        /* c8 ignore next 1 - ?? is defense in depth */
        const arrayMergeBehavior = state.options.merge?.arrayMergeBehavior ?? 'append';
        switch (arrayMergeBehavior) {
          case 'append':
            target[key] = existing.concat(...newValue);
            break;
          case 'replace':
            target[key] = newValue;
            break;
          /* c8 ignore next 2 - exhaustive switch for ArrayMergeBehavior type */
          default:
            return failWithDetail(`Invalid array merge behavior: ${arrayMergeBehavior as string}`, 'error');
        }
        return succeedWithDetail(target[key], 'edited');
      }
      target[key] = newValue;
      return succeedWithDetail(newValue, 'edited');
    }
    /* c8 ignore start */
    return failWithDetail(`Invalid JSON: ${JSON.stringify(newValue)}`, 'error');
  } /* c8 ignore stop */

  /**
   * Applies editor rules to a single property during merge operations. This method
   * iterates through all configured editor rules to process the property, handling
   * templates, conditionals, multi-value properties, and references.
   * @param key - The property key to edit
   * @param value - The property value to edit
   * @param state - The editor state containing rules and context
   * @returns Success with transformed property object, or Failure if rules cannot process
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
   * Applies editor rules to a single JSON value during clone operations. This method
   * iterates through all configured editor rules to process the value, handling
   * templates, conditionals, multi-value expressions, and references.
   * @param value - The JSON value to edit and transform
   * @param state - The editor state containing rules and context
   * @returns Success with transformed value, or Failure if rules cannot process
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
   * Clone an object without applying null-as-delete behavior.
   * This preserves null values during cloning so they can be used for deletion signaling during merge.
   * @param target - The target object to clone into
   * @param src - The source object to clone
   * @param state - The editor state
   * @returns The cloned object
   * @internal
   */
  protected _cloneObjectWithoutNullAsDelete(
    target: JsonObject,
    src: JsonObject,
    state: JsonEditorState
  ): DetailedResult<JsonObject, JsonEditFailureReason> {
    // Temporarily disable null-as-delete during cloning
    const modifiedOptions: IJsonEditorOptions = {
      context: state.options.context,
      validation: state.options.validation,
      merge: {
        /* c8 ignore next 1 - ? is defense in depth */
        arrayMergeBehavior: state.options.merge?.arrayMergeBehavior ?? 'append',
        nullAsDelete: false
      }
    };
    const modifiedState = new JsonEditorState(state.editor, modifiedOptions, state.context);

    return this._mergeObjectInPlace(target, src, modifiedState)
      .onSuccess((merged) => {
        return this._finalizeAndMerge(merged, modifiedState);
      })
      .withFailureDetail('error');
  }

  /**
   * Finalizes the merge operation by processing any deferred properties and merging
   * them into the target object. Deferred properties are those that require special
   * processing after the initial merge phase, such as references that depend on
   * other properties being resolved first.
   * @param target - The target object that has been merged
   * @param state - The editor state containing deferred properties and rules
   * @returns Success with the finalized target object, or Failure with error details
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
