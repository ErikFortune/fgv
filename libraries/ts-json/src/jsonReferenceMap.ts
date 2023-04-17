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
  mapResults,
  recordToMap,
  succeed,
  succeedWithDetail
} from '@fgv/ts-utils';

import { JsonObject, JsonValue, isJsonObject } from './common';
import { IJsonContext, IJsonReferenceMap, JsonReferenceMapFailureReason } from './jsonContext';
import { JsonEditor } from './jsonEditor/jsonEditor';

/**
 * @public
 */
export interface IReferenceMapKeyPolicyValidateOptions {
  makeValid?: boolean;
}

/**
 * Policy object responsible for validating or correcting
 * keys in a {@link IJsonReferenceMap | reference map}.
 * @public
 */
export class ReferenceMapKeyPolicy<T> {
  /**
   * @internal
   */
  protected readonly _defaultOptions?: IReferenceMapKeyPolicyValidateOptions;

  /**
   * @internal
   */
  protected readonly _isValid: (key: string, item?: T) => boolean;

  public constructor(
    options?: IReferenceMapKeyPolicyValidateOptions,
    isValid?: (key: string, item?: T) => boolean
  ) {
    this._defaultOptions = options;
    this._isValid = isValid ?? ReferenceMapKeyPolicy.defaultKeyPredicate;
  }

  public static defaultKeyPredicate(key: string): boolean {
    return key.length > 0 && !key.includes('{{') && !key.startsWith('?');
  }

  public isValid(key: string, item?: T): boolean {
    return this._isValid(key, item);
  }

  public validate(key: string, item?: T, __options?: IReferenceMapKeyPolicyValidateOptions): Result<string> {
    return this.isValid(key, item) ? succeed(key) : fail(`${key}: invalid key`);
  }

  public validateItems(
    items: [string, T][],
    options?: IReferenceMapKeyPolicyValidateOptions
  ): Result<[string, T][]> {
    return mapResults(
      items.map((item) => {
        return this.validate(...item, options).onSuccess((valid) => {
          return succeed([valid, item[1]]);
        });
      })
    );
  }

  public validateMap(
    map: Map<string, T>,
    options?: IReferenceMapKeyPolicyValidateOptions
  ): Result<Map<string, T>> {
    return this.validateItems(Array.from(map.entries()), options).onSuccess((valid) => {
      return captureResult(() => new Map(valid));
    });
  }
}

/**
 * @public
 */
export class PrefixKeyPolicy<T> extends ReferenceMapKeyPolicy<T> {
  public readonly prefix: string;

  public constructor(prefix: string, options?: IReferenceMapKeyPolicyValidateOptions) {
    super(options);
    this.prefix = prefix;
  }

  public isValid(key: string, __item?: T): boolean {
    return (
      key.startsWith(this.prefix) && key !== this.prefix && ReferenceMapKeyPolicy.defaultKeyPredicate(key)
    );
  }

  public validate(key: string, item?: T, options?: IReferenceMapKeyPolicyValidateOptions): Result<string> {
    // istanbul ignore next
    const makeValid = (options ?? this._defaultOptions)?.makeValid === true;
    if (this.isValid(key, item)) {
      return succeed(key);
    } else if (makeValid && ReferenceMapKeyPolicy.defaultKeyPredicate(key)) {
      return succeed(`${this.prefix}${key}`);
    }
    return fail(`${key}: invalid key`);
  }
}

/**
 * @public
 */
export type MapOrRecord<T> = Map<string, T> | Record<string, T>;

/**
 * Abstract base class with common functionality for simple
 * {@link IJsonReferenceMap | reference map} implementations.
 * {@link JsonValue | json values}.
 * @public
 */
export abstract class SimpleJsonMapBase<T> implements IJsonReferenceMap {
  /**
   * @internal
   */
  protected readonly _keyPolicy: ReferenceMapKeyPolicy<T>;

  /**
   * @internal
   */
  protected readonly _values: Map<string, T>;

  /**
   * @internal
   */
  protected readonly _context?: IJsonContext;

  /**
   *
   * @param values -
   * @param context -
   * @param keyPolicy -
   * @internal
   */
  protected constructor(
    values?: MapOrRecord<T>,
    context?: IJsonContext,
    keyPolicy?: ReferenceMapKeyPolicy<T>
  ) {
    values = SimpleJsonMapBase._toMap(values).orThrow();
    this._keyPolicy = keyPolicy ?? new ReferenceMapKeyPolicy();
    this._values = this._keyPolicy.validateMap(values).orThrow();
    this._context = context;
  }

  /**
   *
   * @param values -
   * @returns
   * @internal
   */
  protected static _toMap<T>(values?: MapOrRecord<T>): Result<Map<string, T>> {
    if (values === undefined) {
      return captureResult(() => new Map<string, T>());
    } else if (!(values instanceof Map)) {
      return recordToMap(values, (__k, v) => succeed(v));
    }
    return succeed(values);
  }

  /**
   * Determine if a key might be valid for this map but does not determine if key actually
   * exists. Allows key range to be constrained.
   * @param key - key to be tested
   * @returns `true` if the key is in the valid range, `false` otherwise.
   */
  public keyIsInRange(key: string): boolean {
    return this._keyPolicy.isValid(key);
  }

  /**
   * Determines if an object with the specified key actually exists in the map.
   * @param key - key to be tested
   * @returns `true` if an object with the specified key exists, `false` otherwise.
   */
  public has(key: string): boolean {
    return this._values.has(key);
  }

  /**
   * Gets a {@link JsonObject | JSON object} specified by key.
   * @param key - key of the object to be retrieved
   * @param context - optional {@link IJsonContext | JSON context} used to format the
   * returned object.
   * @returns {@link ts-utils#Success | `Success`} with the formatted object if successful.
   * {@link ts-utils#Failure | `Failure`} with detail 'unknown' if no such object exists,
   * or {@link ts-utils#Failure | `Failure`} with detail 'error' if the object was found
   * but could not be formatted.
   */
  public getJsonObject(
    key: string,
    context?: IJsonContext
  ): DetailedResult<JsonObject, JsonReferenceMapFailureReason> {
    return this.getJsonValue(key, context).onSuccess((jv) => {
      if (!isJsonObject(jv)) {
        return failWithDetail(`${key}: not an object`, 'error');
      }
      return succeedWithDetail(jv);
    });
  }

  /**
   * Gets a {@link JsonValue | JSON value} specified by key.
   * @param key - key of the value to be retrieved
   * @param context - Optional {@link IJsonContext | JSON context} used to format the value
   * @returns Success with the formatted object if successful. Failure with detail 'unknown'
   * if no such object exists, or failure with detail 'error' if the object was found but
   * could not be formatted.
   */
  // eslint-disable-next-line no-use-before-define
  public abstract getJsonValue(
    key: string,
    context?: IJsonContext
  ): DetailedResult<JsonValue, JsonReferenceMapFailureReason>;
}

/**
 * Initialization options for a {@link SimpleJsonMap | SimpleJsonMap}.
 * @public
 */
export interface ISimpleJsonMapOptions {
  keyPolicy?: ReferenceMapKeyPolicy<JsonValue>;
  editor?: JsonEditor;
}

/**
 * A {@link SimpleJsonMap | SimpleJsonMap } presents a view of a simple map
 * of {@link JsonValue | JSON values}.
 * @public
 */
export class SimpleJsonMap extends SimpleJsonMapBase<JsonValue> {
  /**
   * @internal
   */
  protected _editor?: JsonEditor;

  /**
   *
   * @param values -
   * @param context -
   * @param options -
   * @internal
   */
  protected constructor(
    values?: MapOrRecord<JsonValue>,
    context?: IJsonContext,
    options?: ISimpleJsonMapOptions
  ) {
    super(values, context, options?.keyPolicy);
    this._editor = options?.editor;
  }

  /**
   * Creates a new {@link SimpleJsonMap | SimpleJsonMap} from the supplied objects
   * @param values - A string-keyed `Map` or `Record` of the {@link JsonValue | JSON values}
   * to be returned.
   * @param context - Optional {@link IJsonContext | IJsonContext} used to format returned values.
   * @param options - Optional {@link ISimpleJsonMapOptions | ISimpleJsonMapOptions} for initialization.
   */
  public static createSimple(
    values?: MapOrRecord<JsonValue>,
    context?: IJsonContext,
    options?: ISimpleJsonMapOptions
  ): Result<SimpleJsonMap> {
    return captureResult(() => new SimpleJsonMap(values, context, options));
  }

  /**
   * Gets a {@link JsonValue | JSON value} specified by key.
   * @param key - key of the value to be retrieved
   * @param context - Optional {@link IJsonContext | JSON context} used to format the value
   * @returns Success with the formatted object if successful. Failure with detail 'unknown'
   * if no such object exists, or failure with detail 'error' if the object was found but
   * could not be formatted.
   */
  public getJsonValue(
    key: string,
    context?: IJsonContext
  ): DetailedResult<JsonValue, JsonReferenceMapFailureReason> {
    context = context ?? this._context;
    const value = this._values.get(key);
    if (!value) {
      return failWithDetail(`${key}: JSON value not found`, 'unknown');
    }
    return this._clone(value, context);
  }

  /**
   * @internal
   */
  protected _clone(
    value: JsonValue,
    context?: IJsonContext
  ): DetailedResult<JsonValue, JsonReferenceMapFailureReason> {
    if (!this._editor) {
      const result = JsonEditor.create();
      // istanbul ignore next: nearly impossible to reproduce
      if (result.isFailure()) {
        return failWithDetail(result.message, 'error');
      }
      this._editor = result.value;
    }
    return this._editor.clone(value, context).withFailureDetail('error');
  }
}

/**
 * Initialization options for a {@link PrefixedJsonMap | PrefixedJsonMap}
 * @public
 */
export interface IKeyPrefixOptions {
  /**
   * Indicates whether the prefix should be added automatically as needed (default true)
   */
  addPrefix?: boolean;

  /**
   * The prefix to be enforced
   */
  prefix: string;
}

/**
 * A {@link PrefixedJsonMap | PrefixedJsonMap} enforces a supplied prefix for all contained values,
 * optionally adding the prefix as necessary (default `true`).
 * @public
 */
export class PrefixedJsonMap extends SimpleJsonMap {
  /**
   *
   * @param values -
   * @param context -
   * @param options-
   * @internal
   */
  protected constructor(
    values?: MapOrRecord<JsonValue>,
    context?: IJsonContext,
    options?: ISimpleJsonMapOptions
  ) {
    super(values, context, options);
  }

  /**
   * Creates a new @see PrefixedJsonMap from the supplied values
   * @param prefix - A string prefix to be enforced for and added to key names as necessary
   * @param values - A string-keyed Map or Record of the @see JsonValue to be returned
   * @param context - Optional @see IJsonContext used to format returned values
   * @param editor - Optional @see JsonEditor used to format returned values
   */
  public static createPrefixed(
    prefix: string,
    values?: MapOrRecord<JsonValue>,
    context?: IJsonContext,
    editor?: JsonEditor
  ): Result<PrefixedJsonMap>;

  /**
   * Creates a new @see PrefixedJsonMap from the supplied values
   * @param prefixOptions - A KeyPrefixOptions indicating the prefix to enforce and whether that prefix should
   * be added automatically if necessary (default true)
   * @param values - A string-keyed Map or record of the @see JsonValue to be returned
   * @param context - Optional @see IJsonContext used to format returned values
   * @param editor - Optional @see JsonEditor used to format returned values
   */
  public static createPrefixed(
    prefixOptions: IKeyPrefixOptions,
    values?: MapOrRecord<JsonValue>,
    context?: IJsonContext,
    editor?: JsonEditor
  ): Result<PrefixedJsonMap>;
  public static createPrefixed(
    prefixOptions: string | IKeyPrefixOptions,
    values?: MapOrRecord<JsonValue>,
    context?: IJsonContext,
    editor?: JsonEditor
  ): Result<PrefixedJsonMap> {
    return captureResult(
      () => new PrefixedJsonMap(values, context, { keyPolicy: this._toPolicy(prefixOptions), editor })
    );
  }

  /**
   *
   * @param prefixOptions -
   * @returns
   * @internal
   */
  protected static _toPolicy(prefixOptions: string | IKeyPrefixOptions): ReferenceMapKeyPolicy<JsonValue> {
    if (typeof prefixOptions === 'string') {
      return new PrefixKeyPolicy(prefixOptions, { makeValid: true });
    }
    return new PrefixKeyPolicy(prefixOptions.prefix, { makeValid: prefixOptions.addPrefix !== false });
  }
}
