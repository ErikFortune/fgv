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

import { JsonObject, JsonValue } from '@fgv/ts-json-base';
import { DetailedResult, failWithDetail } from '@fgv/ts-utils';
import { JsonEditFailureReason, JsonPropertyEditFailureReason } from './common';

import { JsonEditorState } from './jsonEditorState';

/**
 * An {@link Editor.IJsonEditorRule | IJsonEditorRule} represents a single configurable
 * rule to be applied by a {@link Editor.JsonEditor | JsonEditor}.
 * @public
 */
export interface IJsonEditorRule {
  /**
   * Called by a {@link Editor.JsonEditor | JsonEditor} to possibly edit one of the properties being
   * merged into a target object.
   * @param key - The key of the property to be edited.
   * @param value - The {@link JsonValue | value} of the property to be edited.
   * @param state - {@link Editor.JsonEditorState | Editor state} which applies to the edit.
   * @returns If the property was edited, returns `Success` with a {@link JsonObject | JsonObject} containing
   * the edited results and with detail `'edited'`. If this property should be deferred for later consideration
   * or merge, `Success` with detail `'deferred'` and a {@link JsonObject | JsonObject} to be finalized.  If
   * the rule does not affect this property, returns `Failure` with detail `'inapplicable'`. If an error occurred
   * while processing the error, returns `Failure` with detail `'error'`.
   */
  editProperty(
    key: string,
    value: JsonValue,
    state: JsonEditorState
  ): DetailedResult<JsonObject, JsonPropertyEditFailureReason>;

  /**
   * Called by a {@link Editor.JsonEditor | JsonEditor} to possibly edit a property value or array element.
   * @param value - The {@link JsonValue | value} of the property to be edited.
   * @param state - {@link Editor.JsonEditorState | Editor state} which applies to the edit.
   * @returns Returns `Success` with the {@link JsonValue | JsonValue} to be inserted, with detail `'edited'` if
   * the value was edited.  Returns `Failure` with `'inapplicable'` if the rule does not affect this value.
   * Fails with detail `'ignore'` if the value is to be ignored, or with `'error'` if an error occurs.
   */
  editValue(value: JsonValue, state: JsonEditorState): DetailedResult<JsonValue, JsonEditFailureReason>;

  /**
   * Called for each rule after all properties have been merged.  Any properties that were deferred
   * during the initial edit pass are supplied as input.
   * @param deferred - Any {@link JsonObject | objects} that were deferred during the first edit pass.
   * @param state - {@link Editor.JsonEditorState | Editor state} which applies to the edit.
   * @returns On `Success` return, any returned objects are merged in order and finalization
   * is stopped. Finalization is also stopped on `Failure` with detail `'ignore'`. On `Failure`
   * with detail `'inapplicable'`, finalization continues with the next rule. Fails with an
   * error detail `'error'` and an informative message if an error occurs.
   */
  finalizeProperties(
    deferred: JsonObject[],
    state: JsonEditorState
  ): DetailedResult<JsonObject[], JsonEditFailureReason>;
}

/**
 * Default base implementation of {@link Editor.IJsonEditorRule | IJsonEditorRule} returns inapplicable for all operations so that
 * derived classes need only implement the operations they actually support.
 * @public
 */
export class JsonEditorRuleBase implements IJsonEditorRule {
  /**
   * {@inheritdoc Editor.IJsonEditorRule.editProperty}
   */
  /* c8 ignore start */
  public editProperty(
    __key: string,
    __value: JsonValue,
    __state: JsonEditorState
  ): DetailedResult<JsonObject, JsonPropertyEditFailureReason> {
    return failWithDetail('inapplicable', 'inapplicable');
  }
  /* c8 ignore stop */

  /**
   * {@inheritdoc Editor.IJsonEditorRule.editValue}
   */
  public editValue(
    __value: JsonValue,
    __state: JsonEditorState
  ): DetailedResult<JsonValue, JsonEditFailureReason> {
    return failWithDetail('inapplicable', 'inapplicable');
  }

  /**
   * {@inheritdoc Editor.IJsonEditorRule.finalizeProperties}
   */
  public finalizeProperties(
    __deferred: JsonObject[],
    __state: JsonEditorState
  ): DetailedResult<JsonObject[], JsonEditFailureReason> {
    return failWithDetail('inapplicable', 'inapplicable');
  }
}
