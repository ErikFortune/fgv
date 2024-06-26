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
import { JsonValue } from '@fgv/ts-json-base';
import { DetailedResult } from '@fgv/ts-utils';
import { IJsonContext } from '../context';

/**
 * Possible `DetailedResult` details for various editor operations.
 * @public
 */
export type JsonEditFailureReason = 'ignore' | 'inapplicable' | 'edited' | 'error';

/**
 * Possible `DetailedResult` details for property edit operations.
 * @public
 */
export type JsonPropertyEditFailureReason = JsonEditFailureReason | 'deferred';

/**
 * Possible validation rules for a {@link JsonEditor | JsonEditor}.
 * @public
 */
export type JsonEditorValidationRules =
  | 'invalidPropertyName'
  | 'invalidPropertyValue'
  | 'undefinedPropertyValue';

/**
 * Validation options for a {@link JsonEditor | JsonEditor}.
 * @public
 */
export interface IJsonEditorValidationOptions {
  /**
   * If `onInvalidPropertyName` is `'error'` (default) then any property name
   * that is invalid after template rendering causes an error and stops
   * conversion.  If `onInvalidPropertyName` is `'ignore'`, then names which
   * are invalid after template rendering are passed through unchanged.
   */
  onInvalidPropertyName: 'error' | 'ignore';

  /**
   * If `onInvalidPropertyValue` is `'error'` (default) then any illegal
   * property value other than `undefined` causes an error and stops
   * conversion.  If `onInvalidPropertyValue` is `'ignore'` then any
   * invalid property values are silently ignored.
   */
  onInvalidPropertyValue: 'error' | 'ignore';

  /**
   * If `onUndefinedPropertyValue` is `'error'`, then any property with
   * value `undefined` will cause an error and stop conversion.  If
   * `onUndefinedPropertyValue` is `'ignore'` (default) then any
   * property with value `undefined` is silently ignored.
   */
  onUndefinedPropertyValue: 'error' | 'ignore';
}

/**
 * Initialization options for a {@link JsonEditor | JsonEditor}.
 * @public
 */
export interface IJsonEditorOptions {
  context?: IJsonContext;
  validation: IJsonEditorValidationOptions;
}

/**
 * A specialized JSON editor which does a deep clone of a supplied `JsonValue`.
 * @public
 */
export interface IJsonCloneEditor {
  /**
   * Returns a deep clone of a supplied `JsonValue`.
   * @param src - The `JsonValue` to be cloned.
   * @param context - An optional {@link IJsonContext | JSON context} used for clone
   * conversion operations.
   */
  clone(src: JsonValue, context?: IJsonContext): DetailedResult<JsonValue, JsonEditFailureReason>;
}
