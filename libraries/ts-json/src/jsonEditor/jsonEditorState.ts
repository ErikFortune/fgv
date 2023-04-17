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
import { IJsonContext, IJsonReferenceMap, TemplateVars, VariableValue } from '../jsonContext';
import {
  IJsonCloneEditor,
  IJsonEditorOptions,
  IJsonEditorValidationOptions,
  JsonEditFailureReason,
  JsonEditorValidationRules,
  JsonPropertyEditFailureReason
} from './common';

import { JsonObject } from '../common';
import { JsonContextHelper } from '../contextHelpers';

export class JsonEditorState {
  protected static _nextId: number = 0;

  public readonly editor: IJsonCloneEditor;

  public readonly options: IJsonEditorOptions;
  protected readonly _deferred: JsonObject[] = [];
  protected readonly _id: number;

  public constructor(
    editor: IJsonCloneEditor,
    baseOptions: IJsonEditorOptions,
    runtimeContext?: IJsonContext
  ) {
    this.editor = editor;
    this.options = JsonEditorState._getEffectiveOptions(baseOptions, runtimeContext).orThrow();
    this._id = JsonEditorState._nextId++;
  }

  public get context(): IJsonContext | undefined {
    return this.options.context;
  }

  public get deferred(): JsonObject[] {
    return this._deferred;
  }

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

  public defer(obj: JsonObject): void {
    this._deferred.push(obj);
  }

  public getVars(defaultContext?: IJsonContext): TemplateVars | undefined {
    return this.options.context?.vars ?? defaultContext?.vars;
  }

  public getRefs(defaultContext?: IJsonContext): IJsonReferenceMap | undefined {
    return this.options.context?.refs ?? defaultContext?.refs;
  }

  public getContext(defaultContext?: IJsonContext): IJsonContext | undefined {
    return JsonContextHelper.mergeContext(defaultContext, this.options.context).orDefault();
  }

  public extendContext(
    baseContext: IJsonContext | undefined,
    add: { vars?: VariableValue[]; refs?: IJsonReferenceMap[] }
  ): Result<IJsonContext | undefined> {
    const context = this.getContext(baseContext);
    return JsonContextHelper.extendContext(context, add);
  }

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
