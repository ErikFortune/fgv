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

import { JsonArray, JsonObject, JsonValue, isJsonObject } from '@fgv/ts-json-base';
import { Conversion, Converter, Result, captureResult, fail, succeed } from '@fgv/ts-utils';
import {
  IJsonContext,
  IJsonReferenceMap,
  TemplateVars,
  TemplateVarsExtendFunction,
  defaultExtendVars
} from '../context';

import { EditorRules, IJsonEditorOptions, IJsonEditorRule, JsonEditor } from '../editor';

/**
 * Conversion options for {@link JsonConverter | JsonConverter}.
 * @public
 */
export interface IJsonConverterOptions {
  /**
   * If `true` and if template variables are available,
   * then string property values will be rendered using
   * mustache and those variable values. Otherwise string
   * properties are copied without modification.
   *
   * Defaults to `true` if vars are supplied with options,
   * `false` otherwise.
   */
  useValueTemplates: boolean;

  /**
   * If `true` and if template variables are available,
   * then property names will be rendered using
   * mustache and those variable values. Otherwise
   * property names are copied without modification.
   *
   * Defaults to `true` if vars are supplied with options,
   * `false` otherwise.
   */
  useNameTemplates: boolean;

  /**
   * If `true` and if template variables are available,
   * then string property names will be considered for
   * conditionals.
   *
   * Default is to match {@link IJsonConverterOptions.useNameTemplates | useNameTemplates}.
   */
  useConditionalNames: boolean;

  /**
   * If `true` (default) then properties with unconditional names
   * (which start with !) are flattened.
   */
  flattenUnconditionalValues: boolean;

  /**
   * If `true` and if both template variables and a
   * context derivation function is available, then properties
   * which match the multi-value name pattern will be expanded.
   * Default matches {@link IJsonConverterOptions.useNameTemplates | useNameTemplates}.
   *
   * Default is `true` unless {@link IJsonConverterOptions.extendVars | extendVars} is
   * explicitly set to `undefined`.
   */
  useMultiValueTemplateNames: boolean;

  /**
   * The variables (mustache view) used to render templated string names
   * and properties.  See the mustache documentation for details of mustache
   * syntax and the template view.
   */
  vars?: TemplateVars;

  /**
   * Method used to extend variables for children of an array node during
   * expansion. Default is to use a built-in extension function unless
   * {@link IJsonConverterOptions.extendVars | extendVars} is explicitly set to undefined.
   */
  extendVars?: TemplateVarsExtendFunction;

  /**
   * If `true` and if a {@link IJsonReferenceMap | references map} is supplied
   * in {@link IJsonConverterOptions.refs | refs}, then references in the source
   * object will be replaced with the corresponding value from the reference map.
   *
   * Default is `true` if {@link IJsonConverterOptions.refs | refs} are present in options,
   * `false` otherwise.
   */
  useReferences: boolean;

  /**
   * An optional {@link IJsonReferenceMap | reference map} used to insert any references
   * in the converted JSON.
   */
  refs?: IJsonReferenceMap;

  /**
   * If {@link IJsonConverterOptions.onInvalidPropertyName | onInvalidPropertyName} is `'error'`
   * (default) then any property name that is invalid after template rendering causes an error
   * and stops conversion.  If {@link IJsonConverterOptions.onInvalidPropertyName | onInvalidPropertyName}
   * is `'ignore'`, then names which are invalid after template rendering are passed through unchanged.
   */
  onInvalidPropertyName: 'error' | 'ignore';

  /**
   * If {@link IJsonConverterOptions.onInvalidPropertyValue | onInvalidPropertyValue} is `'error'`
   * (default) then any illegal property value causes an error and stops conversion.  If
   * {@link IJsonConverterOptions.onInvalidPropertyValue | onInvalidPropertyValue} is `'ignore'` then
   * any invalid property values are silently ignored.
   */
  onInvalidPropertyValue: 'error' | 'ignore';

  /**
   * If {@link IJsonConverterOptions.onUndefinedPropertyValue | onUndefinedPropertyValue} is `'error'`,
   * then any property with value `undefined` will cause an error and stop conversion.  If
   * {@link IJsonConverterOptions.onUndefinedPropertyValue | onUndefinedPropertyValue} is `'ignore'` (default)
   * then any property with value `undefined` is silently ignored.
   */
  onUndefinedPropertyValue: 'error' | 'ignore';
}

/**
 * Merges an optionally supplied partial set of {@link IJsonConverterOptions | options} with
 * the default converter options and taking all dynamic rules into account (e.g. template usage enabled
 * if variables are supplied and disabled if not),  producing a fully-resolved set of
 * {@link IJsonConverterOptions | IJsonConverterOptions}.
 * @param partial - An optional partial {@link IJsonConverterOptions | IJsonConverterOptions}
 * to be merged.
 * @public
 */
export function mergeDefaultJsonConverterOptions(
  partial?: Partial<IJsonConverterOptions>
): IJsonConverterOptions {
  const haveVars = partial?.vars !== undefined;
  const haveRefs = partial?.refs !== undefined;
  const extender = partial?.hasOwnProperty('extendVars') ? partial.extendVars : defaultExtendVars;
  const haveExtender = extender !== undefined;
  const namesDefault = partial?.useNameTemplates ?? haveVars;
  const conditionsDefault = partial?.useConditionalNames ?? namesDefault;

  const options: IJsonConverterOptions = {
    useValueTemplates: partial?.useValueTemplates ?? haveVars,
    useNameTemplates: namesDefault,
    useConditionalNames: conditionsDefault,
    flattenUnconditionalValues: partial?.flattenUnconditionalValues ?? conditionsDefault,
    useMultiValueTemplateNames: partial?.useMultiValueTemplateNames ?? (haveExtender && namesDefault),
    useReferences: partial?.useReferences ?? haveRefs,
    onInvalidPropertyName: partial?.onInvalidPropertyName ?? 'error',
    onInvalidPropertyValue: partial?.onInvalidPropertyValue ?? 'error',
    onUndefinedPropertyValue: partial?.onUndefinedPropertyValue ?? 'ignore',
    extendVars: extender
  };
  if (partial?.vars) {
    options.vars = partial.vars;
  }
  if (partial?.refs) {
    options.refs = partial.refs;
  }
  return options;
}

/**
 * Creates a new {@link IJsonContext | JSON context} using values supplied in an optional partial
 * {@link IJsonConverterOptions | converter options}.
 * @param partial - Optional partial {@link IJsonConverterOptions | IJsonConverterOptions} used to
 * populate the context.
 * @public
 */
export function contextFromConverterOptions(
  partial?: Partial<IJsonConverterOptions>
): IJsonContext | undefined {
  const context: IJsonContext = {};
  if (partial?.vars) {
    context.vars = partial.vars;
  }
  if (partial?.refs) {
    context.refs = partial.refs;
  }
  if (partial?.hasOwnProperty('extendVars')) {
    context.extendVars = partial.extendVars;
  }
  return context.vars || context.refs || context.extendVars ? context : undefined;
}

/**
 * Creates a new {@link JsonEditor | JsonEditor} from an optionally supplied partial
 * {@link IJsonConverterOptions | JSON converter options}.
 * Expands supplied options with default values and constructs an editor with
 * matching configuration and defined rules.
 * @param partial - Optional partial {@link IJsonConverterOptions | IJsonConverterOptions}
 * used to create the editor.
 * @public
 */
export function converterOptionsToEditor(partial?: Partial<IJsonConverterOptions>): Result<JsonEditor> {
  const converterOptions = mergeDefaultJsonConverterOptions(partial);
  const context = contextFromConverterOptions(partial);
  const validation = {
    onInvalidPropertyName: converterOptions.onInvalidPropertyName,
    onInvalidPropertyValue: converterOptions.onInvalidPropertyValue,
    onUndefinedPropertyValue: converterOptions.onUndefinedPropertyValue
  };
  const editorOptions: IJsonEditorOptions = { context, validation };

  const rules: IJsonEditorRule[] = [];
  if (converterOptions.useNameTemplates || converterOptions.useValueTemplates) {
    const templateOptions = {
      ...editorOptions,
      useNameTemplates: converterOptions.useNameTemplates,
      useValueTemplates: converterOptions.useValueTemplates
    };
    rules.push(new EditorRules.TemplatedJsonEditorRule(templateOptions));
  }
  if (converterOptions.useConditionalNames || converterOptions.flattenUnconditionalValues) {
    const conditionalOptions = {
      ...editorOptions,
      flattenUnconditionalValues: converterOptions.flattenUnconditionalValues
    };
    rules.push(new EditorRules.ConditionalJsonEditorRule(conditionalOptions));
  }
  if (converterOptions.useMultiValueTemplateNames) {
    rules.push(new EditorRules.MultiValueJsonEditorRule(editorOptions));
  }
  if (converterOptions.useReferences) {
    rules.push(new EditorRules.ReferenceJsonEditorRule(editorOptions));
  }

  return JsonEditor.create(editorOptions, rules);
}

/**
 * A thin wrapper to allow an arbitrary {@link JsonEditor | JsonEditor} to be used via the
 * \@fgv/ts-utils `Converter` pattern.
 * @public
 */
export class JsonEditorConverter extends Conversion.BaseConverter<JsonValue, IJsonContext> {
  public readonly editor: JsonEditor;

  /**
   * Constructs a new {@link JsonEditor | JsonEditor}Converter which uses the supplied editor
   * @param editor -
   */
  public constructor(editor: JsonEditor) {
    super((from, __self, context) => this._convert(from, context), editor.options.context);
    this.editor = editor;
  }

  /**
   * Constructs a new {@link JsonEditor | JsonEditor}Converter which uses the supplied editor
   * @param editor -
   */
  public static createWithEditor(editor: JsonEditor): Result<JsonEditorConverter> {
    return captureResult(() => new JsonEditorConverter(editor));
  }

  /**
   * Gets a derived converter which fails if the resulting converted
   * `JsonValue` is not a `JsonObject`.
   */
  public object(): Converter<JsonObject, IJsonContext> {
    return this.map((jv) => {
      if (!isJsonObject(jv)) {
        return fail(`Cannot convert "${JSON.stringify(jv)}" to JSON object.`);
      }
      return succeed(jv);
    });
  }

  /**
   * Gets a derived converter which fails if the resulting converted
   * `JsonValue` is not a `JsonArray`.
   */
  public array(): Converter<JsonArray, IJsonContext> {
    return this.map((jv) => {
      if (!Array.isArray(jv) || typeof jv !== 'object') {
        return fail(`Cannot convert "${JSON.stringify(jv)}" to JSON array.`);
      }
      return succeed(jv);
    });
  }

  protected _convert(from: unknown, context?: IJsonContext): Result<JsonValue> {
    return this.editor.clone(from as JsonValue, context);
  }
}

/**
 * An \@fgv/ts-utils `Converter` from `unknown` to type-safe JSON, optionally
 * rendering any string property names or values using mustache with a supplied view.
 * @public
 */
export class JsonConverter extends JsonEditorConverter {
  /**
   * Constructs a new {@link JsonConverter | JsonConverter} with
   * supplied or default options.
   * @param options - Optional partial {@link IJsonConverterOptions | options}
   * to configure the converter.
   */
  public constructor(options?: Partial<IJsonConverterOptions>) {
    const editor = converterOptionsToEditor(options).orThrow();
    super(editor);
  }

  /**
   * Creates a new {@link JsonConverter | JsonConverter}.
   * @param options - Optional partial {@link IJsonConverterOptions | options}
   * to configure the converter.
   * @returns `Success` with a new {@link JsonConverter | JsonConverter}, or `Failure`
   * with an informative message if an error occurs.
   */
  public static create(options?: Partial<IJsonConverterOptions>): Result<JsonConverter> {
    return captureResult(() => new JsonConverter(options));
  }
}

/**
 * Initialization options for a {@link TemplatedJsonConverter | TemplatedJsonConverter}.
 * @public
 */
export type TemplatedJsonConverterOptions = Omit<
  IJsonConverterOptions,
  'useNameTemplates' | 'useValueTemplates' | 'useMultiValueTemplateNames'
>;

/**
 * An \@fgv/ts-utils `Converter` from `unknown` to type-safe JSON
 * with mustache template rendering and multi-value property name rules enabled
 * regardless of initial context.
 * @public
 */
export class TemplatedJsonConverter extends JsonEditorConverter {
  /**
   * Default {@link IJsonConverterOptions | JSON converter options}
   * to enable templated conversion.
   */
  public static readonly templateOptions: Partial<IJsonConverterOptions> = {
    useNameTemplates: true,
    useValueTemplates: true,
    useMultiValueTemplateNames: true,
    useConditionalNames: false,
    flattenUnconditionalValues: false
  };

  /**
   * Constructs a new {@link TemplatedJsonConverter | TemplatedJsonConverter} with
   * supplied or default options.
   * @param options - Optional partial {@link TemplatedJsonConverterOptions | options}
   * to configure the converter.
   */
  public constructor(options?: Partial<TemplatedJsonConverterOptions>) {
    options = { ...options, ...TemplatedJsonConverter.templateOptions };
    const editor = converterOptionsToEditor(options).orThrow();
    super(editor);
  }

  /**
   * Constructs a new {@link TemplatedJsonConverter | TemplatedJsonConverter} with
   * supplied or default options.
   * @param options - Optional partial {@link TemplatedJsonConverterOptions | options}
   * to configure the converter.
   */
  public static create(options?: Partial<TemplatedJsonConverterOptions>): Result<JsonConverter> {
    return captureResult(() => new TemplatedJsonConverter(options));
  }
}

/**
 * Options for a {@link ConditionalJsonConverter | ConditionalJsonConverter}.
 * @public
 */
export type ConditionalJsonConverterOptions = Omit<TemplatedJsonConverterOptions, 'useConditionalNames'>;

/**
 * An \@fgv/ts-utils `Converter` from `unknown` to type-safe JSON with mustache
 * template rendering, multi-value property name and conditional property
 * name rules enabled regardless of initial context.
 * @public
 */
export class ConditionalJsonConverter extends JsonEditorConverter {
  /**
   * Default {@link IJsonConverterOptions | JSON converter options}
   * to enable conditional conversion.
   */
  public static readonly conditionalOptions: Partial<IJsonConverterOptions> = {
    ...TemplatedJsonConverter.templateOptions,
    useConditionalNames: true,
    flattenUnconditionalValues: true
  };

  /**
   * Constructs a new {@link ConditionalJsonConverter | ConditionalJsonConverter} with supplied or
   * default options.
   * @param options - Optional partial {@link ConditionalJsonConverterOptions | configuration or context}
   * for the converter.
   */
  public constructor(options?: Partial<ConditionalJsonConverterOptions>) {
    options = { ...options, ...ConditionalJsonConverter.conditionalOptions };
    const editor = converterOptionsToEditor(options).orThrow();
    super(editor);
  }

  /**
   * Constructs a new {@link ConditionalJsonConverter | ConditionalJsonConverter} with supplied or
   * default options.
   * @param options - Optional partial {@link ConditionalJsonConverterOptions | configuration or context}
   * for the converter.
   */
  public static create(options?: Partial<ConditionalJsonConverterOptions>): Result<JsonConverter> {
    return captureResult(() => new ConditionalJsonConverter(options));
  }
}

/**
 * Initialization options for a {@link RichJsonConverter | RichJsonConverter}.
 * @public
 */
export type RichJsonConverterOptions = Omit<ConditionalJsonConverterOptions, 'useReferences'>;

/**
 * A \@fgv/ts-utils `Converter` from `unknown` to type-safe JSON with mustache
 * template rendering, multi-value property name, conditional property
 * name, and external reference rules enabled regardless of initial context.
 * @public
 */
export class RichJsonConverter extends JsonEditorConverter {
  /**
   * Default {@link IJsonConverterOptions | JSON converter options}
   * to enable rich conversion.
   */
  public static readonly richOptions: Partial<IJsonConverterOptions> = {
    ...ConditionalJsonConverter.conditionalOptions,
    useReferences: true
  };

  /**
   * Constructs a new {@link RichJsonConverter | RichJsonConverter} with supplied or
   * default options.
   * @param options - Optional partial {@link RichJsonConverterOptions | configuration or context}
   * for the converter.
   */
  public constructor(options?: Partial<RichJsonConverterOptions>) {
    options = { ...options, ...RichJsonConverter.richOptions };
    const editor = converterOptionsToEditor(options).orThrow();
    super(editor);
  }

  /**
   * Constructs a new {@link RichJsonConverter | RichJsonConverter} with supplied or
   * default options
   * @param options - Optional partial {@link RichJsonConverterOptions | configuration or context}
   * for the converter.
   */
  public static create(options?: Partial<RichJsonConverterOptions>): Result<JsonConverter> {
    return captureResult(() => new RichJsonConverter(options));
  }
}
