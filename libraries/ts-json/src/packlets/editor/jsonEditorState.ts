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

import { DetailedFailure, Result, failWithDetail, succeed } from '@fgv/ts-utils';
import { IJsonContext, IJsonReferenceMap, JsonContextHelper, TemplateVars, VariableValue } from '../context';
import { JsonObject } from '../json';
import {
  IJsonCloneEditor,
  IJsonEditorOptions,
  IJsonEditorValidationOptions,
  JsonEditFailureReason,
  JsonEditorValidationRules,
  JsonPropertyEditFailureReason
} from './common';

/**
 * Represents the internal state of a {@link Editor.JsonEditor | JsonEditor}.
 * @public
 */
export class JsonEditorState {
  /**
   * Static global counter used to assign each {@link Editor.JsonEditorState | JsonEditorState}
   * a unique identifier.
   * @internal
   */
  protected static _nextId: number = 0;

  /**
   * The {@link Editor.IJsonCloneEditor | editor} for which this state applies.
   */
  public readonly editor: IJsonCloneEditor;

  /**
   * Fully resolved {@link Editor.IJsonEditorOptions | editor options} that apply
   * to the operation for which this state applies.
   */
  public readonly options: IJsonEditorOptions;

  /**
   * Any deferred {@link JsonObject | objects} to be merged during finalization.
   * @internal
   */
  protected readonly _deferred: JsonObject[] = [];

  /**
   * Unique global identifier for this {@link Editor.JsonEditorState | state object}.
   * @internal
   */
  protected readonly _id: number;

  /**
   * Constructs a new {@link Editor.JsonEditorState | JsonEditorState}.
   * @param editor - The {@link Editor.IJsonCloneEditor | editor} to which this state
   * applies.
   * @param baseOptions - The {@link Editor.IJsonEditorOptions | editor options} that
   * apply to this rule.
   * @param runtimeContext - An optional {@link IJsonContext | JSON context} to be used
   * for json value conversion.
   */
  public constructor(
    editor: IJsonCloneEditor,
    baseOptions: IJsonEditorOptions,
    runtimeContext?: IJsonContext
  ) {
    this.editor = editor;
    this.options = JsonEditorState._getEffectiveOptions(baseOptions, runtimeContext).orThrow();
    this._id = JsonEditorState._nextId++;
  }

  /**
   * The optional {@link IJsonContext | JSON context} for this state.
   */
  public get context(): IJsonContext | undefined {
    return this.options.context;
  }

  /**
   * An array of {@link JsonObject | objects} that are deferred for merge during
   * finalization.
   */
  public get deferred(): JsonObject[] {
    return this._deferred;
  }

  /**
   * Merges an optional {@link IJsonContext | JSON context} into a supplied set
   * of {@link Editor.IJsonEditorOptions | JSON editor options}.
   * @param options - The {@link Editor.IJsonEditorOptions | IJsonEditorOptions} into
   * which the the new context is to be merged.
   * @param context - The {@link IJsonContext | JSON context} to be merged into the
   * editor options.
   * @returns `Success` with the supplied {@link Editor.IJsonEditorOptions | options} if
   * there was nothing to merge, or aa new {@link Editor.IJsonEditorOptions | IJsonEditorOptions}
   * constructed from the base options merged with the supplied context.  Returns `Failure`
   * with more information if an error occurs.
   * @internal
   */
  protected static _getEffectiveOptions(
    options: IJsonEditorOptions,
    context?: IJsonContext
  ): Result<IJsonEditorOptions> {
    if (!context) {
      return succeed(options);
    }
    return JsonContextHelper.mergeContext(options.context, context).onSuccess((merged) => {
      return succeed({ context: merged, validation: options.validation });
    });
  }

  /**
   * Adds a supplied {@link JsonObject | object} to the deferred list.
   * @param obj - The {@link JsonObject | object} to be deferred.
   */
  public defer(obj: JsonObject): void {
    this._deferred.push(obj);
  }

  /**
   * Gets a {@link TemplateVars | TemplateVars} from the context of this {@link Editor.JsonEditorState | JsonEditorState},
   * or from an optional supplied {@link IJsonContext | IJsonContext} if the current state has no default
   * context.
   * @param defaultContext - An optional default {@link IJsonContext | IJsonContext} to use as `TemplateVars`
   * if the current state does not have context.
   * @returns A {@link TemplateVars | TemplateVars} reflecting the appropriate {@link IJsonContext | JSON context}, or
   * `undefined` if no vars are found.
   */
  public getVars(defaultContext?: IJsonContext): TemplateVars | undefined {
    return this.options.context?.vars ?? defaultContext?.vars;
  }

  /**
   * Gets an {@link IJsonReferenceMap | reference map} containing any other values
   * referenced during the operation.
   * @param defaultContext - An optional default {@link IJsonContext | IJsonContext} to use as
   * {@link TemplateVars | TemplateVars} if the current state does not have context.
   * @returns An {@link IJsonReferenceMap | IJsonReferenceMap} containing any values referenced
   * during this operation.
   */
  public getRefs(defaultContext?: IJsonContext): IJsonReferenceMap | undefined {
    return this.options.context?.refs ?? defaultContext?.refs;
  }

  /**
   * Gets the context of this {@link Editor.JsonEditorState | JsonEditorState} or an optionally
   * supplied default context if this state has no context.
   * @param defaultContext - The default {@link IJsonContext | JSON context} to use as default
   * if this state has no context.
   * @returns The appropriate {@link IJsonContext | IJsonContext} or `undefined` if no context
   * is available.
   */
  public getContext(defaultContext?: IJsonContext): IJsonContext | undefined {
    return JsonContextHelper.mergeContext(defaultContext, this.options.context).orDefault();
  }

  /**
   * Constructs a new {@link IJsonContext | IJsonContext} by merging supplied variables
   * and references into a supplied existing context.
   * @param baseContext - The {@link IJsonContext | IJsonContext} into which variables
   * and references are to be merged, or `undefined` to start with a default empty context.
   * @param add - The {@link VariableValue | variable values} and/or
   * {@link IJsonReferenceMap | JSON entity references} to be merged into the base context.
   * @returns A new {@link IJsonContext | IJsonContext} created by merging the supplied values.
   */
  public extendContext(
    baseContext: IJsonContext | undefined,
    add: { vars?: VariableValue[]; refs?: IJsonReferenceMap[] }
  ): Result<IJsonContext | undefined> {
    const context = this.getContext(baseContext);
    return JsonContextHelper.extendContext(context, add);
  }

  /**
   * Helper method to constructs  `DetailedFailure` with appropriate details and messaging
   * for various validation failures.
   * @param rule - The {@link Editor.JsonEditorValidationRules | validation rule} that failed.
   * @param message -  A string message describing the failed validation.
   * @param validation - The {@link Editor.IJsonEditorValidationOptions | validation options}
   * in effect.
   * @returns A `DetailedFailure` with appropriate detail and message.
   */
  public failValidation<T = JsonObject>(
    rule: JsonEditorValidationRules,
    message?: string,
    validation?: IJsonEditorValidationOptions
  ): DetailedFailure<T, JsonEditFailureReason> {
    let detail: JsonPropertyEditFailureReason = 'error';
    const effective = validation ?? this.options.validation;
    switch (rule) {
      case 'invalidPropertyName':
        detail = effective.onInvalidPropertyName !== 'ignore' ? 'error' : 'inapplicable';
        break;
      case 'invalidPropertyValue':
        detail = effective.onInvalidPropertyValue !== 'ignore' ? 'error' : 'ignore';
        break;
      case 'undefinedPropertyValue':
        detail = effective.onUndefinedPropertyValue !== 'error' ? 'ignore' : 'error';
        // istanbul ignore next
        message = message ?? 'Cannot convert undefined to JSON';
        break;
    }
    // istanbul ignore next
    return failWithDetail(message ?? rule, detail);
  }
}
